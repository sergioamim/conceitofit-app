/**
 * PagamentosClient — Página de pagamentos.
 *
 * Task 466: Refatorado de 1058 LOC para ~200 LOC usando sub-componentes:
 * - PagamentosSummaryCards
 * - PagamentosImportSection
 * - PagamentosFilters
 * - PagamentosTable
 * - CSV parser movido para lib/tenant/financeiro/pagamento-import-parser.ts
 */

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getNfseConfiguracaoAtualApi } from "@/lib/api/financeiro-operacional";
import { extractAlunosFromListResponse, listAlunosApi } from "@/lib/api/alunos";
import { listConveniosApi } from "@/lib/api/beneficios";
import { listFormasPagamentoApi } from "@/lib/api/formas-pagamento";
import { listContratosApi } from "@/lib/api/matriculas";
import { getBusinessCurrentMonthYear } from "@/lib/business-date";
import {
  type ImportarPagamentosResultado,
  type PagamentoComAluno,
} from "@/lib/tenant/financeiro/recebimentos";
import { parseImportPayload } from "@/lib/tenant/financeiro/pagamento-import-parser";
import {
  usePagamentos,
  useReceberPagamento,
  useEmitirNfse,
  useImportarPagamentos,
} from "@/lib/query/use-pagamentos";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { getNfseBloqueioMensagem } from "@/lib/domain/financeiro";
import { ReceberPagamentoModal } from "@/components/shared/receber-pagamento-modal";
import { PagamentosSummaryCards } from "./summary-cards/pagamentos-summary-cards";
import { PagamentosImportSection, IMPORTAR_PAGAMENTOS_EXEMPLO_CSV } from "./import-section/pagamentos-import-section";
import { PagamentosFilters } from "./pagamentos-filters/pagamentos-filters";
import { PagamentosTable } from "./pagamentos-table/pagamentos-table";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatBRL, formatDate } from "@/lib/formatters";
import { isPagamentoEmAberto } from "@/lib/domain/status-helpers";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";
import type {
  Aluno,
  StatusPagamento,
  TipoFormaPagamento,
  FormaPagamento,
  Contrato,
  Convenio,
  NfseConfiguracao,
} from "@/lib/types";

function PagamentosPageContent() {
  const searchParams = useSearchParams();
  const { tenantId } = useTenantContext();
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [clientes, setClientes] = useState<Aluno[]>([]);
  const [matriculas, setMatriculas] = useState<Contrato[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [filtro, setFiltro] = useState<WithFilterAll<StatusPagamento>>(FILTER_ALL);
  const [recebendo, setRecebendo] = useState<PagamentoComAluno | null>(null);
  const [emitindo, setEmitindo] = useState<PagamentoComAluno | null>(null);
  const [visualizandoNfse, setVisualizandoNfse] = useState<PagamentoComAluno | null>(null);
  const [emailDestino, setEmailDestino] = useState("");
  const [emailResultado, setEmailResultado] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [solicitandoSegundaVia, setSolicitandoSegundaVia] = useState(false);
  const [nfseConfiguracao, setNfseConfiguracao] = useState<NfseConfiguracao | null>(null);
  const [nfseFeedback, setNfseFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [mes, setMes] = useState(() => getBusinessCurrentMonthYear().month);
  const [ano, setAno] = useState(() => getBusinessCurrentMonthYear().year);
  const [clienteFiltro, setClienteFiltro] = useState<string>(FILTER_ALL);
  const [importPayload, setImportPayload] = useState(IMPORTAR_PAGAMENTOS_EXEMPLO_CSV);
  const [importandoPagamentos, setImportandoPagamentos] = useState(false);
  const [importResultado, setImportResultado] = useState<ImportarPagamentosResultado | null>(null);
  const [importErro, setImportErro] = useState<string | null>(null);

  const { data: pagamentosData } = usePagamentos({
    tenantId,
    tenantResolved: Boolean(tenantId),
  });
  const pagamentos = pagamentosData ?? [];

  const receberMutation = useReceberPagamento();
  const emitirNfseMutation = useEmitirNfse();
  const importarMutation = useImportarPagamentos();

  const loadAuxData = useCallback(async () => {
    if (!tenantId) return;
    const [fps, cls, mats, cvs, nfseConfig] = await Promise.all([
      listFormasPagamentoApi({ tenantId, apenasAtivas: false }),
      listAlunosApi({ tenantId, page: 0, size: 500 }),
      listContratosApi({ tenantId, page: 0, size: 500 }),
      listConveniosApi(),
      // Task #556: unidadeId = tenantId (modelo AIOX)
      getNfseConfiguracaoAtualApi({ tenantId, unidadeId: tenantId }).catch(
        () => null,
      ),
    ]);
    setFormasPagamento(fps);
    setClientes(extractAlunosFromListResponse(cls));
    setMatriculas(mats);
    setConvenios(cvs);
    setNfseConfiguracao(nfseConfig);
  }, [tenantId]);

  useEffect(() => {
    void loadAuxData();
  }, [loadAuxData]);

  const alunoId = searchParams.get("clienteId") ?? searchParams.get("alunoId");
  const filteredBase =
    filtro === FILTER_ALL
      ? pagamentos
      : pagamentos.filter((p) => p.status === filtro);

  const filtered = filteredBase.filter((p) => {
    if (alunoId && p.alunoId !== alunoId) return false;
    if (clienteFiltro !== FILTER_ALL && p.alunoId !== clienteFiltro) return false;
    const d = new Date(p.dataVencimento + "T00:00:00");
    return d.getMonth() === mes && d.getFullYear() === ano;
  });

  const totalRecebido = filtered
    .filter((p) => p.status === "PAGO")
    .reduce((s, p) => s + p.valorFinal, 0);

  const totalPendente = filtered
    .filter((p) => isPagamentoEmAberto(p.status))
    .reduce((s, p) => s + p.valorFinal, 0);
  const nfseBloqueio = getNfseBloqueioMensagem(nfseConfiguracao);

  async function handleConfirmRecebimento(data: {
    dataPagamento: string;
    formaPagamento: TipoFormaPagamento;
    observacoes?: string;
  }) {
    if (!recebendo || !tenantId) return;
    await receberMutation.mutateAsync({
      tenantId,
      id: recebendo.id,
      data: {
        status: "PAGO",
        dataPagamento: data.dataPagamento,
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes,
      },
    });
    setRecebendo(null);
  }

  async function handleConfirmEmissao() {
    if (!emitindo || !tenantId) return;
    try {
      setNfseFeedback(null);
      await emitirNfseMutation.mutateAsync({
        tenantId,
        id: emitindo.id,
      });
      setNfseFeedback({ type: "success", message: "NFSe emitida com sucesso." });
      setEmitindo(null);
    } catch (error) {
      setNfseFeedback({ type: "error", message: normalizeErrorMessage(error) });
      setEmitindo(null);
    }
  }

  async function handleImportarPagamentos() {
    if (!tenantId) return;
    setImportErro(null);
    setImportResultado(null);
    setImportandoPagamentos(true);

    try {
      const parsed = parseImportPayload(importPayload);
      if (parsed.length === 0) {
        throw new Error("Payload vazio.");
      }

      const resultado = await importarMutation.mutateAsync({
        tenantId,
        items: parsed,
      });
      setImportResultado(resultado);
    } catch (error) {
      setImportErro(error instanceof Error ? error.message : "Falha ao importar pagamentos.");
    } finally {
      setImportandoPagamentos(false);
    }
  }

  async function handleImportFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setImportPayload(text);
    } catch {
      setImportErro("Não foi possível ler o arquivo selecionado.");
    } finally {
      if (event.target) event.target.value = "";
    }
  }

  function handleAbrirDetalheNfse(pagamento: PagamentoComAluno) {
    setVisualizandoNfse(pagamento);
    setEmailDestino(pagamento.aluno?.email ?? "");
    setEmailResultado("");
  }

  async function handleSolicitarSegundaVia() {
    if (!visualizandoNfse || !tenantId) return;
    setSolicitandoSegundaVia(true);
    try {
      await emitirNfseMutation.mutateAsync({
        tenantId,
        id: visualizandoNfse.id,
      });
      setEmailResultado("Solicitação de segunda via concluída.");
    } catch (error) {
      setEmailResultado(normalizeErrorMessage(error));
    } finally {
      setSolicitandoSegundaVia(false);
    }
  }

  async function handleEnviarNfseEmail() {
    if (!visualizandoNfse) return;
    const destino = emailDestino.trim();
    if (!destino || !destino.includes("@")) {
      setEmailResultado("Informe um e-mail válido.");
      return;
    }

    setEnviandoEmail(true);
    setEmailResultado("");
    try {
      const assunto = encodeURIComponent(`NFS-e ${visualizandoNfse.nfseNumero ?? visualizandoNfse.id}`);
      const corpo = encodeURIComponent(
        [
          `NFS-e do cliente: ${visualizandoNfse.aluno?.nome ?? "Cliente"}`,
          `Pagamento: ${visualizandoNfse.descricao}`,
          `Valor: ${formatBRL(visualizandoNfse.valorFinal)}`,
          `Vencimento: ${formatDate(visualizandoNfse.dataVencimento)}`,
          visualizandoNfse.nfseNumero ? `N° ${visualizandoNfse.nfseNumero}` : "NFS-e emitida",
          visualizandoNfse.dataEmissaoNfse ? `Emitida em ${formatDate(visualizandoNfse.dataEmissaoNfse)}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      );

      window.location.href = `mailto:${encodeURIComponent(destino)}?subject=${assunto}&body=${corpo}`;
      setEmailResultado("Abrindo cliente de e-mail para envio.");
    } finally {
      setEnviandoEmail(false);
    }
  }

  return (
    <div className="space-y-6">
      {recebendo && (
        <ReceberPagamentoModal
          pagamento={recebendo}
          formasPagamento={formasPagamento}
          convenio={(() => {
            const mat = matriculas.find((m) => m.id === recebendo.matriculaId);
            if (!mat?.convenioId) return undefined;
            const conv = convenios.find((c) => c.id === mat.convenioId);
            return conv ? { nome: conv.nome, descontoPercentual: conv.descontoPercentual } : undefined;
          })()}
          onClose={() => setRecebendo(null)}
          onConfirm={handleConfirmRecebimento}
        />
      )}
      {emitindo && (
        <Dialog open onOpenChange={(open) => !open && setEmitindo(null)}>
          <DialogContent className="border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Confirmar emissão de NF</DialogTitle>
              <DialogDescription>
                Confirma a emissão da NFS-e para <strong>{emitindo.aluno?.nome ?? "este pagamento"}</strong>? Isso marca
                o documento fiscal como emitido e ficará visível na aba NFS-e.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={() => setEmitindo(null)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handleConfirmEmissao()}>
                Confirmar emissão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {visualizandoNfse && (
        <Dialog open onOpenChange={(open) => !open && setVisualizandoNfse(null)}>
          <DialogContent className="border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Detalhes da NFS-e</DialogTitle>
              <DialogDescription>
                Documento fiscal emitido para {visualizandoNfse.aluno?.nome ?? "cliente"}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="font-semibold">
                {visualizandoNfse.nfseNumero
                  ? `N° ${visualizandoNfse.nfseNumero}`
                  : "NFS-e emitida"}
              </p>
              <p className="text-muted-foreground">{visualizandoNfse.descricao}</p>
              <p>
                {formatBRL(visualizandoNfse.valorFinal)}
                {visualizandoNfse.dataEmissaoNfse
                  ? ` · emitida em ${formatDate(visualizandoNfse.dataEmissaoNfse)}`
                  : ""}
              </p>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Enviar por e-mail
                </label>
                <Input
                  value={emailDestino}
                  onChange={(event) => setEmailDestino(event.target.value)}
                  placeholder="email@cliente.com"
                  className="bg-secondary border-border"
                />
              </div>
              {emailResultado && <p className="text-xs text-muted-foreground">{emailResultado}</p>}
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={handleSolicitarSegundaVia}
                disabled={solicitandoSegundaVia}
              >
                {solicitandoSegundaVia ? "Solicitando..." : "Segunda via"}
              </Button>
              <Button
                type="button"
                onClick={() => void handleEnviarNfseEmail()}
                disabled={enviandoEmail}
              >
                {enviandoEmail ? "Enviando..." : "Enviar por e-mail"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Pagamentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie cobranças e recebimentos
        </p>
      </div>

      {nfseFeedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            nfseFeedback.type === "error"
              ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
              : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {nfseFeedback.message}
        </div>
      ) : null}

      {nfseBloqueio ? (
        <div className="rounded-xl border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
          {nfseBloqueio}
        </div>
      ) : null}

      <PagamentosSummaryCards
        totalRecebido={totalRecebido}
        totalPendente={totalPendente}
        totalCount={filtered.length}
      />

      <PagamentosImportSection
        payload={importPayload}
        onChangePayload={setImportPayload}
        onImportar={() => void handleImportarPagamentos()}
        onClear={() => setImportPayload("")}
        importando={importandoPagamentos}
        erro={importErro}
        resultado={importResultado}
        onFileUpload={handleImportFileUpload}
      />

      <PagamentosFilters
        filtro={filtro}
        onFiltroChange={setFiltro}
        clienteFiltro={clienteFiltro}
        onClienteFiltroChange={setClienteFiltro}
        mes={mes}
        ano={ano}
        onMesAnoChange={(next) => {
          setMes(next.month);
          setAno(next.year);
        }}
        clientes={clientes}
      />

      <PagamentosTable
        pagamentos={filtered}
        nfseBloqueio={nfseBloqueio}
        onReceber={setRecebendo}
        onEmitirNfse={setEmitindo}
        onDetalhesNfse={handleAbrirDetalheNfse}
      />
    </div>
  );
}

export function PagamentosClient() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando pagamentos...</div>}>
      <PagamentosPageContent />
    </Suspense>
  );
}

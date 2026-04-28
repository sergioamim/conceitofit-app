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

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getNfseConfiguracaoAtualApi } from "@/lib/api/financeiro-operacional";
import {
  extractAlunosFromListResponse,
  listAlunosApi,
  searchAlunosApi,
} from "@/lib/api/alunos";
import { listConveniosApi } from "@/lib/api/beneficios";
import { listFormasPagamentoApi } from "@/lib/api/formas-pagamento";
import { listContratosApi } from "@/lib/api/contratos";
import { getBusinessCurrentMonthYear } from "@/lib/business-date";
import {
  type ImportarPagamentosResultado,
  type PagamentoComAluno,
} from "@/lib/tenant/financeiro/recebimentos";
import { parseImportPayload } from "@/lib/tenant/financeiro/pagamento-import-parser";
import {
  usePagamentosPage,
  useReceberPagamento,
  useEmitirNfse,
  useImportarPagamentos,
  useSumarioOperacionalPagamentos,
} from "@/lib/query/use-pagamentos";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { getNfseBloqueioMensagem } from "@/lib/domain/financeiro";
import { ReceberPagamentoModal } from "@/components/shared/receber-pagamento-modal";
import { SplitCobrancaModal } from "@/components/pagamento-split/split-cobranca-modal";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import { PagamentosSummaryCards } from "./summary-cards/pagamentos-summary-cards";
import { PagamentosImportSection, IMPORTAR_PAGAMENTOS_EXEMPLO_CSV } from "./import-section/pagamentos-import-section";
import { PagamentosFilters } from "./pagamentos-filters/pagamentos-filters";
import { PagamentosTable } from "./pagamentos-table/pagamentos-table";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatBRL, formatDate } from "@/lib/formatters";
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
import type { SuggestionOption } from "@/components/shared/suggestion-input";

function mapAlunoToSuggestionOption(aluno: Aluno): SuggestionOption {
  const cpf = (aluno.cpf ?? "").replace(/\D/g, "");
  return {
    id: aluno.id,
    label: aluno.nome,
    searchText: [cpf, aluno.email ?? "", aluno.telefone ?? ""].filter(Boolean).join(" "),
  };
}

function mergeAlunosById(current: Aluno[], incoming: Aluno[]): Aluno[] {
  if (incoming.length === 0) return current;
  const byId = new Map(current.map((item) => [item.id, item] as const));
  for (const aluno of incoming) {
    byId.set(aluno.id, aluno);
  }
  return [...byId.values()];
}

function PagamentosPageContent() {
  const searchParams = useSearchParams();
  const { tenantId } = useTenantContext();
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [clientes, setClientes] = useState<Aluno[]>([]);
  const [matriculas, setMatriculas] = useState<Contrato[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [filtro, setFiltro] = useState<WithFilterAll<StatusPagamento>>(FILTER_ALL);
  const [recebendo, setRecebendo] = useState<PagamentoComAluno | null>(null);
  const [recebendoSplit, setRecebendoSplit] = useState<PagamentoComAluno | null>(null);
  const [splitTenantId, setSplitTenantId] = useState<string | null>(null);

  // Tenant ativo lido client-side pra abrir modal de split. Mounted-guard.
  useEffect(() => {
    setSplitTenantId(getActiveTenantIdFromSession() ?? null);
  }, []);
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
  const [clienteBusca, setClienteBusca] = useState("");
  const [clienteOptions, setClienteOptions] = useState<SuggestionOption[]>([]);
  const [clienteOptionsLoading, setClienteOptionsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [importPayload, setImportPayload] = useState(IMPORTAR_PAGAMENTOS_EXEMPLO_CSV);
  const [importandoPagamentos, setImportandoPagamentos] = useState(false);
  const [importResultado, setImportResultado] = useState<ImportarPagamentosResultado | null>(null);
  const [importErro, setImportErro] = useState<string | null>(null);

  const PAGE_SIZE = 50;

  // P0-A passo 3 (2026-04-23): filtros todos server-side. `mes/ano` viram
  // `startDate/endDate`; `filtro` (status) e `clienteFiltro` (→ CPF) também
  // são repassados ao backend. Listagem paginada real (size=50 + page),
  // cards leem totais do sumário operacional (GROUP BY no DB).
  const periodoStart = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  const periodoEnd = (() => {
    const lastDay = new Date(ano, mes + 1, 0).getDate();
    return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  })();

  // URL ?clienteId=...|?alunoId=... sobrepõe o select de cliente quando presente.
  const alunoUrlParam = searchParams.get("clienteId") ?? searchParams.get("alunoId");
  const clienteSelecionadoId =
    alunoUrlParam ?? (clienteFiltro === FILTER_ALL ? undefined : clienteFiltro);

  const documentoCliente = useMemo(() => {
    if (!clienteSelecionadoId) return undefined;
    const aluno = clientes.find((c) => c.id === clienteSelecionadoId);
    const digits = (aluno?.cpf ?? "").replace(/\D/g, "");
    return digits || undefined;
  }, [clienteSelecionadoId, clientes]);

  // Resetar pra primeira página quando filtros mudam — evita cair numa página
  // vazia (ex.: mes novo com menos de `page * PAGE_SIZE` itens).
  useEffect(() => {
    setPage(0);
  }, [filtro, mes, ano, clienteFiltro, alunoUrlParam, documentoCliente]);

  const statusBackend = filtro === FILTER_ALL ? undefined : filtro;

  const {
    data: pagamentosPage,
    isFetching,
    error: pagamentosError,
    refetch,
  } = usePagamentosPage({
    tenantId,
    tenantResolved: Boolean(tenantId),
    status: statusBackend,
    startDate: periodoStart,
    endDate: periodoEnd,
    documentoCliente,
    page,
    size: PAGE_SIZE,
  });
  const pagamentos = pagamentosPage?.items ?? [];
  const pagamentosTotal = pagamentosPage?.total ?? 0;
  const hasNextPage = pagamentosPage?.hasNext ?? false;

  const { data: sumarioPeriodo } = useSumarioOperacionalPagamentos({
    tenantId,
    tenantResolved: Boolean(tenantId),
    startDate: periodoStart,
    endDate: periodoEnd,
    documentoCliente,
  });

  const receberMutation = useReceberPagamento();
  const emitirNfseMutation = useEmitirNfse();
  const importarMutation = useImportarPagamentos();

  const loadAuxData = useCallback(async () => {
    if (!tenantId) return;
    const [fps, cls, mats, cvs, nfseConfig] = await Promise.allSettled([
      listFormasPagamentoApi({ tenantId, apenasAtivas: false }),
      listAlunosApi({ tenantId, page: 0, size: 500 }),
      listContratosApi({ tenantId, page: 0, size: 500 }),
      listConveniosApi(),
      // Task #556: unidadeId = tenantId (modelo AIOX)
      getNfseConfiguracaoAtualApi({ tenantId, unidadeId: tenantId }).catch(
        () => null,
      ),
    ]);
    if (fps.status === "fulfilled") {
      setFormasPagamento(fps.value);
    }
    if (cls.status === "fulfilled") {
      const alunos = extractAlunosFromListResponse(cls.value);
      setClientes(alunos);
      setClienteOptions(alunos.slice(0, 12).map(mapAlunoToSuggestionOption));
    }
    if (mats.status === "fulfilled") {
      setMatriculas(mats.value);
    }
    if (cvs.status === "fulfilled") {
      setConvenios(cvs.value);
    }
    if (nfseConfig.status === "fulfilled") {
      setNfseConfiguracao(nfseConfig.value);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadAuxData();
  }, [loadAuxData]);

  const loadClienteSuggestions = useCallback(
    async (searchTerm: string) => {
      if (!tenantId) return;
      setClienteOptionsLoading(true);
      try {
        const trimmed = searchTerm.trim();
        if (!trimmed) {
          if (clientes.length > 0) {
            setClienteOptions(clientes.slice(0, 12).map(mapAlunoToSuggestionOption));
            return;
          }
          const response = await listAlunosApi({ tenantId, page: 0, size: 12 });
          const alunos = extractAlunosFromListResponse(response);
          setClientes((current) => (current.length > 0 ? current : alunos));
          setClienteOptions(alunos.map(mapAlunoToSuggestionOption));
          return;
        }

        const alunos = await searchAlunosApi({
          tenantId,
          search: trimmed,
          size: 10,
        });
        setClientes((current) => mergeAlunosById(current, alunos));
        setClienteOptions(alunos.map(mapAlunoToSuggestionOption));
      } catch {
        setClienteOptions([]);
      } finally {
        setClienteOptionsLoading(false);
      }
    },
    [clientes, tenantId],
  );

  useEffect(() => {
    if (clienteSelecionadoId === undefined) {
      if (!alunoUrlParam) {
        setClienteBusca("");
      }
      return;
    }
    const alunoSelecionado = clientes.find((item) => item.id === clienteSelecionadoId);
    if (alunoSelecionado) {
      setClienteBusca(alunoSelecionado.nome);
    }
  }, [alunoUrlParam, clienteSelecionadoId, clientes]);

  // Totais do período vêm SEMPRE do sumário server-side (GROUP BY). Cards
  // refletem o período inteiro independente da página atual. `totalPendente`
  // agrega PENDENTE + VENCIDA pra bater com o conceito frontend de "em aberto".
  const totalRecebido = sumarioPeriodo?.totalRecebido ?? 0;
  const totalPendente = (sumarioPeriodo?.totalPendente ?? 0) + (sumarioPeriodo?.totalVencido ?? 0);
  const totalCount = sumarioPeriodo?.countTotal ?? pagamentosTotal;
  const nfseBloqueio = getNfseBloqueioMensagem(nfseConfiguracao);
  const pagamentosErrorMessage = pagamentosError
    ? normalizeErrorMessage(pagamentosError)
    : null;

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
              <DialogTitle className="text-lg">Confirmar emissão de NF</DialogTitle>
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
              <DialogTitle className="text-lg">Detalhes da NFS-e</DialogTitle>
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

      {pagamentosErrorMessage ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          Não foi possível carregar a listagem de pagamentos. {pagamentosErrorMessage}
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
        totalCount={totalCount}
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
        clienteBusca={clienteBusca}
        onClienteBuscaChange={(value) => {
          setClienteBusca(value);
          void loadClienteSuggestions(value);
        }}
        onClienteSelect={(option) => {
          setClienteBusca(option.label);
          setClienteFiltro(option.id);
        }}
        onClienteSuggestionOpen={() => {
          void loadClienteSuggestions(clienteBusca);
        }}
        mes={mes}
        ano={ano}
        onMesAnoChange={(next) => {
          setMes(next.month);
          setAno(next.year);
        }}
        clienteOptions={clienteOptions}
        clienteLoading={clienteOptionsLoading}
      />

      <PagamentosTable
        pagamentos={pagamentos}
        nfseBloqueio={nfseBloqueio}
        onReceber={setRecebendo}
        onReceberSplit={splitTenantId ? setRecebendoSplit : undefined}
        onEmitirNfse={setEmitindo}
        onDetalhesNfse={handleAbrirDetalheNfse}
      />

      {splitTenantId && recebendoSplit ? (
        <SplitCobrancaModal
          open
          onOpenChange={(o) => !o && setRecebendoSplit(null)}
          tenantId={splitTenantId}
          alunoId={recebendoSplit.alunoId ?? undefined}
          alunoNome={recebendoSplit.aluno?.nome ?? undefined}
          pagamentoExistenteId={recebendoSplit.id}
          valorSugerido={recebendoSplit.valorFinal ?? recebendoSplit.valor ?? 0}
          descricaoSugerida={recebendoSplit.descricao ?? ""}
          onSuccess={() => {
            setRecebendoSplit(null);
            void refetch();
          }}
        />
      ) : null}

      {pagamentosTotal > PAGE_SIZE ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <p className="text-xs text-muted-foreground">
            Exibindo <span className="font-semibold text-foreground">
              {pagamentos.length === 0 ? 0 : page * PAGE_SIZE + 1}-{page * PAGE_SIZE + pagamentos.length}
            </span>{" "}
            de <span className="font-semibold text-foreground">{pagamentosTotal.toLocaleString("pt-BR")}</span> pagamentos
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              disabled={page === 0 || isFetching}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={16} className="mr-1" />
              Anterior
            </Button>
            <span className="px-3 text-xs font-semibold">Página {page + 1}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              disabled={!hasNextPage || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      ) : null}
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

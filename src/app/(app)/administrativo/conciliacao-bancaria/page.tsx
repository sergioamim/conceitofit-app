"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, FileCheck, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ImportarLinhasApiInput,
  conciliarLinhaApi,
  ignorarLinhaApi,
  importarLinhasConciliacaoApi,
  listarConciliacaoLinhasApi,
} from "@/lib/api/conciliacao-bancaria";
import { getBusinessMonthRange } from "@/lib/business-date";
import type {
  ConciliacaoLinha,
  ContaBancaria,
  ContaPagar,
  OrigemConciliacao,
  Pagamento,
  StatusConciliacao,
  TipoMovimentoConciliacao,
} from "@/lib/types";
import { listContasBancariasApi } from "@/lib/api/contas-bancarias";
import { listPagamentosApi } from "@/lib/api/pagamentos";
import { listContasPagarApi } from "@/lib/api/financeiro-gerencial";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { useTenantContext } from "@/hooks/use-session-context";

const ORIGEM_LABEL: Record<OrigemConciliacao, string> = {
  MANUAL: "Manual",
  OFX: "OFX",
  STONE: "Stone",
};

const STATUS_LABEL: Record<StatusConciliacao, string> = {
  PENDENTE: "Pendente",
  CONCILIADA: "Conciliada",
  IGNORADA: "Ignorada",
};

const MOVIMENTO_ICON: Record<TipoMovimentoConciliacao, string> = {
  CREDITO: "+",
  DEBITO: "-",
};

const NONE_OPTION = "__NONE__";

function normalizeDateISO(): { start: string; end: string } {
  return getBusinessMonthRange();
}

function formatBRL(value: number) {
  return (Number(value) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function mapStatusClass(status: StatusConciliacao) {
  if (status === "CONCILIADA") return "bg-gym-teal/15 text-gym-teal";
  if (status === "IGNORADA") return "bg-muted text-muted-foreground";
  return "bg-gym-warning/15 text-gym-warning";
}

type ConciliacaoFiltro = StatusConciliacao | "TODAS";
type ContaBancariaSelect = string | typeof NONE_OPTION;

type ConciliarFormState = {
  contaReceberId: ContaBancariaSelect;
  contaPagarId: ContaBancariaSelect;
  observacao: string;
};

const IMPORT_ORIGEM_OPTIONS: OrigemConciliacao[] = ["MANUAL", "OFX", "STONE"];

export default function ConciliacaoBancariaPage() {
  const initialRange = normalizeDateISO();
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [linhas, setLinhas] = useState<ConciliacaoLinha[]>([]);
  const [contasReceber, setContasReceber] = useState<(Pagamento & { clienteNome?: string })[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);

  const [filtroStatus, setFiltroStatus] = useState<ConciliacaoFiltro>("PENDENTE");
  const [filtroConta, setFiltroConta] = useState<string>("TODAS");
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);

  const [payload, setPayload] = useState(
    `[{"chaveConciliacao":"DOC-001","dataMovimento":"${initialRange.end}","valor":199.9,"tipoMovimento":"CREDITO","descricao":"Exemplo de lançamento"}]`
  );
  const [importContaId, setImportContaId] = useState("");
  const [importOrigem, setImportOrigem] = useState<OrigemConciliacao>("MANUAL");

  const [conciliarOpen, setConciliarOpen] = useState(false);
  const [linhaSelecionada, setLinhaSelecionada] = useState<ConciliacaoLinha | null>(null);
  const [conciliarForm, setConciliarForm] = useState<ConciliarFormState>({
    contaReceberId: NONE_OPTION,
    contaPagarId: NONE_OPTION,
    observacao: "",
  });
  const { tenantId, tenantName, tenantResolved, loading: tenantLoading, error: tenantError } = useTenantContext();

  const contasBancariasMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const conta of contasBancarias) {
      map.set(conta.id, conta.apelido);
    }
    return map;
  }, [contasBancarias]);

  const contasReceberOptions = useMemo(
    () =>
      contasReceber
        .map((item) => ({
          value: item.id,
          label: `${item.aluno?.nome ?? "Cliente"} · ${item.descricao} · ${formatBRL(item.valorFinal)}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [contasReceber]
  );

  const contasPagarOptions = useMemo(
    () =>
      contasPagar
        .map((item) => ({ value: item.id, label: `${item.fornecedor} · ${formatBRL(item.valorOriginal)}` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [contasPagar]
  );

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [linhasResponse, contasResponse, pagamentosResponse, contasPagarResponse] = await Promise.all([
        listarConciliacaoLinhasApi({
          tenantId: tenantId || undefined,
          status: filtroStatus === "TODAS" ? undefined : filtroStatus,
          contaBancariaId: filtroConta === "TODAS" ? undefined : filtroConta,
          startDate,
          endDate,
        }),
        listContasBancariasApi({ tenantId: tenantId || undefined }),
        listPagamentosApi({ tenantId }),
        listContasPagarApi({ tenantId }),
      ]);
      setLinhas(linhasResponse);
      setContasBancarias(contasResponse);
      setContasReceber(pagamentosResponse);
      setContasPagar(contasPagarResponse);
      if (!importContaId && contasResponse.length > 0) {
        setImportContaId(contasResponse[0].id);
      }
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [tenantId, filtroStatus, filtroConta, startDate, endDate, importContaId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setError(tenantError);
  }, [tenantError]);

  useEffect(() => {
    setHasLoadedOnce(false);
    setSuccess(null);
    setConciliarOpen(false);
    setLinhaSelecionada(null);
    setConciliarForm({
      contaReceberId: NONE_OPTION,
      contaPagarId: NONE_OPTION,
      observacao: "",
    });
  }, [tenantId]);

  const contasBancariasOptions = useMemo(
    () => [
      { id: "TODAS", label: "Todas as contas" },
      ...contasBancarias.map((conta) => ({
        id: conta.id,
        label: `${conta.apelido} (${conta.banco})`,
      })),
    ],
    [contasBancarias]
  );

  function parseImportPayload(): ImportarLinhasApiInput["linhas"] {
    const normalized = payload.trim();
    if (!normalized) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(normalized);
    } catch {
      throw new Error("JSON inválido no campo de importação.");
    }

    const itens = Array.isArray(parsed) ? parsed : [parsed];
    if (itens.length === 0) throw new Error("Informe ao menos uma linha para importar.");

    return itens.map((item, index) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const contaBancariaId = typeof row.contaBancariaId === "string" && row.contaBancariaId.trim()
        ? row.contaBancariaId.trim()
        : importContaId;
      if (!contaBancariaId) {
        throw new Error(`Linha ${index + 1}: conta bancária não informada.`);
      }

      const chaveConciliacao = String(row.chaveConciliacao ?? "").trim();
      if (!chaveConciliacao) {
        throw new Error(`Linha ${index + 1}: chaveConciliacao é obrigatória.`);
      }

      const dataMovimento = String(row.dataMovimento ?? row.data ?? "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dataMovimento)) {
        throw new Error(`Linha ${index + 1}: dataMovimento deve estar no formato YYYY-MM-DD.`);
      }

      const origem =
        row.origem === "MANUAL" || row.origem === "OFX" || row.origem === "STONE"
          ? row.origem
          : importOrigem;
      const tipoMovimento =
        row.tipoMovimento === "DEBITO" || row.tipoMovimento === "CREDITO"
          ? row.tipoMovimento
          : "CREDITO";

      const valor = Number(row.valor);
      if (!Number.isFinite(valor) || valor <= 0) {
        throw new Error(`Linha ${index + 1}: valor deve ser maior que 0.`);
      }

      return {
        contaBancariaId,
        chaveConciliacao,
        dataMovimento,
        valor,
        tipoMovimento,
        origem,
        descricao: String(row.descricao ?? "").trim() || undefined,
        documento: String(row.documento ?? "").trim() || undefined,
        observacao: String(row.observacao ?? "").trim() || undefined,
      };
    });
  }

  async function handleImport() {
    if (!tenantId) {
      setError("Não foi possível identificar a unidade ativa.");
      return;
    }
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const linhasParaImportar = parseImportPayload();
      if (linhasParaImportar.length === 0) {
        throw new Error("Preencha o JSON com ao menos um lançamento.");
      }
      await importarLinhasConciliacaoApi({
        tenantId: tenantId || undefined,
        linhas: linhasParaImportar,
      });
      setSuccess("Importação concluída.");
      await load();
    } catch (importError) {
      setError(normalizeErrorMessage(importError));
    } finally {
      setSaving(false);
    }
  }

  function openConciliar(linha: ConciliacaoLinha) {
    setLinhaSelecionada(linha);
    setConciliarForm({
      contaReceberId: NONE_OPTION,
      contaPagarId: NONE_OPTION,
      observacao: linha.observacao ?? "",
    });
    setConciliarOpen(true);
  }

  async function handleConciliar() {
    if (!tenantId) {
      setError("Não foi possível identificar a unidade ativa.");
      return;
    }
    if (!linhaSelecionada) return;
    if (conciliarForm.contaReceberId === NONE_OPTION && conciliarForm.contaPagarId === NONE_OPTION) {
      setError("Selecione conta a receber ou conta a pagar.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await conciliarLinhaApi({
        tenantId: tenantId || undefined,
        id: linhaSelecionada.id,
        contaReceberId:
          conciliarForm.contaReceberId === NONE_OPTION ? undefined : conciliarForm.contaReceberId,
        contaPagarId:
          conciliarForm.contaPagarId === NONE_OPTION ? undefined : conciliarForm.contaPagarId,
        observacao: conciliarForm.observacao.trim() || undefined,
      });
      setLinhas((prev) =>
        prev
          .map((linha) => (linha.id === updated.id ? updated : linha))
          .filter((linha) => {
            if (filtroStatus === "TODAS") return true;
            if (filtroStatus === "PENDENTE") return linha.status === "PENDENTE";
            if (filtroStatus === "CONCILIADA") return linha.status === "CONCILIADA";
            return linha.status === "IGNORADA";
          })
      );
      setConciliarOpen(false);
      setLinhaSelecionada(null);
      setSuccess("Conciliação registrada com sucesso.");
    } catch (conciliationError) {
      setError(normalizeErrorMessage(conciliationError));
    } finally {
      setSaving(false);
    }
  }

  async function handleIgnorar(linha: ConciliacaoLinha) {
    if (!tenantId) {
      setError("Não foi possível identificar a unidade ativa.");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const updated = await ignorarLinhaApi({
        tenantId: tenantId || undefined,
        id: linha.id,
      });
      setLinhas((prev) =>
        prev
          .map((item) => (item.id === updated.id ? updated : item))
          .filter((item) => {
            if (filtroStatus === "TODAS") return true;
            if (filtroStatus === "PENDENTE") return item.status === "PENDENTE";
            if (filtroStatus === "CONCILIADA") return item.status === "CONCILIADA";
            return item.status === "IGNORADA";
          })
      );
      setSuccess("Lançamento ignorado.");
    } catch (ignoreError) {
      setError(normalizeErrorMessage(ignoreError));
    }
  }

  const initialLoading = tenantLoading || !tenantResolved || (loading && !hasLoadedOnce);
  const isTenantUnavailable = tenantResolved && !tenantId;
  const emptyStateMessage = isTenantUnavailable
    ? "Não foi possível identificar a unidade ativa."
    : error
      ? "Não foi possível carregar os lançamentos."
      : "Nenhum lançamento para o filtro selecionado.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administrativo</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Conciliação bancária</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Unidade ativa:{" "}
            <span className="font-medium text-foreground">
              {tenantResolved ? tenantName : "Carregando..."}
            </span>
          </p>
        </div>
      </div>

      {(error || success) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger" : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {error ?? success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Importação manual (JSON)</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Cole um array JSON com os campos: <strong>chaveConciliacao</strong>, <strong>dataMovimento</strong>, <strong>valor</strong>, <strong>tipoMovimento</strong> (CREDITO/DEBITO) e opcionalmente <strong>contaBancariaId</strong>, <strong>origem</strong>, <strong>descricao</strong>, <strong>documento</strong>, <strong>observacao</strong>.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                JSON
              </label>
              <textarea
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                placeholder='Exemplo: [{"chaveConciliacao":"DOC-001","dataMovimento":"2026-02-01","valor":120,"tipoMovimento":"CREDITO","descricao":"Mensalidade"}]'
                className="focus-ring-brand h-36 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conta bancária padrão
              </label>
              <Select value={importContaId} onValueChange={setImportContaId}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {contasBancarias.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.apelido} ({conta.banco})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Origem padrão</label>
              <Select
                value={importOrigem}
                onValueChange={(value) => setImportOrigem(value as OrigemConciliacao)}
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {IMPORT_ORIGEM_OPTIONS.map((origem) => (
                    <SelectItem key={origem} value={origem}>
                      {ORIGEM_LABEL[origem]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={handleImport} disabled={saving || !tenantResolved || !tenantId || !payload.trim()}>
              {saving ? "Importando..." : "Importar linhas"}
            </Button>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => {
                setPayload("");
              }}
            >
              Limpar
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Filtros</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="bg-secondary border-border"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="bg-secondary border-border"
            />
            <Select value={filtroConta} onValueChange={setFiltroConta}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {contasBancariasOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as ConciliacaoFiltro)}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="CONCILIADA">Conciliada</SelectItem>
                  <SelectItem value="IGNORADA">Ignorada</SelectItem>
                  <SelectItem value="TODAS">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={conciliarOpen} onOpenChange={setConciliarOpen}>
        <DialogContent className="border-border bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Conciliar lançamento</DialogTitle>
            <DialogDescription>
              Vincule a conta a receber ou a conta a pagar. O vínculo pode ser feito com apenas um lado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conta a receber
              </label>
              <Select
                value={conciliarForm.contaReceberId}
                onValueChange={(value) => setConciliarForm((prev) => ({ ...prev, contaReceberId: value }))}
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value={NONE_OPTION}>Não vincular</SelectItem>
                  {contasReceberOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conta a pagar
              </label>
              <Select
                value={conciliarForm.contaPagarId}
                onValueChange={(value) => setConciliarForm((prev) => ({ ...prev, contaPagarId: value }))}
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value={NONE_OPTION}>Não vincular</SelectItem>
                  {contasPagarOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observação
              </label>
              <Input
                value={conciliarForm.observacao}
                onChange={(event) => setConciliarForm((prev) => ({ ...prev, observacao: event.target.value }))}
                placeholder="Observação opcional"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => {
                setConciliarOpen(false);
                setLinhaSelecionada(null);
              }}
              disabled={saving}
            >
              Fechar
            </Button>
            <Button onClick={handleConciliar} disabled={saving}>
              {saving ? "Salvando..." : "Salvar conciliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Chave de conciliação</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Conta bancária</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {initialLoading && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!initialLoading && linhas.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted-foreground">
                  {emptyStateMessage}
                </td>
              </tr>
            )}
            {!initialLoading &&
              linhas.map((linha) => {
                const contaLabel = contasBancariasMap.get(linha.contaBancariaId) ?? "Conta sem referência";
                return (
                  <tr key={linha.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 text-muted-foreground">{linha.dataMovimento}</td>
                    <td className="px-4 py-3 font-medium">{linha.chaveConciliacao}</td>
                    <td className="px-4 py-3">{ORIGEM_LABEL[linha.origem]}</td>
                    <td className="px-4 py-3">{contaLabel}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CalendarDays className="size-3" /> {MOVIMENTO_ICON[linha.tipoMovimento]} {linha.tipoMovimento}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatBRL(linha.valor)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${mapStatusClass(linha.status)}`}>
                        {STATUS_LABEL[linha.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {linha.status === "PENDENTE" ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border"
                              onClick={() => openConciliar(linha)}
                            >
                              <FileCheck className="mr-1.5 size-4" />
                              Conciliar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border"
                              onClick={() => handleIgnorar(linha)}
                            >
                              <Handshake className="mr-1.5 size-4" />
                              Ignorar
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem ação</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Filter, Pencil, RefreshCcw, Search, XCircle } from "lucide-react";
import { searchAlunosApi } from "@/lib/api/alunos";
import type { ContratosDashboardMensalFilters } from "@/lib/api/contratos";
import type { Aluno, Contrato, Plano } from "@/lib/types";
import { listPlanosService } from "@/lib/tenant/comercial/runtime";
import { formatDateLabel, formatMonthLabel } from "@/lib/tenant/comercial/matriculas-insights";
import {
  resolveContratoStatusFromPlano,
  resolveFluxoComercialStatus,
  STATUS_CONTRATO_LABEL,
  STATUS_FLUXO_COMERCIAL_LABEL,
} from "@/lib/tenant/comercial/plano-flow";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useCancelarContrato, useContratos, useEditarContrato, useRenovarContrato } from "@/lib/query/use-contratos";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatBRL } from "@/lib/formatters";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { ListErrorState } from "@/components/shared/list-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ContratoEditModal, type ContratoEditForm } from "./contrato-edit-modal";

const PAGE_SIZE = 20;

const ASSINATURA_STATUS_LABEL: Record<string, string> = {
  ATIVA: "Recorrente",
  PENDENTE: "Pendente",
  CANCELADA: "Cancelada",
  SUSPENSA: "Suspensa",
  VENCIDA: "Vencida",
  INADIMPLENTE: "Inadimplente",
  TRIAL: "Trial",
};

const STATUS_OPTIONS = ["ATIVA", "VENCIDA", "CANCELADA", "SUSPENSA", "INADIMPLENTE"];
const CONTRATO_STATUS_OPTIONS = ["ASSINADO", "PENDENTE_ASSINATURA", "TRIAL"];
const PAGAMENTO_STATUS_OPTIONS = ["PENDENTE", "PAGO", "VENCIDO", "CANCELADO"];
const FORMA_PAGAMENTO_OPTIONS = ["PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "DINHEIRO", "BOLETO"];

type ContratosListProps = {
  monthKey: string;
};

type ContratoListRow = Contrato & { aluno?: Aluno; plano?: Plano };

type FilterDraft = {
  busca: string;
  status: string;
  contratoStatus: string;
  planoId: string;
  formaPagamento: string;
  pagamentoStatus: string;
  dataInicioDe: string;
  dataInicioAte: string;
  dataFimDe: string;
  dataFimAte: string;
  valorMin: string;
  valorMax: string;
  ordenarPor: string;
  direcao: "asc" | "desc";
};

const DEFAULT_FILTERS: FilterDraft = {
  busca: "",
  status: "",
  contratoStatus: "",
  planoId: "",
  formaPagamento: "",
  pagamentoStatus: "",
  dataInicioDe: "",
  dataInicioAte: "",
  dataFimDe: "",
  dataFimAte: "",
  valorMin: "",
  valorMax: "",
  ordenarPor: "dataInicio",
  direcao: "desc",
};

function getBadgeClass(kind: "contrato" | "fluxo", value: string | undefined) {
  if (kind === "contrato") {
    if (value === "ASSINADO") return "bg-gym-teal/15 text-gym-teal";
    if (value === "PENDENTE_ASSINATURA") return "bg-gym-warning/15 text-gym-warning";
    return "bg-muted text-muted-foreground";
  }

  if (value === "ATIVO") return "bg-gym-teal/15 text-gym-teal";
  if (value === "AGUARDANDO_ASSINATURA") return "bg-amber-500/15 text-amber-400";
  if (value === "AGUARDANDO_PAGAMENTO") return "bg-gym-warning/15 text-gym-warning";
  if (value === "CANCELADO") return "bg-gym-danger/15 text-gym-danger";
  if (value === "VENCIDO") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function getAssinaturaBadgeClass(status: string): string {
  if (status === "ATIVA") return "bg-gym-teal/15 text-gym-teal";
  if (status === "PENDENTE" || status === "TRIAL") return "bg-gym-warning/15 text-gym-warning";
  if (status === "CANCELADA" || status === "INADIMPLENTE") return "bg-gym-danger/15 text-gym-danger";
  if (status === "SUSPENSA" || status === "VENCIDA") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalNumber(value: string) {
  if (value.trim().length === 0) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toApiFilters(input: FilterDraft): ContratosDashboardMensalFilters {
  return {
    busca: optionalString(input.busca),
    status: optionalString(input.status),
    contratoStatus: optionalString(input.contratoStatus),
    planoId: optionalString(input.planoId),
    formaPagamento: optionalString(input.formaPagamento),
    pagamentoStatus: optionalString(input.pagamentoStatus),
    dataInicioDe: optionalString(input.dataInicioDe),
    dataInicioAte: optionalString(input.dataInicioAte),
    dataFimDe: optionalString(input.dataFimDe),
    dataFimAte: optionalString(input.dataFimAte),
    valorMin: optionalNumber(input.valorMin),
    valorMax: optionalNumber(input.valorMax),
    ordenarPor: input.ordenarPor,
    direcao: input.direcao,
  };
}

function countAdvancedFilters(input: FilterDraft) {
  return [
    input.contratoStatus,
    input.planoId,
    input.formaPagamento,
    input.pagamentoStatus,
    input.dataInicioDe,
    input.dataInicioAte,
    input.dataFimDe,
    input.dataFimAte,
    input.valorMin,
    input.valorMax,
  ].filter((value) => value.trim().length > 0).length;
}

export function ContratosList({ monthKey }: ContratosListProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { tenantId, tenantResolved, capabilities } = useTenantContext();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<ContratoListRow | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [clienteSuggestions, setClienteSuggestions] = useState<Aluno[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<FilterDraft>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterDraft>(DEFAULT_FILTERS);

  const apiFilters = useMemo(() => toApiFilters(appliedFilters), [appliedFilters]);
  const { data: dashboard, isLoading: loading, error: queryError, refetch } = useContratos({
    tenantId,
    tenantResolved,
    monthKey,
    page,
    filters: apiFilters,
  });

  const renovarMutation = useRenovarContrato();
  const cancelarMutation = useCancelarContrato();
  const editarMutation = useEditarContrato();
  const error = queryError ? normalizeErrorMessage(queryError) : null;
  const visibleRows = useMemo(() => dashboard?.contratos?.items ?? [], [dashboard?.contratos?.items]);
  const canEditContrato = capabilities.includes("matricula.editar-contrato");
  const canCancelContrato = capabilities.includes("matricula.cancelar");
  const advancedFilterCount = countAdvancedFilters(appliedFilters);
  const visibleMonthLabel = formatMonthLabel(dashboard?.mes || monthKey);
  const snapshotDateLabel =
    dashboard?.dataReferenciaOperacional && dashboard.dataReferenciaOperacional.length >= 10
      ? formatDateLabel(dashboard.dataReferenciaOperacional)
      : null;
  const hasNextPage = dashboard ? page + 1 < dashboard.contratos.totalPages : false;
  const showingFrom = visibleRows.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = visibleRows.length === 0 ? 0 : page * PAGE_SIZE + visibleRows.length;

  useEffect(() => {
    setPage(0);
    setFeedback(null);
    setActionId(null);
    setEditRow(null);
    setEditError(null);
  }, [monthKey, tenantId]);

  useEffect(() => {
    if (!tenantId || !tenantResolved) {
      setPlanos([]);
      return;
    }
    let active = true;
    listPlanosService({ tenantId, apenasAtivos: true })
      .then((items) => {
        if (active) setPlanos(items.filter((plano) => plano.ativo));
      })
      .catch(() => {
        if (active) setPlanos([]);
      });
    return () => {
      active = false;
    };
  }, [tenantId, tenantResolved]);

  useEffect(() => {
    const search = draft.busca.trim();
    if (!tenantId || !tenantResolved || search.length < 2) {
      setClienteSuggestions([]);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(() => {
      searchAlunosApi({ tenantId, search, size: 6 })
        .then((items) => {
          if (active) setClienteSuggestions(items);
        })
        .catch(() => {
          if (active) setClienteSuggestions([]);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [draft.busca, tenantId, tenantResolved]);

  function updateFilter<K extends keyof FilterDraft>(key: K, value: FilterDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function applyFilters() {
    setPage(0);
    setAppliedFilters(draft);
  }

  function clearFilters() {
    setPage(0);
    setDraft(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  }

  async function handleEditContrato(values: ContratoEditForm) {
    if (!tenantId || !editRow) return;
    setEditError(null);
    setActionId(editRow.id);
    try {
      await editarMutation.mutateAsync({
        tenantId,
        id: editRow.id,
        dataInicio: values.dataInicio,
        motivo: values.motivo,
      });
      await refetch();
      setEditRow(null);
      setFeedback(`Contrato de ${editRow.aluno?.nome ?? "cliente"} atualizado.`);
    } catch (error) {
      setEditError(normalizeErrorMessage(error));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-4">
      {ConfirmDialog}
      <ContratoEditModal
        open={Boolean(editRow)}
        alunoNome={editRow?.aluno?.nome ?? "cliente"}
        dataInicioAtual={editRow?.dataInicio ?? ""}
        dataFimAtual={editRow?.dataFim ?? ""}
        loading={editarMutation.isPending}
        error={editError}
        onOpenChange={(open) => {
          if (!open) {
            setEditRow(null);
            setEditError(null);
          }
        }}
        onSubmit={handleEditContrato}
      />

      {feedback ? (
        <div className="rounded-md border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal">
          {feedback}
        </div>
      ) : null}

      {error ? <ListErrorState error={error} onRetry={() => void refetch()} /> : null}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Listagem de contratos</h2>
            <p className="text-sm text-muted-foreground">
              Vigencia na referencia{" "}
              {snapshotDateLabel ? (
                <span className="font-medium text-foreground">{snapshotDateLabel}</span>
              ) : (
                visibleMonthLabel
              )}
              {snapshotDateLabel ? (
                <>
                  {" "}
                  (<span>{visibleMonthLabel}</span>) — paginacao e filtros no backend.
                </>
              ) : (
                <> — paginacao e filtros no backend.</>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="border-border" onClick={clearFilters}>
              Limpar
            </Button>
            <Button type="button" onClick={applyFilters}>
              <Search className="size-4" />
              Filtrar
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nome..."
              value={draft.busca}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
              onChange={(event) => {
                updateFilter("busca", event.target.value);
                setSuggestionsOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyFilters();
                  setSuggestionsOpen(false);
                }
              }}
              className="border-border bg-secondary pl-8"
            />
            {suggestionsOpen && clienteSuggestions.length > 0 ? (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                {clienteSuggestions.map((aluno) => (
                  <button
                    key={aluno.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      updateFilter("busca", aluno.nome);
                      setSuggestionsOpen(false);
                    }}
                  >
                    <span className="block font-medium text-foreground">{aluno.nome}</span>
                    <span className="block text-xs text-muted-foreground">
                      {[aluno.email, aluno.cpf].filter(Boolean).join(" - ") || "Cliente cadastrado"}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <select className="h-10 rounded-md border border-border bg-secondary px-3 text-sm lg:w-56" value={draft.status} onChange={(event) => updateFilter("status", event.target.value)}>
            <option value="">Status do contrato</option>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>

          <AdvancedFiltersSheet
            draft={draft}
            planos={planos}
            activeCount={advancedFilterCount}
            onChange={updateFilter}
            onApply={applyFilters}
            onClearAdvanced={() => {
              const nextDraft = {
                ...draft,
                contratoStatus: "",
                planoId: "",
                formaPagamento: "",
                pagamentoStatus: "",
                dataInicioDe: "",
                dataInicioAte: "",
                dataFimDe: "",
                dataFimAte: "",
                valorMin: "",
                valorMax: "",
              };
              setDraft(nextDraft);
              setAppliedFilters(nextDraft);
              setPage(0);
            }}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/70">
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plano e cobranca</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vigencia</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Situacao</th>
              <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  {loading ? "Carregando contratos..." : "Nenhum contrato encontrado para os filtros aplicados"}
                </td>
              </tr>
            ) : null}

            {visibleRows.map((row) => {
              const contratoStatus = resolveContratoStatusFromPlano(row.plano, row.contratoStatus);
              const fluxoStatus = resolveFluxoComercialStatus({ matricula: row, pagamento: row.pagamento, plano: row.plano });
              const canEdit = row.status === "ATIVA" && canEditContrato;
              const canCancel = row.status === "ATIVA" && canCancelContrato;
              const canRenew = row.status === "VENCIDA" || row.status === "CANCELADA";

              return (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-4 text-sm">
                    <div className="font-semibold text-foreground">{row.aluno?.nome ?? "Cliente nao identificado"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Inicio em {formatDateLabel(row.dataInicio)}</div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-medium text-foreground">{row.plano?.nome ?? "Plano nao encontrado"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatBRL(row.valorPago)} - {row.pagamento?.formaPagamento ?? row.formaPagamento}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{row.pagamento?.status ?? "Sem cobranca"} - {formatBRL(row.pagamento?.valorFinal ?? row.valorPago)}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    <div>De {formatDateLabel(row.dataInicio)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">ate {formatDateLabel(row.dataFim)}</div>
                    {row.dataCancelamento ? (
                      <div className="mt-1 text-xs text-gym-danger">cancelado em {formatDateLabel(row.dataCancelamento.slice(0, 10))}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", getBadgeClass("contrato", contratoStatus))}>{STATUS_CONTRATO_LABEL[contratoStatus]}</span>
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", getBadgeClass("fluxo", fluxoStatus))}>{fluxoStatus ? STATUS_FLUXO_COMERCIAL_LABEL[fluxoStatus] : "Sem fluxo"}</span>
                      {row.assinaturaStatus ? (
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", getAssinaturaBadgeClass(row.assinaturaStatus))}>{ASSINATURA_STATUS_LABEL[row.assinaturaStatus] ?? row.assinaturaStatus}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      {canEdit ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loading || actionId === row.id}
                          onClick={() => {
                            setEditError(null);
                            setEditRow(row);
                          }}
                        >
                          <Pencil className="mr-1 size-4" />
                          Editar
                        </Button>
                      ) : null}
                      {canRenew ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loading || actionId === row.id}
                          onClick={async () => {
                            if (!tenantId) return;
                            setActionId(row.id);
                            try {
                              await renovarMutation.mutateAsync({ tenantId, id: row.id });
                              setFeedback(`Contrato de ${row.aluno?.nome ?? "cliente"} renovado.`);
                            } finally {
                              setActionId(null);
                            }
                          }}
                        >
                          <RefreshCcw className="mr-1 size-4" />
                          Renovar
                        </Button>
                      ) : null}
                      {canCancel ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loading || actionId === row.id}
                          onClick={() => {
                            if (!tenantId) return;
                            confirm("Cancelar esta contratacao?", async () => {
                              setActionId(row.id);
                              try {
                                await cancelarMutation.mutateAsync({ tenantId, id: row.id, assinaturaId: row.assinaturaId });
                                setFeedback(`Contrato de ${row.aluno?.nome ?? "cliente"} cancelado.`);
                              } finally {
                                setActionId(null);
                              }
                            });
                          }}
                        >
                          <XCircle className="mr-1 size-4" />
                          Cancelar
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Mostrando <span className="font-semibold text-foreground">{showingFrom}</span> ate{" "}
          <span className="font-semibold text-foreground">{showingTo}</span> de{" "}
          <span className="font-semibold text-foreground">{dashboard?.contratos.totalItems ?? 0}</span> contrato(s) - pagina{" "}
          <span className="font-semibold text-foreground">{page + 1}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="border-border" disabled={loading || page <= 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>
            Anterior
          </Button>
          <Button type="button" variant="outline" className="border-border" disabled={loading || !hasNextPage} onClick={() => setPage((current) => current + 1)}>
            Proxima
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdvancedFiltersSheet({
  draft,
  planos,
  activeCount,
  onChange,
  onApply,
  onClearAdvanced,
}: {
  draft: FilterDraft;
  planos: Plano[];
  activeCount: number;
  onChange: <K extends keyof FilterDraft>(key: K, value: FilterDraft[K]) => void;
  onApply: () => void;
  onClearAdvanced: () => void;
}) {
  const [open, setOpen] = useState(false);

  function applyAndClose() {
    onApply();
    setOpen(false);
  }

  function clearAndClose() {
    onClearAdvanced();
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-10 w-10 rounded-xl border-border bg-secondary"
          aria-label="Abrir filtros avancados"
        >
          <Filter className="size-4" />
          {activeCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gym-accent px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full border-border bg-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filtros avancados</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex h-full flex-col">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
              <p className="text-sm font-semibold text-foreground">Contratos e assinatura</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Refine por assinatura, plano, cobranca, vigencia e valor.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FilterField label="Status Assinatura">
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/80 px-3 text-sm"
                  value={draft.contratoStatus}
                  onChange={(event) => onChange("contratoStatus", event.target.value)}
                >
                  <option value="">Todos</option>
                  {CONTRATO_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Plano">
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/80 px-3 text-sm"
                  value={draft.planoId}
                  onChange={(event) => onChange("planoId", event.target.value)}
                >
                  <option value="">Todos</option>
                  {planos.map((plano) => (
                    <option key={plano.id} value={plano.id}>{plano.nome}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Status pagamento">
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/80 px-3 text-sm"
                  value={draft.pagamentoStatus}
                  onChange={(event) => onChange("pagamentoStatus", event.target.value)}
                >
                  <option value="">Todos</option>
                  {PAGAMENTO_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Forma pagamento">
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/80 px-3 text-sm"
                  value={draft.formaPagamento}
                  onChange={(event) => onChange("formaPagamento", event.target.value)}
                >
                  <option value="">Todas</option>
                  {FORMA_PAGAMENTO_OPTIONS.map((forma) => (
                    <option key={forma} value={forma}>{forma}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Inicio de">
                <Input type="date" value={draft.dataInicioDe} onChange={(event) => onChange("dataInicioDe", event.target.value)} />
              </FilterField>

              <FilterField label="Inicio ate">
                <Input type="date" value={draft.dataInicioAte} onChange={(event) => onChange("dataInicioAte", event.target.value)} />
              </FilterField>

              <FilterField label="Fim de">
                <Input type="date" value={draft.dataFimDe} onChange={(event) => onChange("dataFimDe", event.target.value)} />
              </FilterField>

              <FilterField label="Fim ate">
                <Input type="date" value={draft.dataFimAte} onChange={(event) => onChange("dataFimAte", event.target.value)} />
              </FilterField>

              <FilterField label="Valor minimo">
                <Input type="number" min="0" step="0.01" value={draft.valorMin} onChange={(event) => onChange("valorMin", event.target.value)} />
              </FilterField>

              <FilterField label="Valor maximo">
                <Input type="number" min="0" step="0.01" value={draft.valorMax} onChange={(event) => onChange("valorMax", event.target.value)} />
              </FilterField>

              <FilterField label="Ordenar por">
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/80 px-3 text-sm"
                  value={draft.ordenarPor}
                  onChange={(event) => onChange("ordenarPor", event.target.value)}
                >
                  <option value="dataInicio">Inicio</option>
                  <option value="dataFim">Fim</option>
                  <option value="dataCriacao">Criacao</option>
                  <option value="cliente">Cliente</option>
                  <option value="plano">Plano</option>
                  <option value="status">Status contrato</option>
                  <option value="contratoStatus">Status assinatura</option>
                  <option value="pagamentoStatus">Status pagamento</option>
                  <option value="valor">Valor</option>
                </select>
              </FilterField>

              <FilterField label="Direcao">
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/80 px-3 text-sm"
                  value={draft.direcao}
                  onChange={(event) => onChange("direcao", event.target.value as "asc" | "desc")}
                >
                  <option value="desc">Decrescente</option>
                  <option value="asc">Crescente</option>
                </select>
              </FilterField>
            </div>
          </div>

          <SheetFooter className="mt-auto border-t border-border pt-5 sm:justify-between">
            <Button type="button" variant="outline" className="border-border" onClick={clearAndClose}>
              Limpar avancados
            </Button>
            <Button type="button" onClick={applyAndClose}>
              Aplicar filtros
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-3">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}

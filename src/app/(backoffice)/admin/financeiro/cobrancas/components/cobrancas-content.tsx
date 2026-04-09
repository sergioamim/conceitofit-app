"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { z } from "zod";
import { CrudModal, type FormFieldConfig } from "@/components/shared/crud-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { ListErrorState } from "@/components/shared/list-states";
import { PaginatedTable } from "@/components/shared/paginated-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  baixarAdminCobranca,
  cancelarAdminCobranca,
  createAdminCobranca,
} from "@/backoffice/api/admin-billing";
import { useAdminCobrancas, useAdminContratos } from "@/backoffice/query/use-admin-financeiro";
import { useAcademiaSuggestion } from "@/app/(backoffice)/admin/lib/use-academia-suggestion";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { formatBRL, formatDate } from "@/lib/formatters";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";
import type { Cobranca, CobrancaStatus, ContratoPlataforma, TipoFormaPagamento } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { isCobrancaEmAberto, isCobrancaPendente } from "@/lib/domain/status-helpers";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";

type PageSize = 10 | 20 | 50;
type StatusFilter = WithFilterAll<CobrancaStatus>;

type CobrancaFormValues = {
  contratoId: string;
  academiaId: string;
  academiaIdDisplay: string;
  valor: string;
  dataVencimento: string;
  multa?: string;
  juros?: string;
  observacoes?: string;
};

type BaixaManualForm = {
  dataPagamento: string;
  formaPagamento: TipoFormaPagamento;
  observacoes?: string;
};

export type CobrancasContentProps = {
  initialCobrancas: Cobranca[];
  initialContratos: ContratoPlataforma[];
};

const PAGE_SIZES: PageSize[] = [10, 20, 50];

const STATUS_OPTIONS: { value: CobrancaStatus; label: string }[] = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "PAGO", label: "Pago" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "CANCELADO", label: "Cancelado" },
];

const FORMA_PAGAMENTO_OPTIONS: { value: TipoFormaPagamento; label: string }[] = [
  { value: "BOLETO", label: "Boleto" },
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO_CREDITO", label: "Cartao de credito" },
  { value: "CARTAO_DEBITO", label: "Cartao de debito" },
  { value: "RECORRENTE", label: "Recorrente" },
];

const cobrancaFormSchema = z.object({
  contratoId: requiredTrimmedString("Selecione o contrato."),
  academiaId: z.string().trim().optional().default(""),
  academiaIdDisplay: z.string().optional().default(""),
  valor: z.string().trim().min(1, "Informe o valor da cobranca.").refine(
    (value) => Number.isFinite(Number(value.replace(",", "."))),
    { message: "Informe um valor valido." }
  ),
  dataVencimento: requiredTrimmedString("Informe a data de vencimento."),
  multa: z.string().trim().optional(),
  juros: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
});

function ContratoCobrancaHint({ contratos }: { contratos: ContratoPlataforma[] }) {
  const { control, setValue } = useFormContext<CobrancaFormValues>();
  const contratoId = useWatch({ control, name: "contratoId" });
  const valor = useWatch({ control, name: "valor" });
  const contrato = contratos.find((item) => item.id === contratoId) ?? null;

  useEffect(() => {
    if (!contrato) return;
    setValue("academiaId", contrato.academiaId, { shouldDirty: true, shouldValidate: true });
    setValue("academiaIdDisplay", contrato.academiaNome ?? "", { shouldDirty: true });
    if (!valor?.trim()) {
      setValue("valor", String(contrato.valorMensal), { shouldDirty: true });
    }
  }, [contrato, setValue, valor]);

  if (!contrato) return null;

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3 md:col-span-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Contrato selecionado
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{contrato.academiaNome}</p>
      <p className="text-xs text-muted-foreground">
        {contrato.planoNome} · {contrato.ciclo === "ANUAL" ? "Anual" : "Mensal"} · valor base {formatBRL(contrato.valorMensal)}
      </p>
    </div>
  );
}

function parseNumberString(value?: string): number | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pushAcademiaOption(target: Map<string, string>, academiaId?: string | null, academiaNome?: string | null) {
  const normalizedId = academiaId?.trim();
  const normalizedNome = academiaNome?.trim();

  if (!normalizedId || !normalizedNome) {
    return;
  }

  target.set(normalizedId, normalizedNome);
}

function getStatusBadgeClass(status: CobrancaStatus) {
  switch (status) {
    case "PAGO":
      return "bg-gym-teal text-white hover:bg-gym-teal/90";
    case "VENCIDO":
      return "border-gym-danger/30 bg-gym-danger/10 text-gym-danger";
    case "CANCELADO":
      return "border-border bg-secondary text-muted-foreground";
    case "PENDENTE":
      return "border-amber-400/40 bg-amber-500/10 text-amber-200";
  }
}

function toCobrancaStatus(cobranca: Cobranca, todayDate = ""): CobrancaStatus {
  if (isCobrancaPendente(cobranca.status) && todayDate && cobranca.dataVencimento < todayDate) {
    return "VENCIDO";
  }
  return cobranca.status;
}

function toFormValues(contrato: ContratoPlataforma | null, academiaIndex?: Map<string, string>): CobrancaFormValues {
  if (!contrato) {
    return {
      contratoId: "",
      academiaId: "",
      academiaIdDisplay: "",
      valor: "",
      dataVencimento: "",
      multa: "",
      juros: "",
      observacoes: "",
    };
  }

  return {
    contratoId: contrato.id,
    academiaId: contrato.academiaId,
    academiaIdDisplay: academiaIndex?.get(contrato.academiaId) ?? contrato.academiaNome ?? "",
    valor: String(contrato.valorMensal),
    dataVencimento: "",
    multa: "",
    juros: "",
    observacoes: "",
  };
}

export function CobrancasContent({ initialCobrancas, initialContratos }: CobrancasContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cobrancasQuery = useAdminCobrancas();
  const contratosQuery = useAdminContratos();
  const { academiaOptions: academiaSuggestionOptions, academiaIndex, onFocusOpen: onAcademiaFocusOpen } = useAcademiaSuggestion();
  const loading = cobrancasQuery.isLoading || contratosQuery.isLoading;
  const error = cobrancasQuery.error?.message ?? contratosQuery.error?.message ?? null;
  const cobrancas = cobrancasQuery.data ?? initialCobrancas;
  const contratos = contratosQuery.data ?? initialContratos;
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(FILTER_ALL);
  const [academiaFilter, setAcademiaFilter] = useState<string>(FILTER_ALL);
  const [periodoFilter, setPeriodoFilter] = useState<typeof FILTER_ALL | "VENCIDAS" | "MES_ATUAL">(FILTER_ALL);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [todayDate, setTodayDate] = useState("");
  const [currentMonthKey, setCurrentMonthKey] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [cobrancaParaBaixa, setCobrancaParaBaixa] = useState<Cobranca | null>(null);
  const [baixaForm, setBaixaForm] = useState<BaixaManualForm>({
    dataPagamento: "",
    formaPagamento: "BOLETO",
    observacoes: "",
  });
  const [baixando, setBaixando] = useState(false);
  const [cobrancaParaCancelar, setCobrancaParaCancelar] = useState<Cobranca | null>(null);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    const now = new Date();
    setTodayDate(now.toISOString().slice(0, 10));
    setCurrentMonthKey(now.toISOString().slice(0, 7));
  }, []);

  const contratosAtivos = useMemo(
    () => contratos.filter((contrato) => contrato.status === "ATIVO" || contrato.status === "TRIAL"),
    [contratos]
  );

  const contratoOptions = useMemo(
    () =>
      contratosAtivos.map((contrato) => ({
        value: contrato.id,
        label: `${contrato.academiaNome} · ${contrato.planoNome}`,
      })),
    [contratosAtivos]
  );

  const cobrancaFields = useMemo<FormFieldConfig[]>(
    () => [
      { name: "contratoId", label: "Contrato *", type: "select", options: contratoOptions, className: "md:col-span-2" },
      {
        name: "academiaId",
        label: "Academia",
        type: "suggestion",
        suggestionOptions: academiaSuggestionOptions,
        suggestionDisplayField: "academiaIdDisplay",
        onFocusOpen: onAcademiaFocusOpen,
        placeholder: "Auto-preenchido pelo contrato",
        helperText: "Preenchido automaticamente ao selecionar o contrato.",
      },
      { name: "dataVencimento", label: "Vencimento *", type: "text", required: true, placeholder: "YYYY-MM-DD" },
      { name: "valor", label: "Valor *", type: "number", required: true, min: 0, step: "0.01" },
      { name: "multa", label: "Multa", type: "number", min: 0, step: "0.01" },
      { name: "juros", label: "Juros", type: "number", min: 0, step: "0.01" },
      { name: "observacoes", label: "Observacoes", type: "textarea", className: "md:col-span-3" },
    ],
    [academiaSuggestionOptions, contratoOptions, onAcademiaFocusOpen]
  );

  const filteredCobrancas = useMemo(() => {
    return cobrancas.filter((cobranca) => {
      const effectiveStatus = toCobrancaStatus(cobranca, todayDate);
      if (statusFilter !== FILTER_ALL && effectiveStatus !== statusFilter) return false;
      if (academiaFilter !== FILTER_ALL && cobranca.academiaId !== academiaFilter) return false;
      if (periodoFilter === "VENCIDAS" && effectiveStatus !== "VENCIDO") return false;
      if (periodoFilter === "MES_ATUAL" && !cobranca.dataVencimento.startsWith(currentMonthKey)) return false;
      return true;
    });
  }, [academiaFilter, cobrancas, currentMonthKey, periodoFilter, statusFilter, todayDate]);

  const pageItems = useMemo(
    () => filteredCobrancas.slice(page * pageSize, page * pageSize + pageSize),
    [filteredCobrancas, page, pageSize]
  );

  const hasNext = (page + 1) * pageSize < filteredCobrancas.length;

  const resumo = useMemo(() => {
    let pendente = 0;
    let vencido = 0;
    let recebidoMes = 0;

    cobrancas.forEach((cobranca) => {
      const effectiveStatus = toCobrancaStatus(cobranca, todayDate);
      if (isCobrancaPendente(effectiveStatus)) pendente += cobranca.valor;
      if (effectiveStatus === "VENCIDO") vencido += cobranca.valor;
      if (effectiveStatus === "PAGO" && cobranca.dataPagamento?.startsWith(currentMonthKey)) {
        recebidoMes += cobranca.valor;
      }
    });

    const inadimplencia = pendente + vencido > 0 ? (vencido / (pendente + vencido)) * 100 : 0;
    return { pendente, vencido, recebidoMes, inadimplencia };
  }, [cobrancas, currentMonthKey, todayDate]);

  const academias = useMemo(() => {
    const map = new Map<string, string>();
    contratos.forEach((contrato) => {
      pushAcademiaOption(map, contrato.academiaId, contrato.academiaNome);
    });
    cobrancas.forEach((cobranca) => {
      pushAcademiaOption(map, cobranca.academiaId, cobranca.academiaNome);
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [cobrancas, contratos]);

  function resetFilters() {
    setStatusFilter(FILTER_ALL);
    setAcademiaFilter(FILTER_ALL);
    setPeriodoFilter(FILTER_ALL);
    setPage(0);
  }

  function openCreateModal() {
    setModalOpen(true);
  }

  async function handleCreateCobranca(values: CobrancaFormValues) {
    setSaving(true);
    try {
      const contrato = contratos.find((item) => item.id === values.contratoId);
      if (!contrato) {
        throw new Error("Selecione um contrato valido para gerar a cobranca.");
      }
      const saved = await createAdminCobranca({
        contratoId: values.contratoId,
        academiaId: values.academiaId || contrato.academiaId,
        valor: parseNumberString(values.valor) ?? 0,
        dataVencimento: values.dataVencimento.trim(),
        dataPagamento: undefined,
        status: "PENDENTE",
        formaPagamento: "BOLETO",
        multa: parseNumberString(values.multa),
        juros: parseNumberString(values.juros),
        observacoes: values.observacoes?.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.financeiro.cobrancas() });
      setPage(0);
      setModalOpen(false);
      toast({
        title: "Cobranca gerada",
        description: contrato ? `${contrato.academiaNome} · ${formatBRL(saved.valor)}` : formatBRL(saved.valor),
      });
    } catch (saveError) {
      toast({
        title: "Nao foi possivel gerar a cobranca",
        description: normalizeErrorMessage(saveError),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleBaixaManual() {
    if (!cobrancaParaBaixa) return;
    setBaixando(true);
    try {
      await baixarAdminCobranca(cobrancaParaBaixa.id, {
        dataPagamento: baixaForm.dataPagamento,
        formaPagamento: baixaForm.formaPagamento,
        observacoes: baixaForm.observacoes?.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.financeiro.cobrancas() });
      setCobrancaParaBaixa(null);
      setBaixaForm({
        dataPagamento: "",
        formaPagamento: "BOLETO",
        observacoes: "",
      });
      toast({
        title: "Cobranca baixada",
        description: `${cobrancaParaBaixa.academiaNome} · ${formatBRL(cobrancaParaBaixa.valor)}`,
      });
    } catch (errorBaixa) {
      toast({
        title: "Nao foi possivel baixar a cobranca",
        description: normalizeErrorMessage(errorBaixa),
        variant: "destructive",
      });
    } finally {
      setBaixando(false);
    }
  }

  async function handleCancelarCobranca() {
    if (!cobrancaParaCancelar) return;
    setCancelando(true);
    try {
      const cancelada = await cancelarAdminCobranca(cobrancaParaCancelar.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.financeiro.cobrancas() });
      setCobrancaParaCancelar(null);
      toast({
        title: "Cobranca cancelada",
        description: `${cancelada.academiaNome || cobrancaParaCancelar.academiaNome} · ${formatBRL(cancelada.valor)}`,
      });
    } catch (errorCancelar) {
      toast({
        title: "Nao foi possivel cancelar a cobranca",
        description: normalizeErrorMessage(errorCancelar),
        variant: "destructive",
      });
    } finally {
      setCancelando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Financeiro &gt; Cobranças</p>
        <h1 className="font-display text-3xl font-bold">Cobranças da plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Geração manual e gestão financeira das cobranças vinculadas aos contratos das academias.
        </p>
      </header>

      {error ? <ListErrorState error={error} onRetry={() => { cobrancasQuery.refetch(); contratosQuery.refetch(); }} /> : null}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total pendente</p>
          <p className="mt-2 text-2xl font-bold text-gym-warning">{loading ? "…" : formatBRL(resumo.pendente)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total vencido</p>
          <p className="mt-2 text-2xl font-bold text-gym-danger">{loading ? "…" : formatBRL(resumo.vencido)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recebido no mês</p>
          <p className="mt-2 text-2xl font-bold text-gym-teal">{loading ? "…" : formatBRL(resumo.recebidoMes)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inadimplência</p>
          <p className="mt-2 text-2xl font-bold text-gym-accent">{loading ? "…" : `${resumo.inadimplencia.toFixed(1)}%`}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Carteira de cobranças</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Filtre por status, academia e período para acompanhar vencimentos, recebimentos e baixas manuais.
            </p>
          </div>
          <Button onClick={openCreateModal}>Nova cobrança</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter);
                setPage(0);
              }}
            >
              <SelectTrigger className="border-border bg-secondary">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value={FILTER_ALL}>Todos os status</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={academiaFilter}
              onValueChange={(value) => {
                setAcademiaFilter(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="border-border bg-secondary">
                <SelectValue placeholder="Academia" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value={FILTER_ALL}>Todas as academias</SelectItem>
                {academias.map((academia) => (
                  <SelectItem key={academia.id} value={academia.id}>
                    {academia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={periodoFilter}
              onValueChange={(value) => {
                setPeriodoFilter(value as typeof FILTER_ALL | "VENCIDAS" | "MES_ATUAL");
                setPage(0);
              }}
            >
              <SelectTrigger className="border-border bg-secondary">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value={FILTER_ALL}>Todo o período</SelectItem>
                <SelectItem value="VENCIDAS">Somente vencidas</SelectItem>
                <SelectItem value="MES_ATUAL">Vencimento no mês atual</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={resetFilters} className="border-border">
              Limpar filtros
            </Button>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-44">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value) as PageSize);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-full border-border bg-secondary text-xs">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} por página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <PaginatedTable<Cobranca>
            columns={[
              { label: "Academia" },
              { label: "Valor" },
              { label: "Vencimento" },
              { label: "Pagamento" },
              { label: "Forma" },
              { label: "Status" },
              { label: "Ações", className: "text-right" },
            ]}
            items={pageItems}
            emptyText={loading ? "Carregando cobranças..." : "Nenhuma cobrança encontrada."}
            isLoading={loading}
            getRowKey={(cobranca) => cobranca.id}
            page={page}
            pageSize={pageSize}
            total={filteredCobrancas.length}
            hasNext={hasNext}
            onPrevious={() => setPage((current) => Math.max(0, current - 1))}
            onNext={() => setPage((current) => current + 1)}
            itemLabel="cobranças"
            showPagination={filteredCobrancas.length > pageSize}
            renderCells={(cobranca) => {
              const effectiveStatus = toCobrancaStatus(cobranca, todayDate);
              return (
                <>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{cobranca.academiaNome || "Academia"}</span>
                      <span className="text-xs text-muted-foreground">{cobranca.contratoId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex flex-col gap-1">
                      <span>{formatBRL(cobranca.valor)}</span>
                      {cobranca.multa || cobranca.juros ? (
                        <span className="text-xs">
                          {`Multa ${formatBRL(cobranca.multa ?? 0)} · Juros ${formatBRL(cobranca.juros ?? 0)}`}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(cobranca.dataVencimento)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {cobranca.dataPagamento ? formatDate(cobranca.dataPagamento) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{cobranca.formaPagamento ?? "Boleto"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={getStatusBadgeClass(effectiveStatus)}>
                      {effectiveStatus === "VENCIDO" ? "Vencido" : effectiveStatus === "PAGO" ? "Pago" : effectiveStatus === "CANCELADO" ? "Cancelado" : "Pendente"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <DataTableRowActions
                        actions={[
                          ...(isCobrancaEmAberto(effectiveStatus)
                            ? [
                                {
                                  kind: "edit" as const,
                                  label: "Baixa manual",
                                  onClick: () => {
                                    setCobrancaParaBaixa(cobranca);
                                    setBaixaForm({
                                      dataPagamento: todayDate,
                                      formaPagamento: cobranca.formaPagamento ?? "BOLETO",
                                      observacoes: cobranca.observacoes ?? "",
                                    });
                                  },
                                },
                                {
                                  kind: "delete" as const,
                                  label: "Cancelar cobrança",
                                  onClick: () => setCobrancaParaCancelar(cobranca),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </div>
                  </td>
                </>
              );
            }}
          />
        </CardContent>
      </Card>

      <CrudModal<CobrancaFormValues>
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(values) => {
          void handleCreateCobranca(values);
        }}
        initial={toFormValues(null)}
        title="Nova cobrança"
        description="Selecione o contrato, vencimento e parâmetros financeiros da cobrança."
        fields={cobrancaFields}
        schema={cobrancaFormSchema}
        fieldsClassName="grid gap-4 py-2 md:grid-cols-3"
        contentClassName="border-border bg-card sm:max-w-3xl"
        submitLabel={saving ? "Gerando..." : "Gerar cobrança"}
        renderAfterFields={() => <ContratoCobrancaHint contratos={contratosAtivos} />}
      />

      <Dialog
        open={cobrancaParaBaixa != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCobrancaParaBaixa(null);
            setBaixaForm({
              dataPagamento: "",
              formaPagamento: "BOLETO",
              observacoes: "",
            });
          }
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Baixa manual</DialogTitle>
            <DialogDescription>
              Registre o pagamento manual da cobrança selecionada com data, forma e observação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {cobrancaParaBaixa
                ? `${cobrancaParaBaixa.academiaNome} · ${formatBRL(cobrancaParaBaixa.valor)}`
                : "Selecione uma cobrança para registrar a baixa."}
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Data do pagamento
              </label>
              <input
                value={baixaForm.dataPagamento}
                onChange={(event) => setBaixaForm((current) => ({ ...current, dataPagamento: event.target.value }))}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Forma de pagamento
              </label>
              <Select
                value={baixaForm.formaPagamento}
                onValueChange={(value) =>
                  setBaixaForm((current) => ({ ...current, formaPagamento: value as TipoFormaPagamento }))
                }
              >
                <SelectTrigger className="border-border bg-secondary">
                  <SelectValue placeholder="Forma de pagamento" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {FORMA_PAGAMENTO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Observação
              </label>
              <Textarea
                value={baixaForm.observacoes}
                onChange={(event) => setBaixaForm((current) => ({ ...current, observacoes: event.target.value }))}
                rows={4}
                className="border-border bg-secondary"
                placeholder="Ex.: baixa manual aprovada pelo financeiro."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCobrancaParaBaixa(null)} disabled={baixando}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleBaixaManual()}
              disabled={baixando || !baixaForm.dataPagamento.trim()}
            >
              {baixando ? "Baixando..." : "Confirmar baixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={cobrancaParaCancelar != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setCobrancaParaCancelar(null);
        }}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar cobrança</AlertDialogTitle>
            <AlertDialogDescription>
              {cobrancaParaCancelar
                ? `Deseja cancelar a cobrança de ${cobrancaParaCancelar.academiaNome} no valor de ${formatBRL(cobrancaParaCancelar.valor)}?`
                : "Confirme o cancelamento da cobrança."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelando}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleCancelarCobranca()} disabled={cancelando}>
              {cancelando ? "Cancelando..." : "Cancelar cobrança"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

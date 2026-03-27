"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { listGlobalAcademias } from "@/lib/backoffice/admin";
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
  createAdminContrato,
  listAdminContratos,
  listAdminPlanos,
  reativarAdminContrato,
  suspenderAdminContrato,
  updateAdminContrato,
} from "@/lib/api/admin-billing";
import { formatBRL, formatDate } from "@/lib/formatters";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";
import type {
  Academia,
  CicloPlanoPlataforma,
  ContratoPlataforma,
  PlanoPlataforma,
  StatusContratoPlataforma,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type PageSize = 10 | 20 | 50;
type StatusFilter = "TODOS" | StatusContratoPlataforma;

type ContratoFormValues = {
  academiaId: string;
  planoId: string;
  dataInicio: string;
  dataFim?: string;
  ciclo: CicloPlanoPlataforma;
  valorMensal: string;
  status: StatusContratoPlataforma;
};

const PAGE_SIZES: PageSize[] = [10, 20, 50];

const STATUS_OPTIONS: { value: StatusContratoPlataforma; label: string }[] = [
  { value: "ATIVO", label: "Ativo" },
  { value: "TRIAL", label: "Trial" },
  { value: "SUSPENSO", label: "Suspenso" },
  { value: "CANCELADO", label: "Cancelado" },
];

const CICLO_OPTIONS: { value: CicloPlanoPlataforma; label: string }[] = [
  { value: "MENSAL", label: "Mensal" },
  { value: "ANUAL", label: "Anual" },
];

const contratoFormSchema = z.object({
  academiaId: requiredTrimmedString("Selecione a academia."),
  planoId: requiredTrimmedString("Selecione o plano."),
  dataInicio: requiredTrimmedString("Informe a data de início."),
  dataFim: z.string().trim().optional(),
  ciclo: z.enum(["MENSAL", "ANUAL"]).default("MENSAL"),
  valorMensal: z.string().trim().min(1, "Informe o valor do contrato.").refine(
    (value) => Number.isFinite(Number(value.replace(",", "."))),
    { message: "Informe um valor válido." }
  ),
  status: z.enum(["ATIVO", "SUSPENSO", "CANCELADO", "TRIAL"]).default("ATIVO"),
});

function getStatusLabel(status: StatusContratoPlataforma) {
  switch (status) {
    case "ATIVO":
      return "Ativo";
    case "TRIAL":
      return "Trial";
    case "SUSPENSO":
      return "Suspenso";
    case "CANCELADO":
      return "Cancelado";
  }
}

function getStatusBadgeClass(status: StatusContratoPlataforma) {
  switch (status) {
    case "ATIVO":
      return "bg-gym-teal text-white hover:bg-gym-teal/90";
    case "TRIAL":
      return "bg-gym-accent text-white hover:bg-gym-accent/90";
    case "SUSPENSO":
      return "border-amber-400/40 bg-amber-500/10 text-amber-200";
    case "CANCELADO":
      return "border-gym-danger/30 bg-gym-danger/10 text-gym-danger";
  }
}

function parseNumberString(value: string | undefined, fallback?: number): number | undefined {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  const parsed = Number(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isContratoVencido(dataFim?: string, todayDate = "") {
  if (!dataFim || !todayDate) return false;
  return dataFim < todayDate;
}

function toFormValues(
  contrato: ContratoPlataforma | null,
  planosIndex: Map<string, PlanoPlataforma>
): ContratoFormValues {
  if (!contrato) {
    return {
      academiaId: "",
      planoId: "",
      dataInicio: "",
      dataFim: "",
      ciclo: "MENSAL",
      valorMensal: "",
      status: "ATIVO",
    };
  }

  return {
    academiaId: contrato.academiaId,
    planoId: contrato.planoId,
    dataInicio: contrato.dataInicio,
    dataFim: contrato.dataFim ?? "",
    ciclo: contrato.ciclo,
    valorMensal: String(contrato.valorMensal ?? planosIndex.get(contrato.planoId)?.precoMensal ?? 0),
    status: contrato.status,
  };
}

export default function AdminContratosPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contratos, setContratos] = useState<ContratoPlataforma[]>([]);
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [planos, setPlanos] = useState<PlanoPlataforma[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [academiaFilter, setAcademiaFilter] = useState("TODOS");
  const [planoFilter, setPlanoFilter] = useState("TODOS");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [todayDate, setTodayDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContratoPlataforma | null>(null);
  const [suspenderOpen, setSuspenderOpen] = useState(false);
  const [suspendendo, setSuspendendo] = useState(false);
  const [motivoSuspensao, setMotivoSuspensao] = useState("");
  const [contratoParaSuspender, setContratoParaSuspender] = useState<ContratoPlataforma | null>(null);
  const [contratoParaReativar, setContratoParaReativar] = useState<ContratoPlataforma | null>(null);
  const [reativando, setReativando] = useState(false);

  useEffect(() => {
    const now = new Date();
    setTodayDate(now.toISOString().slice(0, 10));
  }, []);

  const planosIndex = useMemo(
    () => new Map(planos.map((plano) => [plano.id, plano] as const)),
    [planos]
  );

  const academiaOptions = useMemo(
    () => academias.map((academia) => ({ value: academia.id, label: academia.nome })),
    [academias]
  );

  const planoOptions = useMemo(
    () => planos.map((plano) => ({ value: plano.id, label: plano.nome })),
    [planos]
  );

  const fields = useMemo<FormFieldConfig[]>(
    () => [
      { name: "academiaId", label: "Academia *", type: "select", options: academiaOptions, className: "md:col-span-2" },
      { name: "planoId", label: "Plano *", type: "select", options: planoOptions, className: "space-y-1.5" },
      { name: "dataInicio", label: "Data de início *", type: "text", required: true, placeholder: "YYYY-MM-DD" },
      { name: "dataFim", label: "Data de fim", type: "text", placeholder: "YYYY-MM-DD" },
      { name: "ciclo", label: "Ciclo *", type: "select", options: CICLO_OPTIONS },
      { name: "valorMensal", label: "Valor negociado *", type: "number", required: true, min: 0, step: "0.01" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, className: "md:col-span-3" },
    ],
    [academiaOptions, planoOptions]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const [contratosResponse, academiasResponse, planosResponse] = await Promise.all([
        listAdminContratos(),
        listGlobalAcademias(),
        listAdminPlanos(),
      ]);
      setContratos(contratosResponse);
      setAcademias(academiasResponse);
      setPlanos(planosResponse);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredContratos = useMemo(() => {
    return contratos.filter((contrato) => {
      if (statusFilter !== "TODOS" && contrato.status !== statusFilter) return false;
      if (academiaFilter !== "TODOS" && contrato.academiaId !== academiaFilter) return false;
      if (planoFilter !== "TODOS" && contrato.planoId !== planoFilter) return false;
      return true;
    });
  }, [academiaFilter, contratos, planoFilter, statusFilter]);

  const pageItems = useMemo(
    () => filteredContratos.slice(page * pageSize, page * pageSize + pageSize),
    [filteredContratos, page, pageSize]
  );

  const hasNext = (page + 1) * pageSize < filteredContratos.length;
  const contratosSuspensos = useMemo(
    () => contratos.filter((contrato) => contrato.status === "SUSPENSO").length,
    [contratos]
  );
  const contratosVencidos = useMemo(
    () => contratos.filter((contrato) => isContratoVencido(contrato.dataFim, todayDate)).length,
    [contratos, todayDate]
  );

  function resetFilters() {
    setStatusFilter("TODOS");
    setAcademiaFilter("TODOS");
    setPlanoFilter("TODOS");
    setPage(0);
  }

  function openCreateModal() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEditModal(contrato: ContratoPlataforma) {
    setEditing(contrato);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSave(values: ContratoFormValues, id?: string) {
    setSaving(true);
    try {
      const historicoPlanosIds = editing?.planoId && editing.planoId !== values.planoId
        ? Array.from(new Set([...(editing.historicoPlanosIds ?? []), editing.planoId]))
        : editing?.historicoPlanosIds ?? [];
      const payload = {
        academiaId: values.academiaId,
        planoId: values.planoId,
        dataInicio: values.dataInicio.trim(),
        dataFim: values.dataFim?.trim() || undefined,
        ciclo: values.ciclo,
        valorMensal: parseNumberString(values.valorMensal, 0) ?? 0,
        status: values.status,
        motivoSuspensao: editing?.motivoSuspensao,
        historicoPlanosIds,
      };
      const saved = id ? await updateAdminContrato(id, payload) : await createAdminContrato(payload);
      setContratos((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      closeModal();
      setPage(0);
      toast({
        title: id ? "Contrato atualizado" : "Contrato criado",
        description: `${saved.academiaNome || "Academia"} · ${saved.planoNome || "Plano"}`,
      });
    } catch (saveError) {
      toast({
        title: "Não foi possível salvar o contrato",
        description: normalizeErrorMessage(saveError),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspenderContrato() {
    if (!contratoParaSuspender) return;
    setSuspendendo(true);
    try {
      const suspenso = await suspenderAdminContrato(contratoParaSuspender.id, motivoSuspensao);
      setContratos((current) => current.map((item) => (item.id === suspenso.id ? suspenso : item)));
      setSuspenderOpen(false);
      setContratoParaSuspender(null);
      setMotivoSuspensao("");
      toast({
        title: "Contrato suspenso",
        description: suspenso.academiaNome || suspenso.id,
      });
    } catch (errorSuspender) {
      toast({
        title: "Não foi possível suspender o contrato",
        description: normalizeErrorMessage(errorSuspender),
        variant: "destructive",
      });
    } finally {
      setSuspendendo(false);
    }
  }

  async function handleReativarContrato() {
    if (!contratoParaReativar) return;
    setReativando(true);
    try {
      const reativado = await reativarAdminContrato(contratoParaReativar.id);
      setContratos((current) => current.map((item) => (item.id === reativado.id ? reativado : item)));
      setContratoParaReativar(null);
      toast({
        title: "Contrato reativado",
        description: reativado.academiaNome || reativado.id,
      });
    } catch (errorReativar) {
      toast({
        title: "Não foi possível reativar o contrato",
        description: normalizeErrorMessage(errorReativar),
        variant: "destructive",
      });
    } finally {
      setReativando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Financeiro &gt; Contratos</p>
        <h1 className="font-display text-3xl font-bold">Contratos da plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Vínculo comercial entre academias da rede e os planos da plataforma.
        </p>
      </header>

      {error ? <ListErrorState error={error} onRetry={() => void load()} /> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de contratos</p>
          <p className="mt-2 text-2xl font-bold text-gym-accent">{loading ? "…" : contratos.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suspensos</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{loading ? "…" : contratosSuspensos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vencidos</p>
          <p className="mt-2 text-2xl font-bold text-gym-danger">{loading ? "…" : contratosVencidos}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Carteira de contratos</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Filtre por status, academia e plano para acompanhar contratos ativos, trials e exceções.
            </p>
          </div>
          <Button onClick={openCreateModal}>Novo contrato</Button>
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
                <SelectItem value="TODOS">Todos os status</SelectItem>
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
                <SelectItem value="TODOS">Todas as academias</SelectItem>
                {academias.map((academia) => (
                  <SelectItem key={academia.id} value={academia.id}>
                    {academia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={planoFilter}
              onValueChange={(value) => {
                setPlanoFilter(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="border-border bg-secondary">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="TODOS">Todos os planos</SelectItem>
                {planos.map((plano) => (
                  <SelectItem key={plano.id} value={plano.id}>
                    {plano.nome}
                  </SelectItem>
                ))}
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

          <PaginatedTable<ContratoPlataforma>
            columns={[
              { label: "Academia" },
              { label: "Plano" },
              { label: "Ciclo / valor" },
              { label: "Vigência" },
              { label: "Status" },
              { label: "Histórico" },
              { label: "Ações", className: "text-right" },
            ]}
            items={pageItems}
            emptyText={loading ? "Carregando contratos..." : "Nenhum contrato encontrado."}
            isLoading={loading}
            getRowKey={(contrato) => contrato.id}
            page={page}
            pageSize={pageSize}
            total={filteredContratos.length}
            hasNext={hasNext}
            onPrevious={() => setPage((current) => Math.max(0, current - 1))}
            onNext={() => setPage((current) => current + 1)}
            itemLabel="contratos"
            showPagination={filteredContratos.length > pageSize}
            renderCells={(contrato) => {
              const vencido = isContratoVencido(contrato.dataFim, todayDate);
              const suspenso = contrato.status === "SUSPENSO";

              return (
                <>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{contrato.academiaNome || "Academia"}</span>
                      <span className="text-xs text-muted-foreground">{contrato.academiaId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{contrato.planoNome || "Plano"}</span>
                      <span className="text-xs text-muted-foreground">{contrato.planoId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex flex-col">
                      <span>{contrato.ciclo === "ANUAL" ? "Anual" : "Mensal"}</span>
                      <span>{formatBRL(contrato.valorMensal)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex flex-col gap-1">
                      <span>Início: {formatDate(contrato.dataInicio)}</span>
                      <span>Fim: {contrato.dataFim ? formatDate(contrato.dataFim) : "Indeterminado"}</span>
                      {vencido ? (
                        <span className="text-xs font-semibold text-gym-danger">Contrato vencido</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <Badge variant="outline" className={getStatusBadgeClass(contrato.status)}>
                        {getStatusLabel(contrato.status)}
                      </Badge>
                      {suspenso && contrato.motivoSuspensao ? (
                        <span className="text-xs text-amber-200">{contrato.motivoSuspensao}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {contrato.historicoPlanosIds.length > 0
                      ? `${contrato.historicoPlanosIds.length} mudança(s)`
                      : "Sem trocas"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <DataTableRowActions
                        actions={[
                          {
                            kind: "edit",
                            label: "Editar contrato",
                            onClick: () => openEditModal(contrato),
                          },
                          ...(contrato.status === "SUSPENSO"
                            ? [
                                {
                                  kind: "toggle" as const,
                                  label: "Reativar contrato",
                                  onClick: () => setContratoParaReativar(contrato),
                                },
                              ]
                            : [
                                {
                                  kind: "toggle" as const,
                                  label: "Suspender contrato",
                                  onClick: () => {
                                    setContratoParaSuspender(contrato);
                                    setMotivoSuspensao(contrato.motivoSuspensao ?? "");
                                    setSuspenderOpen(true);
                                  },
                                },
                              ]),
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

      <CrudModal<ContratoFormValues>
        open={modalOpen}
        onClose={closeModal}
        onSave={(values, id) => {
          void handleSave(values, id);
        }}
        initial={toFormValues(editing, planosIndex)}
        initialId={editing?.id}
        title="Novo contrato"
        editTitle="Editar contrato"
        description="Selecione academia, plano, vigência, ciclo e valor negociado."
        editDescription="Atualize o vínculo comercial, status e vigência do contrato."
        fields={fields}
        schema={contratoFormSchema}
        fieldsClassName="grid gap-4 py-2 md:grid-cols-3"
        contentClassName="border-border bg-card sm:max-w-3xl"
        submitLabel={saving ? "Criando..." : "Criar contrato"}
        editSubmitLabel={saving ? "Salvando..." : "Salvar contrato"}
      />

      <Dialog
        open={suspenderOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSuspenderOpen(false);
            setContratoParaSuspender(null);
            setMotivoSuspensao("");
          }
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Suspender contrato</DialogTitle>
            <DialogDescription>
              Confirme a suspensão e registre o motivo para auditoria operacional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {contratoParaSuspender
                ? `Contrato de ${contratoParaSuspender.academiaNome} no plano ${contratoParaSuspender.planoNome}.`
                : "Selecione um contrato para suspender."}
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Motivo da suspensão
              </label>
              <Textarea
                value={motivoSuspensao}
                onChange={(event) => setMotivoSuspensao(event.target.value)}
                rows={4}
                className="border-border bg-secondary"
                placeholder="Ex.: inadimplência, renegociação comercial ou pausa temporária."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspenderOpen(false);
                setContratoParaSuspender(null);
                setMotivoSuspensao("");
              }}
              disabled={suspendendo}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleSuspenderContrato()} disabled={suspendendo}>
              {suspendendo ? "Suspendendo..." : "Confirmar suspensão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={contratoParaReativar != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setContratoParaReativar(null);
        }}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar contrato</AlertDialogTitle>
            <AlertDialogDescription>
              {contratoParaReativar
                ? `Deseja reativar o contrato de ${contratoParaReativar.academiaNome} no plano ${contratoParaReativar.planoNome}?`
                : "Confirme a reativação do contrato."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reativando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              onClick={() => void handleReativarContrato()}
              disabled={reativando}
            >
              {reativando ? "Reativando..." : "Reativar contrato"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  createCrmTaskApi,
  listCrmTasksApi,
  listProspectsApi,
  updateCrmTaskApi,
} from "@/lib/api/crm";
import { listFuncionariosApi } from "@/lib/api/administrativo";
import { normalizeCapabilityError } from "@/lib/api/backend-capability";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import { getBusinessTodayIso } from "@/lib/business-date";
import {
  buildDefaultCrmPipelineStages,
  CRM_TASK_PRIORITY_LABEL,
  CRM_TASK_STATUS_LABEL,
  CRM_TASK_TYPE_LABEL,
} from "@/lib/tenant/crm/workspace";
import { enrichCrmTasksRuntime, normalizeProspectRuntime, sortCrmTasksRuntime } from "@/lib/tenant/crm/runtime";
import type {
  CrmPipelineStage,
  CrmTask,
  CrmTaskPrioridade,
  CrmTaskStatus,
  CrmTaskTipo,
  Funcionario,
  Prospect,
  StatusProspect,
} from "@/lib/types";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { formatDateTime } from "@/lib/formatters";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  titulo: string;
  descricao: string;
  prospectId: string;
  responsavelId: string;
  stageStatus: StatusProspect;
  tipo: CrmTaskTipo;
  prioridade: CrmTaskPrioridade;
  status: Exclude<CrmTaskStatus, "ATRASADA">;
  vencimentoData: string;
  vencimentoHora: string;
};

const TODAY = getBusinessTodayIso();
const EMPTY_FORM: FormState = {
  titulo: "",
  descricao: "",
  prospectId: "",
  responsavelId: "",
  stageStatus: "NOVO",
  tipo: "LIGACAO",
  prioridade: "MEDIA",
  status: "PENDENTE",
  vencimentoData: TODAY,
  vencimentoHora: "09:00",
};

function toForm(task?: CrmTask | null): FormState {
  if (!task) return EMPTY_FORM;
  const [date = TODAY, time = "09:00"] = task.vencimentoEm.split("T");
  return {
    titulo: task.titulo,
    descricao: task.descricao ?? "",
    prospectId: task.prospectId ?? "",
    responsavelId: task.responsavelId ?? "",
    stageStatus: task.stageStatus ?? "NOVO",
    tipo: task.tipo,
    prioridade: task.prioridade,
    status: task.status === "ATRASADA" ? "PENDENTE" : task.status,
    vencimentoData: date,
    vencimentoHora: time.slice(0, 5),
  };
}

export default function CrmTarefasPage() {
  const tenantContext = useTenantContext();
  const [rows, setRows] = useState<CrmTask[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [editing, setEditing] = useState<CrmTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<CrmTaskStatus | "TODAS">("TODAS");
  const [filterResponsavel, setFilterResponsavel] = useState<string>(FILTER_ALL);
  const [filterPrioridade, setFilterPrioridade] = useState<CrmTaskPrioridade | "TODAS">("TODAS");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [writeUnavailable, setWriteUnavailable] = useState(false);
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";
  const { register, handleSubmit, reset, setValue, getValues } = useForm<FormState>({
    defaultValues: EMPTY_FORM,
  });
  const stages = useMemo<CrmPipelineStage[]>(
    () => buildDefaultCrmPipelineStages(tenantId || "tenant-runtime"),
    [tenantId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [taskRows, prospectRows, funcionarioRows] = await Promise.all([
        listCrmTasksApi({ tenantId }),
        listProspectsApi({ tenantId }),
        listFuncionariosApi(true),
      ]);
      const normalizedProspects = prospectRows
        .map((prospect) => normalizeProspectRuntime(prospect))
        .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
      setRows(
        sortCrmTasksRuntime(
          enrichCrmTasksRuntime({
            tasks: taskRows,
            prospects: normalizedProspects,
            funcionarios: funcionarioRows,
          })
        )
      );
      setProspects(normalizedProspects);
      setFuncionarios(funcionarioRows);
    } catch (loadError) {
      setError(normalizeCapabilityError(loadError, "Falha ao carregar tarefas comerciais."));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filterStatus !== "TODAS" && row.status !== filterStatus) return false;
      if (filterResponsavel !== FILTER_ALL && row.responsavelId !== filterResponsavel) return false;
      if (filterPrioridade !== "TODAS" && row.prioridade !== filterPrioridade) return false;
      return true;
    });
  }, [filterPrioridade, filterResponsavel, filterStatus, rows]);

  const metrics = useMemo(() => {
    return {
      abertas: rows.filter((row) => !["CONCLUIDA", "CANCELADA"].includes(row.status)).length,
      atrasadas: rows.filter((row) => row.status === "ATRASADA").length,
      concluidas: rows.filter((row) => row.status === "CONCLUIDA").length,
    };
  }, [rows]);

  function resetForm(task?: CrmTask | null) {
    setEditing(task ?? null);
    reset(toForm(task));
  }

  async function onSubmit(form: FormState) {
    if (!tenantId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        prospectId: form.prospectId || undefined,
        responsavelId: form.responsavelId || undefined,
        stageStatus: form.stageStatus,
        titulo: form.titulo,
        descricao: form.descricao,
        tipo: form.tipo,
        prioridade: form.prioridade,
        status: form.status,
        vencimentoEm: `${form.vencimentoData}T${form.vencimentoHora}:00`,
      };
      if (editing) {
        await updateCrmTaskApi({
          tenantId,
          id: editing.id,
          data: payload,
        });
      } else {
        await createCrmTaskApi({
          tenantId,
          data: payload,
        });
      }
      resetForm(null);
      await load();
    } catch (submitError) {
      const message = normalizeCapabilityError(submitError, "Falha ao salvar tarefa CRM.");
      setError(message);
      if (message.startsWith("Backend ainda não expõe")) {
        setWriteUnavailable(true);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleConcluir(task: CrmTask) {
    if (!tenantId) return;
    setSaving(true);
    setError("");
    try {
      await updateCrmTaskApi({
        tenantId,
        id: task.id,
        data: { status: "CONCLUIDA" },
      });
      if (editing?.id === task.id) {
        resetForm(null);
      }
      await load();
    } catch (submitError) {
      const message = normalizeCapabilityError(submitError, "Falha ao concluir tarefa.");
      setError(message);
      if (message.startsWith("Backend ainda não expõe")) {
        setWriteUnavailable(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            CRM operacional
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Tarefas comerciais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestão diária de follow-up, responsáveis e vencimentos da unidade{" "}
            <span className="font-semibold text-foreground">{tenantContext.tenantName ?? "atual"}</span>.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 lg:w-[420px]">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="px-4 py-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Abertas</p>
              <p className="mt-2 font-display text-2xl text-sky-300">{metrics.abertas}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="px-4 py-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Atrasadas</p>
              <p className="mt-2 font-display text-2xl text-rose-300">{metrics.atrasadas}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="px-4 py-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Concluídas</p>
              <p className="mt-2 font-display text-2xl text-emerald-300">{metrics.concluidas}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {error ? (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="px-6 py-5 text-sm text-rose-100">{error}</CardContent>
        </Card>
      ) : null}
      {writeUnavailable ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="px-6 py-5 text-sm text-amber-100">
            Este ambiente ainda não expõe criação e edição de tarefas CRM no backend. A tela permanece em modo leitura.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>Fila operacional</CardTitle>
            <CardDescription>Filtre por status, prioridade e responsável para distribuir a carga.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-filter-status">Status</Label>
                <select
                  id="task-filter-status"
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value as CrmTaskStatus | "TODAS")}
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                >
                  <option value="TODAS">Todos</option>
                  {Object.entries(CRM_TASK_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-filter-prioridade">Prioridade</Label>
                <select
                  id="task-filter-prioridade"
                  value={filterPrioridade}
                  onChange={(event) => setFilterPrioridade(event.target.value as CrmTaskPrioridade | "TODAS")}
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                >
                  <option value="TODAS">Todas</option>
                  {Object.entries(CRM_TASK_PRIORITY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-filter-responsavel">Responsável</Label>
                <select
                  id="task-filter-responsavel"
                  value={filterResponsavel}
                  onChange={(event) => setFilterResponsavel(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                >
                  <option value={FILTER_ALL}>Todos</option>
                  {funcionarios.map((funcionario) => (
                    <option key={funcionario.id} value={funcionario.id}>
                      {funcionario.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                Carregando tarefas comerciais...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma tarefa encontrada com os filtros atuais.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRows.map((task) => (
                  <div key={task.id} className="rounded-xl border border-border/70 bg-secondary/25 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{task.titulo}</p>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                            {CRM_TASK_STATUS_LABEL[task.status]}
                          </span>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                            {CRM_TASK_PRIORITY_LABEL[task.prioridade]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {task.prospectNome ?? "Sem prospect"} · {task.responsavelNome ?? "Sem responsável"} ·{" "}
                          {CRM_TASK_TYPE_LABEL[task.tipo]}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {task.stageStatus
                            ? stages.find((stage) => stage.status === task.stageStatus)?.nome ?? task.stageStatus
                            : "Sem etapa"}
                          {" · "}
                          vence em {formatDateTime(task.vencimentoEm)}
                        </p>
                        {task.descricao ? (
                          <p className="mt-2 text-sm text-muted-foreground">{task.descricao}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => resetForm(task)}>
                          Editar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleConcluir(task)}
                          disabled={saving || writeUnavailable || task.status === "CONCLUIDA"}
                        >
                          Concluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</CardTitle>
            <CardDescription>
              Centralize follow-up, priorização e responsável em um único registro operacional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <Label htmlFor="crm-task-titulo">Título da tarefa</Label>
                <Input
                  id="crm-task-titulo"
                  {...register("titulo")}
                  className="border-border bg-secondary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crm-task-prospect">Prospect</Label>
                <select
                  id="crm-task-prospect"
                  {...register("prospectId")}
                  onChange={(event) => {
                    const prospect = prospects.find((item) => item.id === event.target.value);
                    setValue("prospectId", event.target.value);
                    setValue("stageStatus", prospect?.status ?? getValues("stageStatus"));
                    setValue("responsavelId", prospect?.responsavelId ?? getValues("responsavelId"));
                  }}
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                >
                  <option value="">Sem prospect vinculado</option>
                  {prospects.map((prospect) => (
                    <option key={prospect.id} value={prospect.id}>
                      {prospect.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="crm-task-stage">Etapa do funil</Label>
                  <select
                    id="crm-task-stage"
                    {...register("stageStatus")}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                  >
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.status}>
                        {stage.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="crm-task-responsavel">Responsável</Label>
                  <select
                    id="crm-task-responsavel"
                    {...register("responsavelId")}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                  >
                    <option value="">Sem responsável</option>
                    {funcionarios.map((funcionario) => (
                      <option key={funcionario.id} value={funcionario.id}>
                        {funcionario.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="crm-task-tipo">Tipo</Label>
                  <select
                    id="crm-task-tipo"
                    {...register("tipo")}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                  >
                    {Object.entries(CRM_TASK_TYPE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crm-task-prioridade">Prioridade</Label>
                  <select
                    id="crm-task-prioridade"
                    {...register("prioridade")}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                  >
                    {Object.entries(CRM_TASK_PRIORITY_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crm-task-status">Status</Label>
                  <select
                    id="crm-task-status"
                    {...register("status")}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANDAMENTO">Em andamento</option>
                    <option value="CONCLUIDA">Concluída</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="crm-task-data">Data de vencimento</Label>
                  <Input
                    id="crm-task-data"
                    type="date"
                    {...register("vencimentoData")}
                    className="border-border bg-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crm-task-hora">Hora de vencimento</Label>
                  <Input
                    id="crm-task-hora"
                    type="time"
                    {...register("vencimentoHora")}
                    className="border-border bg-secondary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crm-task-descricao">Contexto do follow-up</Label>
                <Textarea
                  id="crm-task-descricao"
                  {...register("descricao")}
                  className="border-border bg-secondary"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving || writeUnavailable}>
                  {saving ? "Salvando..." : editing ? "Salvar tarefa" : "Criar tarefa"}
                </Button>
                <Button type="button" variant="outline" onClick={() => resetForm(null)} disabled={saving}>
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

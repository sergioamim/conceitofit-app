"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { ApiRequestError } from "@/lib/api/http";
import { normalizeCapabilityError } from "@/lib/api/backend-capability";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import { getBusinessTodayIso } from "@/lib/business-date";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { buildDefaultCrmPipelineStages } from "@/lib/tenant/crm/workspace";
import { useCreateCrmTask, useCrmTasksQuery, useUpdateCrmTask } from "@/lib/query/use-crm-tasks";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { CrmPipelineStage, CrmTask, CrmTaskPrioridade, CrmTaskStatus, Funcionario } from "@/lib/types";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { Card, CardContent } from "@/components/ui/card";
import {
  crmTarefaFormSchema,
  type CrmTarefaFormValues,
  EMPTY_CRM_TAREFA_FORM_VALUES,
} from "./tarefas-form-schema";
import { CrmTaskFormCard, CrmTaskQueueCard } from "./tarefas-sections";

function buildEmptyForm(todayIso: string): CrmTarefaFormValues {
  return {
    ...EMPTY_CRM_TAREFA_FORM_VALUES,
    vencimentoData: todayIso,
  };
}

function resolveResponsavelIdByName(funcionarios: Funcionario[], responsavelNome?: string): string {
  if (!responsavelNome) return "";
  const funcionario = funcionarios.find((item) => item.nome === responsavelNome);
  return funcionario?.id ?? "";
}

function toForm(task: CrmTask | null | undefined, todayIso: string, funcionarios: Funcionario[]): CrmTarefaFormValues {
  if (!task) return buildEmptyForm(todayIso);
  const [date = todayIso, time = "09:00"] = task.vencimentoEm.split("T");
  return {
    titulo: task.titulo,
    descricao: task.descricao ?? "",
    prospectId: task.prospectId ?? "",
    responsavelId: task.responsavelId ?? resolveResponsavelIdByName(funcionarios, task.responsavelNome),
    prioridade: task.prioridade,
    status: task.status === "ATRASADA" ? "PENDENTE" : task.status,
    vencimentoData: date,
    vencimentoHora: time.slice(0, 5),
  };
}

function resolveResponsavelNome(funcionarios: Funcionario[], responsavelId?: string): string | undefined {
  if (!responsavelId) return undefined;
  return funcionarios.find((item) => item.id === responsavelId)?.nome;
}

function buildTaskPayload(values: CrmTarefaFormValues, funcionarios: Funcionario[]) {
  return {
    prospectId: values.prospectId || undefined,
    titulo: values.titulo.trim(),
    descricao: values.descricao?.trim() || undefined,
    prioridade: values.prioridade,
    status: values.status,
    responsavel: resolveResponsavelNome(funcionarios, values.responsavelId),
    vencimentoEm: `${values.vencimentoData}T${values.vencimentoHora}:00`,
  };
}

function buildConcluirPayload(task: CrmTask) {
  return {
    prospectId: task.prospectId || undefined,
    titulo: task.titulo,
    descricao: task.descricao,
    prioridade: task.prioridade,
    status: "CONCLUIDA" as const,
    responsavel: task.responsavelNome,
    vencimentoEm: task.vencimentoEm,
  };
}

export default function CrmTarefasPage() {
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const {
    data: queryData,
    isLoading: loading,
    error: queryError,
  } = useCrmTasksQuery({
    tenantId,
    enabled: tenantContext.tenantResolved,
  });

  const rows = queryData?.tasks ?? [];
  const prospects = queryData?.prospects ?? [];
  const funcionarios = queryData?.funcionarios ?? [];

  const createMutation = useCreateCrmTask();
  const updateMutation = useUpdateCrmTask();
  const saving = createMutation.isPending || updateMutation.isPending;

  const [editing, setEditing] = useState<CrmTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<CrmTaskStatus | "TODAS">("TODAS");
  const [filterResponsavel, setFilterResponsavel] = useState<string>(FILTER_ALL);
  const [filterPrioridade, setFilterPrioridade] = useState<CrmTaskPrioridade | "TODAS">("TODAS");
  const [submitError, setSubmitError] = useState("");
  const [writeUnavailable, setWriteUnavailable] = useState(false);

  const form = useForm<CrmTarefaFormValues>({
    resolver: zodResolver(crmTarefaFormSchema),
    defaultValues: EMPTY_CRM_TAREFA_FORM_VALUES,
    mode: "onChange",
  });
  const { handleSubmit, reset, setValue, setError, control } = form;

  useEffect(() => {
    reset(buildEmptyForm(getBusinessTodayIso()));
  }, [reset]);

  const stages: CrmPipelineStage[] = buildDefaultCrmPipelineStages(tenantId || "tenant-runtime");
  const funcionariosById = new Map(funcionarios.map((funcionario) => [funcionario.id, funcionario] as const));
  const selectedProspectId = useWatch({ control, name: "prospectId" });
  const selectedProspect = prospects.find((prospect) => prospect.id === selectedProspectId);
  const displayError = submitError || (queryError ? normalizeErrorMessage(queryError) : "");

  const filteredRows = rows.filter((row) => {
    if (filterStatus !== "TODAS" && row.status !== filterStatus) return false;
    if (filterPrioridade !== "TODAS" && row.prioridade !== filterPrioridade) return false;
    if (filterResponsavel !== FILTER_ALL) {
      const selectedFuncionario = funcionariosById.get(filterResponsavel);
      const matchesById = row.responsavelId === filterResponsavel;
      const matchesByName = selectedFuncionario ? row.responsavelNome === selectedFuncionario.nome : false;
      if (!matchesById && !matchesByName) return false;
    }
    return true;
  });

  const metrics = {
    abertas: rows.filter((row) => !["CONCLUIDA", "CANCELADA"].includes(row.status)).length,
    atrasadas: rows.filter((row) => row.status === "ATRASADA").length,
    concluidas: rows.filter((row) => row.status === "CONCLUIDA").length,
  };

  function resetForm(task?: CrmTask | null) {
    setEditing(task ?? null);
    setSubmitError("");
    reset(toForm(task, getBusinessTodayIso(), funcionarios));
  }

  async function onSubmit(values: CrmTarefaFormValues) {
    if (!tenantId) return;

    setSubmitError("");
    try {
      const payload = buildTaskPayload(values, funcionarios);
      if (editing) {
        await updateMutation.mutateAsync({ tenantId, id: editing.id, data: payload });
      } else {
        await createMutation.mutateAsync({ tenantId, data: payload });
      }
      setWriteUnavailable(false);
      resetForm(null);
    } catch (error) {
      const fieldResult = applyApiFieldErrors(error, setError, {
        mapField: (field) => {
          switch (field) {
            case "responsavel":
              return "responsavelId";
            case "vencimentoEm":
              return "vencimentoData";
            default:
              return field as keyof CrmTarefaFormValues;
          }
        },
      });

      if (error instanceof ApiRequestError) {
        const dueDateMessage = error.fieldErrors?.vencimentoEm;
        if (typeof dueDateMessage === "string" && dueDateMessage.trim().length > 0) {
          setError("vencimentoHora", { type: "server", message: dueDateMessage });
        }
      }

      const capabilityMessage = normalizeCapabilityError(error, "Falha ao salvar tarefa CRM.");
      const message = buildFormApiErrorMessage(error, {
        appliedFields: fieldResult.appliedFields,
        fallbackMessage: capabilityMessage,
      });
      setSubmitError(message);
      if (capabilityMessage.startsWith("Backend ainda não expõe")) {
        setWriteUnavailable(true);
      }
    }
  }

  async function handleConcluir(task: CrmTask) {
    if (!tenantId) return;

    setSubmitError("");
    try {
      await updateMutation.mutateAsync({
        tenantId,
        id: task.id,
        data: buildConcluirPayload(task),
      });
      setWriteUnavailable(false);
      if (editing?.id === task.id) {
        resetForm(null);
      }
    } catch (error) {
      const message = normalizeCapabilityError(error, "Falha ao concluir tarefa.");
      setSubmitError(message);
      if (message.startsWith("Backend ainda não expõe")) {
        setWriteUnavailable(true);
      }
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

      {displayError ? (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="px-6 py-5 text-sm text-rose-100">{displayError}</CardContent>
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
        <CrmTaskQueueCard
          loading={loading}
          filteredRows={filteredRows}
          saving={saving}
          writeUnavailable={writeUnavailable}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterResponsavel={filterResponsavel}
          setFilterResponsavel={setFilterResponsavel}
          filterPrioridade={filterPrioridade}
          setFilterPrioridade={setFilterPrioridade}
          funcionarios={funcionarios}
          stages={stages}
          onEdit={resetForm}
          onConcluir={handleConcluir}
        />

        <CrmTaskFormCard
          form={form}
          editing={editing}
          saving={saving}
          writeUnavailable={writeUnavailable}
          prospects={prospects}
          funcionarios={funcionarios}
          stages={stages}
          selectedProspect={selectedProspect}
          onProspectChange={(nextProspectId) => {
            const prospect = prospects.find((item) => item.id === nextProspectId);
            setValue("prospectId", nextProspectId, { shouldDirty: true, shouldValidate: true });
            setValue("responsavelId", prospect?.responsavelId ?? "", {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          onSubmit={handleSubmit(onSubmit)}
          onReset={() => resetForm(null)}
        />
      </div>
    </div>
  );
}

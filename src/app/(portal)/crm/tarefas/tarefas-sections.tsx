"use client";

import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import { formatDateTime } from "@/lib/formatters";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import {
  CRM_TASK_PRIORITY_LABEL,
  CRM_TASK_STATUS_LABEL,
  CRM_TASK_TYPE_LABEL,
} from "@/lib/tenant/crm/workspace";
import type {
  CrmPipelineStage,
  CrmTask,
  CrmTaskPrioridade,
  CrmTaskStatus,
  Funcionario,
  Prospect,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CrmTarefaFormValues } from "./tarefas-form-schema";

export function CrmTaskQueueCard({
  loading,
  filteredRows,
  saving,
  writeUnavailable,
  filterStatus,
  setFilterStatus,
  filterResponsavel,
  setFilterResponsavel,
  filterPrioridade,
  setFilterPrioridade,
  funcionarios,
  stages,
  onEdit,
  onConcluir,
}: {
  loading: boolean;
  filteredRows: CrmTask[];
  saving: boolean;
  writeUnavailable: boolean;
  filterStatus: CrmTaskStatus | "TODAS";
  setFilterStatus: (value: CrmTaskStatus | "TODAS") => void;
  filterResponsavel: string;
  setFilterResponsavel: (value: string) => void;
  filterPrioridade: CrmTaskPrioridade | "TODAS";
  setFilterPrioridade: (value: CrmTaskPrioridade | "TODAS") => void;
  funcionarios: Funcionario[];
  stages: CrmPipelineStage[];
  onEdit: (task: CrmTask) => void;
  onConcluir: (task: CrmTask) => void;
}) {
  return (
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
                    {task.descricao ? <p className="mt-2 text-sm text-muted-foreground">{task.descricao}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => onEdit(task)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => onConcluir(task)}
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
  );
}

export function CrmTaskFormCard({
  form,
  editing,
  saving,
  writeUnavailable,
  prospects,
  funcionarios,
  stages,
  selectedProspect,
  onProspectChange,
  onSubmit,
  onReset,
}: {
  form: UseFormReturn<CrmTarefaFormValues>;
  editing: CrmTask | null;
  saving: boolean;
  writeUnavailable: boolean;
  prospects: Prospect[];
  funcionarios: Funcionario[];
  stages: CrmPipelineStage[];
  selectedProspect?: Prospect;
  onProspectChange: (prospectId: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onReset: () => void;
}) {
  const {
    register,
    formState: { errors, isValid },
  } = form;

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</CardTitle>
        <CardDescription>
          Centralize follow-up, priorização e responsável em um único registro operacional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="crm-task-titulo">Título da tarefa</Label>
            <Input id="crm-task-titulo" {...register("titulo")} className="border-border bg-secondary" />
            {errors.titulo?.message ? <p className="text-xs text-destructive">{errors.titulo.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="crm-task-prospect">Prospect</Label>
            <select
              id="crm-task-prospect"
              {...register("prospectId")}
              onChange={(event) => onProspectChange(event.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
            >
              <option value="">Sem prospect vinculado</option>
              {prospects.map((prospect) => (
                <option key={prospect.id} value={prospect.id}>
                  {prospect.nome}
                </option>
              ))}
            </select>
            {selectedProspect ? (
              <p className="text-xs text-muted-foreground">
                Etapa atual:{" "}
                {stages.find((stage) => stage.status === selectedProspect.status)?.nome ?? selectedProspect.status}
              </p>
            ) : null}
            {errors.prospectId?.message ? <p className="text-xs text-destructive">{errors.prospectId.message}</p> : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
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
              {errors.responsavelId?.message ? (
                <p className="text-xs text-destructive">{errors.responsavelId.message}</p>
              ) : null}
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
              {errors.prioridade?.message ? (
                <p className="text-xs text-destructive">{errors.prioridade.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-1">
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
              {errors.status?.message ? <p className="text-xs text-destructive">{errors.status.message}</p> : null}
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="crm-task-data">Data de vencimento</Label>
              <Input
                id="crm-task-data"
                type="date"
                {...register("vencimentoData")}
                className="border-border bg-secondary"
              />
              {errors.vencimentoData?.message ? (
                <p className="text-xs text-destructive">{errors.vencimentoData.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="crm-task-hora">Hora de vencimento</Label>
              <Input
                id="crm-task-hora"
                type="time"
                {...register("vencimentoHora")}
                className="border-border bg-secondary"
              />
              {errors.vencimentoHora?.message ? (
                <p className="text-xs text-destructive">{errors.vencimentoHora.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="crm-task-descricao">Contexto do follow-up</Label>
            <Textarea id="crm-task-descricao" {...register("descricao")} className="border-border bg-secondary" />
            {errors.descricao?.message ? <p className="text-xs text-destructive">{errors.descricao.message}</p> : null}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || writeUnavailable || !isValid}>
              {saving ? "Salvando..." : editing ? "Salvar tarefa" : "Criar tarefa"}
            </Button>
            <Button type="button" variant="outline" onClick={onReset} disabled={saving}>
              Limpar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

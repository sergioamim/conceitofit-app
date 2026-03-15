import type {
  CrmActivity,
  CrmActivityOrigem,
  CrmAutomation,
  CrmTask,
  CrmTaskOrigem,
  CrmTaskPrioridade,
  CrmWorkspaceSnapshot,
  Funcionario,
  Prospect,
} from "@/lib/types";
import {
  buildDefaultCrmPipelineStages,
  getCrmStageName,
  getEffectiveCrmTaskStatus,
  isCrmTaskClosed,
} from "./workspace";

export function normalizeProspectRuntime(prospect: Prospect, previous?: Prospect): Prospect {
  const createdAt = prospect.dataCriacao ?? previous?.dataCriacao ?? new Date().toISOString();
  const existingStatusLog = prospect.statusLog ?? previous?.statusLog ?? [];
  const statusChangedAt = prospect.dataUltimoContato ?? createdAt;
  const lastStatusLog = existingStatusLog[existingStatusLog.length - 1];
  const statusLog =
    existingStatusLog.length === 0
      ? [{ status: prospect.status, data: createdAt }]
      : lastStatusLog?.status === prospect.status
        ? existingStatusLog
        : [...existingStatusLog, { status: prospect.status, data: statusChangedAt }];

  return {
    ...(previous ?? {}),
    ...prospect,
    dataCriacao: createdAt,
    statusLog,
  };
}

export function sortCrmTasksRuntime(tasks: CrmTask[]): CrmTask[] {
  const priorityWeight: Record<CrmTaskPrioridade, number> = {
    ALTA: 3,
    MEDIA: 2,
    BAIXA: 1,
  };

  return [...tasks].sort((a, b) => {
    const dueCompare = a.vencimentoEm.localeCompare(b.vencimentoEm);
    if (dueCompare !== 0) return dueCompare;
    return priorityWeight[b.prioridade] - priorityWeight[a.prioridade];
  });
}

export function enrichCrmTasksRuntime(input: {
  tasks: CrmTask[];
  prospects: Prospect[];
  funcionarios: Funcionario[];
}): CrmTask[] {
  const prospectsById = new Map(input.prospects.map((prospect) => [prospect.id, prospect] as const));
  const funcionariosById = new Map(input.funcionarios.map((funcionario) => [funcionario.id, funcionario] as const));

  return input.tasks.map((task) => {
    const prospect = task.prospectId ? prospectsById.get(task.prospectId) : undefined;
    const responsavel = task.responsavelId ? funcionariosById.get(task.responsavelId) : undefined;

    return {
      ...task,
      prospectNome: task.prospectNome ?? prospect?.nome,
      stageStatus: task.stageStatus ?? prospect?.status,
      responsavelNome: task.responsavelNome ?? responsavel?.nome,
      status: getEffectiveCrmTaskStatus(task),
    };
  });
}

function resolveCrmActivityOrigin(origem: CrmTaskOrigem): CrmActivityOrigem {
  if (origem === "MANUAL") return "OPERADOR";
  return "AUTOMACAO";
}

function buildSyntheticCrmActivities(input: {
  tenantId: string;
  prospects: Prospect[];
  tasks: CrmTask[];
  automations: CrmAutomation[];
}): CrmActivity[] {
  const prospectActivities = input.prospects.flatMap((prospect) => {
    const activities: CrmActivity[] = [
      {
        id: `crm-activity-prospect-${prospect.id}`,
        tenantId: input.tenantId,
        prospectId: prospect.id,
        prospectNome: prospect.nome,
        tipo: "PROSPECT_CRIADO",
        titulo: `Prospect criado: ${prospect.nome}`,
        descricao: `Origem ${prospect.origem}.`,
        actorNome: "Operação CRM",
        actorId: prospect.responsavelId,
        origem: "OPERADOR",
        dataCriacao: prospect.dataCriacao,
      },
    ];

    const lastStatusLog = prospect.statusLog?.[prospect.statusLog.length - 1];
    if (prospect.status !== "NOVO" && lastStatusLog && lastStatusLog.data !== prospect.dataCriacao) {
      activities.push({
        id: `crm-activity-stage-${prospect.id}-${lastStatusLog.data}`,
        tenantId: input.tenantId,
        prospectId: prospect.id,
        prospectNome: prospect.nome,
        tipo: "ETAPA_ALTERADA",
        titulo: `Prospect movido para ${getCrmStageName(prospect.status)}`,
        descricao: `Etapa comercial atualizada para ${getCrmStageName(prospect.status)}.`,
        actorNome: "Operação CRM",
        actorId: prospect.responsavelId,
        origem: "OPERADOR",
        dataCriacao: lastStatusLog.data,
      });
    }

    return activities;
  });

  const taskActivities = input.tasks.flatMap((task) => {
    const activities: CrmActivity[] = [
      {
        id: `crm-activity-task-created-${task.id}`,
        tenantId: input.tenantId,
        prospectId: task.prospectId,
        prospectNome: task.prospectNome,
        taskId: task.id,
        tipo: "TAREFA_CRIADA",
        titulo: `Tarefa criada: ${task.titulo}`,
        descricao: task.descricao,
        actorNome: task.responsavelNome ?? "Operação CRM",
        actorId: task.responsavelId,
        origem: resolveCrmActivityOrigin(task.origem),
        dataCriacao: task.dataCriacao,
      },
    ];

    if (task.status === "CONCLUIDA" && (task.concluidaEm ?? task.dataAtualizacao)) {
      activities.push({
        id: `crm-activity-task-done-${task.id}`,
        tenantId: input.tenantId,
        prospectId: task.prospectId,
        prospectNome: task.prospectNome,
        taskId: task.id,
        tipo: "TAREFA_CONCLUIDA",
        titulo: `Tarefa concluída: ${task.titulo}`,
        descricao: task.descricao,
        actorNome: task.responsavelNome ?? "Operação CRM",
        actorId: task.responsavelId,
        origem: resolveCrmActivityOrigin(task.origem),
        dataCriacao: task.concluidaEm ?? task.dataAtualizacao ?? task.dataCriacao,
      });
    }

    return activities;
  });

  const automationActivities = input.automations.map((automation) => ({
    id: `crm-activity-automation-${automation.id}`,
    tenantId: input.tenantId,
    tipo: "AUTOMACAO_ALTERADA" as const,
    titulo: `Automação ${automation.ativo ? "ativa" : "pausada"}: ${automation.nome}`,
    descricao: automation.descricao,
    actorNome: "Sistema CRM",
    origem: "SISTEMA" as const,
    dataCriacao: automation.dataAtualizacao ?? automation.dataCriacao,
  }));

  return [...prospectActivities, ...taskActivities, ...automationActivities].sort((a, b) =>
    b.dataCriacao.localeCompare(a.dataCriacao)
  );
}

export function buildCrmWorkspaceSnapshotRuntime(input: {
  tenantId: string;
  prospects: Prospect[];
  tasks: CrmTask[];
  automations: CrmAutomation[];
  activities?: CrmActivity[];
  cadenciasAtivas?: number;
}): CrmWorkspaceSnapshot {
  const tenantId =
    input.tenantId ||
    input.prospects[0]?.tenantId ||
    input.tasks[0]?.tenantId ||
    input.automations[0]?.tenantId ||
    "tenant-runtime";
  const stages = buildDefaultCrmPipelineStages(tenantId);
  const openTasks = input.tasks.filter((task) => !isCrmTaskClosed(task.status));
  const activities =
    input.activities && input.activities.length > 0
      ? [...input.activities].sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao))
      : buildSyntheticCrmActivities({
          tenantId,
          prospects: input.prospects,
          tasks: input.tasks,
          automations: input.automations,
        });

  return {
    tenantId,
    totalProspectsAbertos: input.prospects.filter(
      (prospect) => prospect.status !== "CONVERTIDO" && prospect.status !== "PERDIDO"
    ).length,
    totalTarefasAbertas: openTasks.length,
    totalTarefasAtrasadas: openTasks.filter((task) => task.status === "ATRASADA").length,
    totalCadenciasAtivas: input.cadenciasAtivas ?? 0,
    totalAutomacoesAtivas: input.automations.filter((automation) => automation.ativo).length,
    estagios: stages.map((stage) => ({
      stageStatus: stage.status,
      stageNome: stage.nome,
      totalProspects: input.prospects.filter((prospect) => prospect.status === stage.status).length,
      totalTarefas: openTasks.filter((task) => task.stageStatus === stage.status).length,
      slaHoras: stage.slaHoras,
    })),
    proximasTarefas: sortCrmTasksRuntime(openTasks).slice(0, 5),
    atividadesRecentes: activities.slice(0, 8),
  };
}

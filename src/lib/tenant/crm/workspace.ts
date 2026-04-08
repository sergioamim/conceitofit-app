import type {
  CrmActivityTipo,
  CrmAutomationAcao,
  CrmAutomationGatilho,
  CrmCadenciaAcao,
  CrmCadenciaGatilho,
  CrmCadenceExecutionStatus,
  CrmCadenceStepExecutionStatus,
  CrmEscalationAction,
  CrmPipelineStage,
  CrmPlaybookAcao,
  CrmTask,
  CrmTaskPrioridade,
  CrmTaskStatus,
  CrmTaskTipo,
  StatusProspect,
} from "@/lib/types";

type StagePreset = Omit<CrmPipelineStage, "id" | "tenantId">;

const CRM_STAGE_PRESETS: StagePreset[] = [
  {
    status: "NOVO",
    nome: "Novo",
    ordem: 10,
    descricao: "Lead recém-capturado aguardando primeiro contato.",
    objetivo: "Responder em até 15 minutos.",
    slaHoras: 4,
    ativo: true,
    accentClass: "bg-sky-500/20 text-sky-300",
  },
  {
    status: "EM_CONTATO",
    nome: "Em contato",
    ordem: 20,
    descricao: "Qualificação ativa do interesse e objeções.",
    objetivo: "Avançar para agenda ou proposta.",
    slaHoras: 24,
    ativo: true,
    accentClass: "bg-amber-500/20 text-amber-300",
  },
  {
    status: "AGENDOU_VISITA",
    nome: "Agendou visita",
    ordem: 30,
    descricao: "Lead com visita experimental marcada.",
    objetivo: "Garantir confirmação e comparecimento.",
    slaHoras: 12,
    ativo: true,
    accentClass: "bg-orange-500/20 text-orange-300",
  },
  {
    status: "VISITOU",
    nome: "Visitou",
    ordem: 40,
    descricao: "Lead passou pela unidade e precisa de follow-up.",
    objetivo: "Apresentar plano e fechar proposta.",
    slaHoras: 24,
    ativo: true,
    accentClass: "bg-violet-500/20 text-violet-300",
  },
  {
    status: "CONVERTIDO",
    nome: "Convertido",
    ordem: 50,
    descricao: "Lead convertido em cliente ou matrícula.",
    objetivo: "Encerrar trilha comercial com handoff limpo.",
    slaHoras: 0,
    ativo: true,
    accentClass: "bg-emerald-500/20 text-emerald-300",
  },
  {
    status: "PERDIDO",
    nome: "Perdido",
    ordem: 60,
    descricao: "Lead perdido ou congelado por objeção forte.",
    objetivo: "Registrar motivo e avaliar reativação futura.",
    slaHoras: 0,
    ativo: true,
    accentClass: "bg-rose-500/20 text-rose-300",
  },
];

export const CRM_TASK_STATUS_LABEL: Record<CrmTaskStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  ATRASADA: "Atrasada",
  CANCELADA: "Cancelada",
};

export const CRM_TASK_PRIORITY_LABEL: Record<CrmTaskPrioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export const CRM_TASK_TYPE_LABEL: Record<CrmTaskTipo, string> = {
  LIGACAO: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  VISITA: "Visita",
  PROPOSTA: "Proposta",
  FOLLOW_UP: "Follow-up",
};

export const CRM_PLAYBOOK_ACTION_LABEL: Record<CrmPlaybookAcao, string> = {
  CHECKLIST: "Checklist",
  SCRIPT_WHATSAPP: "Script WhatsApp",
  LIGACAO: "Ligação",
  PROPOSTA: "Proposta",
  VISITA: "Visita",
  ENVIAR_WHATSAPP: "Enviar WhatsApp",
};

export const CRM_CADENCIA_TRIGGER_LABEL: Record<CrmCadenciaGatilho, string> = {
  NOVO_PROSPECT: "Novo prospect",
  SEM_RESPOSTA: "Sem resposta",
  VISITA_REALIZADA: "Visita realizada",
  MUDANCA_DE_ETAPA: "Mudança de etapa",
  CONVERSA_ABERTA: "Conversa aberta (WhatsApp)",
  MENSAGEM_RECEBIDA: "Mensagem recebida (WhatsApp)",
  SEM_RESPOSTA_24H: "Sem resposta (24h)",
  SEM_RESPOSTA_48H: "Sem resposta (48h)",
  SEM_RESPOSTA_72H: "Sem resposta (72h)",
};

export const CRM_CADENCIA_ACTION_LABEL: Record<CrmCadenciaAcao, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  LIGACAO: "Ligação",
  TAREFA_INTERNA: "Tarefa interna",
};

export const CRM_AUTOMATION_TRIGGER_LABEL: Record<CrmAutomationGatilho, string> = {
  PROSPECT_CRIADO: "Prospect criado",
  ETAPA_ALTERADA: "Etapa alterada",
  TAREFA_ATRASADA: "Tarefa atrasada",
  CADENCIA_CONCLUIDA: "Cadência concluída",
};

export const CRM_AUTOMATION_ACTION_LABEL: Record<CrmAutomationAcao, string> = {
  CRIAR_TAREFA: "Criar tarefa",
  INICIAR_CADENCIA: "Iniciar cadência",
  APLICAR_PLAYBOOK: "Aplicar playbook",
  NOTIFICAR_RESPONSAVEL: "Notificar responsável",
};

export const CRM_ACTIVITY_LABEL: Record<CrmActivityTipo, string> = {
  PROSPECT_CRIADO: "Prospect criado",
  ETAPA_ALTERADA: "Etapa alterada",
  FOLLOW_UP_REGISTRADO: "Follow-up registrado",
  TAREFA_CRIADA: "Tarefa criada",
  TAREFA_CONCLUIDA: "Tarefa concluída",
  PLAYBOOK_ATUALIZADO: "Playbook atualizado",
  CADENCIA_ATIVADA: "Cadência ativada",
  AUTOMACAO_ALTERADA: "Automação alterada",
};

export const CRM_CADENCE_EXECUTION_STATUS_LABEL: Record<CrmCadenceExecutionStatus, string> = {
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
  ESCALADA: "Escalada",
};

export const CRM_CADENCE_STEP_STATUS_LABEL: Record<CrmCadenceStepExecutionStatus, string> = {
  PENDENTE: "Pendente",
  EXECUTADO: "Executado",
  PULADO: "Pulado",
  FALHA: "Falha",
};

export const CRM_ESCALATION_ACTION_LABEL: Record<CrmEscalationAction, string> = {
  MOVER_ETAPA: "Mover etapa",
  CRIAR_TAREFA_URGENTE: "Criar tarefa urgente",
  NOTIFICAR_GESTOR: "Notificar gestor",
  MARCAR_PERDIDO: "Marcar como perdido",
};

export function buildDefaultCrmPipelineStages(tenantId: string): CrmPipelineStage[] {
  const tenantSuffix = tenantId.slice(-4);
  return CRM_STAGE_PRESETS.map((stage) => ({
    ...stage,
    id: `crm-stage-${tenantSuffix}-${stage.status.toLowerCase()}`,
    tenantId,
  }));
}

export function getCrmStageName(status: StatusProspect): string {
  return CRM_STAGE_PRESETS.find((stage) => stage.status === status)?.nome ?? status;
}

export function isCrmTaskClosed(status: CrmTaskStatus): boolean {
  return status === "CONCLUIDA" || status === "CANCELADA";
}

export function isCrmTaskOverdue(task: Pick<CrmTask, "status" | "vencimentoEm">, reference = new Date()): boolean {
  if (isCrmTaskClosed(task.status)) return false;
  return task.vencimentoEm < reference.toISOString().slice(0, 19);
}

export function getEffectiveCrmTaskStatus(task: Pick<CrmTask, "status" | "vencimentoEm">): CrmTaskStatus {
  return isCrmTaskOverdue(task) ? "ATRASADA" : task.status;
}

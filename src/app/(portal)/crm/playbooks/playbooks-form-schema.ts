import { z } from "zod";
import type { CrmCadenciaAcao, CrmCadenciaGatilho, CrmTaskPrioridade, StatusProspect } from "@/lib/types";

const PLAYBOOK_PRIORIDADES = ["BAIXA", "MEDIA", "ALTA"] as const satisfies readonly CrmTaskPrioridade[];
const CADENCIA_TRIGGERS = [
  "NOVO_PROSPECT",
  "SEM_RESPOSTA",
  "VISITA_REALIZADA",
  "MUDANCA_DE_ETAPA",
  "CONVERSA_ABERTA",
  "MENSAGEM_RECEBIDA",
  "SEM_RESPOSTA_24H",
  "SEM_RESPOSTA_48H",
  "SEM_RESPOSTA_72H",
] as const satisfies readonly CrmCadenciaGatilho[];
const CADENCIA_ACTIONS = [
  "WHATSAPP",
  "EMAIL",
  "LIGACAO",
  "TAREFA_INTERNA",
] as const satisfies readonly CrmCadenciaAcao[];
const STAGE_STATUSES = [
  "NOVO",
  "EM_CONTATO",
  "AGENDOU_VISITA",
  "VISITOU",
  "CONVERTIDO",
  "PERDIDO",
] as const satisfies readonly StatusProspect[];

const playbookEtapaSchema = z.object({
  value: z.string().trim().min(1, "Etapa obrigatória").max(120, "Máximo de 120 caracteres"),
});

const cadenciaPassoSchema = z.object({
  titulo: z.string().trim().min(1, "Título obrigatório").max(200, "Máximo de 200 caracteres"),
  acao: z.enum(CADENCIA_ACTIONS),
  delayDias: z.coerce.number().int().min(0, "Delay mínimo de 0 dias").max(365, "Delay máximo de 365 dias"),
  template: z.string().trim().max(100, "Máximo de 100 caracteres").optional().or(z.literal("")),
  automatica: z.boolean(),
});

export const playbookFormSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório").max(120, "Máximo de 120 caracteres"),
  descricao: z.string().trim().max(500, "Máximo de 500 caracteres").optional().or(z.literal("")),
  ativo: z.boolean(),
  prioridadePadrao: z.enum(PLAYBOOK_PRIORIDADES),
  prazoHorasPadrao: z.coerce
    .number()
    .int("Informe um número inteiro de horas")
    .min(0, "Prazo mínimo de 0 horas")
    .max(720, "Prazo máximo de 720 horas"),
  etapas: z.array(playbookEtapaSchema).min(1, "Playbook deve ter pelo menos 1 etapa").max(20, "Máximo de 20 etapas"),
});

export const cadenciaFormSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório").max(120, "Máximo de 120 caracteres"),
  objetivo: z.string().trim().min(1, "Objetivo obrigatório").max(500, "Máximo de 500 caracteres"),
  stageStatus: z.enum(STAGE_STATUSES),
  gatilho: z.enum(CADENCIA_TRIGGERS),
  ativo: z.boolean(),
  passos: z.array(cadenciaPassoSchema).min(1, "Cadência deve ter pelo menos 1 passo").max(20, "Máximo de 20 passos"),
});

export type PlaybookFormValues = z.input<typeof playbookFormSchema>;
export type CadenciaFormValues = z.input<typeof cadenciaFormSchema>;

export const EMPTY_PLAYBOOK_FORM_VALUES: PlaybookFormValues = {
  nome: "",
  descricao: "",
  ativo: true,
  prioridadePadrao: "MEDIA",
  prazoHorasPadrao: 4,
  etapas: [{ value: "" }],
};

export const EMPTY_CADENCIA_FORM_VALUES: CadenciaFormValues = {
  nome: "",
  objetivo: "",
  stageStatus: "NOVO",
  gatilho: "NOVO_PROSPECT",
  ativo: true,
  passos: [
    {
      titulo: "",
      acao: "WHATSAPP",
      delayDias: 0,
      template: "",
      automatica: true,
    },
  ],
};

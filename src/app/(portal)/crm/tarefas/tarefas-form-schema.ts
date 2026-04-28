import { z } from "zod";
import type { CrmTaskPrioridade, CrmTaskStatus } from "@/lib/types";

const TASK_PRIORIDADES = ["BAIXA", "MEDIA", "ALTA"] as const satisfies readonly CrmTaskPrioridade[];
const TASK_STATUSES = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "CANCELADA",
] as const satisfies readonly Exclude<CrmTaskStatus, "ATRASADA">[];

export const crmTarefaFormSchema = z.object({
  titulo: z.string().trim().min(1, "Título obrigatório").max(160, "Máximo de 160 caracteres"),
  descricao: z.string().trim().max(4000, "Máximo de 4000 caracteres").optional().or(z.literal("")),
  prospectId: z.string().trim().optional().or(z.literal("")),
  responsavelId: z.string().trim().optional().or(z.literal("")),
  prioridade: z.enum(TASK_PRIORIDADES),
  status: z.enum(TASK_STATUSES),
  vencimentoData: z.string().trim().min(1, "Data de vencimento obrigatória"),
  vencimentoHora: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Hora inválida")
    .min(1, "Hora de vencimento obrigatória"),
});

export type CrmTarefaFormValues = z.input<typeof crmTarefaFormSchema>;

export const EMPTY_CRM_TAREFA_FORM_VALUES: CrmTarefaFormValues = {
  titulo: "",
  descricao: "",
  prospectId: "",
  responsavelId: "",
  prioridade: "MEDIA",
  status: "PENDENTE",
  vencimentoData: "",
  vencimentoHora: "09:00",
};

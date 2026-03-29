import type { StatusProspect, StatusAgendamento } from "@/lib/types";

export const STATUS_COLUMNS: { key: StatusProspect; label: string }[] = [
  { key: "NOVO", label: "Novo" },
  { key: "AGENDOU_VISITA", label: "Agendou visita" },
  { key: "VISITOU", label: "Visitou" },
  { key: "EM_CONTATO", label: "Em contato" },
  { key: "CONVERTIDO", label: "Convertido" },
  { key: "PERDIDO", label: "Perdido" },
];

export const ORIGEM_LABEL: Record<string, string> = {
  VISITA_PRESENCIAL: "Visita presencial",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  INDICACAO: "Indicação",
  SITE: "Site",
  OUTROS: "Outros",
};

export const STATUS_AG_LABEL: Record<StatusAgendamento, string> = {
  AGENDADO: "Agendado",
  REALIZADO: "Realizado",
  CANCELADO: "Cancelado",
};

export type Tab = "detalhes" | "conversa" | "agenda";

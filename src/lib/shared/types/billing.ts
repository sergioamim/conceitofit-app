export type CicloAssinatura = "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

export type StatusAssinatura =
  | "ATIVA"
  | "PENDENTE"
  | "CANCELADA"
  | "SUSPENSA"
  | "VENCIDA"
  | "INADIMPLENTE"
  | "TRIAL";

export type StatusCobrancaRecorrente =
  | "PENDENTE"
  | "PAGO"
  | "VENCIDO"
  | "CANCELADO"
  | "FALHA"
  | "ESTORNADO";

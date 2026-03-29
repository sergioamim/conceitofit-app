export type StatusLeadB2b =
  | "NOVO"
  | "CONTATADO"
  | "QUALIFICADO"
  | "NEGOCIANDO"
  | "CONVERTIDO"
  | "PERDIDO";

export interface LeadB2b {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  nomeAcademia?: string;
  quantidadeAlunos?: number;
  cidade?: string;
  estado?: string;
  origem: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  status: StatusLeadB2b;
  notas?: string;
  dataCriacao: string;
  dataAtualizacao?: string;
}

export interface LeadB2bStats {
  total: number;
  novos: number;
  contatados: number;
  qualificados: number;
  negociando: number;
  convertidos: number;
  perdidos: number;
}

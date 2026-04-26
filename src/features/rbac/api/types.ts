/**
 * Tipos do feature module RBAC v2.
 *
 * Espelham os DTOs dos novos controllers em modulo-auth:
 *  - RbacDashboardController       (/stats, /usuarios, /auditoria)
 *  - RbacConviteController         (/convites)
 *  - RbacPoliticaSegurancaController (/politica-seguranca)
 *
 * Tipos compartilhados (PerfilAcesso, Capacidade, etc) reutilizam o módulo
 * existente em src/lib/api/gestao-acessos.types.ts.
 */

import type { PerfilAcesso, Capacidade } from "@/lib/api/gestao-acessos.types";

export type Dominio = "ACADEMIA" | "PLATAFORMA";

// ---------------------------------------------------------------------------
// /stats
// ---------------------------------------------------------------------------

export interface PapelResumo {
  id: string;
  nome: string;
  cor: string | null;
  tipo: string;
}

export interface DistribuicaoPapel {
  papelId: string;
  papelNome: string;
  papelCor: string | null;
  usuarios: number;
}

export interface AtividadeRecente {
  id: string;
  autorEmail: string;
  acao: string;
  alvo: string | null;
  categoria: string;
  critico: boolean;
  createdAt: string;
}

export interface StatsResponse {
  usuariosAtivos: number;
  usuariosAtivosDelta7d: number;
  convitesPendentes: number;
  convitesExpiramEm48h: number;
  papeisConfigurados: number;
  papeisCustom: number;
  capacidadesCriticas: number;
  distribuicaoPorPapel: DistribuicaoPapel[];
  atividadeRecente: AtividadeRecente[];
}

// ---------------------------------------------------------------------------
// /usuarios/{id}
// ---------------------------------------------------------------------------

export interface PapelInfo {
  id: string;
  nome: string;
  cor: string | null;
  tipo: string;
}

export interface UsuarioDetalhe {
  id: number;
  nome: string;
  email: string;
  userKind: string;
  enabled: boolean;
  inviteStatus: string | null;
  status: StatusUsuario;
  tenantId: string | null;
  papel: PapelInfo | null;
  createdAt: string | null;
  firstLoginAt: string | null;
}

export interface ResetarSenhaResponse {
  senhaTemporaria: string;
}

// ---------------------------------------------------------------------------
// /usuarios
// ---------------------------------------------------------------------------

export type StatusUsuario = "ativo" | "convite-pendente" | "suspenso";

export interface UsuarioListItem {
  id: number;
  nome: string;
  email: string;
  userKind: string;
  papel: PapelResumo | null;
  status: StatusUsuario;
  ultimoAcessoAt: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

export interface ListarUsuariosParams {
  dominio: Dominio;
  tenantId?: string;
  papelId?: string;
  status?: StatusUsuario;
  q?: string;
  page?: number;
  size?: number;
}

// ---------------------------------------------------------------------------
// /auditoria
// ---------------------------------------------------------------------------

export type CategoriaAuditoria =
  | "usuario" | "papel" | "permissao"
  | "seguranca" | "alerta" | "dados";

export type RangeAuditoria = "24h" | "7d" | "30d" | "90d";

export interface EventoAuditoria {
  id: string;
  tenantId: string | null;
  autorEmail: string;
  autorUserId: number | null;
  action: string;
  resourceType: string;
  resourceKey: string | null;
  categoria: CategoriaAuditoria;
  critico: boolean;
  beforeState: string | null;
  afterState: string | null;
  details: string | null;
  createdAt: string;
}

export interface ListarAuditoriaParams {
  dominio: Dominio;
  tenantId?: string;
  categoria?: CategoriaAuditoria;
  range?: RangeAuditoria;
  critico?: boolean;
  q?: string;
  page?: number;
  size?: number;
}

// ---------------------------------------------------------------------------
// /convites
// ---------------------------------------------------------------------------

export interface CriarConvitesPayload {
  dominio: Dominio;
  tenantId?: string;
  emails: string[];
  papelId: string;
  unidades?: string[];
  mensagem?: string;
}

export interface ConviteCriado {
  id: string;
  email: string;
  token: string;
  status: string;
}

export interface ResultadoConvites {
  criados: ConviteCriado[];
  jaExistentesEmOutraRede: string[];
}

// ---------------------------------------------------------------------------
// /politica-seguranca
// ---------------------------------------------------------------------------

export interface PoliticaSeguranca {
  id: string;
  dominio: Dominio;
  tenantId: string | null;
  senhaMinCaracteres: number;
  senhaExpiraEmDias: number | null;
  senhaExigirMaiuscula: boolean;
  senhaExigirNumero: boolean;
  senhaExigirSimbolo: boolean;
  senhaBloquearReuso5: boolean;
  senhaBloquearComuns: boolean;
  sessaoExpiraInatividadeMin: number;
  sessaoLimite3Simultaneas: boolean;
  sessaoRestricaoIp: boolean;
  sessaoAlertaNovoDispositivo: boolean;
  pisoCamposBloqueados: string | null;
}

export type AtualizarPoliticaPayload = Omit<
  PoliticaSeguranca,
  "id" | "pisoCamposBloqueados"
>;

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { PerfilAcesso, Capacidade };

/**
 * Tipos TypeScript para o domínio Gestão de Acessos v2.
 *
 * Espelham os DTOs dos controllers em
 * `modulo-auth/src/main/java/fit/conceito/auth/controller/`.
 */

// ---------------------------------------------------------------------------
// Feature Modules
// ---------------------------------------------------------------------------

export type FeatureModuleTipo = "CORE" | "PLATAFORMA" | "ADDON";

export interface FeatureModule {
  key: string;
  nome: string;
  descricao: string | null;
  tipo: FeatureModuleTipo;
  icone: string | null;
  ativo: boolean;
}

// ---------------------------------------------------------------------------
// Capacidades
// ---------------------------------------------------------------------------

export interface Capacidade {
  key: string;
  dominio: string;
  modulo: string;
  nome: string;
  descricao: string | null;
  grupo: string;
  ordem: number;
  /** RBAC v2: ações irreversíveis ou de alto impacto. Backfilled em V202604251900. */
  critica?: boolean;
}

/** Mapa retornado pelo endpoint `/api/v1/auth/capacidades?dominio=X` */
export type CapacidadesPorGrupo = Record<string, Capacidade[]>;

// ---------------------------------------------------------------------------
// Perfis de Acesso
// ---------------------------------------------------------------------------

export interface PerfilAcesso {
  id: string;
  dominio: string;
  tenantId: string | null;
  nome: string;
  descricao: string | null;
  tipo: string;
  copiadoDe: string | null;
  ativo: boolean;
  /** RBAC v2: cor do papel para RoleChip. Backfilled em V202604251900. */
  cor?: string | null;
}

export interface PerfilAcessoDetalhe extends PerfilAcesso {
  capacidades: string[];
}

// ---------------------------------------------------------------------------
// Usuário ↔ Perfil
// ---------------------------------------------------------------------------

export interface UsuarioPerfil {
  userId: number;
  tenantId: string;
  perfilId: string;
  perfilNome: string | null;
}

export interface UsuarioPerfilDetalhe extends UsuarioPerfil {
  overrides: UsuarioCapacidadeOverride[];
}

export interface UsuarioCapacidadeOverride {
  capacidadeKey: string;
  tipo: "GRANT" | "DENY";
  motivo: string | null;
}

// ---------------------------------------------------------------------------
// Planos SaaS
// ---------------------------------------------------------------------------

export interface PlanoSaas {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface PlanoSaasDetalhe extends PlanoSaas {
  featureKeys: string[];
}

// ---------------------------------------------------------------------------
// Grupos de Tenants
// ---------------------------------------------------------------------------

export interface GrupoTenant {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

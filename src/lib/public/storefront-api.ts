/**
 * Client server-side para os endpoints do storefront público com academiaSlug no path.
 * Base: GET /api/v1/publico/storefront/{academiaSlug}/*
 *
 * Usa serverFetch (BACKEND_PROXY_TARGET + cookies) — só pode ser chamado
 * dentro de Server Components ou Route Handlers.
 */

import { serverFetch } from "@/lib/shared/server-fetch";

// ---------------------------------------------------------------------------
// Response types — espelham DTOs do backend Java
// ---------------------------------------------------------------------------

export interface StorefrontOverviewResponse {
  academiaId: string;
  academiaSlug: string;
  nome: string;
  descricao: string;
  unidades: StorefrontUnidadeResponse[];
  modalidades: StorefrontModalidadeResponse[];
  storefrontTheme: StorefrontThemeResponse | null;
}

export interface StorefrontUnidadeResponse {
  tenantId: string;
  nome: string;
  telefone: string;
  endereco: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
}

export interface StorefrontModalidadeResponse {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
}

export interface StorefrontThemeResponse {
  id: string;
  academiaId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  corPrimaria: string | null;
  corSecundaria: string | null;
  corFundo: string | null;
  corTexto: string | null;
  titulo: string | null;
  subtitulo: string | null;
  descricao: string | null;
  bannerUrl: string | null;
  galeriaUrls: string[];
  redesSociais: Record<string, string>;
  customCssVars: Record<string, string>;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface StorefrontPlanosResponse {
  academiaId: string;
  academiaNome: string;
  academiaSlug: string;
  unidades: StorefrontUnidadePlanosResponse[];
}

export interface StorefrontUnidadePlanosResponse {
  tenantId: string;
  nomeUnidade: string;
  subdomain: string;
  planos: StorefrontPlanoPublicoResponse[];
}

export interface StorefrontPlanoPublicoResponse {
  id: string;
  nome: string;
  slug?: string;
  descricao: string;
  tipo: string;
  duracaoDias: number;
  valor: number;
  valorMatricula: number;
  destaque: boolean;
  beneficios: string[];
  ordem?: number;
}

export interface StorefrontAtividadesResponse {
  academiaId: string;
  academiaNome: string;
  academiaSlug: string;
  atividades: StorefrontAtividadePublicaResponse[];
}

export interface StorefrontAtividadePublicaResponse {
  nome: string;
  descricao: string;
  categoria: string;
  categoriaDescricao: string;
  icone: string;
  cor: string;
  imagemUrl: string;
}

export interface StorefrontSitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: string;
  priority: string;
}

export interface StorefrontSeoResponse {
  title: string;
  description: string;
  ogImage: string;
  jsonLd: string;
}

export interface StorefrontUnidadeDetalhadaResponse {
  tenantId: string;
  nome: string;
  telefone: string;
  email: string;
  whatsapp: string | null;
  descricaoPublica: string | null;
  endereco: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  } | null;
  latitude: number | null;
  longitude: number | null;
  horarioFuncionamento: StorefrontHorarioResponse[];
  fotos: string[] | null;
  planos: StorefrontPlanoPublicoResponse[];
}

export interface StorefrontHorarioResponse {
  dia: string;
  abre: string;
  fecha: string;
  fechado: boolean;
}

export interface StorefrontHorarioSlot {
  data: string;
  horaInicio: string;
  horaFim: string;
  atividadeId: string;
  nomeAtividade: string;
}

// ---------------------------------------------------------------------------
// API functions — usam academiaSlug no path
// ---------------------------------------------------------------------------

const SLUG_BASE = "/api/v1/publico/storefront";

/** GET /{academiaSlug} — overview com unidades, modalidades e tema */
export async function getStorefrontOverview(
  academiaSlug: string,
): Promise<StorefrontOverviewResponse> {
  return serverFetch<StorefrontOverviewResponse>(
    `${SLUG_BASE}/${encodeURIComponent(academiaSlug)}`,
    { next: { revalidate: 60 } },
  );
}

/** GET /{academiaSlug}/theme — tema ativo */
export async function getStorefrontThemeBySlug(
  academiaSlug: string,
): Promise<StorefrontThemeResponse> {
  return serverFetch<StorefrontThemeResponse>(
    `${SLUG_BASE}/${encodeURIComponent(academiaSlug)}/theme`,
    { next: { revalidate: 300 } },
  );
}

/** GET /{academiaSlug}/planos — planos agrupados por unidade */
export async function getStorefrontPlanos(
  academiaSlug: string,
): Promise<StorefrontPlanosResponse> {
  return serverFetch<StorefrontPlanosResponse>(
    `${SLUG_BASE}/${encodeURIComponent(academiaSlug)}/planos`,
    { next: { revalidate: 60 } },
  );
}

/** GET /{academiaSlug}/atividades — atividades públicas */
async function getStorefrontAtividades(
  academiaSlug: string,
): Promise<StorefrontAtividadesResponse> {
  return serverFetch<StorefrontAtividadesResponse>(
    `${SLUG_BASE}/${encodeURIComponent(academiaSlug)}/atividades`,
    { next: { revalidate: 60 } },
  );
}

/** GET /{academiaSlug}/sitemap — URLs para sitemap */
export async function getStorefrontSitemap(
  academiaSlug: string,
): Promise<StorefrontSitemapEntry[]> {
  return serverFetch<StorefrontSitemapEntry[]>(
    `${SLUG_BASE}/${encodeURIComponent(academiaSlug)}/sitemap`,
    { next: { revalidate: 3600 } },
  );
}

/** GET /{academiaSlug}/seo — metadata SEO */
export async function getStorefrontSeo(
  academiaSlug: string,
): Promise<StorefrontSeoResponse> {
  return serverFetch<StorefrontSeoResponse>(
    `${SLUG_BASE}/${encodeURIComponent(academiaSlug)}/seo`,
    { next: { revalidate: 3600 } },
  );
}

/** GET /{academiaSlug}/unidades/{tenantId} — detalhe da unidade */
export async function getStorefrontUnidadeDetalhe(
  academiaSlug: string,
  tenantId: string,
): Promise<StorefrontUnidadeDetalhadaResponse> {
  return serverFetch<StorefrontUnidadeDetalhadaResponse>(
    `${SLUG_BASE}/${encodeURIComponent(academiaSlug)}/unidades/${encodeURIComponent(tenantId)}`,
    { next: { revalidate: 60 } },
  );
}

/** GET /{academiaSlug}/unidades/{tenantId}/horarios-disponiveis */
async function getStorefrontHorariosDisponiveis(
  academiaSlug: string,
  tenantId: string,
  atividadeId?: string,
): Promise<{ tenantId: string; horarios: StorefrontHorarioSlot[] }> {
  return serverFetch<{ tenantId: string; horarios: StorefrontHorarioSlot[] }>(
    `${SLUG_BASE}/${encodeURIComponent(academiaSlug)}/unidades/${encodeURIComponent(tenantId)}/horarios-disponiveis`,
    {
      query: atividadeId ? { atividadeId } : undefined,
      next: { revalidate: 300 },
    },
  );
}

import { serverFetch } from "@/lib/shared/server-fetch";
import { getTenantAppName, resolveTenantTheme } from "@/lib/tenant/tenant-theme";
import type {
  Academia,
  Plano,
  Tenant,
  TenantThemeColors,
  TipoFormaPagamento,
} from "@/lib/types";
import type { PublicTenantContext } from "./services";

// ---------------------------------------------------------------------------
// Server-side data fetching for the public journey (RSC)
// ---------------------------------------------------------------------------
// Uses `serverFetch` (BACKEND_PROXY_TARGET + cookies) so these functions can
// only be called inside Server Components or Route Handlers.
// ---------------------------------------------------------------------------

interface TenantApiResponse {
  id: string;
  academiaId?: string | null;
  nome: string;
  razaoSocial?: string | null;
  documento?: string | null;
  groupId?: string | null;
  subdomain?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativo?: boolean;
  endereco?: Record<string, string | null> | null;
  branding?: {
    appName?: string | null;
    logoUrl?: string | null;
    themePreset?: string | null;
    useCustomColors?: boolean;
    colors?: Record<string, string> | null;
  } | null;
}

interface AcademiaApiResponse {
  id: string;
  nome: string;
  razaoSocial?: string | null;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: Record<string, string | null> | null;
  branding?: TenantApiResponse["branding"] | null;
  ativo?: boolean | null;
}

interface FormaPagamentoApiResponse {
  id: string;
  tenantId: string;
  nome: string;
  tipo: TipoFormaPagamento;
  parcelasMax?: number | null;
  ativo?: boolean | null;
}

// Reuse the same plano response normalizer from comercial-catalogo
interface PlanoApiRaw {
  id?: string;
  tenantId?: string;
  nome?: string;
  descricao?: string | null;
  tipo?: Plano["tipo"] | null;
  duracaoDias?: unknown;
  valor?: unknown;
  valorMatricula?: unknown;
  cobraAnuidade?: unknown;
  valorAnuidade?: unknown;
  parcelasMaxAnuidade?: unknown;
  permiteRenovacaoAutomatica?: unknown;
  permiteCobrancaRecorrente?: unknown;
  permiteVendaOnline?: unknown;
  diaCobrancaPadrao?: unknown;
  contratoTemplateHtml?: string | null;
  contratoAssinatura?: Plano["contratoAssinatura"] | null;
  contratoEnviarAutomaticoEmail?: unknown;
  atividadeIds?: string[] | null;
  atividades?: Array<{ id: string }> | null;
  beneficios?: string[] | null;
  ativo?: unknown;
  destaque?: unknown;
  ordem?: unknown;
}

// ---------------------------------------------------------------------------
// Normalizers (lightweight duplicates to avoid importing client modules)
// ---------------------------------------------------------------------------

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

const toBool = (v: unknown, fb = false): boolean => {
  if (typeof v === "boolean") return v;
  return fb;
};

function normalizeDiasCobrancaPublic(value: unknown): number[] | undefined {
  if (Array.isArray(value)) {
    const dias = value.map(Number).filter((n) => Number.isFinite(n) && n >= 1 && n <= 28);
    return dias.length > 0 ? dias.sort((a, b) => a - b) : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 28) {
    return [value];
  }
  return undefined;
}

function normalizeTenant(raw: TenantApiResponse): Tenant {
  return {
    id: raw.id,
    academiaId: raw.academiaId ?? undefined,
    nome: raw.nome,
    razaoSocial: raw.razaoSocial ?? undefined,
    documento: raw.documento ?? undefined,
    groupId: raw.groupId ?? undefined,
    subdomain: raw.subdomain ?? undefined,
    email: raw.email ?? undefined,
    telefone: raw.telefone ?? undefined,
    ativo: raw.ativo ?? true,
    endereco: raw.endereco
      ? Object.fromEntries(
          Object.entries(raw.endereco).map(([k, v]) => [k, v ?? undefined]),
        )
      : undefined,
    branding: raw.branding
      ? {
          appName: raw.branding.appName ?? undefined,
          logoUrl: raw.branding.logoUrl ?? undefined,
          themePreset: raw.branding.themePreset as Tenant["branding"] extends infer B
            ? B extends { themePreset?: infer P }
              ? P
              : never
            : never,
          useCustomColors: raw.branding.useCustomColors ?? false,
          colors: raw.branding.colors ?? undefined,
        }
      : undefined,
  };
}

function normalizeAcademia(raw: AcademiaApiResponse): Academia {
  return {
    id: raw.id,
    nome: raw.nome,
    razaoSocial: raw.razaoSocial ?? undefined,
    documento: raw.documento ?? undefined,
    email: raw.email ?? undefined,
    telefone: raw.telefone ?? undefined,
    endereco: raw.endereco
      ? Object.fromEntries(
          Object.entries(raw.endereco).map(([k, v]) => [k, v ?? undefined]),
        )
      : undefined,
    branding: raw.branding
      ? {
          appName: raw.branding.appName ?? undefined,
          logoUrl: raw.branding.logoUrl ?? undefined,
          themePreset: raw.branding.themePreset as Academia["branding"] extends infer B
            ? B extends { themePreset?: infer P }
              ? P
              : never
            : never,
          useCustomColors: raw.branding.useCustomColors ?? false,
          colors: raw.branding.colors ?? undefined,
        }
      : undefined,
    ativo: raw.ativo ?? undefined,
  };
}

function normalizePlano(raw: PlanoApiRaw, tenantId: string): Plano {
  const tipo = raw.tipo ?? "MENSAL";
  return {
    id: raw.id ?? "",
    tenantId: raw.tenantId ?? tenantId,
    nome: raw.nome ?? "",
    descricao: (raw.descricao ?? undefined) as string | undefined,
    tipo,
    duracaoDias: Math.max(1, Math.floor(toNum(raw.duracaoDias, 1))),
    valor: toNum(raw.valor, 0),
    valorMatricula: toNum(raw.valorMatricula, 0),
    cobraAnuidade: toBool(raw.cobraAnuidade),
    valorAnuidade: raw.valorAnuidade == null ? undefined : toNum(raw.valorAnuidade),
    parcelasMaxAnuidade: raw.parcelasMaxAnuidade == null
      ? undefined
      : Math.max(1, Math.floor(toNum(raw.parcelasMaxAnuidade, 1))),
    permiteRenovacaoAutomatica: toBool(raw.permiteRenovacaoAutomatica, tipo !== "AVULSO"),
    permiteCobrancaRecorrente: toBool(raw.permiteCobrancaRecorrente),
    permiteVendaOnline: toBool(raw.permiteVendaOnline, true),
    diaCobrancaPadrao: normalizeDiasCobrancaPublic(raw.diaCobrancaPadrao),
    contratoTemplateHtml: raw.contratoTemplateHtml?.trim() || undefined,
    contratoAssinatura: raw.contratoAssinatura ?? "AMBAS",
    contratoEnviarAutomaticoEmail: toBool(raw.contratoEnviarAutomaticoEmail),
    atividades: Array.isArray(raw.atividadeIds)
      ? raw.atividadeIds
      : Array.isArray(raw.atividades)
        ? raw.atividades.map((a) => a.id).filter(Boolean)
        : [],
    beneficios: Array.isArray(raw.beneficios)
      ? raw.beneficios.filter((b): b is string => typeof b === "string" && b.trim().length > 0)
      : [],
    destaque: toBool(raw.destaque),
    ativo: toBool(raw.ativo, true),
    ordem: raw.ordem == null ? undefined : Math.max(0, Math.floor(toNum(raw.ordem))),
  };
}

// ---------------------------------------------------------------------------
// normalizeSlug helper
// ---------------------------------------------------------------------------

function normalizeSlug(value?: string | null): string {
  return (value?.trim() ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveTenantFromRef(tenants: Tenant[], ref?: string | null): Tenant {
  const normalizedRef = normalizeSlug(ref);
  if (normalizedRef) {
    const matched = tenants.find((t) =>
      [t.id, t.subdomain, t.nome].some((v) => normalizeSlug(v) === normalizedRef),
    );
    if (matched) return matched;
  }
  return tenants[0] ?? (() => { throw new Error("Nenhuma unidade pública disponível."); })();
}

function buildAcademiaFromTenant(tenant: Tenant): Academia {
  return {
    id: tenant.academiaId ?? tenant.groupId ?? tenant.id,
    nome: tenant.nome,
    razaoSocial: tenant.razaoSocial,
    documento: tenant.documento,
    email: tenant.email,
    telefone: tenant.telefone,
    endereco: tenant.endereco,
    branding: tenant.branding,
    ativo: tenant.ativo,
  };
}

// ---------------------------------------------------------------------------
// Exported server-only functions
// ---------------------------------------------------------------------------

export async function listPublicTenantsServer(): Promise<Tenant[]> {
  const raw = await serverFetch<TenantApiResponse[]>("/api/v1/unidades", {
    next: { revalidate: 120 },
  });
  return raw
    .map(normalizeTenant)
    .filter((t) => t.ativo !== false)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function getPublicJourneyContextServer(
  tenantRef?: string | null,
): Promise<PublicTenantContext> {
  const tenants = await listPublicTenantsServer();
  const resolved = resolveTenantFromRef(tenants, tenantRef);

  // Set tenant context + fetch academia
  const tenant = resolved;
  let academia: Academia;

  try {
    await serverFetch<unknown>(
      `/api/v1/context/unidade-ativa/${resolved.id}`,
      { method: "PUT" },
    );
    academia = await serverFetch<AcademiaApiResponse>("/api/v1/academia", {
      query: { tenantId: resolved.id },
    }).then(normalizeAcademia);
  } catch {
    academia = buildAcademiaFromTenant(tenant);
  }

  type PlanoListResponse = PlanoApiRaw[] | { items?: PlanoApiRaw[]; content?: PlanoApiRaw[] };

  const [planosRaw, formasRaw] = await Promise.all([
    serverFetch<PlanoListResponse>("/api/v1/comercial/planos", {
      query: { tenantId: tenant.id, apenasAtivos: true },
      next: { revalidate: 60 },
    }),
    serverFetch<FormaPagamentoApiResponse[]>(
      "/api/v1/gerencial/financeiro/formas-pagamento",
      {
        query: { tenantId: tenant.id, apenasAtivas: true },
        next: { revalidate: 120 },
      },
    ),
  ]);

  const planoItems: PlanoApiRaw[] = Array.isArray(planosRaw)
    ? planosRaw
    : (planosRaw as Record<string, PlanoApiRaw[] | undefined>).items ??
      (planosRaw as Record<string, PlanoApiRaw[] | undefined>).content ??
      [];

  const planos = planoItems
    .map((p) => normalizePlano(p, tenant.id))
    .filter((p) => p.ativo)
    .sort((a, b) => {
      if (a.destaque === b.destaque) return (a.ordem ?? 999) - (b.ordem ?? 999);
      return a.destaque ? -1 : 1;
    });

  const formasPagamentoOnline = formasRaw
    .filter((f) => f.ativo !== false && (f.tipo === "PIX" || f.tipo === "CARTAO_CREDITO"))
    .sort((a, b) => {
      if (a.tipo === b.tipo) return 0;
      if (a.tipo === "PIX") return -1;
      if (b.tipo === "PIX") return 1;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
  const cartaoCreditoParcelasMax =
    formasPagamentoOnline.find((f) => f.tipo === "CARTAO_CREDITO")?.parcelasMax ?? 1;

  return {
    tenant,
    tenantRef: tenant.subdomain ?? tenant.id,
    academia,
    appName: getTenantAppName(academia),
    theme: resolveTenantTheme(academia),
    planos,
    formasPagamento: formasPagamentoOnline.map((f) => f.tipo),
    cartaoCreditoParcelasMax,
  };
}

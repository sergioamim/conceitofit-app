import { Suspense, type ComponentType } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { logger } from "@/lib/shared/logger";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

const DEFAULT_FALLBACK = <SuspenseFallback variant="section" />;

type TenantLoaderOptions<T> = {
  url: string;
  query?: Record<string, unknown>;
  fallbackMessage?: string;
  passTenantId?: boolean;
  logModule?: string;
  emptyValue?: T;
};

/**
 * Creates a Server Component page that fetches data for the active tenant
 * and renders a content component with `initialData` (and optionally `tenantId`).
 *
 * Eliminates the repeated getActiveTenantId + serverFetch + Suspense boilerplate.
 *
 * @example
 * // Simple case: fetch and pass initialData
 * export default createTenantLoader<Sala[]>({
 *   url: "/api/v1/administrativo/salas",
 *   query: { apenasAtivas: false },
 *   logModule: "SalasPage",
 * }, SalasContent);
 *
 * @example
 * // With tenantId passed to component
 * export default createTenantLoader<Atividade[]>({
 *   url: "/api/v1/administrativo/atividades",
 *   query: { apenasAtivas: true },
 *   passTenantId: true,
 *   fallbackMessage: "Carregando atividades...",
 *   logModule: "AtividadesPage",
 * }, AtividadesContent);
 */
export function createTenantLoader<T>(
  options: TenantLoaderOptions<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ContentComponent: ComponentType<any>,
) {
  const {
    url,
    query = {},
    fallbackMessage,
    passTenantId = false,
    logModule,
    emptyValue,
  } = options;

  const fallbackNode = fallbackMessage
    ? <SuspenseFallback variant="section" message={fallbackMessage} />
    : DEFAULT_FALLBACK;

  const empty = emptyValue ?? ([] as unknown as T);

  async function Loader() {
    const tenantId = await getActiveTenantId();
    let data: T = empty;

    try {
      if (tenantId) {
        data = await serverFetch<T>(url, {
          query: { tenantId, ...query },
          next: { revalidate: 0 },
        });
      }
    } catch (error) {
      const mod = logModule ?? url;
      logger.warn(`[${mod}] SSR fetch failed, falling back to client`, {
        module: mod,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const props: Record<string, unknown> = { initialData: data };
    if (passTenantId) {
      props.tenantId = tenantId || "";
    }

    return <ContentComponent {...props} />;
  }

  return function TenantLoaderPage() {
    return <Suspense fallback={fallbackNode}><Loader /></Suspense>;
  };
}

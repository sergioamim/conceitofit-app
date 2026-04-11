import type { Page } from "@playwright/test";
import { installE2EAuthSession, type E2EAuthSessionSeed } from "./auth-session";
import { installProtectedShellMocks, type E2EProtectedShellMockOptions } from "./protected-shell-mocks";

type InstallBackofficeGlobalSessionOptions = {
  session?: E2EAuthSessionSeed;
  shell?: E2EProtectedShellMockOptions;
};

const DEFAULT_TENANTS = [
  {
    id: "tenant-centro",
    academiaId: "academia-e2e",
    groupId: "academia-e2e",
    nome: "Unidade Centro",
    ativo: true,
  },
];

export async function installBackofficeGlobalSession(
  page: Page,
  options: InstallBackofficeGlobalSessionOptions = {},
) {
  const tenants = options.shell?.tenants?.length ? options.shell.tenants : DEFAULT_TENANTS;
  const currentTenantId =
    options.session?.activeTenantId
    ?? options.shell?.currentTenantId
    ?? tenants[0]?.id
    ?? DEFAULT_TENANTS[0].id;
  const roles = options.session?.roles ?? options.shell?.user?.roles ?? ["OWNER", "ADMIN"];
  const availableTenants =
    options.session?.availableTenants
    ?? options.shell?.user?.availableTenants
    ?? tenants.map((tenant, index) => ({
      tenantId: tenant.id,
      defaultTenant: index === 0,
    }));
  const firstTenant = tenants.find((tenant) => tenant.id === currentTenantId) ?? tenants[0] ?? DEFAULT_TENANTS[0];
  const academiaId = options.shell?.academia?.id ?? firstTenant.academiaId ?? firstTenant.groupId ?? "academia-e2e";
  const academiaNome = options.shell?.academia?.nome ?? "Academia E2E";

  await installE2EAuthSession(page, {
    activeTenantId: currentTenantId,
    preferredTenantId: options.session?.preferredTenantId ?? currentTenantId,
    baseTenantId: options.session?.baseTenantId ?? currentTenantId,
    availableTenants,
    userId: options.session?.userId ?? options.shell?.user?.userId ?? options.shell?.user?.id ?? "user-root",
    userKind: options.session?.userKind ?? options.shell?.user?.userKind ?? "COLABORADOR",
    displayName:
      options.session?.displayName
      ?? options.shell?.user?.displayName
      ?? options.shell?.user?.nome
      ?? "Root Admin",
    roles,
    availableScopes: options.session?.availableScopes ?? options.shell?.user?.availableScopes ?? ["GLOBAL"],
    broadAccess: options.session?.broadAccess ?? options.shell?.user?.broadAccess ?? true,
    networkId: options.session?.networkId ?? options.shell?.user?.redeId ?? "rede-e2e",
    networkSubdomain:
      options.session?.networkSubdomain
      ?? options.session?.networkSlug
      ?? options.shell?.user?.redeSlug
      ?? "rede-e2e",
    networkSlug:
      options.session?.networkSlug
      ?? options.session?.networkSubdomain
      ?? options.shell?.user?.redeSlug
      ?? "rede-e2e",
    networkName: options.session?.networkName ?? options.shell?.user?.redeNome ?? "Rede E2E",
    forcePasswordChangeRequired: options.session?.forcePasswordChangeRequired ?? false,
    sessionActive: options.session?.sessionActive ?? true,
  });

  return installProtectedShellMocks(page, {
    currentTenantId,
    tenants,
    user: {
      id: options.shell?.user?.id ?? options.shell?.user?.userId ?? options.session?.userId ?? "user-root",
      userId: options.shell?.user?.userId ?? options.shell?.user?.id ?? options.session?.userId ?? "user-root",
      nome: options.shell?.user?.nome ?? options.session?.displayName ?? "Root Admin",
      displayName:
        options.shell?.user?.displayName
        ?? options.shell?.user?.nome
        ?? options.session?.displayName
        ?? "Root Admin",
      email: options.shell?.user?.email ?? "root@qa.local",
      roles,
      userKind: options.shell?.user?.userKind ?? options.session?.userKind ?? "COLABORADOR",
      activeTenantId: options.shell?.user?.activeTenantId ?? currentTenantId,
      tenantBaseId: options.shell?.user?.tenantBaseId ?? options.session?.baseTenantId ?? currentTenantId,
      availableTenants,
      availableScopes: options.shell?.user?.availableScopes ?? options.session?.availableScopes ?? ["GLOBAL"],
      broadAccess: options.shell?.user?.broadAccess ?? options.session?.broadAccess ?? true,
      redeId: options.shell?.user?.redeId ?? options.session?.networkId ?? "rede-e2e",
      redeNome: options.shell?.user?.redeNome ?? options.session?.networkName ?? "Rede E2E",
      redeSlug:
        options.shell?.user?.redeSlug
        ?? options.session?.networkSlug
        ?? options.session?.networkSubdomain
        ?? "rede-e2e",
    },
    academia: {
      id: academiaId,
      nome: academiaNome,
      ativo: options.shell?.academia?.ativo ?? true,
    },
    capabilities: {
      canAccessElevatedModules: options.shell?.capabilities?.canAccessElevatedModules ?? true,
      canDeleteClient: options.shell?.capabilities?.canDeleteClient ?? false,
    },
  });
}

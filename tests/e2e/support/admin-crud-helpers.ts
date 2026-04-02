import type { Locator, Page } from "@playwright/test";
import { installAdminCrudApiMocks } from "./backend-only-stubs";
import { installBackofficeGlobalSession } from "./backoffice-global-session";

const AVAILABLE_TENANTS = [
  { tenantId: "tenant-centro", defaultTenant: true },
  { tenantId: "tenant-barra", defaultTenant: false },
  { tenantId: "tenant-vila-maria", defaultTenant: false },
];
let uniqueCounter = 0;

export async function openAdminCrudPage(page: Page, path: string) {
  page.on("dialog", (dialog) => {
    void dialog.accept();
  });

  await installAdminCrudApiMocks(page);
  await installBackofficeGlobalSession(page, {
    session: {
      activeTenantId: "tenant-centro",
      baseTenantId: "tenant-centro",
      availableTenants: AVAILABLE_TENANTS,
      userId: "user-admin-global",
      userKind: "COLABORADOR",
      displayName: "Root Admin",
      roles: ["OWNER", "ADMIN"],
      availableScopes: ["GLOBAL"],
      broadAccess: true,
    },
    shell: {
      currentTenantId: "tenant-centro",
      tenants: [
        {
          id: "tenant-centro",
          academiaId: "academia-rede-principal",
          groupId: "academia-rede-principal",
          nome: "Unidade Centro",
          ativo: true,
        },
        {
          id: "tenant-barra",
          academiaId: "academia-rede-principal",
          groupId: "academia-rede-principal",
          nome: "Unidade Barra",
          ativo: true,
        },
        {
          id: "tenant-vila-maria",
          academiaId: "academia-rede-leste",
          groupId: "academia-rede-leste",
          nome: "Unidade Vila Maria",
          ativo: true,
        },
      ],
      user: {
        id: "user-admin-global",
        userId: "user-admin-global",
        nome: "Root Admin",
        displayName: "Root Admin",
        email: "admin@academia.local",
        roles: ["OWNER", "ADMIN"],
        userKind: "COLABORADOR",
        activeTenantId: "tenant-centro",
        tenantBaseId: "tenant-centro",
        availableTenants: AVAILABLE_TENANTS,
        availableScopes: ["GLOBAL"],
        broadAccess: true,
        redeId: "academia-rede-principal",
        redeNome: "Conceito Fit",
        redeSlug: "conceito-fit",
      },
      academia: {
        id: "academia-rede-principal",
        nome: "Conceito Fit",
        ativo: true,
      },
      capabilities: {
        canAccessElevatedModules: true,
        canDeleteClient: true,
      },
    },
  });

  try {
    await page.goto(path, { waitUntil: "commit" });
    await page.waitForLoadState("domcontentloaded");
    try {
      await page.waitForLoadState("load", { timeout: 5_000 });
    } catch {
      await page.locator("main").waitFor({ state: "visible", timeout: 5_000 });
    }
  } catch (error) {
    if (error instanceof Error && /ERR_ABORTED|frame was detached/i.test(error.message)) {
      await page.goto(path, { waitUntil: "commit" });
      await page.waitForLoadState("domcontentloaded");
      try {
        await page.waitForLoadState("load", { timeout: 5_000 });
      } catch {
        await page.locator("main").waitFor({ state: "visible", timeout: 5_000 });
      }
      return;
    }
    throw error;
  }
}

export async function selectComboboxOption(page: Page, combobox: Locator, optionName: string) {
  await combobox.scrollIntoViewIfNeeded();
  const tagName = await combobox.evaluate((element) => element.tagName.toLowerCase());

  if (tagName === "select") {
    await combobox.selectOption({ label: optionName });
    return;
  }

  await combobox.click();
  await page.getByRole("option", { name: optionName, exact: true }).click();
}

export function uniqueSuffix() {
  uniqueCounter += 1;
  return String(uniqueCounter).padStart(6, "0");
}

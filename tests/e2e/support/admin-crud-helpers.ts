import type { Locator, Page } from "@playwright/test";
import { installAdminCrudApiMocks, seedAuthenticatedSession } from "./backend-only-stubs";

const AVAILABLE_TENANTS = [
  { tenantId: "tenant-centro", defaultTenant: true },
  { tenantId: "tenant-barra", defaultTenant: false },
  { tenantId: "tenant-vila-maria", defaultTenant: false },
];
const ACTIVE_TENANT_ID = "tenant-centro";
const ACTIVE_TENANT_NAME = "Unidade Centro";
let uniqueCounter = 0;

export async function openAdminCrudPage(page: Page, path: string) {
  page.on("dialog", (dialog) => {
    void dialog.accept();
  });

  await installAdminCrudApiMocks(page);
  await seedAuthenticatedSession(page, {
    tenantId: ACTIVE_TENANT_ID,
    availableTenants: AVAILABLE_TENANTS,
    userId: "user-admin-global",
    userKind: "COLABORADOR",
    displayName: "Root Admin",
    roles: ["OWNER", "ADMIN"],
    availableScopes: ["UNIDADE"],
    broadAccess: true,
  });
  await page.context().addCookies([
    {
      name: "academia-active-tenant-id",
      value: ACTIVE_TENANT_ID,
      domain: "localhost",
      path: "/",
    },
    {
      name: "academia-active-tenant-name",
      value: ACTIVE_TENANT_NAME,
      domain: "localhost",
      path: "/",
    },
  ]);

  try {
    await page.goto(path, { waitUntil: "commit" });
    await page.waitForLoadState("load");
  } catch (error) {
    if (error instanceof Error && /ERR_ABORTED|frame was detached/i.test(error.message)) {
      await page.goto(path, { waitUntil: "commit" });
      await page.waitForLoadState("load");
      return;
    }
    throw error;
  }
}

export async function selectComboboxOption(page: Page, combobox: Locator, optionName: string) {
  await combobox.click();
  await page.getByRole("option", { name: optionName }).click();
}

export function uniqueSuffix() {
  uniqueCounter += 1;
  return String(uniqueCounter).padStart(6, "0");
}

import type { Page } from "@playwright/test";

const PLAYWRIGHT_FORCE_AUTHENTICATED_SSR_COOKIE = "academia-e2e-force-ssr-fetch";
const PLAYWRIGHT_BACKEND_BASE_COOKIE = "academia-e2e-backend-base-url";
const LEGACY_ACTIVE_TENANT_COOKIE = "academia-active-tenant-id";
const DEFAULT_E2E_BASE_URL = "http://localhost:3000";

function resolveE2EBaseUrl() {
  const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();
  return configuredBaseUrl && /^https?:\/\//.test(configuredBaseUrl)
    ? configuredBaseUrl
    : DEFAULT_E2E_BASE_URL;
}

export async function enableAuthenticatedSSRForPlaywright(
  page: Page,
  options: { backendBaseUrl?: string } = {},
) {
  const appBaseUrl = resolveE2EBaseUrl();
  const backendBaseUrl = options.backendBaseUrl?.trim();

  if (!backendBaseUrl || !/^https?:\/\//.test(backendBaseUrl)) {
    throw new Error(
      "enableAuthenticatedSSRForPlaywright exige backendBaseUrl explicito para evitar deadlock de SSR contra a propria app Next.",
    );
  }

  await page.context().addCookies([
    {
      name: PLAYWRIGHT_FORCE_AUTHENTICATED_SSR_COOKIE,
      value: "true",
      url: appBaseUrl,
    },
    {
      name: PLAYWRIGHT_BACKEND_BASE_COOKIE,
      value: backendBaseUrl,
      url: appBaseUrl,
    },
  ]);
}

export async function overrideLegacyActiveTenantCookie(page: Page, tenantId: string) {
  await page.context().addCookies([
    {
      name: LEGACY_ACTIVE_TENANT_COOKIE,
      value: tenantId,
      url: resolveE2EBaseUrl(),
    },
  ]);
}

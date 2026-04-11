import { cookies } from "next/headers";

export const PLAYWRIGHT_FORCE_AUTHENTICATED_SSR_COOKIE = "academia-e2e-force-ssr-fetch";

export function isPlaywrightTestRuntime(): boolean {
  const raw = process.env.PLAYWRIGHT_TEST?.trim().toLowerCase();
  return raw === "1" || raw === "true";
}

export async function shouldBypassAuthenticatedSSRFetch(): Promise<boolean> {
  if (!isPlaywrightTestRuntime()) {
    return false;
  }

  const jar = await cookies();
  const raw = jar.get(PLAYWRIGHT_FORCE_AUTHENTICATED_SSR_COOKIE)?.value?.trim().toLowerCase();
  const shouldForceAuthenticatedSSR = raw === "1" || raw === "true";

  return !shouldForceAuthenticatedSSR;
}

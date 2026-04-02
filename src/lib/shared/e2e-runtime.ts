export function isPlaywrightTestRuntime(): boolean {
  const raw = process.env.PLAYWRIGHT_TEST?.trim().toLowerCase();
  return raw === "1" || raw === "true";
}

export function shouldBypassAuthenticatedSSRFetch(): boolean {
  return isPlaywrightTestRuntime();
}

type NetworkAccessRouteMode = "login" | "forgot-password" | "first-access";

function normalizeHost(value?: string | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeNetworkSubdomain(value?: string | null): string | undefined {
  const candidate = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!candidate) return undefined;
  return encodeURIComponent(candidate);
}

export function getNetworkSubdomainFromHost(host?: string | null): string | undefined {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return undefined;

  const hostname = normalizedHost.split(":")[0] ?? "";
  if (!hostname.endsWith(".localhost")) return undefined;

  const labels = hostname.split(".").filter(Boolean);
  if (labels.length < 2) return undefined;

  const subdomain = labels[0];
  if (!subdomain || subdomain === "localhost") return undefined;
  return normalizeNetworkSubdomain(subdomain);
}

export function resolveNetworkSubdomain(input: {
  routeSubdomain?: string | null;
  host?: string | null;
}): string | undefined {
  return normalizeNetworkSubdomain(input.routeSubdomain) ?? getNetworkSubdomainFromHost(input.host);
}

export function buildNetworkAccessHref(mode: NetworkAccessRouteMode, networkSubdomain: string): string {
  const normalizedSubdomain = normalizeNetworkSubdomain(networkSubdomain);
  const safeSubdomain = normalizedSubdomain ?? "rede";

  switch (mode) {
    case "forgot-password":
      return `/app/${safeSubdomain}/forgot-password`;
    case "first-access":
      return `/app/${safeSubdomain}/first-access`;
    default:
      return `/app/${safeSubdomain}/login`;
  }
}

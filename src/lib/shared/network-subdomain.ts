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
  
  // Ignorar acessos a IPs diretos
  if (!hostname || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return undefined;

  const labels = hostname.split(".").filter(Boolean);
  const subdomain = labels[0];
  
  if (!subdomain) return undefined;

  // Root domains and reserved global subdomains that should route to the Global/Admin login
  const reservedSubdomains = ["app", "admin", "www", "localhost"];
  
  if (reservedSubdomains.includes(subdomain)) {
     return undefined;
  }

  // Local dev mode: exige ao menos 'subdomain.localhost'
  if (hostname.endsWith(".localhost") && labels.length >= 2) {
      return normalizeNetworkSubdomain(subdomain);
  }

  // Produção: Exige no mínimo 3 partes no domínio ('academia.conceito.fit' ou 'academia.conceitofit.com')
  // Domínios de 2 partes ('conceito.fit') são ignorados e vão pro Backoffice.
  if (labels.length >= 3) {
      return normalizeNetworkSubdomain(subdomain);
  }

  return undefined;
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
      return `/acesso/${safeSubdomain}/recuperar-senha`;
    case "first-access":
      return `/acesso/${safeSubdomain}/primeiro-acesso`;
    default:
      return `/acesso/${safeSubdomain}/autenticacao`;
  }
}

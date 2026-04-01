function normalizeHost(host: string): string {
  const trimmed = host.trim().toLowerCase();

  if (!trimmed) return "";

  if (trimmed.startsWith("[")) {
    const closingBracketIndex = trimmed.indexOf("]");
    return closingBracketIndex >= 0 ? trimmed.slice(1, closingBracketIndex) : trimmed;
  }

  return trimmed.split(":")[0] ?? "";
}

function isIpv4Address(hostname: string): boolean {
  const segments = hostname.split(".");
  if (segments.length !== 4) return false;

  return segments.every((segment) => {
    if (!/^\d{1,3}$/.test(segment)) return false;
    const value = Number(segment);
    return value >= 0 && value <= 255;
  });
}

function isIpv6Address(hostname: string): boolean {
  return hostname.includes(":") && /^[a-f0-9:]+$/i.test(hostname);
}

function isIpAddress(hostname: string): boolean {
  return isIpv4Address(hostname) || isIpv6Address(hostname);
}

export function extractSubdomain(host: string, rootHosts: Set<string>): string | undefined {
  const hostname = normalizeHost(host);
  if (!hostname || isIpAddress(hostname)) return undefined;

  if (rootHosts.has(hostname)) {
    return undefined;
  }

  if (hostname.endsWith(".localhost")) {
    const label = hostname.replace(/\.localhost$/, "");
    return label && label !== "localhost" ? label : undefined;
  }

  const parts = hostname.split(".");
  if (parts.length < 3) return undefined;

  const candidate = parts[0];
  if (!candidate || candidate === "www") return undefined;

  return candidate;
}

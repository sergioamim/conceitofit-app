export function normalizeRoles(input?: string[] | null): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((role) => role.trim().toUpperCase())
    .filter(Boolean);
}

export function hasElevatedAccess(input?: string[] | null): boolean {
  const roles = normalizeRoles(input);
  return roles.some((role) => role === "ADMIN" || role.includes("ADMIN"));
}

export function hasClientDeleteCapability(input?: string[] | null): boolean {
  const roles = normalizeRoles(input);
  return roles.some((role) => role === "ALTO" || role === "CLIENT_DELETE");
}

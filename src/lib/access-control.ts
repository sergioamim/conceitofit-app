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

/**
 * GERENTE+ inclui qualquer papel administrativo (ADMIN, SUPER_ADMIN) ou
 * gerencial (GERENTE, COORDENADOR). Usado para liberar telas operacionais
 * de supervisão como o dashboard de caixas e a aba de diferenças
 * (CXO-203). Roles comuns (OPERADOR, ATENDENTE) não passam.
 */
export function hasGerenteAccess(input?: string[] | null): boolean {
  const roles = normalizeRoles(input);
  return roles.some(
    (role) =>
      role === "GERENTE" ||
      role === "COORDENADOR" ||
      role === "ADMIN" ||
      role.includes("ADMIN") ||
      role.includes("GERENTE"),
  );
}

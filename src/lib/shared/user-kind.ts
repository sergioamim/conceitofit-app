import type { AuthSessionScope } from "@/lib/api/session";

export type UserKind = "PLATAFORMA" | "OPERADOR" | "CLIENTE";

export const USER_KIND_PLATAFORMA = "PLATAFORMA" satisfies UserKind;
export const USER_KIND_OPERADOR = "OPERADOR" satisfies UserKind;
export const USER_KIND_CLIENTE = "CLIENTE" satisfies UserKind;

const CANONICAL: ReadonlySet<UserKind> = new Set(["PLATAFORMA", "OPERADOR", "CLIENTE"]);

export function normalizeUserKind(raw?: string | null): UserKind | null {
  if (typeof raw !== "string") return null;
  const normalized = raw.trim().toUpperCase();
  if (!normalized) return null;
  return (CANONICAL.has(normalized as UserKind) ? (normalized as UserKind) : null);
}

export interface UserKindSessionInput {
  userKind?: string | null;
  broadAccess?: boolean | null;
  availableScopes?: readonly AuthSessionScope[] | null;
}

export function resolveUserKindFromSession(input: UserKindSessionInput): UserKind | null {
  const direct = normalizeUserKind(input.userKind ?? undefined);
  if (direct) return direct;

  const scopes = input.availableScopes ?? [];
  const hasGlobal = scopes.includes("GLOBAL");
  if (hasGlobal || input.broadAccess === true) {
    return "PLATAFORMA";
  }

  return null;
}

export function isPlatformUser(input: UserKindSessionInput): boolean {
  return resolveUserKindFromSession(input) === "PLATAFORMA";
}

export function isOperatorUser(input: UserKindSessionInput): boolean {
  return resolveUserKindFromSession(input) === "OPERADOR";
}

export function isClientUser(input: UserKindSessionInput): boolean {
  return resolveUserKindFromSession(input) === "CLIENTE";
}

export function isBackofficeKind(input: UserKindSessionInput): boolean {
  const kind = resolveUserKindFromSession(input);
  return kind === "PLATAFORMA" || kind === "OPERADOR";
}

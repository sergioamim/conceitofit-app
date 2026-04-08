/**
 * CSRF Token — Double Submit Cookie pattern.
 *
 * Cookie nome: _csrf_token | Header: X-CSRF-Token
 * O backend ainda não valida CSRF (csrf.disable()), mas quando habilitar,
 * este header já estará presente. SameSite=Lax nos cookies já mitiga CSRF
 * de cross-site. O double-submit cookie adiciona proteção extra contra
 * CSRF de subdomínios comprometidos.
 */

export const CSRF_COOKIE_NAME = "_csrf_token";

function generateRequestId(): string | undefined {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch { /* fallback */ }
  return undefined;
}

export function readCsrfToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`),
    );
    if (match) return decodeURIComponent(match[1]);

    const token = crypto.randomUUID?.() ?? generateRequestId();
    if (!token) return undefined;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict${secure}`;
    return token;
  } catch {
    return undefined;
  }
}

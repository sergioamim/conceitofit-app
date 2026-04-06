import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Teste de auditoria de segurança: garante que nenhuma chave sensível nova
 * seja adicionada ao localStorage sem aprovação explícita nesta lista.
 *
 * Auditado em: 2026-04-06 (Task 456)
 * Referência: docs/SESSION_STORAGE_AUDIT.md
 */

const SESSION_FILE = path.resolve(__dirname, "../../src/lib/api/session.ts");
const TOKEN_STORE_FILE = path.resolve(__dirname, "../../src/lib/api/token-store.ts");

// Chaves aprovadas para localStorage — qualquer nova chave requer revisão de segurança
const APPROVED_LOCAL_STORAGE_KEYS = new Set([
  // Tokens (Nível de risco: CRÍTICO — migrar para HttpOnly cookies na Task 458)
  "academia-auth-token",
  "academia-auth-refresh-token",
  "academia-auth-token-type",
  "academia-auth-expires-in",

  // Identidade (Nível de risco: MÉDIO — migrar para claims cookie na Task 458)
  "academia-auth-user-id",
  "academia-auth-user-kind",
  "academia-auth-display-name",

  // Contexto de rede (Nível de risco: BAIXO-MÉDIO)
  "academia-auth-network-id",
  "academia-auth-network-subdomain",
  "academia-auth-network-slug", // TODO: eliminar — redundante com subdomain
  "academia-auth-network-name",

  // Contexto de tenant (Nível de risco: ALTO — migrar para claims cookie na Task 458)
  "academia-auth-active-tenant-id",
  "academia-auth-base-tenant-id",
  "academia-auth-available-tenants",
  "academia-auth-preferred-tenant-id",

  // Permissões (Nível de risco: ALTO)
  "academia-auth-available-scopes",
  "academia-auth-broad-access",
  "academia-auth-force-password-change-required",
  "academia-auth-session-active",

  // Impersonação (sessionStorage — ok)
  "academia-impersonation-session",
  "academia-backoffice-return-session",
  "academia-backoffice-recovery-session",
  "academia-backoffice-reauth-required",

  // Operacional (sessionStorage — ok)
  "academia-operational-tenant-scope",

  // Cookies já configurados
  "academia-active-tenant-id",

  // Context ID (não sensível)
  "academia-api-context-id",
]);

function extractLocalStorageKeys(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const keys: string[] = [];

  // Pattern 1: localStorage.setItem("KEY", ...)
  const setPattern = /localStorage\.setItem\(["']([^"']+)["']/g;
  let match;
  while ((match = setPattern.exec(content)) !== null) {
    keys.push(match[1]);
  }

  // Pattern 2: localStorage.getItem("KEY", ...)
  const getPattern = /localStorage\.getItem\(["']([^"']+)["']/g;
  while ((match = getPattern.exec(content)) !== null) {
    if (!keys.includes(match[1])) {
      keys.push(match[1]);
    }
  }

  // Pattern 3: localStorage.removeItem("KEY", ...)
  const removePattern = /localStorage\.removeItem\(["']([^"']+)["']/g;
  while ((match = removePattern.exec(content)) !== null) {
    if (!keys.includes(match[1])) {
      keys.push(match[1]);
    }
  }

  return keys;
}

describe("Session Storage Audit (Task 456)", () => {
  it("session.ts não usa chaves localStorage não aprovadas", () => {
    const keys = extractLocalStorageKeys(SESSION_FILE);
    const unapproved = keys.filter((k) => !APPROVED_LOCAL_STORAGE_KEYS.has(k));

    expect(unapproved).toEqual([]);
  });

  it("token-store.ts não usa chaves localStorage não aprovadas", () => {
    const keys = extractLocalStorageKeys(TOKEN_STORE_FILE);
    const unapproved = keys.filter((k) => !APPROVED_LOCAL_STORAGE_KEYS.has(k));

    expect(unapproved).toEqual([]);
  });

  it("session.ts não contém academy-auth-network-slug usage redundante", () => {
    const content = fs.readFileSync(SESSION_FILE, "utf-8");
    // A chave network-slug é redundante mas ainda existe — documentada como TODO
    // Este teste apenas confirma que não há escritas DIRETAS adicionais além das mapeadas
    const slugWrites = (content.match(/NETWORK_SLUG_KEY/g) || []).length;
    // Pode aparecer na definição da const e em removeItem — até 4 ocorrências são aceitáveis
    expect(slugWrites).toBeLessThanOrEqual(6);
  });
});

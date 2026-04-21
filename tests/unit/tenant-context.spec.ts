import { expect, test } from "@playwright/test";
import { DEFAULT_ACTIVE_TENANT_LABEL } from "../../src/lib/tenant/hooks/use-session-context";
import {
  clearAuthSession,
} from "../../src/lib/api/session";
import {
  dedupeTenants,
  resolveTenantContextSnapshot,
  tenantContextNeedsRepair,
} from "../../src/lib/tenant/tenant-context";
import { installMockBrowser } from "./support/test-runtime";

let browser: ReturnType<typeof installMockBrowser> | undefined;

const TENANT_CENTRO = {
  id: "tenant-centro",
  nome: "Centro",
  ativo: true,
};

const TENANT_SUL = {
  id: "tenant-sul",
  nome: "Sul",
  ativo: true,
};

const TENANT_INATIVO = {
  id: "tenant-inativo",
  nome: "Inativo",
  ativo: false,
};

test.beforeEach(() => {
  browser = installMockBrowser();
  clearAuthSession();
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
});

test.describe("tenant context", () => {
  test("mantém fallback textual estável quando não há unidade resolvida", () => {
    const snapshot = resolveTenantContextSnapshot({});

    expect(snapshot.tenant).toBeNull();
    expect(snapshot.tenantId).toBe("");
    expect(snapshot.tenantName).toBe(DEFAULT_ACTIVE_TENANT_LABEL);
    expect(snapshot.tenants).toEqual([]);
    expect(snapshot.tenantResolved).toBe(false);
  });

  // Task 458 (confirmada): availableTenants não é mais armazenado no cookie/local —
  // getAvailableTenantsFromSession() retorna sempre []. O frontend busca a lista de
  // unidades via endpoint de contexto quando necessário. Os helpers puramente
  // funcionais (dedupeTenants, resolveTenantContextSnapshot, tenantContextNeedsRepair)
  // continuam valendo e são validados aqui.
  test(
    "deduplica tenants e resolve snapshot priorizando sessao e tenant valido",
    async () => {
      expect(
        dedupeTenants([
          TENANT_CENTRO,
          { ...TENANT_CENTRO, nome: "Centro duplicado" },
          TENANT_SUL,
        ]),
      ).toEqual([TENANT_CENTRO, TENANT_SUL]);

      const snapshot = resolveTenantContextSnapshot({
        currentTenantId: "tenant-sul",
        tenantAtual: TENANT_INATIVO,
        tenants: [TENANT_CENTRO, TENANT_SUL, TENANT_INATIVO],
      });

      expect(snapshot.tenantId).toBe("tenant-sul");
      expect(snapshot.tenant?.id).toBe("tenant-sul");

      expect(
        tenantContextNeedsRepair({
          currentTenantId: "tenant-inexistente",
          tenantAtual: TENANT_CENTRO,
          tenants: [TENANT_CENTRO],
        }),
      ).toBe(true);
    },
  );

  // Task 458: getAvailableTenantsFromSession retorna sempre [] (claims cookie enxuto
  // para evitar fetch por tela). Valida contrato da nova fonte canônica.
  test(
    "getAvailableTenantsFromSession retorna lista vazia (claims enxutos — Task 458)",
    async () => {
      const { getAvailableTenantsFromSession } = await import(
        "../../src/lib/api/session"
      );
      expect(getAvailableTenantsFromSession()).toEqual([]);
    },
  );
});

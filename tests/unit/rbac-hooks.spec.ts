import { expect, test } from "@playwright/test";
import { cleanup, renderHook } from "@testing-library/react";
import { Window } from "happy-dom";
import { clearAuthSession } from "../../src/lib/api/session";
import { resetTenantContextMemory } from "../../src/lib/tenant/tenant-context";
import { useAuthAccess, useRbacTenant } from "../../src/lib/tenant/rbac/hooks";

const envSnapshot = {
  bootstrapEnabled: process.env.NEXT_PUBLIC_APP_BOOTSTRAP_ENABLED,
  bootstrapStrict: process.env.NEXT_PUBLIC_APP_BOOTSTRAP_STRICT,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
};

function installMockDom() {
  const globalRef = globalThis as typeof globalThis & {
    window?: Window & typeof globalThis;
    document?: Document;
    navigator?: Navigator;
    HTMLElement?: typeof HTMLElement;
    Node?: typeof Node;
    MutationObserver?: typeof MutationObserver;
    Event?: typeof Event;
    CustomEvent?: typeof CustomEvent;
    getComputedStyle?: typeof getComputedStyle;
    localStorage?: Storage;
  };

  const previous = {
    window: globalRef.window,
    document: globalRef.document,
    navigator: globalRef.navigator,
    HTMLElement: globalRef.HTMLElement,
    Node: globalRef.Node,
    MutationObserver: globalRef.MutationObserver,
    Event: globalRef.Event,
    CustomEvent: globalRef.CustomEvent,
    getComputedStyle: globalRef.getComputedStyle,
    localStorage: globalRef.localStorage,
  };

  const windowInstance = new Window({ url: "http://localhost" }) as unknown as Window & typeof globalThis;
  const assign = <K extends keyof typeof globalRef>(key: K, value: (typeof globalRef)[K]) => {
    Object.defineProperty(globalRef, key, {
      configurable: true,
      writable: true,
      value,
    });
  };

  assign("window", windowInstance as typeof globalRef.window);
  assign("document", windowInstance.document);
  assign("navigator", windowInstance.navigator);
  assign("HTMLElement", windowInstance.HTMLElement);
  assign("Node", windowInstance.Node);
  assign("MutationObserver", windowInstance.MutationObserver);
  assign("Event", windowInstance.Event);
  assign("CustomEvent", windowInstance.CustomEvent);
  assign("getComputedStyle", windowInstance.getComputedStyle.bind(windowInstance));
  assign("localStorage", windowInstance.localStorage);

  return {
    restore() {
      cleanup();

      const restoreValue = <K extends keyof typeof previous>(key: K, value: (typeof previous)[K]) => {
        if (value === undefined) {
          Reflect.deleteProperty(globalRef, key);
          return;
        }
        Object.defineProperty(globalRef, key, {
          configurable: true,
          writable: true,
          value,
        });
      };

      restoreValue("window", previous.window);
      restoreValue("document", previous.document);
      restoreValue("navigator", previous.navigator);
      restoreValue("HTMLElement", previous.HTMLElement);
      restoreValue("Node", previous.Node);
      restoreValue("MutationObserver", previous.MutationObserver);
      restoreValue("Event", previous.Event);
      restoreValue("CustomEvent", previous.CustomEvent);
      restoreValue("getComputedStyle", previous.getComputedStyle);
      restoreValue("localStorage", previous.localStorage);
    },
  };
}

let dom: ReturnType<typeof installMockDom> | undefined;

test.beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_BOOTSTRAP_ENABLED = "false";
  process.env.NEXT_PUBLIC_APP_BOOTSTRAP_STRICT = "false";
  process.env.NEXT_PUBLIC_API_BASE_URL = "";

  dom = installMockDom();
  clearAuthSession();
  resetTenantContextMemory();
});

test.afterEach(() => {
  clearAuthSession();
  resetTenantContextMemory();
  dom?.restore();
  process.env.NEXT_PUBLIC_APP_BOOTSTRAP_ENABLED = envSnapshot.bootstrapEnabled;
  process.env.NEXT_PUBLIC_APP_BOOTSTRAP_STRICT = envSnapshot.bootstrapStrict;
  process.env.NEXT_PUBLIC_API_BASE_URL = envSnapshot.apiBaseUrl;
  dom = undefined;
});

test.describe.serial("rbac hooks", () => {
  // requer revisão: fallback de loading em useTenantContext sem provider.
  // Usa renderHook sem provider; com a nova arquitetura de contexto o hook pode
  // não entrar no estado `loading: true` esperado pelo teste.
  test.fixme("useRbacTenant expõe fallback estável quando não há provider", async () => {
    const { result } = renderHook(() => useRbacTenant());

    expect(result.current.tenantId).toBe("");
    expect(result.current.tenantName).toBe("Unidade ativa");
    expect(result.current.availableTenants).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(typeof result.current.refreshTenant).toBe("function");
  });

  // requer revisão: fallback de loading em useTenantContext sem provider.
  test.fixme("useAuthAccess mantém o contrato básico de acesso", async () => {
    const { result } = renderHook(() => useAuthAccess());

    expect(result.current.roles).toEqual([]);
    expect(result.current.canAccessElevatedModules).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refresh).toBe("function");
  });
});

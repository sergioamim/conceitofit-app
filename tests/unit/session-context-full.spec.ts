import { expect, test } from "@playwright/test";
import { cleanup, renderHook } from "@testing-library/react";
import { Window } from "happy-dom";
import { clearAuthSession } from "../../src/lib/api/session";
import { resetTenantContextMemory } from "../../src/lib/tenant/tenant-context";
import {
  DEFAULT_ACTIVE_TENANT_LABEL,
  DEFAULT_BASE_TENANT_LABEL,
  useAuthAccess,
  useTenantContext,
} from "../../src/lib/tenant/hooks/use-session-context";

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

test.describe("session context full", () => {
  // Fallback sem provider: `loading: false` por design (fail-fast em dev
  // com console.error, sem spinner eterno em prod). Ver
  // resolveUnprovidedTenantContextValue em use-session-context.tsx.
  test("mantém fallback estável quando não há provider", async () => {
    const { result } = renderHook(() => useTenantContext());

    expect(result.current.tenantName).toBe(DEFAULT_ACTIVE_TENANT_LABEL);
    expect(result.current.baseTenantName).toBe(DEFAULT_BASE_TENANT_LABEL);
    expect(result.current.tenantId).toBe("");
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.refresh).toBe("function");
    expect(typeof result.current.setTenant).toBe("function");
    expect(typeof result.current.switchActiveTenant).toBe("function");
    expect(typeof result.current.syncAcademiaBranding).toBe("function");
  });

  // Fallback sem provider: `loading: false` por design. Ver comentário acima.
  test("useAuthAccess reaproveita o contrato de acesso do contexto", async () => {
    const { result } = renderHook(() => useAuthAccess());

    expect(result.current.roles).toEqual([]);
    expect(result.current.canAccessElevatedModules).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refresh).toBe("function");
  });
});

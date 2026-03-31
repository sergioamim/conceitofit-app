/** @jsxImportSource react */
import React from "react";
import { expect, test } from "@playwright/test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { Window } from "happy-dom";
import { getOnboardingStatus } from "../../src/lib/api/onboarding-api";
import { clearAuthSession, saveAuthSession } from "../../src/lib/api/session";
import { OnboardingChecklist } from "../../src/components/shared/onboarding/OnboardingChecklist";
import { mockFetchWithSequence } from "./support/test-runtime";

const envSnapshot = {
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

  assign("window", windowInstance);
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
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  dom = installMockDom();
  clearAuthSession();
  saveAuthSession({
    token: "token-onboarding",
    refreshToken: "refresh-onboarding",
    activeTenantId: "tenant-onboarding",
    availableTenants: [{ tenantId: "tenant-onboarding", defaultTenant: true }],
  });
});

test.afterEach(async () => {
  clearAuthSession();
  await new Promise((resolve) => setTimeout(resolve, 0));
  dom?.restore();
  process.env.NEXT_PUBLIC_API_BASE_URL = envSnapshot.apiBaseUrl;
  dom = undefined;
});

test.describe("onboarding checklist api", () => {
  test("normaliza o status de onboarding com progresso e rotas", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          progressPercent: 50,
          steps: [
            {
              id: "dados-academia",
              title: "Dados da Academia",
              status: "COMPLETED",
              route: "/administrativo/academia",
            },
            {
              chave: "criar-plano",
              titulo: "Criar Plano",
              status: "PENDENTE",
              rotaConfiguracao: "/planos/novo",
            },
          ],
        },
      },
    ]);

    try {
      const status = await getOnboardingStatus();

      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain("/backend/api/v1/onboarding/status");
      expect(status).toEqual({
        percentualConclusao: 50,
        concluido: false,
        totalEtapas: 2,
        etapasConcluidas: 1,
        etapas: [
          {
            id: "dados-academia",
            titulo: "Dados da Academia",
            descricao: undefined,
            status: "CONCLUIDA",
            rotaConfiguracao: "/administrativo/academia",
          },
          {
            id: "criar-plano",
            titulo: "Criar Plano",
            descricao: undefined,
            status: "PENDENTE",
            rotaConfiguracao: "/planos/novo",
          },
        ],
      });
    } finally {
      restore();
    }
  });

  test("retorna null quando o endpoint ainda não existe no backend", async () => {
    const { restore } = mockFetchWithSequence([
      new Response(JSON.stringify({ message: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      await expect(getOnboardingStatus()).resolves.toBeNull();
    } finally {
      restore();
    }
  });
});

test.describe("OnboardingChecklist", () => {
  test("renderiza progresso, etapas pendentes e chama onDismiss", async () => {
    const { restore } = mockFetchWithSequence([
      {
        body: {
          percentualConclusao: 50,
          etapasConcluidas: 1,
          totalEtapas: 2,
          etapas: [
            {
              id: "dados-academia",
              titulo: "Dados da Academia",
              status: "CONCLUIDA",
              rotaConfiguracao: "/administrativo/academia",
            },
            {
              id: "criar-plano",
              titulo: "Criar Plano",
              status: "PENDENTE",
              rotaConfiguracao: "/planos/novo",
            },
          ],
        },
      },
    ]);

    let dismissCount = 0;
    let unmount: (() => void) | undefined;

    try {
      const view = render(React.createElement(OnboardingChecklist, {
        onDismiss: () => {
          dismissCount += 1;
        },
      }));
      unmount = view.unmount;

      expect(view.getByTestId("onboarding-checklist-loading")).toBeTruthy();

      await view.findByTestId("onboarding-checklist");
      await view.findByText("Checklist de configuração da academia");
      await view.findByText("1 de 2 etapa(s) concluídas.");

      const configurarAgora = await view.findByRole("link", { name: "Configurar agora" });
      expect(configurarAgora.getAttribute("href")).toBe("/planos/novo");

      fireEvent.click(view.getByRole("button", { name: "Fechar checklist de onboarding" }));
      expect(dismissCount).toBe(1);
    } finally {
      unmount?.();
      restore();
    }
  });

  test("oculta o componente quando o onboarding já está concluído e hideWhenComplete está ativo", async () => {
    const { restore } = mockFetchWithSequence([
      {
        body: {
          percentualConclusao: 100,
          concluido: true,
          etapasConcluidas: 2,
          totalEtapas: 2,
          etapas: [
            { id: "dados-academia", titulo: "Dados da Academia", status: "CONCLUIDA" },
            { id: "criar-plano", titulo: "Criar Plano", status: "CONCLUIDA" },
          ],
        },
      },
    ]);

    let unmount: (() => void) | undefined;

    try {
      const view = render(React.createElement(OnboardingChecklist, { hideWhenComplete: true }));
      unmount = view.unmount;

      await waitFor(() => {
        expect(view.queryByTestId("onboarding-checklist")).toBeNull();
      });
    } finally {
      unmount?.();
      restore();
    }
  });
});

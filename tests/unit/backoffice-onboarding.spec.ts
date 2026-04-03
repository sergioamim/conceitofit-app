import { expect, test } from "@playwright/test";
import {
  atualizarImportacaoOnboardingStatus,
  listUnidadesOnboarding,
  registrarImportacaoOnboarding,
  saveUnidadeOnboarding,
} from "../../src/backoffice/lib/onboarding";

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

type MockBrowser = {
  restore(): void;
};

type FetchCall = {
  url: string;
  method: string;
  body?: string;
};

function installMockBrowser(): MockBrowser {
  const globalRef = globalThis as typeof globalThis & {
    window?: Window & typeof globalThis;
  };
  const previousWindow = globalRef.window;
  const storage = new MemoryStorage();
  globalRef.window = {
    localStorage: storage,
  } as unknown as Window & typeof globalThis;

  return {
    restore() {
      if (previousWindow === undefined) {
        Reflect.deleteProperty(globalRef, "window");
        return;
      }
      globalRef.window = previousWindow;
    },
  };
}

function mockFetchSequence(responses: Response[]): {
  calls: FetchCall[];
  restore(): void;
} {
  const calls: FetchCall[] = [];
  const previousFetch = global.fetch;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? init.body : undefined,
    });
    const response = responses[calls.length - 1];
    if (!response) {
      throw new Error(`Unexpected fetch call ${calls.length}: ${init?.method ?? "GET"} ${String(input)}`);
    }
    return response;
  }) as typeof global.fetch;

  return {
    calls,
    restore() {
      global.fetch = previousFetch;
    },
  };
}

const envSnapshot = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

const runtimeSnapshot = {
  forceLocalMode: (
    globalThis as typeof globalThis & {
      __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
    }
  ).__ACADEMIA_FORCE_LOCAL_MODE__,
};

let browser: MockBrowser | undefined;

test.beforeEach(() => {
  browser = installMockBrowser();
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  (
    globalThis as typeof globalThis & {
      __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
    }
  ).__ACADEMIA_FORCE_LOCAL_MODE__ = true;
});

test.afterEach(() => {
  browser?.restore();
  process.env.NEXT_PUBLIC_API_BASE_URL = envSnapshot.apiBaseUrl;
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
  if (runtimeSnapshot.forceLocalMode === undefined) {
    delete (
      globalThis as typeof globalThis & {
        __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
      }
    ).__ACADEMIA_FORCE_LOCAL_MODE__;
  } else {
    (
      globalThis as typeof globalThis & {
        __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
      }
    ).__ACADEMIA_FORCE_LOCAL_MODE__ = runtimeSnapshot.forceLocalMode;
  }
});

test.describe("backoffice onboarding service", () => {
  test("salva estratégia e acompanha a evolução do job da unidade", async () => {
    const savedState = {
      tenantId: "tenant-onboarding",
      academiaId: "acd-onboarding",
      estrategia: "PREPARAR_ETL",
      status: "AGUARDANDO_IMPORTACAO",
      evoFilialId: "321",
      eventos: [
        {
          type: "IMPORTACAO_PREPARADA",
          message: "Carga inicial preparada.",
          createdAt: "2026-03-14T10:00:00",
        },
      ],
    };
    const startedState = {
      ...savedState,
      status: "EM_IMPORTACAO",
      ultimoJobId: "job-123",
      eventos: [
        {
          type: "JOB_CRIADO",
          message: "Job job-123 criado.",
          createdAt: "2026-03-14T10:01:00",
        },
      ],
    };
    const finishedState = {
      ...startedState,
      status: "PRONTA",
      ultimaMensagem: "Carga finalizada com sucesso.",
      eventos: [
        {
          type: "JOB_STATUS_ATUALIZADO",
          message: "Carga finalizada com sucesso.",
          createdAt: "2026-03-14T10:02:00",
        },
      ],
    };
    const { calls, restore } = mockFetchSequence([
      new Response(JSON.stringify(savedState), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify(startedState), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify(finishedState), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify([finishedState]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    try {
      const saved = await saveUnidadeOnboarding({
        tenantId: "tenant-onboarding",
        academiaId: "acd-onboarding",
        estrategia: "PREPARAR_ETL",
        evoFilialId: "321",
      });

      expect(saved.status).toBe("AGUARDANDO_IMPORTACAO");
      expect(saved.evoFilialId).toBe("321");
      expect(saved.eventos.some((item) => item.type === "IMPORTACAO_PREPARADA")).toBeTruthy();

      const started = await registrarImportacaoOnboarding({
        tenantId: "tenant-onboarding",
        academiaId: "acd-onboarding",
        jobId: "job-123",
        origem: "PACOTE",
      });

      expect(started.status).toBe("EM_IMPORTACAO");
      expect(started.ultimoJobId).toBe("job-123");
      expect(started.eventos[0]?.type).toBe("JOB_CRIADO");

      const finished = await atualizarImportacaoOnboardingStatus({
        tenantId: "tenant-onboarding",
        academiaId: "acd-onboarding",
        jobId: "job-123",
        importStatus: "CONCLUIDO",
        origem: "PACOTE",
        mensagem: "Carga finalizada com sucesso.",
      });

      expect(finished.status).toBe("PRONTA");
      expect(finished.ultimaMensagem).toBe("Carga finalizada com sucesso.");
      expect(finished.eventos[0]?.type).toBe("JOB_STATUS_ATUALIZADO");

      const listed = await listUnidadesOnboarding();
      expect(listed).toHaveLength(1);
      expect(listed[0]).toMatchObject({
        tenantId: "tenant-onboarding",
        status: "PRONTA",
        evoFilialId: "321",
        ultimoJobId: "job-123",
      });
      expect(calls).toHaveLength(4);
      expect(calls[0]).toMatchObject({
        method: "PUT",
      });
      expect(calls[0]?.url).toContain("/api/v1/admin/unidades/tenant-onboarding/onboarding");
      expect(calls[1]).toMatchObject({
        method: "POST",
      });
      expect(calls[1]?.url).toContain("/api/v1/admin/unidades/tenant-onboarding/onboarding/job-status");
      expect(calls[2]?.url).toContain("/api/v1/admin/unidades/tenant-onboarding/onboarding/job-status");
      expect(calls[3]).toMatchObject({
        method: "GET",
      });
      expect(calls[3]?.url).toContain("/api/v1/admin/unidades/onboarding");
    } finally {
      restore();
    }
  });
});

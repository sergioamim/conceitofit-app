import { expect, test } from "@playwright/test";
import {
  atualizarImportacaoOnboardingStatus,
  listUnidadesOnboarding,
  registrarImportacaoOnboarding,
  saveUnidadeOnboarding,
} from "../../src/lib/backoffice/onboarding";

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

const envSnapshot = {
  useRealApi: process.env.NEXT_PUBLIC_USE_REAL_API,
};

let browser: MockBrowser | undefined;

test.beforeEach(() => {
  browser = installMockBrowser();
  process.env.NEXT_PUBLIC_USE_REAL_API = "false";
});

test.afterEach(() => {
  browser?.restore();
  process.env.NEXT_PUBLIC_USE_REAL_API = envSnapshot.useRealApi;
});

test.describe("backoffice onboarding local service", () => {
  test("salva estratégia e acompanha a evolução do job da unidade", async () => {
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
  });
});

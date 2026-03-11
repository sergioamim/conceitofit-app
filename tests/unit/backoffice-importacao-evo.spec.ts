import { expect, test } from "@playwright/test";
import {
  createBackofficeEvoP0CsvJob,
  createBackofficeEvoP0PacoteJob,
  getBackofficeEvoImportJobResumo,
  listBackofficeEvoImportJobRejeicoes,
  uploadBackofficeEvoP0Pacote,
} from "../../src/lib/backoffice/importacao-evo";

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

test.describe("backoffice importacao EVO local service", () => {
  test("executa job CSV com rejeições simuladas e paginação de erros", async () => {
    const csvFile = new File(["id,nome\n1,Ana"], "clientes.csv", { type: "text/csv" });

    const created = await createBackofficeEvoP0CsvJob({
      dryRun: true,
      maxRejeicoesRetorno: 10,
      mapeamentoFiliais: [{ idFilialEvo: 123, tenantId: "tenant-csv" }],
      arquivos: [{ field: "clientesFile", file: csvFile }],
      tenantId: "tenant-csv",
    });

    expect(created.jobId).toBeTruthy();
    expect(created.tenantIds).toEqual(["tenant-csv"]);

    const firstPoll = await getBackofficeEvoImportJobResumo({
      jobId: created.jobId,
      tenantId: "tenant-csv",
    });
    const secondPoll = await getBackofficeEvoImportJobResumo({
      jobId: created.jobId,
      tenantId: "tenant-csv",
    });
    const thirdPoll = await getBackofficeEvoImportJobResumo({
      jobId: created.jobId,
      tenantId: "tenant-csv",
    });

    expect(firstPoll.status).toBe("PROCESSANDO");
    expect(secondPoll.status).toBe("PROCESSANDO");
    expect(thirdPoll.status).toBe("CONCLUIDO_COM_REJEICOES");
    expect(thirdPoll.geral?.total).toBeGreaterThan(0);

    const rejeicoes = await listBackofficeEvoImportJobRejeicoes({
      jobId: created.jobId,
      tenantId: "tenant-csv",
      page: 0,
      size: 50,
    });

    expect(rejeicoes.items).toHaveLength(1);
    expect(rejeicoes.hasNext).toBeFalsy();
  });

  test("analisa pacote e conclui job unitário", async () => {
    const pacote = new File(["conteudo"], "backup-evo.zip", { type: "application/zip" });

    const analise = await uploadBackofficeEvoP0Pacote({
      tenantId: "tenant-pacote",
      evoUnidadeId: 88,
      arquivo: pacote,
    });

    expect(analise.uploadId).toBeTruthy();
    expect(analise.totalArquivosDisponiveis).toBeGreaterThan(0);
    expect(analise.arquivos.some((item) => item.chave === "clientes")).toBeTruthy();

    const job = await createBackofficeEvoP0PacoteJob({
      uploadId: analise.uploadId,
      dryRun: false,
      maxRejeicoesRetorno: 50,
      arquivos: ["clientes", "contratos"],
      tenantId: "tenant-pacote",
    });

    await getBackofficeEvoImportJobResumo({ jobId: job.jobId, tenantId: "tenant-pacote" });
    await getBackofficeEvoImportJobResumo({ jobId: job.jobId, tenantId: "tenant-pacote" });
    const finished = await getBackofficeEvoImportJobResumo({ jobId: job.jobId, tenantId: "tenant-pacote" });

    expect(finished.status).toBe("CONCLUIDO");
    expect(finished.tenantIds).toEqual(["tenant-pacote"]);
    expect(finished.contratos?.total).toBeGreaterThan(0);
  });
});

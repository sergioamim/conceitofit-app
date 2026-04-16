import { expect, test } from "@playwright/test";
import {
  createBackofficeEvoPacoteFotoImportJob,
  createBackofficeEvoP0CsvJob,
  createBackofficeEvoP0PacoteJob,
  getBackofficeEvoFotoImportEstado,
  getBackofficeEvoFotoImportJobStatus,
  getBackofficeEvoImportJobResumo,
  listBackofficeEvoImportJobRejeicoes,
  normalizeUploadAnaliseArquivoHistorico,
  uploadBackofficeEvoP0Pacote,
} from "../../src/backoffice/lib/importacao-evo";
import { clearAuthSession, saveAuthSession } from "../../src/lib/api/session";

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
  headers: Headers;
  body?: BodyInit | null;
};

function installMockBrowser(): MockBrowser {
  const globalRef = globalThis as typeof globalThis & {
    window?: Window & typeof globalThis;
    document?: Document;
  };
  const previousWindow = globalRef.window;
  const previousDocument = globalRef.document;
  const localStorageRef = new MemoryStorage();
  const sessionStorageRef = new MemoryStorage();
  const documentRef = {
    cookie: "",
  } as Document;
  globalRef.window = {
    localStorage: localStorageRef,
    sessionStorage: sessionStorageRef,
    location: {
      protocol: "http:",
    } as Location,
    dispatchEvent: () => true,
    document: documentRef,
  } as unknown as Window & typeof globalThis;
  globalRef.document = documentRef;

  return {
    restore() {
      if (previousWindow === undefined) {
        Reflect.deleteProperty(globalRef, "window");
      } else {
        globalRef.window = previousWindow;
      }
      if (previousDocument === undefined) {
        Reflect.deleteProperty(globalRef, "document");
      } else {
        globalRef.document = previousDocument;
      }
    },
  };
}

function mockFetchSequence(
  responses: Array<Response | ((call: FetchCall) => Response | Promise<Response>)>
): {
  calls: FetchCall[];
  restore(): void;
} {
  const calls: FetchCall[] = [];
  const previousFetch = global.fetch;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: FetchCall = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: init?.body,
    };
    calls.push(call);

    const response = responses[calls.length - 1];
    if (!response) {
      throw new Error(`Unexpected fetch call ${calls.length}: ${call.method} ${call.url}`);
    }

    return response instanceof Response ? response : response(call);
  }) as typeof global.fetch;

  return {
    calls,
    restore() {
      global.fetch = previousFetch;
    },
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const envSnapshot = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

let browser: MockBrowser | undefined;

test.beforeEach(() => {
  browser = installMockBrowser();
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  clearAuthSession();
  saveAuthSession({
    token: "access-token",
    refreshToken: "refresh-token",
    activeTenantId: "tenant-pacote",
    availableTenants: [{ tenantId: "tenant-pacote", defaultTenant: true }],
  });
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
  process.env.NEXT_PUBLIC_API_BASE_URL = envSnapshot.apiBaseUrl;
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
});

test.describe("backoffice importacao EVO api wrappers", () => {
  test("analisa pacote sem EVO Unidade manual e recebe filial resolvida do backend", async () => {
    const pacote = new File(["conteudo"], "backup-evo.zip", { type: "application/zip" });
    const { calls, restore } = mockFetchSequence([
      jsonResponse({
        uploadId: "upload-1",
        tenantId: null,
        evoUnidadeId: 321,
        filialResolvida: {
          evoFilialId: 321,
          evoAcademiaId: 99,
          nome: "Academia Centro",
          documento: "12.345.678/0001-90",
          cidade: "Sao Paulo",
          bairro: "Centro",
          email: "centro@academia.test",
          telefone: "1133334444",
          abreviacao: "CTR",
        },
        filiaisEncontradas: [
          {
            evoFilialId: 321,
            evoAcademiaId: 99,
            nome: "Academia Centro",
          },
        ],
        criadoEm: "2026-03-13T10:00:00Z",
        expiraEm: "2026-03-13T11:00:00Z",
        totalArquivosDisponiveis: 3,
        arquivos: [
          {
            chave: "clientes",
            rotulo: "Clientes",
            arquivoEsperado: "CLIENTES.csv",
            disponivel: true,
            nomeArquivoEnviado: "CLIENTES.csv",
            tamanhoBytes: 128,
            ultimoProcessamento: {
              jobId: "job-clientes-1",
              alias: "Carga clientes",
              status: "CONCLUIDO",
              processadoEm: "2026-03-12T10:00:00Z",
              resumo: {
                total: 20,
                processadas: 20,
                criadas: 12,
                atualizadas: 8,
                rejeitadas: 0,
              },
              retrySomenteErrosSuportado: false,
            },
          },
          {
            chave: "funcionarios",
            rotulo: "Cadastro principal",
            arquivoEsperado: "FUNCIONARIOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS.csv",
            tamanhoBytes: 256,
            dominio: "colaboradores",
            bloco: "fichaPrincipal",
            descricao: "Base do colaborador",
            ultimoProcessamento: {
              jobId: "job-func-1",
              status: "CONCLUIDO_COM_REJEICOES",
              processadoEm: "2026-03-12T11:00:00Z",
              resumo: {
                total: 9,
                processadas: 9,
                criadas: 4,
                atualizadas: 3,
                rejeitadas: 2,
              },
              parcial: true,
              mensagemParcial: "Pendências de função exigem reprocessamento.",
              retrySomenteErrosSuportado: true,
            },
          },
          {
            chave: "FUNCIONARIOS_HORARIOS.csv",
            rotulo: "Horários semanais",
            arquivoEsperado: "FUNCIONARIOS_HORARIOS.csv",
            disponivel: false,
            dominio: "colaboradores",
            bloco: "horarios",
            impactoAusencia: "Sem horários, a importação fica parcial.",
          },
        ],
      }),
    ]);

    try {
      const analise = await uploadBackofficeEvoP0Pacote({
        arquivo: pacote,
      });

      expect(analise.evoUnidadeId).toBe(321);
      expect(analise.filialResolvida?.nome).toBe("Academia Centro");
      expect(analise.filiaisEncontradas).toHaveLength(1);
      expect(analise.arquivos.find((arquivo) => arquivo.chave === "funcionarios")?.bloco).toBe("fichaPrincipal");
      expect(analise.arquivos.find((arquivo) => arquivo.chave === "FUNCIONARIOS_HORARIOS.csv")?.impactoAusencia).toContain(
        "parcial"
      );
      expect(analise.arquivos.find((arquivo) => arquivo.chave === "clientes")?.ultimoProcessamento?.alias).toBe("Carga clientes");
      expect(analise.arquivos.find((arquivo) => arquivo.chave === "funcionarios")?.ultimoProcessamento?.retrySomenteErrosSuportado).toBe(true);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe("/backend/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote");
      expect(calls[0].method).toBe("POST");
      expect(calls[0].headers.get("X-Tenant-Id")).toBeNull();

      const formData = calls[0].body as FormData;
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("tenantId")).toBeNull();
      expect(formData.get("evoUnidadeId")).toBeNull();
      expect(formData.get("arquivo")).toBeTruthy();
    } finally {
      restore();
    }
  });

  test("mantem envio manual de EVO Unidade quando o usuario informa a filial", async () => {
    const pacote = new File(["conteudo"], "backup-evo.zip", { type: "application/zip" });
    const { calls, restore } = mockFetchSequence([
      jsonResponse({
        uploadId: "upload-2",
        tenantId: null,
        evoUnidadeId: null,
        filialResolvida: null,
        filiaisEncontradas: [
          { evoFilialId: 100, nome: "Academia Centro" },
          { evoFilialId: 200, nome: "Academia Norte" },
        ],
        criadoEm: "2026-03-13T10:00:00Z",
        expiraEm: "2026-03-13T11:00:00Z",
        totalArquivosDisponiveis: 2,
        arquivos: [],
      }),
    ]);

    try {
      const analise = await uploadBackofficeEvoP0Pacote({
        evoUnidadeId: 200,
        arquivo: pacote,
      });

      expect(analise.evoUnidadeId).toBeNull();
      expect(analise.filiaisEncontradas).toHaveLength(2);

      const formData = calls[0].body as FormData;
      expect(formData.get("tenantId")).toBeNull();
      expect(formData.get("evoUnidadeId")).toBe("200");
    } finally {
      restore();
    }
  });

  test("cria job de pacote e consulta resumo sem quebrar o polling", async () => {
    const { calls, restore } = mockFetchSequence([
      jsonResponse({
        jobId: "job-pacote-1",
        status: "PROCESSANDO",
        dryRun: false,
        solicitadoEm: "2026-03-13T10:05:00Z",
      }, 202),
      jsonResponse({
        jobId: "job-pacote-1",
        tenantIds: ["tenant-pacote"],
        status: "CONCLUIDO",
        solicitadoEm: "2026-03-13T10:05:00Z",
        finalizadoEm: "2026-03-13T10:07:00Z",
        geral: { total: 12, processadas: 12, criadas: 10, atualizadas: 2, rejeitadas: 0 },
        funcionarios: { total: 5, processadas: 5, criadas: 3, atualizadas: 2, rejeitadas: 0 },
        colaboradoresDetalhe: {
          fichaPrincipal: { total: 5, processadas: 5, criadas: 3, atualizadas: 2, rejeitadas: 0 },
          funcoes: {
            total: 5,
            processadas: 5,
            criadas: 0,
            atualizadas: 5,
            rejeitadas: 0,
            parcial: true,
            mensagemParcial: "Sem catálogo completo de funções.",
          },
        },
      }),
    ]);

    try {
      const job = await createBackofficeEvoP0PacoteJob({
        uploadId: "upload-1",
        dryRun: false,
        arquivos: ["clientes", "contratos"],
        tenantId: "tenant-pacote",
        apelido: "Carga pacote unidade central",
      });
      const resumo = await getBackofficeEvoImportJobResumo({
        jobId: job.jobId,
        tenantId: "tenant-pacote",
      });

      expect(job.jobId).toBe("job-pacote-1");
      expect(resumo.status).toBe("CONCLUIDO");
      expect(resumo.geral?.total).toBe(12);
      expect(resumo.colaboradoresDetalhe?.fichaPrincipal?.processadas).toBe(5);
      expect(resumo.colaboradoresDetalhe?.funcoes?.mensagemParcial).toContain("funções");

      expect(calls).toHaveLength(2);
      expect(calls[0].url).toBe("/backend/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/upload-1/job");
      expect(calls[0].method).toBe("POST");
      expect(calls[0].headers.get("Content-Type")).toBe("application/json");
      expect(calls[0].headers.get("X-Tenant-Id")).toBe("tenant-pacote");
      expect(calls[0].headers.get("X-Context-Id")).toBeNull();
      expect(JSON.parse(String(calls[0].body))).toEqual({
        dryRun: false,
        tenantId: "tenant-pacote",
        arquivos: ["clientes", "contratos"],
        apelido: "Carga pacote unidade central",
      });

      expect(calls[1].url).toBe("/backend/api/v1/admin/integracoes/importacao-terceiros/jobs/job-pacote-1/p0");
      expect(calls[1].method).toBe("GET");
    } finally {
      restore();
    }
  });

  test("mantem retry somente erros como semantica local sem enviar flag legada no create job", async () => {
    const { calls, restore } = mockFetchSequence([
      jsonResponse({
        jobId: "job-pacote-retry",
        status: "PROCESSANDO",
        dryRun: false,
        solicitadoEm: "2026-03-13T10:10:00Z",
      }, 202),
    ]);

    try {
      const job = await createBackofficeEvoP0PacoteJob({
        uploadId: "upload-1",
        dryRun: false,
        arquivos: ["funcionarios"],
        retrySomenteErros: true,
        tenantId: "tenant-pacote",
      });

      expect(job.jobId).toBe("job-pacote-retry");
      expect(calls[0].url).toBe("/backend/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/upload-1/job");
      expect(calls[0].headers.get("X-Tenant-Id")).toBe("tenant-pacote");
      expect(calls[0].headers.get("X-Context-Id")).toBeNull();
      expect(JSON.parse(String(calls[0].body))).toEqual({
        dryRun: false,
        tenantId: "tenant-pacote",
        arquivos: ["funcionarios"],
      });
    } finally {
      restore();
    }
  });

  test("consulta estado da importação de fotos por unidade", async () => {
    const { calls, restore } = mockFetchSequence([
      jsonResponse({
        tenantId: "tenant-pacote",
        bucket: "conceito-fit-fotos",
        storagePrefix: "tenant-pacote/alunos/",
        totalAlunos: 20,
        vinculosEvoClientes: 18,
        alunosComFoto: 9,
        alunosComFotoImportada: 7,
        importado: true,
      }),
    ]);

    try {
      const estado = await getBackofficeEvoFotoImportEstado({
        tenantId: "tenant-pacote",
      });

      expect(estado.importado).toBe(true);
      expect(estado.alunosComFotoImportada).toBe(7);
      expect(calls[0].url).toBe("/backend/api/v1/admin/integracoes/importacao-terceiros/evo/p0/fotos/estado?tenantId=tenant-pacote");
      expect(calls[0].method).toBe("GET");
      expect(calls[0].headers.get("X-Tenant-Id")).toBe("tenant-pacote");
    } finally {
      restore();
    }
  });

  test("dispara e acompanha job de importação de fotos do pacote", async () => {
    const { calls, restore } = mockFetchSequence([
      jsonResponse({
        jobId: "job-fotos-1",
        tenantId: "tenant-pacote",
        uploadId: "upload-1",
        status: "PROCESSANDO",
        dryRun: false,
        force: true,
        solicitadoEm: "2026-04-15T15:00:00Z",
      }, 202),
      jsonResponse({
        jobId: "job-fotos-1",
        tenantId: "tenant-pacote",
        uploadId: "upload-1",
        status: "CONCLUIDO",
        dryRun: false,
        force: true,
        solicitadoEm: "2026-04-15T15:00:00Z",
        finalizadoEm: "2026-04-15T15:03:00Z",
        total: 12,
        uploaded: 10,
        skipped: 2,
        errors: 0,
        detalhes: [],
      }),
    ]);

    try {
      const job = await createBackofficeEvoPacoteFotoImportJob({
        uploadId: "upload-1",
        tenantId: "tenant-pacote",
        force: true,
      });
      const status = await getBackofficeEvoFotoImportJobStatus({
        jobId: job.jobId,
        tenantId: "tenant-pacote",
      });

      expect(job.status).toBe("PROCESSANDO");
      expect(status.status).toBe("CONCLUIDO");
      expect(status.uploaded).toBe(10);
      expect(calls[0].url).toBe("/backend/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/upload-1/fotos/importar?tenantId=tenant-pacote&force=true");
      expect(calls[0].method).toBe("POST");
      expect(calls[1].url).toBe("/backend/api/v1/admin/integracoes/importacao-terceiros/evo/p0/fotos/jobs/job-fotos-1?tenantId=tenant-pacote");
      expect(calls[1].method).toBe("GET");
    } finally {
      restore();
    }
  });

  test("mantem upload CSV unitario funcionando", async () => {
    const csvFile = new File(["id,nome\n1,Ana"], "clientes.csv", { type: "text/csv" });
    const horariosFile = new File(["id,horario\n1,08:00"], "FUNCIONARIOS_HORARIOS.csv", { type: "text/csv" });
    const { calls, restore } = mockFetchSequence([
      jsonResponse({
        jobId: "job-csv-1",
        status: "PROCESSANDO",
        tenantIds: ["tenant-csv"],
      }),
    ]);

    try {
      const created = await createBackofficeEvoP0CsvJob({
        dryRun: true,
        mapeamentoFiliais: [{ idFilialEvo: 123, tenantId: "tenant-csv" }],
        arquivos: [
          { field: "clientesFile", file: csvFile },
          { field: "funcionariosHorariosFile", file: horariosFile },
        ],
        tenantId: "tenant-csv",
      });

      expect(created.jobId).toBe("job-csv-1");
      expect(created.tenantIds).toEqual(["tenant-csv"]);

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe("/backend/api/v1/admin/integracoes/importacao-terceiros/evo/p0/upload");
      expect(calls[0].method).toBe("POST");

      const formData = calls[0].body as FormData;
      expect(formData.get("dryRun")).toBe("true");
      expect(formData.get("maxRejeicoesRetorno")).toBeNull();
      expect(formData.get("mapeamentoFiliais")).toBe(JSON.stringify([{ idFilialEvo: 123, tenantId: "tenant-csv" }]));
      expect(formData.get("clientesFile")).toBeTruthy();
      expect(formData.get("funcionariosHorariosFile")).toBeTruthy();
    } finally {
      restore();
    }
  });

  test("lista rejeicoes com payload e hint de retry granular", async () => {
    const { calls, restore } = mockFetchSequence([
      jsonResponse({
        items: [
          {
            id: "rej-1",
            entidade: "FUNCIONARIOS_HORARIOS",
            arquivo: "FUNCIONARIOS_HORARIOS.csv",
            linhaArquivo: 19,
            sourceId: "FUNC-10",
            motivo: "Horário inválido",
            criadoEm: "2026-03-13T10:08:00Z",
            bloco: "horarios",
            payload: { diaSemana: "SEG", inicio: "25:00" },
            mensagemAcionavel: "Corrija o turno legado e reenvie apenas o bloco de horários.",
            reprocessamento: {
              suportado: true,
              escopo: "horarios",
              label: "Reprocessar horários",
            },
          },
        ],
        hasNext: false,
      }),
    ]);

    try {
      const rejeicoes = await listBackofficeEvoImportJobRejeicoes({
        jobId: "job-csv-1",
        tenantId: "tenant-csv",
      });

      expect(rejeicoes.items).toHaveLength(1);
      expect(rejeicoes.items?.[0].reprocessamento?.suportado).toBe(true);
      expect(rejeicoes.items?.[0].payload).toEqual({ diaSemana: "SEG", inicio: "25:00" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe("/backend/api/v1/admin/integracoes/importacao-terceiros/jobs/job-csv-1/rejeicoes?page=0&size=50");
      expect(calls[0].method).toBe("GET");
    } finally {
      restore();
    }
  });

  test("normaliza histórico por arquivo com status, contadores e suporte a retry", () => {
    const historico = normalizeUploadAnaliseArquivoHistorico({
      jobId: "job-func-1",
      alias: "Pacote EVO colaboradores",
      status: "CONCLUIDO_COM_REJEICOES",
      processadoEm: "2026-03-13T10:07:00Z",
      resumo: {
        total: 9,
        processadas: 9,
        criadas: 4,
        atualizadas: 3,
        rejeitadas: 2,
      },
      parcial: true,
      mensagemParcial: "Pendências de função exigem retry do arquivo.",
      retrySomenteErrosSuportado: true,
    });

    expect(historico.temHistorico).toBe(true);
    expect(historico.status).toBe("comErros");
    expect(historico.jobId).toBe("job-func-1");
    expect(historico.alias).toBe("Pacote EVO colaboradores");
    expect(historico.processadoEm).toBe("2026-03-13T10:07:00Z");
    expect(historico.resumo?.rejeitadas).toBe(2);
    expect(historico.retrySomenteErrosSuportado).toBe(true);
  });
});

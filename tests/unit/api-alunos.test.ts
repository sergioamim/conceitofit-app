import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAlunoApi,
  createAlunoComMatriculaApi,
  excluirAlunoApi,
  extractAlunosFromListResponse,
  extractAlunosTotais,
  getAlunoApi,
  getClienteOperationalContextApi,
  listAlunosApi,
  migrarClienteParaUnidadeApi,
  searchAlunosApi,
  updateAlunoApi,
} from "@/lib/api/alunos";
import * as http from "@/lib/api/http";

describe("api/alunos", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("extractAlunosFromListResponse", () => {
    it("array direto → retorna como está", () => {
      const items = [{ id: "a1", status: "ATIVO" }] as never;
      const result = extractAlunosFromListResponse(items);
      expect(result).toEqual(items);
    });

    it("envelope com items → extrai e preserva BLOQUEADO como status distinto", () => {
      const result = extractAlunosFromListResponse({
        items: [{ id: "a1", status: "BLOQUEADO" }] as never,
        page: 0,
        size: 10,
        hasNext: false,
      });
      expect(result).toHaveLength(1);
      // Task 458 follow-up: BLOQUEADO é estado distinto de INATIVO
      // (acesso suspenso por inadimplência vs plano vencido). Preservado.
      expect(result[0].status).toBe("BLOQUEADO");
    });

    it("envelope com items null → array vazio", () => {
      const result = extractAlunosFromListResponse({
        items: null as never,
        page: 0,
        size: 10,
        hasNext: false,
      });
      expect(result).toEqual([]);
    });
  });

  describe("extractAlunosTotais", () => {
    it("array → undefined", () => {
      expect(extractAlunosTotais([] as never)).toBeUndefined();
    });

    it("envelope sem totaisStatus → undefined", () => {
      expect(
        extractAlunosTotais({
          items: [],
          page: 0,
          size: 10,
          hasNext: false,
        }),
      ).toBeUndefined();
    });

    it("totaisStatus com total → retorna normalizado", () => {
      const result = extractAlunosTotais({
        items: [],
        page: 0,
        size: 10,
        hasNext: false,
        totaisStatus: {
          total: 100,
          totalAtivo: 80,
          totalSuspenso: 10,
          totalInativo: 5,
          totalCancelado: 5,
        },
      });
      expect(result?.total).toBe(100);
      expect(result?.totalAtivo).toBe(80);
    });

    it("fallback de ativos para totalAtivo", () => {
      const result = extractAlunosTotais({
        items: [],
        page: 0,
        size: 10,
        hasNext: false,
        totaisStatus: {
          total: 10,
          ativos: 8,
          suspensos: 1,
          inativos: 1,
        },
      });
      expect(result?.totalAtivo).toBe(8);
      expect(result?.totalSuspenso).toBe(1);
    });

    it("string numérica é convertida", () => {
      const result = extractAlunosTotais({
        items: [],
        page: 0,
        size: 10,
        hasNext: false,
        totaisStatus: {
          total: "50" as never,
        },
      });
      expect(result?.total).toBe(50);
    });

    it("retorna undefined quando tudo ausente/inválido", () => {
      const result = extractAlunosTotais({
        items: [],
        page: 0,
        size: 10,
        hasNext: false,
        totaisStatus: {} as never,
      });
      expect(result).toBeUndefined();
    });
  });

  describe("listAlunosApi", () => {
    it("GET /comercial/alunos com envelope=true", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "a1" }],
        page: 0,
        size: 10,
        hasNext: false,
      } as never);
      const result = await listAlunosApi({
        tenantId: "t1",
        status: "ATIVO",
        search: "  Ana  ",
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/alunos");
      expect(spy.mock.calls[0][0].query).toMatchObject({
        tenantId: "t1",
        status: "ATIVO",
        search: "Ana",
        envelope: true,
      });
      expect(result.items).toHaveLength(1);
    });

    it("trim de search vazio → undefined", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [],
      } as never);
      await listAlunosApi({ tenantId: "t1", search: "   " });
      expect(spy.mock.calls[0][0].query?.search).toBeUndefined();
    });
  });

  describe("searchAlunosApi", () => {
    it("retorna [] quando search vazio", async () => {
      const spy = vi.spyOn(http, "apiRequest");
      const result = await searchAlunosApi({
        tenantId: "t1",
        search: "   ",
      });
      expect(result).toEqual([]);
      expect(spy).not.toHaveBeenCalled();
    });

    it("chama listAlunosApi com search trimmed", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ items: [{ id: "a1" }] } as never);
      const result = await searchAlunosApi({
        tenantId: "t1",
        search: "  Test  ",
      });
      expect(spy.mock.calls[0][0].query?.search).toBe("Test");
      expect(result).toHaveLength(1);
    });
  });

  describe("getAlunoApi", () => {
    it("GET /comercial/alunos/{id}", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "a1",
        status: "ATIVO",
      } as never);
      await getAlunoApi({ tenantId: "t1", id: "a1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/alunos/a1");
    });

    it("inclui contextHeader quando true", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "a1" } as never);
      await getAlunoApi({
        tenantId: "t1",
        id: "a1",
        includeContextHeader: true,
      });
      expect(spy.mock.calls[0][0].includeContextHeader).toBe(true);
    });

    it("normaliza foto para URL proxy", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "a1",
        tenantId: "t1",
        status: "ATIVO",
        foto: "original.jpg",
        dataAtualizacao: "2026-04-10",
      } as never);
      const result = await getAlunoApi({ tenantId: "t1", id: "a1" });
      expect(result.foto).toContain("/backend/api/v1/comercial/alunos/a1/foto");
      expect(result.foto).toContain("tenantId=t1");
      expect(result.foto).toContain("v=2026-04-10");
    });

    it("foto vazia → undefined", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "a1",
        status: "ATIVO",
        foto: "   ",
      } as never);
      const result = await getAlunoApi({ tenantId: "t1", id: "a1" });
      expect(result.foto).toBeUndefined();
    });
  });

  describe("createAlunoApi", () => {
    it("POST com body completo", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "a1",
        status: "ATIVO",
      } as never);
      await createAlunoApi({
        tenantId: "t1",
        data: {
          nome: "Novo",
          email: "e@m.com",
          telefone: "11",
          cpf: "123",
          dataNascimento: "2000-01-01",
          sexo: "M",
        },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toMatchObject({
        nome: "Novo",
      });
      expect(spy.mock.calls[0][0].body).not.toHaveProperty("tenantId");
    });

    it("permite criar aluno sem cpf quando houver passaporte", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "a1",
        status: "ATIVO",
      } as never);
      await createAlunoApi({
        tenantId: "t1",
        data: {
          nome: "Estrangeiro",
          email: "x@y.com",
          telefone: "11",
          passaporte: "XP-991",
          dataNascimento: "2000-01-01",
          sexo: "F",
        },
      });
      expect(spy.mock.calls[0][0].body).toMatchObject({
        passaporte: "XP-991",
      });
      expect(spy.mock.calls[0][0].body).not.toHaveProperty("cpf");
      expect(spy.mock.calls[0][0].body).not.toHaveProperty("tenantId");
    });

    it("envia responsável quando informado", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "a1",
        status: "ATIVO",
      } as never);
      await createAlunoApi({
        tenantId: "t1",
        data: {
          nome: "Dependente",
          email: "dep@y.com",
          telefone: "11",
          dataNascimento: "2014-01-01",
          sexo: "M",
          responsavel: {
            clienteId: "c1",
            nome: "Maria Responsavel",
            cpf: "98765432100",
          },
        },
      });
      expect(spy.mock.calls[0][0].body).toMatchObject({
        responsavel: {
          clienteId: "c1",
          nome: "Maria Responsavel",
          cpf: "98765432100",
        },
      });
    });
  });

  describe("updateAlunoApi", () => {
    it("PUT com id", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "a1",
        status: "ATIVO",
      } as never);
      await updateAlunoApi({
        tenantId: "t1",
        id: "a1",
        data: { nome: "Edit" },
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/alunos/a1");
    });
  });

  describe("createAlunoComMatriculaApi", () => {
    it("POST /comercial/alunos-com-matricula", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await createAlunoComMatriculaApi({
        tenantId: "t1",
        data: {
          nome: "N",
          email: "e@m.com",
          telefone: "11",
          cpf: "123",
          dataNascimento: "2000-01-01",
          sexo: "M",
          planoId: "p1",
          dataInicio: "2026-04-10",
          formaPagamento: "PIX",
        },
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/alunos-com-matricula",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });
  });

  describe("excluirAlunoApi", () => {
    it("DELETE com body", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await excluirAlunoApi({
        tenantId: "t1",
        id: "a1",
        data: { tenantId: "t1", justificativa: "motivo" },
      });
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
      expect(spy.mock.calls[0][0].body).toMatchObject({
        tenantId: "t1",
        justificativa: "motivo",
      });
    });
  });

  describe("getClienteOperationalContextApi", () => {
    it("GET /contexto-operacional e normaliza", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        tenantId: "t1",
        tenantNome: "Unidade A",
        baseTenantId: "t0",
        aluno: { id: "a1", tenantId: "t1", status: "ATIVO" },
        eligibleTenants: [
          {
            tenantId: "t1",
            tenantNome: "Unidade A",
            defaultTenant: true,
            blockedReasons: [],
          },
        ],
        blockedTenants: [
          {
            tenantId: "t2",
            blockedReasons: [{ code: "DEBITO", message: "Aluno tem débitos" }],
          },
        ],
        blocked: false,
      } as never);
      const result = await getClienteOperationalContextApi({
        id: "a1",
        tenantId: "t1",
      });
      expect(result.tenantId).toBe("t1");
      expect(result.tenantName).toBe("Unidade A");
      expect(result.eligibleTenants).toHaveLength(1);
      expect(result.blockedTenants).toHaveLength(1);
      expect(result.blockedTenants[0].blockedReasons[0].code).toBe("DEBITO");
    });

    it("lança erro quando aluno ausente", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        tenantId: "t1",
      } as never);
      await expect(
        getClienteOperationalContextApi({ id: "a1", tenantId: "t1" }),
      ).rejects.toThrow(/sem aluno/i);
    });
  });

  describe("migrarClienteParaUnidadeApi", () => {
    it("POST /migrar-unidade e normaliza result", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        success: true,
        auditId: "audit-1",
        message: "OK",
        tenantOrigemId: "t1",
        tenantDestinoId: "t2",
        blockedBy: [],
      } as never);
      const result = await migrarClienteParaUnidadeApi({
        tenantId: "t1",
        id: "a1",
        data: { tenantDestinoId: "t2", justificativa: "motivo" } as never,
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/clientes/a1/migrar-unidade",
      );
      expect(result.success).toBe(true);
      expect(result.auditId).toBe("audit-1");
    });

    it("preservarContextoComercial default true", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ success: true } as never);
      await migrarClienteParaUnidadeApi({
        tenantId: "t1",
        id: "a1",
        data: { tenantDestinoId: "t2", justificativa: "x" } as never,
      });
      const body = spy.mock.calls[0][0].body as Record<string, unknown>;
      expect(body.preservarContextoComercial).toBe(true);
    });

    it("success false propaga", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        success: false,
        blockedBy: [
          { code: "C1", message: "m1" },
          { code: "", message: "ignored" },
        ],
      } as never);
      const result = await migrarClienteParaUnidadeApi({
        tenantId: "t1",
        id: "a1",
        data: { tenantDestinoId: "t2", justificativa: "x" } as never,
      });
      expect(result.success).toBe(false);
      expect(result.blockedBy).toHaveLength(1);
    });
  });
});

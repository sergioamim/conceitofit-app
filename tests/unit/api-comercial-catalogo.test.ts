import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPlanoUpsertApiRequest,
  createPlanoApi,
  createProdutoApi,
  createServicoApi,
  deleteProdutoApi,
  deleteServicoApi,
  getPlanoApi,
  listPlanosApi,
  listProdutosApi,
  listServicosApi,
  normalizePlanoApiResponse,
  togglePlanoAtivoApi,
  togglePlanoDestaqueApi,
  toggleProdutoApi,
  toggleServicoApi,
  updatePlanoApi,
  updateProdutoApi,
  updateServicoApi,
} from "@/lib/api/comercial-catalogo";
import * as http from "@/lib/api/http";

describe("api/comercial-catalogo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("buildPlanoUpsertApiRequest", () => {
    it("limita nome e descricao", () => {
      const req = buildPlanoUpsertApiRequest({
        nome: "x".repeat(200),
        descricao: "y".repeat(1000),
        tipo: "MENSAL",
        duracaoDias: 30,
        valor: 100,
        valorMatricula: 0,
        atividades: [],
        beneficios: [],
      } as never);
      expect(req.nome.length).toBe(100);
      expect(req.descricao?.length).toBe(500);
    });

    it("duracaoDias mínimo 1", () => {
      const req = buildPlanoUpsertApiRequest({
        nome: "N",
        tipo: "MENSAL",
        duracaoDias: 0,
        valor: 100,
        valorMatricula: 0,
        atividades: [],
        beneficios: [],
      } as never);
      expect(req.duracaoDias).toBe(1);
    });

    it("valor mínimo 0.01", () => {
      const req = buildPlanoUpsertApiRequest({
        nome: "N",
        tipo: "MENSAL",
        duracaoDias: 30,
        valor: 0,
        valorMatricula: 0,
        atividades: [],
        beneficios: [],
      } as never);
      expect(req.valor).toBe(0.01);
    });

    it("deduplica atividades", () => {
      const req = buildPlanoUpsertApiRequest({
        nome: "N",
        tipo: "MENSAL",
        duracaoDias: 30,
        valor: 100,
        valorMatricula: 0,
        atividades: ["a1", "a2", "a1", "  "] as never,
        beneficios: [],
      } as never);
      expect(req.atividades).toEqual(["a1", "a2"]);
    });

    it("beneficios vazios → undefined", () => {
      const req = buildPlanoUpsertApiRequest({
        nome: "N",
        tipo: "MENSAL",
        duracaoDias: 30,
        valor: 100,
        valorMatricula: 0,
        atividades: [],
        beneficios: [],
      } as never);
      expect(req.beneficios).toBeUndefined();
    });

    it("permiteVendaOnline default → true", () => {
      const req = buildPlanoUpsertApiRequest({
        nome: "N",
        tipo: "MENSAL",
        duracaoDias: 30,
        valor: 100,
        valorMatricula: 0,
        atividades: [],
        beneficios: [],
      } as never);
      expect(req.permiteVendaOnline).toBe(true);
    });

    it("ordem null → undefined", () => {
      const req = buildPlanoUpsertApiRequest({
        nome: "N",
        tipo: "MENSAL",
        duracaoDias: 30,
        valor: 100,
        valorMatricula: 0,
        atividades: [],
        beneficios: [],
        ordem: null,
      } as never);
      expect(req.ordem).toBeUndefined();
    });

    it("preserva regras financeiras e contrato do plano", () => {
      const req = buildPlanoUpsertApiRequest({
        nome: "Plano Premium",
        descricao: "Anual",
        tipo: "ANUAL",
        duracaoDias: 365,
        valor: 199.9,
        valorMatricula: 25,
        cobraAnuidade: true,
        valorAnuidade: 120,
        parcelasMaxAnuidade: 6,
        permiteRenovacaoAutomatica: true,
        permiteCobrancaRecorrente: true,
        diaCobrancaPadrao: [20, 5],
        contratoTemplateHtml: " <p>Contrato</p> ",
        contratoAssinatura: "DIGITAL",
        contratoEnviarAutomaticoEmail: true,
        atividades: ["a1"],
        beneficios: ["Armário"],
        destaque: true,
        permiteVendaOnline: false,
        ordem: 3,
      } as never);

      expect(req).toMatchObject({
        cobraAnuidade: true,
        valorAnuidade: 120,
        parcelasMaxAnuidade: 6,
        permiteRenovacaoAutomatica: true,
        permiteCobrancaRecorrente: true,
        diaCobrancaPadrao: 5,
        contratoTemplateHtml: "<p>Contrato</p>",
        contratoAssinatura: "DIGITAL",
        contratoEnviarAutomaticoEmail: true,
        destaque: true,
        permiteVendaOnline: false,
        ordem: 3,
      });
    });
  });

  describe("normalizePlanoApiResponse", () => {
    it("normaliza com defaults", () => {
      const result = normalizePlanoApiResponse({});
      expect(result.nome).toBe("");
      expect(result.duracaoDias).toBe(1);
      expect(result.valor).toBe(0);
      expect(result.tipo).toBe("MENSAL");
      expect(result.contratoAssinatura).toBe("AMBAS");
      expect(result.atividades).toEqual([]);
      expect(result.beneficios).toEqual([]);
      expect(result.permiteVendaOnline).toBe(true);
      expect(result.ativo).toBe(true);
    });

    it("usa fallback quando input vazio", () => {
      const result = normalizePlanoApiResponse(
        { id: "p1" },
        { tenantId: "t1", nome: "Fallback", valor: 50 },
      );
      expect(result.id).toBe("p1");
      expect(result.tenantId).toBe("t1");
      expect(result.nome).toBe("Fallback");
      expect(result.valor).toBe(50);
    });

    it("extract atividade IDs de array atividades", () => {
      const result = normalizePlanoApiResponse({
        atividades: [{ id: "a1" }, { id: "a2" }] as never,
      });
      expect(result.atividades).toEqual(["a1", "a2"]);
    });

    it("extract atividade IDs de array UUIDs conforme contrato oficial", () => {
      const result = normalizePlanoApiResponse({
        atividades: ["a1", "a2"] as never,
      });
      expect(result.atividades).toEqual(["a1", "a2"]);
    });

    it("atividadeIds tem precedência sobre atividades", () => {
      const result = normalizePlanoApiResponse({
        atividadeIds: ["x1"],
        atividades: [{ id: "a1" }] as never,
      });
      expect(result.atividades).toEqual(["x1"]);
    });

    it("diaCobrancaPadrao array válido ordenado", () => {
      const result = normalizePlanoApiResponse({
        diaCobrancaPadrao: [5, 10, 2, 30, 0] as never,
      });
      expect(result.diaCobrancaPadrao).toEqual([2, 5, 10]);
    });

    it("diaCobrancaPadrao número único", () => {
      const result = normalizePlanoApiResponse({
        diaCobrancaPadrao: 15 as never,
      });
      expect(result.diaCobrancaPadrao).toEqual([15]);
    });

    it("tipo AVULSO → permiteRenovacaoAutomatica default false", () => {
      const result = normalizePlanoApiResponse({ tipo: "AVULSO" as never });
      expect(result.permiteRenovacaoAutomatica).toBe(false);
    });

    it("tipo MENSAL → permiteRenovacaoAutomatica default true", () => {
      const result = normalizePlanoApiResponse({ tipo: "MENSAL" as never });
      expect(result.permiteRenovacaoAutomatica).toBe(true);
    });

    it("tolera resposta undefined usando fallback", () => {
      const result = normalizePlanoApiResponse(undefined, {
        id: "p1",
        tenantId: "t1",
        nome: "Fallback",
        tipo: "MENSAL",
        duracaoDias: 30,
        valor: 99,
        valorMatricula: 0,
        cobraAnuidade: false,
        permiteRenovacaoAutomatica: true,
        permiteCobrancaRecorrente: false,
        contratoAssinatura: "AMBAS",
        contratoEnviarAutomaticoEmail: false,
        destaque: false,
        permiteVendaOnline: true,
        ativo: true,
      } as never);
      expect(result.nome).toBe("Fallback");
      expect(result.tenantId).toBe("t1");
      expect(result.permiteVendaOnline).toBe(true);
    });
  });

  describe("servicos CRUD", () => {
    it("listServicosApi default apenasAtivos=false", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "s1", tenantId: "t1", nome: "S", valor: 100 },
      ] as never);
      await listServicosApi();
      expect(spy.mock.calls[0][0].query).toEqual({ apenasAtivos: false });
    });

    it("listServicosApi apenasAtivos=true", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([] as never);
      await listServicosApi(true);
      expect(spy.mock.calls[0][0].query?.apenasAtivos).toBe(true);
    });

    it("listServicosApi normaliza valor", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "s1",
          tenantId: "t1",
          nome: "S",
          valor: "100",
          custo: "50",
          comissaoPercentual: "10",
        },
      ] as never);
      const result = await listServicosApi();
      expect(result[0].valor).toBe(100);
      expect(result[0].custo).toBe(50);
      expect(result[0].comissaoPercentual).toBe(10);
    });

    it("createServicoApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await createServicoApi({ nome: "S" } as never);
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("updateServicoApi PUT", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await updateServicoApi("s1", { nome: "Edit" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/servicos/s1",
      );
      expect(spy.mock.calls[0][0].method).toBe("PUT");
    });

    it("toggleServicoApi PATCH /toggle", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await toggleServicoApi("s1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/servicos/s1/toggle",
      );
      expect(spy.mock.calls[0][0].method).toBe("PATCH");
    });

    it("deleteServicoApi DELETE", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await deleteServicoApi("s1");
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
    });
  });

  describe("produtos CRUD", () => {
    it("listProdutosApi normaliza valores", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "pr1",
          tenantId: "t1",
          nome: "Prod",
          valorVenda: "99.9",
          estoqueAtual: "10",
        },
      ] as never);
      const result = await listProdutosApi();
      expect(result[0].valorVenda).toBe(99.9);
      expect(result[0].estoqueAtual).toBe(10);
    });

    it("createProdutoApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await createProdutoApi({ nome: "P" } as never);
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/produtos");
    });

    it("updateProdutoApi PUT", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await updateProdutoApi("pr1", { nome: "Edit" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/produtos/pr1",
      );
      expect(spy.mock.calls[0][0].method).toBe("PUT");
    });

    it("toggleProdutoApi PATCH", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await toggleProdutoApi("pr1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/produtos/pr1/toggle",
      );
    });

    it("deleteProdutoApi DELETE", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await deleteProdutoApi("pr1");
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
    });
  });

  describe("planos CRUD", () => {
    it("listPlanosApi GET", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([{ id: "p1" }] as never);
      const result = await listPlanosApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/planos");
      expect(spy.mock.calls[0][0].query?.apenasAtivos).toBe(false);
      expect(result).toHaveLength(1);
    });

    it("listPlanosApi extrai envelope items", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "p1" }, { id: "p2" }],
      } as never);
      const result = await listPlanosApi({ tenantId: "t1" });
      expect(result).toHaveLength(2);
    });

    it("listPlanosApi extrai envelope content", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        content: [{ id: "p1" }],
      } as never);
      const result = await listPlanosApi({ tenantId: "t1" });
      expect(result).toHaveLength(1);
    });

    it("getPlanoApi GET /{id}", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "p1",
      } as never);
      await getPlanoApi({ tenantId: "t1", id: "p1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/planos/p1");
    });

    it("createPlanoApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "p1" } as never);
      await createPlanoApi({
        tenantId: "t1",
        data: {
          nome: "P",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 100,
          valorMatricula: 0,
          atividades: ["a1"],
          beneficios: [],
        } as never,
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toMatchObject({ permiteVendaOnline: true, atividades: ["a1"] });
      expect(spy.mock.calls[0][0].body).not.toHaveProperty("atividadeIds");
      expect(spy.mock.calls[0][0].body).not.toHaveProperty("tenantId");
    });

    it("updatePlanoApi PUT", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await expect(updatePlanoApi({
        tenantId: "t1",
        id: "p1",
        data: {
          nome: "P",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 100,
          valorMatricula: 0,
          atividades: ["a1"],
          beneficios: [],
          ativo: true,
        } as never,
      })).resolves.toBeUndefined();
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/planos/p1");
      expect(spy.mock.calls[0][0].body).toMatchObject({ permiteVendaOnline: true, atividades: ["a1"] });
      expect(spy.mock.calls[0][0].body).not.toHaveProperty("atividadeIds");
      expect(spy.mock.calls[0][0].body).not.toHaveProperty("tenantId");
    });

    it("togglePlanoAtivoApi PATCH /toggle-ativo", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await expect(togglePlanoAtivoApi({ tenantId: "t1", id: "p1" })).resolves.toBeUndefined();
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/planos/p1/toggle-ativo",
      );
    });

    it("togglePlanoDestaqueApi PATCH /toggle-destaque", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await expect(togglePlanoDestaqueApi({ tenantId: "t1", id: "p1" })).resolves.toBeUndefined();
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/planos/p1/toggle-destaque",
      );
    });
  });
});

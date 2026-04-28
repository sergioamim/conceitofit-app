import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addProspectMensagemApi,
  buildProspectUpsertApiRequest,
  checkProspectDuplicateApi,
  converterProspectApi,
  createCrmCadenciaApi,
  createCrmCampanhaApi,
  createCrmPlaybookApi,
  createCrmTaskApi,
  createProspectApi,
  criarProspectAgendamentoApi,
  deleteProspectApi,
  dispararCrmCampanhaApi,
  encerrarCrmCampanhaApi,
  getCrmDashboardRetencaoApi,
  getProspectApi,
  listCrmAutomacoesApi,
  listCrmCadenciasApi,
  listCrmCampanhasApi,
  listCrmPlaybooksApi,
  listCrmTasksApi,
  listProspectAgendamentosApi,
  listProspectMensagensApi,
  listProspectsApi,
  marcarProspectPerdidoApi,
  normalizeProspectApiResponse,
  updateCrmAutomacaoApi,
  updateCrmCadenciaApi,
  updateCrmCampanhaApi,
  updateCrmPlaybookApi,
  updateCrmTaskApi,
  updateProspectAgendamentoApi,
  updateProspectApi,
  updateProspectStatusApi,
} from "@/lib/api/crm";
import * as http from "@/lib/api/http";
import { ApiRequestError } from "@/lib/api/http";

describe("api/crm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("buildProspectUpsertApiRequest", () => {
    it("limita nome ao tamanho máximo", () => {
      const req = buildProspectUpsertApiRequest("t1", {
        nome: "x".repeat(200),
        telefone: "11999999999",
        origem: "INDICACAO",
      } as never);
      expect(req.nome.length).toBe(100);
      expect(req.tenantId).toBe("t1");
      expect(req.telefone).toBe("11999999999");
    });

    it("limpa strings vazias para undefined", () => {
      const req = buildProspectUpsertApiRequest("t1", {
        nome: "  Test  ",
        telefone: "119",
        email: "   ",
        cpf: "",
        origem: "SITE",
        observacoes: "",
      } as never);
      expect(req.nome).toBe("Test");
      expect(req.email).toBeUndefined();
      expect(req.cpf).toBeUndefined();
      expect(req.observacoes).toBeUndefined();
    });

    it("preserva email/cpf/observacoes válidos", () => {
      const req = buildProspectUpsertApiRequest("t1", {
        nome: "N",
        telefone: "11",
        email: "a@b.com",
        cpf: "12345678900",
        origem: "INDICACAO",
        observacoes: "obs",
      } as never);
      expect(req.email).toBe("a@b.com");
      expect(req.cpf).toBe("12345678900");
      expect(req.observacoes).toBe("obs");
    });
  });

  describe("normalizeProspectApiResponse", () => {
    it("usa fallback quando campos ausentes", () => {
      const result = normalizeProspectApiResponse(
        { id: "p1" },
        { tenantId: "t1", nome: "N", telefone: "11", origem: "INDICACAO" },
      );
      expect(result.id).toBe("p1");
      expect(result.tenantId).toBe("t1");
      expect(result.nome).toBe("N");
      expect(result.origem).toBe("INDICACAO");
      expect(result.status).toBe("NOVO");
    });

    it("usa defaults quando nem fallback nem input têm dados", () => {
      const result = normalizeProspectApiResponse({});
      expect(result.id).toBe("");
      expect(result.origem).toBe("OUTROS");
      expect(result.status).toBe("NOVO");
      expect(typeof result.dataCriacao).toBe("string");
    });

    it("limpa strings vazias/whitespace", () => {
      const result = normalizeProspectApiResponse(
        { nome: "   ", email: "  x@y.com  " },
        { tenantId: "t1" },
      );
      expect(result.nome).toBe("");
      expect(result.email).toBe("x@y.com");
    });
  });

  describe("prospects CRUD", () => {
    it("listProspectsApi com filtros", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([{ id: "p1", nome: "A" }] as never);
      const result = await listProspectsApi({
        tenantId: "t1",
        status: "NOVO",
        origem: "SITE",
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/academia/prospects");
      expect(spy.mock.calls[0][0].query).toEqual({
        tenantId: "t1",
        status: "NOVO",
        origem: "SITE",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("p1");
    });

    it("listProspectsApi extrai items de envelope", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "p1" }, { id: "p2" }],
      } as never);
      const result = await listProspectsApi({ tenantId: "t1" });
      expect(result).toHaveLength(2);
    });

    it("listProspectsApi extrai content de envelope", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        content: [{ id: "p1" }],
      } as never);
      const result = await listProspectsApi({ tenantId: "t1" });
      expect(result).toHaveLength(1);
    });

    it("listProspectsApi envelope vazio retorna []", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      const result = await listProspectsApi({ tenantId: "t1" });
      expect(result).toEqual([]);
    });

    it("getProspectApi GET com id no path", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "p1", nome: "N" } as never);
      const result = await getProspectApi({ tenantId: "t1", id: "p1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/academia/prospects/p1");
      expect(result.id).toBe("p1");
    });

    it("createProspectApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "p1" } as never);
      await createProspectApi({
        tenantId: "t1",
        data: {
          nome: "Novo",
          telefone: "11",
          origem: "INDICACAO",
        } as never,
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toMatchObject({
        tenantId: "t1",
        nome: "Novo",
      });
    });

    it("updateProspectApi PUT com id", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "p1" } as never);
      await updateProspectApi({
        tenantId: "t1",
        id: "p1",
        data: { nome: "Edit", telefone: "11", origem: "SITE" } as never,
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/academia/prospects/p1");
    });

    it("deleteProspectApi DELETE", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await deleteProspectApi({ tenantId: "t1", id: "p1" });
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
    });

    it("updateProspectStatusApi PATCH /status", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "p1" } as never);
      await updateProspectStatusApi({
        tenantId: "t1",
        id: "p1",
        status: "VISITOU",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/academia/prospects/p1/status",
      );
      expect(spy.mock.calls[0][0].method).toBe("PATCH");
      expect(spy.mock.calls[0][0].query?.status).toBe("VISITOU");
    });

    it("marcarProspectPerdidoApi POST /perdido", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "p1" } as never);
      await marcarProspectPerdidoApi({
        tenantId: "t1",
        id: "p1",
        motivo: "preço",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/academia/prospects/p1/perdido",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].query?.motivo).toBe("preço");
    });

    it("checkProspectDuplicateApi GET", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(true as never);
      const result = await checkProspectDuplicateApi({
        tenantId: "t1",
        telefone: "  11  ",
      });
      expect(result).toBe(true);
      expect(spy.mock.calls[0][0].query?.telefone).toBe("11");
    });

    it("converterProspectApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ alunoId: "a1" } as never);
      await converterProspectApi({
        tenantId: "t1",
        data: { prospectId: "p1" } as never,
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/academia/prospects/converter",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });
  });

  describe("prospect mensagens/agendamentos", () => {
    it("listProspectMensagensApi GET", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([] as never);
      await listProspectMensagensApi({ tenantId: "t1", prospectId: "p1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/crm/prospects/p1/mensagens",
      );
    });

    it("addProspectMensagemApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await addProspectMensagemApi({
        tenantId: "t1",
        prospectId: "p1",
        data: { texto: "oi", autorNome: "A" },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({ texto: "oi", autorNome: "A" });
    });

    it("listProspectAgendamentosApi GET", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([] as never);
      await listProspectAgendamentosApi({ tenantId: "t1", prospectId: "p1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/crm/prospects/p1/agendamentos",
      );
    });

    it("criarProspectAgendamentoApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await criarProspectAgendamentoApi({
        tenantId: "t1",
        prospectId: "p1",
        data: {
          funcionarioId: "f1",
          titulo: "Visita",
          data: "2026-04-15",
          hora: "10:00",
        },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("updateProspectAgendamentoApi PATCH /status", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await updateProspectAgendamentoApi({
        tenantId: "t1",
        id: "a1",
        status: "REALIZADO",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/crm/prospect-agendamentos/a1/status",
      );
      expect(spy.mock.calls[0][0].method).toBe("PATCH");
    });
  });

  describe("tasks/playbooks/cadencias/automacoes/campanhas", () => {
    it("listCrmTasksApi com filtros", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([] as never);
      await listCrmTasksApi({
        tenantId: "t1",
        status: "PENDENTE",
        prioridade: "ALTA",
      } as never);
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/crm/tarefas");
      expect(spy.mock.calls[0][0].query?.status).toBe("PENDENTE");
    });

    it("createCrmTaskApi POST", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({ id: "t1" } as never);
      const result = await createCrmTaskApi({
        tenantId: "t1",
        data: {
          titulo: "T",
          responsavel: "Joana",
          prioridade: "MEDIA",
          status: "PENDENTE",
          vencimentoEm: "2026-04-20T09:00:00",
        },
      });
      expect(result).toBeDefined();
    });

    it("createCrmTaskApi converte 404 em erro amigável", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        new ApiRequestError({ status: 404, message: "Not Found" }),
      );
      await expect(
        createCrmTaskApi({
          tenantId: "t1",
          data: {
            titulo: "T",
            responsavel: "Joana",
            prioridade: "MEDIA",
            status: "PENDENTE",
            vencimentoEm: "2026-04-20T09:00:00",
          },
        }),
      ).rejects.toThrow(/não expõe criação de tarefas/i);
    });

    it("createCrmTaskApi propaga erro não-404", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        new ApiRequestError({ status: 500, message: "Server error" }),
      );
      await expect(
        createCrmTaskApi({
          tenantId: "t1",
          data: {
            titulo: "T",
            responsavel: "Joana",
            prioridade: "MEDIA",
            status: "PENDENTE",
            vencimentoEm: "2026-04-20T09:00:00",
          },
        }),
      ).rejects.toThrow(/Server error/);
    });

    it("updateCrmTaskApi PUT com id", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "t1" } as never);
      await updateCrmTaskApi({
        tenantId: "t1",
        id: "t1",
        data: {
          titulo: "Edit",
          prioridade: "ALTA",
          status: "EM_ANDAMENTO",
          vencimentoEm: "2026-04-20T09:00:00",
        },
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/crm/tarefas/t1");
    });

    it("updateCrmTaskApi converte 501 em erro amigável", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        new ApiRequestError({ status: 501, message: "Not implemented" }),
      );
      await expect(
        updateCrmTaskApi({
          tenantId: "t1",
          id: "t1",
          data: {} as never,
        }),
      ).rejects.toThrow(/não expõe atualização de tarefas/i);
    });

    it("listCrmPlaybooksApi GET", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ content: [] } as never);
      await listCrmPlaybooksApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/crm/playbooks");
    });

    it("createCrmPlaybookApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await createCrmPlaybookApi({
        tenantId: "t1",
        data: {
          nome: "PB",
          descricao: "obj",
          ativo: true,
          prioridadePadrao: "MEDIA",
          prazoHorasPadrao: 12,
          etapas: ["Contato inicial", "Follow-up"],
        },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toMatchObject({
        nome: "PB",
        descricao: "obj",
        prioridadePadrao: "MEDIA",
        prazoHorasPadrao: 12,
        etapas: ["Contato inicial", "Follow-up"],
      });
    });

    it("updateCrmPlaybookApi PUT", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await updateCrmPlaybookApi({
        tenantId: "t1",
        id: "pb1",
        data: { nome: "Edit" },
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/crm/playbooks/pb1");
    });

    it("listCrmCadenciasApi lista com sucesso", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      const result = await listCrmCadenciasApi({ tenantId: "t1" });
      expect(result).toEqual([]);
    });

    it("createCrmCadenciaApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "c1" } as never);
      await createCrmCadenciaApi({
        tenantId: "t1",
        data: {
          nome: "C",
          objetivo: "o",
          stageStatus: "NOVO",
          gatilho: "NOVO_PROSPECT",
          ativo: true,
          passos: [{ titulo: "Passo 1", acao: "WHATSAPP", delayDias: 0, automatica: true }],
        },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/crm/cadencias");
    });

    it("updateCrmCadenciaApi PUT", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ id: "c1" } as never);
      await updateCrmCadenciaApi({
        tenantId: "t1",
        id: "c1",
        data: { nome: "Editada" },
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/crm/cadencias/c1");
    });

    it("listCrmAutomacoesApi GET", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue([] as never);
      await listCrmAutomacoesApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/crm/automacoes");
    });

    it("updateCrmAutomacaoApi PUT", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await updateCrmAutomacaoApi({
        tenantId: "t1",
        id: "a1",
        data: { ativa: true } as never,
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/crm/automacoes/a1");
      expect(spy.mock.calls[0][0].method).toBe("PUT");
    });

    it("listCrmCampanhasApi GET", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      const result = await listCrmCampanhasApi({ tenantId: "t1" });
      expect(result).toEqual([]);
    });

    it("listCrmCampanhasApi 404 friendly", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        new ApiRequestError({ status: 404, message: "Not Found" }),
      );
      await expect(
        listCrmCampanhasApi({ tenantId: "t1" }),
      ).rejects.toThrow(/não expõe campanhas/i);
    });

    it("createCrmCampanhaApi POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await createCrmCampanhaApi({
        tenantId: "t1",
        data: { nome: "C" } as never,
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("updateCrmCampanhaApi PUT", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await updateCrmCampanhaApi({
        tenantId: "t1",
        id: "c1",
        data: { nome: "Edit" } as never,
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/crm/campanhas/c1");
    });

    it("dispararCrmCampanhaApi POST /disparar", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await dispararCrmCampanhaApi({ tenantId: "t1", id: "c1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/crm/campanhas/c1/disparar",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("encerrarCrmCampanhaApi PATCH /encerrar", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await encerrarCrmCampanhaApi({ tenantId: "t1", id: "c1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/crm/campanhas/c1/encerrar",
      );
      expect(spy.mock.calls[0][0].method).toBe("PATCH");
    });
  });

  describe("dashboard retenção", () => {
    it("getCrmDashboardRetencaoApi GET", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        leadsEmAberto: 5,
        permissoes: {
          podeGerirAutomacoes: true,
          podeGerirTarefas: true,
          podeVerDashboard: true,
        },
      } as never);
      const result = await getCrmDashboardRetencaoApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/crm/dashboard/retencao");
      expect(result.leadsEmAberto).toBe(5);
    });

    it("getCrmDashboardRetencaoApi 404 friendly", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(
        new ApiRequestError({ status: 404, message: "Not Found" }),
      );
      await expect(
        getCrmDashboardRetencaoApi({ tenantId: "t1" }),
      ).rejects.toThrow(/não expõe dashboard de retenção/i);
    });
  });
});

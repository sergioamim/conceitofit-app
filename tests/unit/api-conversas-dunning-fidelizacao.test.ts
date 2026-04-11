import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assignConversaOwnerApi,
  createConversaApi,
  createConversaTaskApi,
  getConversaDetailApi,
  getConversaThreadApi,
  listConversasApi,
  moveConversaQueueApi,
  reattribuirConversaUnidadeApi,
  sendMessageApi,
  updateConversaStatusApi,
} from "@/lib/api/conversas";
import {
  gerarLinkPagamentoDunningApi,
  getDunningDashboardApi,
  listDunningIntervencoesApi,
  listDunningTemplatesApi,
  regularizarDunningApi,
  regularizarEmLoteDunningApi,
  suspenderDunningApi,
  tentarOutroGatewayDunningApi,
  updateDunningTemplateApi,
} from "@/lib/api/dunning";
import {
  converterIndicacaoApi,
  createCampanhaFidelizacaoApi,
  createIndicacaoApi,
  getSaldoDetalheFidelizacaoApi,
  listCampanhasFidelizacaoApi,
  listIndicacoesApi,
  listSaldosFidelizacaoApi,
  resgatarPontosFidelizacaoApi,
  updateCampanhaFidelizacaoApi,
} from "@/lib/api/fidelizacao";
import * as http from "@/lib/api/http";

describe("api/conversas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listConversasApi com filtros", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await listConversasApi({
      tenantId: "t1",
      filters: {
        unidadeId: "u1",
        status: "ABERTA",
        queue: "vendas",
        ownerUserId: "u1",
        periodoInicio: "2026-04-01",
        periodoFim: "2026-04-30",
        busca: "olá",
      } as never,
    });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/conversas");
    expect(spy.mock.calls[0][0].query).toMatchObject({
      tenantId: "t1",
      unidadeId: "u1",
      status: "ABERTA",
      queue: "vendas",
      busca: "olá",
    });
  });

  it("listConversasApi defaults page/size", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await listConversasApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].query).toMatchObject({ page: 0, size: 20 });
  });

  it("getConversaDetailApi GET /{id}", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await getConversaDetailApi({ tenantId: "t1", id: "c1" });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/conversas/c1");
  });

  it("createConversaApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await createConversaApi({
      tenantId: "t1",
      data: { telefone: "11" } as never,
    });
    expect(spy.mock.calls[0][0].method).toBe("POST");
  });

  it("updateConversaStatusApi PATCH", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await updateConversaStatusApi({
      tenantId: "t1",
      id: "c1",
      status: "ENCERRADA" as never,
    });
    expect(spy.mock.calls[0][0].method).toBe("PATCH");
    expect(spy.mock.calls[0][0].body).toEqual({ status: "ENCERRADA" });
  });

  it("assignConversaOwnerApi PATCH /owner", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await assignConversaOwnerApi({
      tenantId: "t1",
      id: "c1",
      ownerUserId: "u1",
    });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/conversas/c1/owner");
  });

  it("moveConversaQueueApi PATCH /queue", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await moveConversaQueueApi({ tenantId: "t1", id: "c1", queue: "sup" });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/conversas/c1/queue");
  });

  it("reattribuirConversaUnidadeApi PATCH /unidade", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await reattribuirConversaUnidadeApi({
      tenantId: "t1",
      id: "c1",
      unidadeId: "u1",
    });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/conversas/c1/unidade");
  });

  it("getConversaThreadApi GET /thread", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await getConversaThreadApi({ tenantId: "t1", id: "c1" });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/conversas/c1/thread");
    expect(spy.mock.calls[0][0].query).toMatchObject({ page: 0, size: 50 });
  });

  it("sendMessageApi POST com X-Idempotency-Key", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await sendMessageApi({
      tenantId: "t1",
      conversationId: "c1",
      data: { texto: "oi" } as never,
      idempotencyKey: "key-1",
    });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/conversas/c1/mensagens");
    expect(spy.mock.calls[0][0].headers?.["X-Idempotency-Key"]).toBe("key-1");
  });

  it("sendMessageApi sem idempotencyKey → headers vazios", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await sendMessageApi({
      tenantId: "t1",
      conversationId: "c1",
      data: { texto: "oi" } as never,
    });
    expect(spy.mock.calls[0][0].headers).toEqual({});
  });

  it("createConversaTaskApi POST /tarefas", async () => {
    const spy = vi
      .spyOn(http, "apiRequest")
      .mockResolvedValue(undefined as never);
    await createConversaTaskApi({
      tenantId: "t1",
      conversationId: "c1",
      data: { titulo: "T" } as never,
    });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/conversas/c1/tarefas");
    expect(spy.mock.calls[0][0].method).toBe("POST");
  });
});

describe("api/dunning", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getDunningDashboardApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await getDunningDashboardApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/financeiro/dunning/dashboard",
    );
  });

  it("listDunningIntervencoesApi GET com filtros", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listDunningIntervencoesApi({
      tenantId: "t1",
      page: 0,
      size: 20,
      valorMinimo: 100,
      busca: "ana",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/financeiro/dunning/intervencao",
    );
    expect(spy.mock.calls[0][0].query?.valorMinimo).toBe(100);
  });

  it("gerarLinkPagamentoDunningApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await gerarLinkPagamentoDunningApi({
      tenantId: "t1",
      contaReceberId: "cr1",
      formaPagamento: "PIX",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/financeiro/dunning/intervencao/cr1/gerar-link-pagamento",
    );
    expect(spy.mock.calls[0][0].body).toEqual({ formaPagamento: "PIX" });
  });

  it("regularizarDunningApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await regularizarDunningApi({ tenantId: "t1", contaReceberId: "cr1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/financeiro/dunning/intervencao/cr1/regularizar",
    );
  });

  it("suspenderDunningApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await suspenderDunningApi({ tenantId: "t1", contaReceberId: "cr1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/financeiro/dunning/intervencao/cr1/suspender",
    );
  });

  it("tentarOutroGatewayDunningApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await tentarOutroGatewayDunningApi({
      tenantId: "t1",
      contaReceberId: "cr1",
      gatewayId: "g1",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/financeiro/dunning/intervencao/cr1/tentar-outro-gateway",
    );
    expect(spy.mock.calls[0][0].body).toEqual({ gatewayId: "g1" });
  });

  it("regularizarEmLoteDunningApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await regularizarEmLoteDunningApi({
      tenantId: "t1",
      contaReceberIds: ["cr1", "cr2"],
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/financeiro/dunning/intervencao/lote/regularizar",
    );
    expect(spy.mock.calls[0][0].body).toEqual({
      contaReceberIds: ["cr1", "cr2"],
    });
  });

  it("listDunningTemplatesApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listDunningTemplatesApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/financeiro/dunning/templates",
    );
  });

  it("updateDunningTemplateApi PUT", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await updateDunningTemplateApi({
      tenantId: "t1",
      evento: "E1",
      canal: "SMS",
      data: { assunto: "x" },
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/financeiro/dunning/templates/E1/SMS",
    );
    expect(spy.mock.calls[0][0].method).toBe("PUT");
  });
});

describe("api/fidelizacao", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listCampanhasFidelizacaoApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listCampanhasFidelizacaoApi({ tenantId: "t1", apenasAtivas: true });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/comercial/fidelizacao/campanhas",
    );
    expect(spy.mock.calls[0][0].query?.apenasAtivas).toBe(true);
  });

  it("createCampanhaFidelizacaoApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await createCampanhaFidelizacaoApi({
      tenantId: "t1",
      data: { nome: "C", pontosIndicacao: 10, pontosConversao: 20 },
    });
    expect(spy.mock.calls[0][0].method).toBe("POST");
  });

  it("updateCampanhaFidelizacaoApi PUT", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await updateCampanhaFidelizacaoApi({
      tenantId: "t1",
      id: "c1",
      data: { nome: "Edit" },
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/comercial/fidelizacao/campanhas/c1",
    );
    expect(spy.mock.calls[0][0].method).toBe("PUT");
  });

  it("listIndicacoesApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listIndicacoesApi({ tenantId: "t1", status: "PENDENTE" });
    expect(spy.mock.calls[0][0].query?.status).toBe("PENDENTE");
  });

  it("createIndicacaoApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await createIndicacaoApi({
      tenantId: "t1",
      data: {
        campanhaId: "c1",
        indicadorAlunoId: "a1",
        indicadoNome: "N",
      },
    });
    expect(spy.mock.calls[0][0].method).toBe("POST");
  });

  it("converterIndicacaoApi POST /converter", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await converterIndicacaoApi({
      tenantId: "t1",
      id: "i1",
      data: { alunoConvertidoId: "al1" },
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/comercial/fidelizacao/indicacoes/i1/converter",
    );
  });

  it("listSaldosFidelizacaoApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listSaldosFidelizacaoApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/comercial/fidelizacao/saldos",
    );
  });

  it("getSaldoDetalheFidelizacaoApi GET /{alunoId}", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await getSaldoDetalheFidelizacaoApi({ tenantId: "t1", alunoId: "a1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/comercial/fidelizacao/saldos/a1",
    );
  });

  it("resgatarPontosFidelizacaoApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await resgatarPontosFidelizacaoApi({
      tenantId: "t1",
      alunoId: "a1",
      data: { pontos: 100 },
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/comercial/fidelizacao/saldos/a1/resgates",
    );
    expect(spy.mock.calls[0][0].method).toBe("POST");
  });
});

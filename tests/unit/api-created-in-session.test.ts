/**
 * Testes para as API clients criadas nesta sessão "resolva tudo":
 * visitantes.ts, nfse.ts, integracoes-agregadores.ts, atendimento-ai.ts,
 * plus o sync/dashboard de conciliação bancária adicionado na sessão.
 *
 * Focam no shape do path + método + params. Normalizadores são cobertos
 * indiretamente pelos mocks de resposta.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import * as http from "@/lib/api/http";

import {
  listVisitantesAtivosApi,
  registrarVisitanteApi,
  registrarEntradaVisitanteApi,
  revogarVisitanteApi,
  validarAcessoVisitanteApi,
} from "@/lib/api/visitantes";
import {
  cancelarNfseSolicitacaoApi,
  getNfseResumoApi,
  listarNfseEventosApi,
  listarNfseSolicitacoesApi,
  retryNfseSolicitacaoApi,
} from "@/lib/api/nfse";
import {
  getStatusAgregadorApi,
  publicarClasseBookingApi,
  publicarSlotsBookingApi,
  reprocessarWebhookAgregadorApi,
  validarAcessoAgregadorApi,
} from "@/lib/api/integracoes-agregadores";
import {
  classificarIntencaoAiApi,
  proximaAcaoAiApi,
  resumirConversaAiApi,
  sugerirRespostaAiApi,
  sugerirRoteamentoAiApi,
} from "@/lib/api/atendimento-ai";
import {
  getConciliacaoDashboardApi,
  importarOfxConciliacaoApi,
} from "@/lib/api/conciliacao-bancaria";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api/visitantes (Task #541)", () => {
  it("listVisitantesAtivosApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listVisitantesAtivosApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/visitantes");
    expect(spy.mock.calls[0][0].query).toEqual({ tenantId: "t1" });
  });

  it("listVisitantesAtivosApi normaliza itens", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue([
      {
        id: "v1",
        tenantId: "t1",
        nome: "João",
        tipo: "DAY_USE",
        codigoAcesso: "ABC123",
        validoAte: "2026-04-11",
        maxEntradas: 1,
        entradasRealizadas: 0,
        revogado: false,
      },
    ] as never);
    const result = await listVisitantesAtivosApi({ tenantId: "t1" });
    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe("João");
    expect(result[0].tipo).toBe("DAY_USE");
  });

  it("listVisitantesAtivosApi trata resposta não-array", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue({ foo: "bar" } as never);
    const result = await listVisitantesAtivosApi({ tenantId: "t1" });
    expect(result).toEqual([]);
  });

  it("registrarVisitanteApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "v1",
      nome: "João",
      tipo: "DAY_USE",
      codigoAcesso: "ABC",
      maxEntradas: 1,
      entradasRealizadas: 0,
      revogado: false,
    } as never);
    await registrarVisitanteApi({
      tenantId: "t1",
      data: {
        nome: "João",
        tipo: "DAY_USE",
        validoAte: "2026-04-11T23:59:59Z",
      },
    });
    expect(spy.mock.calls[0][0].method).toBe("POST");
    expect(spy.mock.calls[0][0].query).toEqual({ tenantId: "t1" });
  });

  it("validarAcessoVisitanteApi POST /validar", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      valido: true,
      nome: "João",
    } as never);
    const res = await validarAcessoVisitanteApi({
      tenantId: "t1",
      codigoAcesso: "ABC",
    });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/visitantes/validar");
    expect(res.valido).toBe(true);
    expect(res.nome).toBe("João");
  });

  it("registrarEntradaVisitanteApi POST /entrada", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "v1",
      nome: "João",
      tipo: "DAY_USE",
      codigoAcesso: "ABC",
      maxEntradas: 1,
      entradasRealizadas: 1,
      revogado: false,
    } as never);
    await registrarEntradaVisitanteApi({
      tenantId: "t1",
      codigoAcesso: "ABC",
      deviceId: "CAT001",
    });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/visitantes/entrada");
    expect(spy.mock.calls[0][0].body).toEqual({
      codigoAcesso: "ABC",
      deviceId: "CAT001",
    });
  });

  it("revogarVisitanteApi DELETE /{id}", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await revogarVisitanteApi({ tenantId: "t1", visitanteId: "v1" });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/visitantes/v1");
    expect(spy.mock.calls[0][0].method).toBe("DELETE");
  });
});

describe("api/nfse (Task #543)", () => {
  it("listarNfseSolicitacoesApi GET com query completa", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listarNfseSolicitacoesApi({
      tenantId: "t1",
      unidadeId: "u1",
      status: "FALHA",
      tomadorCnpj: "00000",
      dataEmissaoInicio: "2026-04-01",
      dataEmissaoFim: "2026-04-30",
      page: 0,
      size: 50,
    });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/nfse/solicitacoes");
    expect(spy.mock.calls[0][0].query).toEqual({
      tenantId: "t1",
      unidadeId: "u1",
      status: "FALHA",
      tomadorCnpj: "00000",
      dataEmissaoInicio: "2026-04-01",
      dataEmissaoFim: "2026-04-30",
      page: 0,
      size: 50,
    });
  });

  it("listarNfseSolicitacoesApi aceita resposta não-array", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue(null as never);
    const result = await listarNfseSolicitacoesApi({
      tenantId: "t1",
      unidadeId: "u1",
    });
    expect(result).toEqual([]);
  });

  it("listarNfseEventosApi GET /{id}/eventos", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listarNfseEventosApi({
      tenantId: "t1",
      unidadeId: "u1",
      solicitacaoId: "s1",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/nfse/solicitacoes/s1/eventos",
    );
  });

  it("retryNfseSolicitacaoApi POST /{id}/retry", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await retryNfseSolicitacaoApi({
      tenantId: "t1",
      unidadeId: "u1",
      solicitacaoId: "s1",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/nfse/solicitacoes/s1/retry",
    );
    expect(spy.mock.calls[0][0].method).toBe("POST");
  });

  it("cancelarNfseSolicitacaoApi POST /{id}/cancelar com motivo no body", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await cancelarNfseSolicitacaoApi({
      tenantId: "t1",
      unidadeId: "u1",
      solicitacaoId: "s1",
      motivo: "erro de digitacao",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/nfse/solicitacoes/s1/cancelar",
    );
    expect(spy.mock.calls[0][0].body).toEqual({
      tenantId: "t1",
      unidadeId: "u1",
      motivo: "erro de digitacao",
    });
  });

  it("getNfseResumoApi GET /resumo com limite default 20", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await getNfseResumoApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/nfse/resumo");
    expect(spy.mock.calls[0][0].query).toEqual({
      tenantId: "t1",
      limiteFalhas: 20,
    });
  });

  it("getNfseResumoApi aceita limite custom", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await getNfseResumoApi({ tenantId: "t1", limiteFalhas: 5 });
    expect(spy.mock.calls[0][0].query?.limiteFalhas).toBe(5);
  });
});

describe("api/integracoes-agregadores (Task #547)", () => {
  it("validarAcessoAgregadorApi POST /{tipo}/validate", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await validarAcessoAgregadorApi({
      tipo: "WELLHUB",
      tenantId: "t1",
      externalUserId: "u1",
      externalGymId: "g1",
      trigger: "catraca",
      customCode: "CC",
      atributos: { foo: "bar" },
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/integracoes/agregadores/WELLHUB/validate",
    );
  });

  it("publicarClasseBookingApi POST /{tipo}/booking/classes/publicar", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await publicarClasseBookingApi({
      tipo: "GYMPASS",
      tenantId: "t1",
      atividadeGradeId: "ag1",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/integracoes/agregadores/GYMPASS/booking/classes/publicar",
    );
  });

  it("publicarSlotsBookingApi POST /{tipo}/booking/slots/publicar", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await publicarSlotsBookingApi({
      tipo: "TOTALPASS",
      tenantId: "t1",
      atividadeGradeId: "ag1",
      dataInicio: "2026-04-01",
      dataFim: "2026-04-30",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/integracoes/agregadores/TOTALPASS/booking/slots/publicar",
    );
  });

  it("reprocessarWebhookAgregadorApi POST /webhooks/{eventId}/reprocessar", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await reprocessarWebhookAgregadorApi({
      tipo: "WELLHUB",
      eventId: "evt-1",
      tenantId: "t1",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/integracoes/agregadores/WELLHUB/webhooks/evt-1/reprocessar",
    );
  });

  it("getStatusAgregadorApi GET /{tipo}/status", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await getStatusAgregadorApi({ tipo: "WELLHUB", tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/integracoes/agregadores/WELLHUB/status",
    );
  });
});

describe("api/atendimento-ai (Task #542)", () => {
  const base = (id: string) => `/api/v1/atendimento/conversas/${id}/ai`;

  it("resumirConversaAiApi POST /resumir", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await resumirConversaAiApi({ conversationId: "c1" });
    expect(spy.mock.calls[0][0].path).toBe(`${base("c1")}/resumir`);
    expect(spy.mock.calls[0][0].method).toBe("POST");
  });

  it("sugerirRespostaAiApi POST /sugerir-resposta", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await sugerirRespostaAiApi({
      conversationId: "c1",
      ultimaMensagem: "Olá",
    });
    expect(spy.mock.calls[0][0].path).toBe(`${base("c1")}/sugerir-resposta`);
    expect(spy.mock.calls[0][0].body).toEqual({ ultimaMensagem: "Olá" });
  });

  it("sugerirRespostaAiApi sem ultimaMensagem envia body undefined", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await sugerirRespostaAiApi({ conversationId: "c1" });
    expect(spy.mock.calls[0][0].body).toBeUndefined();
  });

  it("classificarIntencaoAiApi POST /classificar-intencao", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await classificarIntencaoAiApi({
      conversationId: "c1",
      mensagem: "Quero cancelar",
    });
    expect(spy.mock.calls[0][0].path).toBe(`${base("c1")}/classificar-intencao`);
    expect(spy.mock.calls[0][0].body).toEqual({ mensagem: "Quero cancelar" });
  });

  it("proximaAcaoAiApi POST /proxima-acao", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await proximaAcaoAiApi({ conversationId: "c1" });
    expect(spy.mock.calls[0][0].path).toBe(`${base("c1")}/proxima-acao`);
  });

  it("sugerirRoteamentoAiApi POST /sugerir-roteamento", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await sugerirRoteamentoAiApi({ conversationId: "c1" });
    expect(spy.mock.calls[0][0].path).toBe(`${base("c1")}/sugerir-roteamento`);
  });
});

describe("api/conciliacao-bancaria (Task #548 additions)", () => {
  it("getConciliacaoDashboardApi GET /dashboard", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await getConciliacaoDashboardApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/conciliacao-bancaria/dashboard",
    );
    expect(spy.mock.calls[0][0].query).toEqual({ tenantId: "t1" });
  });

  it("importarOfxConciliacaoApi POST com FormData", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    const file = new File(["<OFX/>"], "extrato.ofx", { type: "text/plain" });
    await importarOfxConciliacaoApi({
      tenantId: "t1",
      contaBancariaId: "cb1",
      arquivo: file,
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/conciliacao-bancaria/importar-ofx",
    );
    expect(spy.mock.calls[0][0].method).toBe("POST");
    expect(spy.mock.calls[0][0].body).toBeInstanceOf(FormData);
    expect(spy.mock.calls[0][0].query).toEqual({
      tenantId: "t1",
      contaBancariaId: "cb1",
    });
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createNpsCampanhaApi,
  dispararNpsCampanhaApi,
  getNpsDashboardApi,
  listNpsCampanhasApi,
  listNpsEnviosApi,
  responderNpsEnvioApi,
  updateNpsCampanhaApi,
} from "@/lib/api/nps";
import {
  cancelarCobrancaPixApi,
  consultarCobrancaPixApi,
  criarCobrancaPixApi,
  devolucaoPixApi,
} from "@/lib/api/pix";
import {
  cancelarContaReceberApi,
  createContaReceberApi,
  listContasReceberApi,
  receberContaReceberApi,
  updateContaReceberApi,
} from "@/lib/api/contas-receber";
import * as http from "@/lib/api/http";

describe("api/nps", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listNpsCampanhasApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listNpsCampanhasApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/retencao/nps/campanhas");
  });

  it("createNpsCampanhaApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await createNpsCampanhaApi({
      tenantId: "t1",
      data: { nome: "C", tipo: "NPS", pergunta: "?" },
    });
    expect(spy.mock.calls[0][0].method).toBe("POST");
  });

  it("updateNpsCampanhaApi PUT", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await updateNpsCampanhaApi({
      tenantId: "t1",
      campanhaId: "c1",
      data: { nome: "E", tipo: "NPS", pergunta: "?" },
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/retencao/nps/campanhas/c1",
    );
    expect(spy.mock.calls[0][0].method).toBe("PUT");
  });

  it("dispararNpsCampanhaApi POST com body", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await dispararNpsCampanhaApi({
      tenantId: "t1",
      campanhaId: "c1",
      alunoIds: ["a1"],
      canais: ["EMAIL"],
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/retencao/nps/campanhas/c1/disparar",
    );
    expect(spy.mock.calls[0][0].body).toEqual({
      alunoIds: ["a1"],
      canais: ["EMAIL"],
    });
  });

  it("dispararNpsCampanhaApi sem body opcionais", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await dispararNpsCampanhaApi({
      tenantId: "t1",
      campanhaId: "c1",
    });
    expect(spy.mock.calls[0][0].body).toEqual({});
  });

  it("getNpsDashboardApi GET com período", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await getNpsDashboardApi({
      tenantId: "t1",
      inicio: "2026-04-01",
      fim: "2026-04-30",
    });
    expect(spy.mock.calls[0][0].query).toMatchObject({
      inicio: "2026-04-01",
      fim: "2026-04-30",
    });
  });

  it("listNpsEnviosApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listNpsEnviosApi({ tenantId: "t1", status: "RESPONDIDA" });
    expect(spy.mock.calls[0][0].query?.status).toBe("RESPONDIDA");
  });

  it("responderNpsEnvioApi POST /responder", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await responderNpsEnvioApi({
      tokenResposta: "tok-1",
      nota: 9,
      comentario: "Ótimo",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/retencao/nps/envios/tok-1/responder",
    );
    expect(spy.mock.calls[0][0].body).toEqual({ nota: 9, comentario: "Ótimo" });
  });

  it("responderNpsEnvioApi sem comentario/origem", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await responderNpsEnvioApi({ tokenResposta: "tok-1", nota: 5 });
    expect(spy.mock.calls[0][0].body).toEqual({ nota: 5 });
  });
});

describe("api/pix", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("criarCobrancaPixApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await criarCobrancaPixApi({
      tenantId: "t1",
      alunoId: "a1",
      valor: 100,
      descricao: "Cob",
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/integracoes/pix/cobrancas",
    );
    expect(spy.mock.calls[0][0].body).toMatchObject({
      alunoId: "a1",
      valor: 100,
    });
  });

  it("consultarCobrancaPixApi GET /{txId}", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await consultarCobrancaPixApi({ txId: "tx1", tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/integracoes/pix/cobrancas/tx1",
    );
    expect(spy.mock.calls[0][0].method).toBe("GET");
  });

  it("cancelarCobrancaPixApi DELETE", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await cancelarCobrancaPixApi({ txId: "tx1", tenantId: "t1" });
    expect(spy.mock.calls[0][0].method).toBe("DELETE");
  });

  it("devolucaoPixApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await devolucaoPixApi({
      tenantId: "t1",
      endToEndId: "e2e",
      valor: 50,
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/integracoes/pix/devolucao",
    );
    expect(spy.mock.calls[0][0].body).toEqual({
      endToEndId: "e2e",
      valor: 50,
    });
  });
});

describe("api/contas-receber", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listContasReceberApi normaliza números", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([
      {
        id: "cr1",
        tenantId: "t1",
        cliente: "Cli",
        descricao: "D",
        categoria: "MENSALIDADE",
        competencia: "2026-04",
        dataVencimento: "2026-04-10",
        valorOriginal: "100.50",
        desconto: "10",
        jurosMulta: "5",
        valorRecebido: null,
        status: "PENDENTE",
        geradaAutomaticamente: false,
        dataCriacao: "2026-04-01",
      },
    ] as never);
    const result = await listContasReceberApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/contas-receber",
    );
    expect(result[0].valorOriginal).toBe(100.5);
    expect(result[0].desconto).toBe(10);
    expect(result[0].valorRecebido).toBeNull();
  });

  it("createContaReceberApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "cr1",
      valorOriginal: 100,
      desconto: 0,
      jurosMulta: 0,
    } as never);
    const result = await createContaReceberApi({
      tenantId: "t1",
      data: {
        cliente: "C",
        descricao: "D",
        competencia: "2026-04",
        dataVencimento: "2026-04-10",
        valorOriginal: 100,
      },
    });
    expect(spy.mock.calls[0][0].method).toBe("POST");
    expect(result?.valorOriginal).toBe(100);
  });

  it("createContaReceberApi retorna null quando response null", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue(null as never);
    const result = await createContaReceberApi({
      tenantId: "t1",
      data: {
        cliente: "C",
        descricao: "D",
        competencia: "2026-04",
        dataVencimento: "2026-04-10",
        valorOriginal: 100,
      },
    });
    expect(result).toBeNull();
  });

  it("updateContaReceberApi PUT /{id}", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "cr1",
      valorOriginal: 100,
      desconto: 0,
      jurosMulta: 0,
    } as never);
    await updateContaReceberApi({
      tenantId: "t1",
      id: "cr1",
      data: { descricao: "Edit" },
    });
    expect(spy.mock.calls[0][0].method).toBe("PUT");
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/contas-receber/cr1",
    );
  });

  it("receberContaReceberApi PATCH /receber", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "cr1",
      valorOriginal: 100,
      desconto: 0,
      jurosMulta: 0,
    } as never);
    await receberContaReceberApi({
      tenantId: "t1",
      id: "cr1",
      data: { dataRecebimento: "2026-04-10", formaPagamento: "PIX" },
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/contas-receber/cr1/receber",
    );
    expect(spy.mock.calls[0][0].method).toBe("PATCH");
  });

  it("cancelarContaReceberApi PATCH /cancelar com observacoes", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "cr1",
      valorOriginal: 100,
      desconto: 0,
      jurosMulta: 0,
    } as never);
    await cancelarContaReceberApi({
      tenantId: "t1",
      id: "cr1",
      observacoes: "motivo",
    });
    expect(spy.mock.calls[0][0].body).toEqual({ observacoes: "motivo" });
  });

  it("cancelarContaReceberApi PATCH sem observacoes → body undefined", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "cr1",
      valorOriginal: 100,
      desconto: 0,
      jurosMulta: 0,
    } as never);
    await cancelarContaReceberApi({ tenantId: "t1", id: "cr1" });
    expect(spy.mock.calls[0][0].body).toBeUndefined();
  });
});

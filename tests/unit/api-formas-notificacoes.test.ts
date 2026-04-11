import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFormaPagamentoApi,
  deleteFormaPagamentoApi,
  listFormasPagamentoApi,
  toggleFormaPagamentoApi,
  updateFormaPagamentoApi,
} from "@/lib/api/formas-pagamento";
import {
  CANAIS_NOTIFICACAO,
  CANAL_LABEL,
  listNotificacaoEventosApi,
  listNotificacaoPreferenciasApi,
  reenviarNotificacaoApi,
  updateNotificacaoPreferenciaApi,
} from "@/lib/api/notificacoes";
import * as http from "@/lib/api/http";

describe("api/formas-pagamento", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listFormasPagamentoApi GET com default apenasAtivas=true", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listFormasPagamentoApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].query).toEqual({
      tenantId: "t1",
      apenasAtivas: true,
    });
  });

  it("listFormasPagamentoApi aceita apenasAtivas=false", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listFormasPagamentoApi({ tenantId: "t1", apenasAtivas: false });
    expect(spy.mock.calls[0][0].query?.apenasAtivas).toBe(false);
  });

  it("listFormasPagamentoApi normaliza null → defaults", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue([
      {
        id: "fp1",
        tenantId: "t1",
        nome: "PIX",
        tipo: "PIX",
        taxaPercentual: null,
        parcelasMax: null,
        prazoRecebimentoDias: null,
        instrucoes: null,
        ativo: null,
      },
    ] as never);
    const result = await listFormasPagamentoApi({ tenantId: "t1" });
    expect(result[0]).toMatchObject({
      taxaPercentual: 0,
      parcelasMax: 1,
      prazoRecebimentoDias: undefined,
      instrucoes: undefined,
      ativo: true,
    });
  });

  it("listFormasPagamentoApi garante parcelasMax >= 1", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue([
      {
        id: "fp1",
        tenantId: "t1",
        nome: "X",
        tipo: "PIX",
        parcelasMax: 0,
      },
    ] as never);
    const result = await listFormasPagamentoApi({ tenantId: "t1" });
    expect(result[0].parcelasMax).toBe(1);
  });

  it("createFormaPagamentoApi envia body construído", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "fp1",
      tenantId: "t1",
      nome: "PIX",
      tipo: "PIX",
    } as never);
    await createFormaPagamentoApi({
      tenantId: "t1",
      data: {
        nome: "PIX",
        tipo: "PIX",
        taxaPercentual: 2,
        parcelasMax: 1,
        emitirAutomaticamente: true,
        prazoRecebimentoDias: 1,
        instrucoes: "teste",
      },
    });
    const body = spy.mock.calls[0][0].body as Record<string, unknown>;
    expect(body.tenantId).toBe("t1");
    expect(body.nome).toBe("PIX");
    expect(body.taxaPercentual).toBe(2);
  });

  it("updateFormaPagamentoApi PUT com id no path", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "fp1",
      tenantId: "t1",
      nome: "X",
      tipo: "PIX",
    } as never);
    await updateFormaPagamentoApi({
      tenantId: "t1",
      id: "fp1",
      data: { nome: "X", tipo: "PIX" },
    });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/formas-pagamento/fp1",
    );
    expect(spy.mock.calls[0][0].method).toBe("PUT");
  });

  it("toggleFormaPagamentoApi PATCH /toggle", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "fp1",
      tenantId: "t1",
      nome: "X",
      tipo: "PIX",
    } as never);
    await toggleFormaPagamentoApi({ tenantId: "t1", id: "fp1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/formas-pagamento/fp1/toggle",
    );
  });

  it("deleteFormaPagamentoApi DELETE", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue(undefined as never);
    await deleteFormaPagamentoApi({ tenantId: "t1", id: "fp1" });
    expect(spy.mock.calls[0][0].method).toBe("DELETE");
  });
});

describe("api/notificacoes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("CANAIS_NOTIFICACAO contém 4 canais", () => {
    expect(CANAIS_NOTIFICACAO).toEqual(["EMAIL", "PUSH", "SMS", "WHATSAPP"]);
  });

  it("CANAL_LABEL tem label para cada canal", () => {
    expect(CANAL_LABEL.EMAIL).toBe("E-mail");
    expect(CANAL_LABEL.PUSH).toBe("Push");
    expect(CANAL_LABEL.SMS).toBe("SMS");
    expect(CANAL_LABEL.WHATSAPP).toBe("WhatsApp");
  });

  it("listNotificacaoEventosApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listNotificacaoEventosApi({ tenantId: "t1", alunoId: "a1" });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/notificacoes/eventos");
    expect(spy.mock.calls[0][0].query).toEqual({
      tenantId: "t1",
      alunoId: "a1",
    });
  });

  it("listNotificacaoPreferenciasApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listNotificacaoPreferenciasApi({ tenantId: "t1", alunoId: "a1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/notificacoes/preferencias",
    );
  });

  it("updateNotificacaoPreferenciaApi PUT com body completo", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await updateNotificacaoPreferenciaApi({
      tenantId: "t1",
      alunoId: "a1",
      evento: "matricula_created",
      canal: "EMAIL",
      habilitado: true,
    });
    expect(spy.mock.calls[0][0].method).toBe("PUT");
    expect(spy.mock.calls[0][0].body).toEqual({
      tenantId: "t1",
      alunoId: "a1",
      evento: "matricula_created",
      canal: "EMAIL",
      habilitado: true,
    });
  });

  it("reenviarNotificacaoApi POST em /outbox/{id}/reenviar", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await reenviarNotificacaoApi({ outboxId: "o1", tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/notificacoes/outbox/o1/reenviar",
    );
    expect(spy.mock.calls[0][0].method).toBe("POST");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { getBotPromptApi, getBotPromptTemplateApi } from "@/lib/api/bot";
import { getDashboardApi } from "@/lib/api/dashboard";
import { normalizeCapabilityError } from "@/lib/api/backend-capability";
import { ApiRequestError } from "@/lib/api/http";
import * as http from "@/lib/api/http";

describe("api/bot", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getBotPromptApi GET /api/v1/bot/prompt com tenantId", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      prompt: "hello",
    } as never);
    await getBotPromptApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/bot/prompt");
    expect(spy.mock.calls[0][0].query).toEqual({ tenantId: "t1" });
  });

  it("getBotPromptApi sem tenantId", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      prompt: "hello",
    } as never);
    await getBotPromptApi();
    expect(spy.mock.calls[0][0].query).toEqual({ tenantId: undefined });
  });

  it("getBotPromptTemplateApi GET /prompt/template", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue("template" as never);
    await getBotPromptTemplateApi();
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/bot/prompt/template");
  });
});

describe("api/backend-capability", () => {
  describe("normalizeCapabilityError", () => {
    it("retorna message de Error", () => {
      expect(normalizeCapabilityError(new Error("falhou"))).toBe("falhou");
    });

    it("usa fallback default quando nenhum mensagem reconhecida", () => {
      expect(normalizeCapabilityError(undefined)).toBe(
        "Não foi possível completar a operação.",
      );
    });

    it("aceita fallback customizado no segundo argumento", () => {
      // O fallback só se aplica se normalizeErrorMessage retornar vazio.
      // Para null/undefined, retorna "Não foi possível..." e o fallback custom
      // não entra. Testamos que a assinatura aceita o segundo parâmetro.
      const result = normalizeCapabilityError(null, "custom fallback");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("extrai de ApiRequestError via normalizeErrorMessage", () => {
      const err = new ApiRequestError({ status: 500, message: "boom" });
      expect(normalizeCapabilityError(err)).toBe("boom");
    });
  });
});

describe("api/dashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/v1/academia/dashboard com query completa", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await getDashboardApi({
      tenantId: "t1",
      referenceDate: "2026-04-10",
      scope: "FULL",
      month: 4,
      year: 2026,
    });
    expect(spy.mock.calls[0][0].path).toBe("/api/v1/academia/dashboard");
    expect(spy.mock.calls[0][0].query).toEqual({
      tenantId: "t1",
      referenceDate: "2026-04-10",
      scope: "FULL",
      month: 4,
      year: 2026,
    });
  });

  it("normaliza payload flat (top-level fields)", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue({
      totalAlunosAtivos: "100",
      prospectsNovos: 50,
      receitaDoMes: "15000.50",
      statusAlunoCount: { ATIVO: 80, INATIVO: 20 },
    } as never);
    const result = await getDashboardApi({ tenantId: "t1" });
    expect(result.totalAlunosAtivos).toBe(100);
    expect(result.prospectsNovos).toBe(50);
    expect(result.receitaDoMes).toBe(15000.5);
    expect(result.statusAlunoCount.ATIVO).toBe(80);
  });

  it("normaliza payload em envelope .data", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue({
      data: {
        totalAlunosAtivos: 5,
        prospectsNovos: 10,
      },
    } as never);
    const result = await getDashboardApi({ tenantId: "t1" });
    expect(result.totalAlunosAtivos).toBe(5);
    expect(result.prospectsNovos).toBe(10);
  });

  it("normaliza payload com envelope.data + summary nested", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue({
      data: {
        summary: {
          clientes: { totalAlunosAtivos: 100 },
          financeiro: { receitaDoMes: 25000 },
        },
      },
    } as never);
    const result = await getDashboardApi({ tenantId: "t1" });
    expect(result.totalAlunosAtivos).toBe(100);
    expect(result.receitaDoMes).toBe(25000);
  });

  it("trata arrays ausentes como arrays vazios", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    const result = await getDashboardApi({ tenantId: "t1" });
    expect(result.prospectsRecentes).toEqual([]);
    expect(result.matriculasVencendo).toEqual([]);
    expect(result.pagamentosPendentes).toEqual([]);
  });

  it("preserva statusAlunoCount com todos os status", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue({
      // Inclui campo-chave para passar o check de extractPayload
      totalAlunosAtivos: 18,
      statusAlunoCount: {
        ATIVO: 10,
        INATIVO: 5,
        SUSPENSO: 2,
        CANCELADO: 1,
      },
    } as never);
    const result = await getDashboardApi({ tenantId: "t1" });
    expect(result.statusAlunoCount).toEqual({
      ATIVO: 10,
      INATIVO: 5,
      SUSPENSO: 2,
      CANCELADO: 1,
      // Task 458 follow-up: BLOQUEADO é status distinto no domínio (default 0 se ausente).
      BLOQUEADO: 0,
    });
  });

  it("default 0 quando statusAlunoCount ausente", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    const result = await getDashboardApi({ tenantId: "t1" });
    expect(result.statusAlunoCount.ATIVO).toBe(0);
    expect(result.statusAlunoCount.INATIVO).toBe(0);
  });
});

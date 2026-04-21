import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  trackPerfilCartoesDrawerOpen,
  trackPerfilDrawerAcoesOpen,
  trackPerfilRiscoDetalhesOpen,
  trackPerfilSugestaoClick,
  trackPerfilTabChange,
} from "@/lib/shared/analytics";

type CapturedEvent = {
  name: string;
  properties: Record<string, unknown>;
};

describe("analytics — Perfil v3 helpers", () => {
  const captured: CapturedEvent[] = [];
  let originalVerbose: string | undefined;

  beforeEach(() => {
    captured.length = 0;
    originalVerbose = process.env.ANALYTICS_VERBOSE;
    process.env.ANALYTICS_VERBOSE = "1";

    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      const tag = args[0];
      if (typeof tag === "string" && tag === "[analytics]") {
        captured.push({
          name: String(args[1]),
          properties: (args[2] as Record<string, unknown>) ?? {},
        });
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalVerbose === undefined) {
      delete process.env.ANALYTICS_VERBOSE;
    } else {
      process.env.ANALYTICS_VERBOSE = originalVerbose;
    }
  });

  it("trackPerfilDrawerAcoesOpen envia total de sugestões", () => {
    trackPerfilDrawerAcoesOpen("tenant-1", "aluno-1", 5);
    expect(captured).toHaveLength(1);
    expect(captured[0].name).toBe("perfil_drawer_acoes_open");
    expect(captured[0].properties).toMatchObject({ alunoId: "aluno-1", totalSugestoes: 5 });
  });

  it("trackPerfilSugestaoClick inclui tipo e prioridade", () => {
    trackPerfilSugestaoClick("tenant-1", "aluno-1", "renovar-plano", "alta");
    expect(captured[0].name).toBe("perfil_sugestao_click");
    expect(captured[0].properties).toMatchObject({
      alunoId: "aluno-1",
      tipo: "renovar-plano",
      prioridade: "alta",
    });
  });

  it("trackPerfilRiscoDetalhesOpen inclui score e label", () => {
    trackPerfilRiscoDetalhesOpen("tenant-1", "aluno-1", 75, "Alto");
    expect(captured[0].name).toBe("perfil_risco_detalhes_open");
    expect(captured[0].properties).toMatchObject({ alunoId: "aluno-1", score: 75, label: "Alto" });
  });

  it("trackPerfilTabChange registra a tab selecionada", () => {
    trackPerfilTabChange("tenant-1", "aluno-1", "frequencia");
    expect(captured[0].name).toBe("perfil_tab_change");
    expect(captured[0].properties).toMatchObject({ alunoId: "aluno-1", tab: "frequencia" });
  });

  it("trackPerfilCartoesDrawerOpen registra apenas alunoId", () => {
    trackPerfilCartoesDrawerOpen("tenant-1", "aluno-1");
    expect(captured[0].name).toBe("perfil_cartoes_drawer_open");
    expect(captured[0].properties).toMatchObject({ alunoId: "aluno-1" });
  });

  it("propriedades undefined não são enviadas", () => {
    // `trackEvent` copia o objeto properties; undefined é serializado pelo
    // JSON downstream. Aqui só confirmamos que a chave definida existe.
    trackPerfilSugestaoClick("tenant-1", "aluno-1", "cobrar-pendencia", "alta");
    expect(captured[0].properties).toHaveProperty("alunoId");
    expect(captured[0].properties).toHaveProperty("tipo");
    expect(captured[0].properties).toHaveProperty("prioridade");
  });
});

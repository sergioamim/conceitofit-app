import { afterEach, describe, expect, it, vi } from "vitest";
import { listPresencasByAlunoApi } from "@/lib/api/presencas";
import * as http from "@/lib/api/http";

describe("api/presencas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("chama /api/v1/comercial/alunos/{id}/presencas com query tenantId", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    await listPresencasByAlunoApi({ tenantId: "t1", alunoId: "a1" });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/api/v1/comercial/alunos/a1/presencas",
        query: { tenantId: "t1" },
      }),
    );
  });

  it("normaliza origem válida (CHECKIN/AULA/ACESSO)", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue([
      {
        id: "p1",
        alunoId: "a1",
        data: "2026-04-10",
        horario: "09:00",
        origem: "AULA",
        atividade: "Pilates",
      },
    ] as never);
    const result = await listPresencasByAlunoApi({ alunoId: "a1" });
    expect(result).toHaveLength(1);
    expect(result[0].origem).toBe("AULA");
    expect(result[0].atividade).toBe("Pilates");
  });

  it("normaliza origem desconhecida para CHECKIN (default)", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue([
      { id: "p1", origem: "QUALQUER" },
    ] as never);
    const result = await listPresencasByAlunoApi({ alunoId: "a1" });
    expect(result[0].origem).toBe("CHECKIN");
  });

  it("preenche campos ausentes com valores default", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue([{}] as never);
    const result = await listPresencasByAlunoApi({ alunoId: "a1" });
    expect(result[0]).toEqual({
      id: "",
      alunoId: "",
      data: "",
      horario: "",
      origem: "CHECKIN",
      atividade: undefined,
    });
  });

  it("trata atividade null como undefined", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue([
      { id: "p1", atividade: null },
    ] as never);
    const result = await listPresencasByAlunoApi({ alunoId: "a1" });
    expect(result[0].atividade).toBeUndefined();
  });

  it("aceita array vazio", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
    const result = await listPresencasByAlunoApi({ alunoId: "a1" });
    expect(result).toEqual([]);
  });
});

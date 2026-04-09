import { expect, test } from "@playwright/test";
import {
  calculateDaysSinceLogin,
  classifyAcademiaHealth,
  normalizeAcademiaHealthStatus,
} from "../../src/backoffice/lib/admin-health";

test.describe("admin health helpers", () => {
  test("classifica academia com poucos alunos como crítica", () => {
    expect(
      classifyAcademiaHealth({
        alunosAtivos: 8,
        inadimplenciaPercentual: 5,
      })
    ).toBe("CRITICO");
  });

  test("classifica academia em risco pela faixa intermediária de alunos", () => {
    expect(
      classifyAcademiaHealth({
        alunosAtivos: 35,
        inadimplenciaPercentual: 8,
      })
    ).toBe("RISCO");
  });

  test("classifica academia saudável quando supera base e inadimplência alvo", () => {
    expect(
      classifyAcademiaHealth({
        alunosAtivos: 120,
        inadimplenciaPercentual: 4.2,
      })
    ).toBe("SAUDAVEL");
  });

  test("normaliza status preenchendo dias sem login e alertas", () => {
    const status = normalizeAcademiaHealthStatus({
      academiaId: "acd-1",
      academiaNome: "Rede Centro",
      unidades: 3,
      alunosAtivos: 9,
      churnMensal: 12,
      inadimplenciaPercentual: 21,
      ultimoLoginAdmin: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      statusContrato: "EM_RISCO",
      planoContratado: "Growth",
      alertasRisco: [],
      healthLevel: "SAUDAVEL",
    });

    expect(status.healthLevel).toBe("CRITICO");
    expect(status.diasSemLoginAdmin).toBeGreaterThanOrEqual(35);
    expect(status.alertasRisco).toEqual(
      expect.arrayContaining([
        "Base de alunos abaixo de 10 ativos.",
        "Inadimplência acima de 20%.",
        "Admin sem login há 30 dias ou mais.",
      ])
    );
  });

  test("calcula dias desde login quando data é válida", () => {
    const days = calculateDaysSinceLogin(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());
    expect(days).toBeGreaterThanOrEqual(5);
  });
});

import { expect, test } from "@playwright/test";
import {
  calculateDaysSinceLogin,
  classifyAcademiaHealth,
  filterAcademiasHealthMap,
  normalizeAcademiaHealthStatus,
} from "../../src/lib/admin-health";

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

  test("filtra por saúde e plano contratado", () => {
    const items = [
      {
        academiaId: "1",
        academiaNome: "Rede A",
        unidades: 2,
        alunosAtivos: 8,
        churnMensal: 10,
        inadimplenciaPercentual: 24,
        statusContrato: "ATIVO" as const,
        planoContratado: "Pro",
        alertasRisco: [],
        healthLevel: "CRITICO" as const,
      },
      {
        academiaId: "2",
        academiaNome: "Rede B",
        unidades: 5,
        alunosAtivos: 120,
        churnMensal: 4,
        inadimplenciaPercentual: 6,
        statusContrato: "ATIVO" as const,
        planoContratado: "Enterprise",
        alertasRisco: [],
        healthLevel: "SAUDAVEL" as const,
      },
    ];

    expect(
      filterAcademiasHealthMap(items, { healthLevel: "CRITICO", planoContratado: "" }).map((item) => item.academiaNome)
    ).toEqual(["Rede A"]);

    expect(
      filterAcademiasHealthMap(items, { healthLevel: "TODOS", planoContratado: "Enterprise" }).map((item) => item.academiaNome)
    ).toEqual(["Rede B"]);
  });

  test("calcula dias desde login quando data é válida", () => {
    const days = calculateDaysSinceLogin(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());
    expect(days).toBeGreaterThanOrEqual(5);
  });
});

import { expect, test } from "@playwright/test";
import {
  formatSignedPercent,
  sortDistribuicaoAcademias,
  toggleSortState,
  type OperacionalSortState,
} from "../../src/lib/backoffice/admin-metrics";

const rows = [
  {
    academiaId: "acd-1",
    academiaNome: "Rede Leste",
    unidades: 3,
    alunosAtivos: 160,
    matriculasAtivas: 140,
    vendasMesQuantidade: 25,
    vendasMesValor: 22500,
    ticketMedio: 900,
  },
  {
    academiaId: "acd-2",
    academiaNome: "Rede Centro",
    unidades: 5,
    alunosAtivos: 210,
    matriculasAtivas: 180,
    vendasMesQuantidade: 18,
    vendasMesValor: 18900,
    ticketMedio: 1050,
  },
];

test.describe("admin metrics helpers", () => {
  test("ordena colunas numéricas em ordem decrescente por padrão operacional", () => {
    const sorted = sortDistribuicaoAcademias(rows, {
      key: "vendasMesValor",
      direction: "desc",
    });

    expect(sorted.map((item) => item.academiaNome)).toEqual(["Rede Leste", "Rede Centro"]);
  });

  test("ordena academia em ordem alfabética crescente", () => {
    const sorted = sortDistribuicaoAcademias(rows, {
      key: "academiaNome",
      direction: "asc",
    });

    expect(sorted.map((item) => item.academiaNome)).toEqual(["Rede Centro", "Rede Leste"]);
  });

  test("alterna direção e usa ordem inicial coerente por coluna", () => {
    const current: OperacionalSortState = {
      key: "vendasMesValor",
      direction: "desc",
    };

    expect(toggleSortState(current, "vendasMesValor")).toEqual({
      key: "vendasMesValor",
      direction: "asc",
    });

    expect(toggleSortState(current, "academiaNome")).toEqual({
      key: "academiaNome",
      direction: "asc",
    });
  });

  test("formata crescimento com sinal explícito", () => {
    expect(formatSignedPercent(12.35)).toBe("+12,4%");
    expect(formatSignedPercent(-8.1)).toBe("-8,1%");
  });
});

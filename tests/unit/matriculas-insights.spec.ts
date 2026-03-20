import { expect, test } from "@playwright/test";
import {
  buildMatriculasMonthlySnapshot,
  formatDateLabel,
  formatMonthLabel,
} from "../../src/lib/comercial/matriculas-insights";
import type { Matricula } from "../../src/lib/types";

function makeMatricula(
  partial: Partial<Matricula & { plano?: { nome?: string }; aluno?: { nome?: string } }>
): Matricula & { plano?: { nome?: string }; aluno?: { nome?: string } } {
  return {
    id: partial.id ?? "mat-1",
    tenantId: "tenant-1",
    alunoId: "aluno-1",
    planoId: "plano-1",
    dataInicio: partial.dataInicio ?? "2026-03-01",
    dataFim: partial.dataFim ?? "2026-04-01",
    valorPago: partial.valorPago ?? 100,
    valorMatricula: partial.valorMatricula ?? 0,
    desconto: partial.desconto ?? 0,
    formaPagamento: partial.formaPagamento ?? "PIX",
    status: partial.status ?? "ATIVA",
    renovacaoAutomatica: partial.renovacaoAutomatica ?? false,
    dataCriacao: partial.dataCriacao ?? "2026-03-01T10:00:00",
    contratoStatus: partial.contratoStatus,
    pagamento: partial.pagamento,
    plano: partial.plano,
    aluno: partial.aluno,
  };
}

test.describe("matriculas insights", () => {
  test("gera resumo do mes atual e agrupa carteira ativa por plano", () => {
    const rows = [
      makeMatricula({
        id: "mat-1",
        plano: { nome: "Black" },
        valorPago: 200,
        dataCriacao: "2026-03-10T09:00:00",
        aluno: { nome: "Ana" },
      }),
      makeMatricula({
        id: "mat-2",
        plano: { nome: "Black" },
        valorPago: 180,
        dataCriacao: "2026-03-08T09:00:00",
        aluno: { nome: "Bruno" },
        contratoStatus: "PENDENTE_ASSINATURA",
      }),
      makeMatricula({
        id: "mat-3",
        plano: { nome: "Fit" },
        valorPago: 90,
        dataCriacao: "2026-03-05T09:00:00",
        status: "CANCELADA",
        aluno: { nome: "Carla" },
      }),
      makeMatricula({
        id: "mat-4",
        plano: { nome: "Black" },
        valorPago: 300,
        dataCriacao: "2026-02-25T09:00:00",
      }),
    ];

    const snapshot = buildMatriculasMonthlySnapshot(rows, "2026-03");

    expect(snapshot.totalContracts).toBe(3);
    expect(snapshot.activeContracts).toBe(2);
    expect(snapshot.pendingSignature).toBe(1);
    expect(snapshot.contractedRevenue).toBe(470);
    expect(snapshot.averageTicket).toBeCloseTo(470 / 3, 5);
    expect(snapshot.monthRows.map((item) => item.id)).toEqual(["mat-1", "mat-2", "mat-3"]);
    expect(snapshot.activeGroups[0]).toEqual(
      expect.objectContaining({
        label: "Black",
        count: 2,
        percentage: 100,
      })
    );
    expect(snapshot.insight).toBe("1 contrato(s) aguardam assinatura neste mes.");
  });

  test("formata datas e mes sem depender de locale do navegador", () => {
    expect(formatDateLabel("2026-03-19")).toBe("19/03/2026");
    expect(formatMonthLabel("2026-03")).toBe("marco");
  });
});

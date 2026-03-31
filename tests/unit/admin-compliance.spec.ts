import { expect, test } from "@playwright/test";
import {
  applyComplianceDashboardDefaults,
  buildComplianceExposureSummary,
  countComplianceDataPoints,
  normalizeComplianceTermsStatus,
  normalizeSolicitacaoExclusaoStatus,
} from "../../src/lib/backoffice/admin-compliance";

test.describe("admin compliance helpers", () => {
  test("calcula total agregado de dados pessoais por academia", () => {
    expect(
      countComplianceDataPoints([
        {
          academiaId: "acd-1",
          academiaNome: "Rede Norte",
          totalAlunos: 40,
          alunosComCpf: 38,
          alunosComEmail: 40,
          alunosComTelefone: 35,
          termosAceitos: 32,
          termosPendentes: 8,
          statusTermos: "PARCIAL",
          camposSensiveis: ["cpf", "email"],
        },
        {
          academiaId: "acd-2",
          academiaNome: "Rede Sul",
          totalAlunos: 20,
          alunosComCpf: 15,
          alunosComEmail: 18,
          alunosComTelefone: 12,
          termosAceitos: 20,
          termosPendentes: 0,
          statusTermos: "ACEITO",
          camposSensiveis: ["telefone"],
        },
      ])
    ).toBe(158);
  });

  test("resume exposição dos campos sensíveis por academia", () => {
    const exposicao = buildComplianceExposureSummary([
      {
        academiaId: "acd-1",
        academiaNome: "Rede Norte",
        totalAlunos: 40,
        alunosComCpf: 38,
        alunosComEmail: 40,
        alunosComTelefone: 35,
        termosAceitos: 32,
        termosPendentes: 8,
        statusTermos: "PARCIAL",
        camposSensiveis: ["cpf", "email", "telefone"],
      },
      {
        academiaId: "acd-2",
        academiaNome: "Rede Sul",
        totalAlunos: 20,
        alunosComCpf: 15,
        alunosComEmail: 18,
        alunosComTelefone: 12,
        termosAceitos: 20,
        termosPendentes: 0,
        statusTermos: "ACEITO",
        camposSensiveis: ["email"],
      },
    ]);

    expect(exposicao[0]).toEqual({
      key: "email",
      label: "E-mail",
      totalAcademias: 2,
      academias: ["Rede Norte", "Rede Sul"],
    });
  });

  test("preenche defaults do dashboard e normaliza status de termos", () => {
    const dashboard = applyComplianceDashboardDefaults({
      totalDadosPessoaisArmazenados: 0,
      solicitacoesExclusaoPendentes: 0,
      termosAceitos: 18,
      termosPendentes: 2,
      academias: [
        {
          academiaId: "acd-1",
          academiaNome: "Rede Centro",
          totalAlunos: 10,
          alunosComCpf: 10,
          alunosComEmail: 8,
          alunosComTelefone: 7,
          termosAceitos: 8,
          termosPendentes: 2,
          statusTermos: "PENDENTE",
          camposSensiveis: ["cpf", "email"],
        },
      ],
      solicitacoesPendentes: [
        {
          id: "req-1",
          academiaId: "acd-1",
          academiaNome: "Rede Centro",
          alunoNome: "Ana",
          status: "PENDENTE",
        },
      ],
      exposicaoCamposSensiveis: [],
    });

    expect(dashboard.totalDadosPessoaisArmazenados).toBe(25);
    expect(dashboard.solicitacoesExclusaoPendentes).toBe(1);
    expect(dashboard.academias[0]?.statusTermos).toBe("PENDENTE");
    expect(dashboard.exposicaoCamposSensiveis).toHaveLength(2);
  });

  test("normaliza status intermediários de solicitação e termos", () => {
    expect(normalizeComplianceTermsStatus({ termosAceitos: 10, termosPendentes: 0 })).toBe("ACEITO");
    expect(normalizeComplianceTermsStatus({ termosAceitos: 5, termosPendentes: 3 })).toBe("PARCIAL");
    expect(normalizeSolicitacaoExclusaoStatus("concluída")).toBe("EXECUTADA");
    expect(normalizeSolicitacaoExclusaoStatus("em_analise")).toBe("EM_PROCESSAMENTO");
  });
});

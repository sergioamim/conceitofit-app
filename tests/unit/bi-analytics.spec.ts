import { expect, test } from "@playwright/test";
import { buildBiExportCsv, buildBiOperationalSnapshot, resolveBiScopeAccess } from "../../src/lib/bi/analytics";
import type {
  Academia,
  Aluno,
  AtividadeGrade,
  Matricula,
  Pagamento,
  Prospect,
  ReservaAula,
  Tenant,
} from "../../src/lib/types";

test.describe("BI analytics helpers", () => {
  const academias: Academia[] = [{ id: "acd-1", nome: "Rede Fit", ativo: true }];
  const tenants: Tenant[] = [
    { id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
    { id: "tn-2", academiaId: "acd-1", nome: "Unidade Norte", ativo: true },
  ];
  const prospects: Prospect[] = [
    {
      id: "pr-1",
      tenantId: "tn-1",
      nome: "Ana",
      telefone: "11999999999",
      origem: "INSTAGRAM",
      status: "CONVERTIDO",
      dataCriacao: "2026-03-02T10:00:00",
      statusLog: [{ status: "CONVERTIDO", data: "2026-03-03T11:00:00" }],
    },
    {
      id: "pr-2",
      tenantId: "tn-2",
      nome: "Bruno",
      telefone: "11999999998",
      origem: "WHATSAPP",
      status: "CONVERTIDO",
      dataCriacao: "2026-03-04T10:00:00",
      statusLog: [{ status: "CONVERTIDO", data: "2026-03-06T14:00:00" }],
    },
    {
      id: "pr-prev",
      tenantId: "tn-1",
      nome: "Carla",
      telefone: "11999999997",
      origem: "INSTAGRAM",
      status: "CONVERTIDO",
      dataCriacao: "2026-02-02T10:00:00",
      statusLog: [{ status: "CONVERTIDO", data: "2026-02-03T11:00:00" }],
    },
  ];
  const alunos: Aluno[] = [
    {
      id: "al-1",
      tenantId: "tn-1",
      prospectId: "pr-1",
      nome: "Ana",
      email: "ana@email.com",
      telefone: "11999999999",
      cpf: "123.456.789-00",
      dataNascimento: "1990-01-01",
      sexo: "F",
      status: "ATIVO",
      dataCadastro: "2026-03-03T11:10:00",
    },
    {
      id: "al-2",
      tenantId: "tn-2",
      prospectId: "pr-2",
      nome: "Bruno",
      email: "bruno@email.com",
      telefone: "11999999998",
      cpf: "987.654.321-00",
      dataNascimento: "1991-01-01",
      sexo: "M",
      status: "ATIVO",
      dataCadastro: "2026-03-06T14:10:00",
    },
  ];
  const matriculas: Matricula[] = [
    {
      id: "mt-1",
      tenantId: "tn-1",
      alunoId: "al-1",
      planoId: "pl-1",
      dataInicio: "2026-03-03",
      dataFim: "2026-04-03",
      valorPago: 129.9,
      valorMatricula: 40,
      desconto: 0,
      formaPagamento: "PIX",
      status: "ATIVA",
      renovacaoAutomatica: true,
      dataCriacao: "2026-03-03T11:12:00",
    },
    {
      id: "mt-2",
      tenantId: "tn-2",
      alunoId: "al-2",
      planoId: "pl-2",
      dataInicio: "2026-03-06",
      dataFim: "2026-04-06",
      valorPago: 139.9,
      valorMatricula: 40,
      desconto: 0,
      formaPagamento: "PIX",
      status: "ATIVA",
      renovacaoAutomatica: true,
      dataCriacao: "2026-03-06T14:12:00",
    },
  ];
  const pagamentos: Pagamento[] = [
    {
      id: "pg-1",
      tenantId: "tn-1",
      alunoId: "al-1",
      matriculaId: "mt-1",
      tipo: "MENSALIDADE",
      descricao: "Mensalidade Ana",
      valor: 129.9,
      desconto: 0,
      valorFinal: 129.9,
      dataVencimento: "2026-03-03",
      dataPagamento: "2026-03-03",
      status: "PAGO",
      dataCriacao: "2026-03-03T11:20:00",
    },
    {
      id: "pg-2",
      tenantId: "tn-2",
      alunoId: "al-2",
      matriculaId: "mt-2",
      tipo: "MENSALIDADE",
      descricao: "Mensalidade Bruno",
      valor: 139.9,
      desconto: 0,
      valorFinal: 139.9,
      dataVencimento: "2026-03-06",
      dataPagamento: "2026-03-06",
      status: "PAGO",
      dataCriacao: "2026-03-06T14:20:00",
    },
    {
      id: "pg-3",
      tenantId: "tn-2",
      alunoId: "al-2",
      matriculaId: "mt-2",
      tipo: "MENSALIDADE",
      descricao: "Mensalidade atraso Bruno",
      valor: 139.9,
      desconto: 0,
      valorFinal: 139.9,
      dataVencimento: "2026-03-07",
      status: "VENCIDO",
      dataCriacao: "2026-03-07T08:20:00",
    },
  ];
  const atividadeGrades: AtividadeGrade[] = [
    {
      id: "gr-1",
      tenantId: "tn-1",
      atividadeId: "atv-1",
      diasSemana: ["SEG", "QUA"],
      definicaoHorario: "PREVIAMENTE",
      horaInicio: "08:00",
      horaFim: "09:00",
      capacidade: 10,
      checkinLiberadoMinutosAntes: 60,
      duracaoMinutos: 60,
      acessoClientes: "TODOS_CLIENTES",
      permiteReserva: true,
      limitarVagasAgregadores: false,
      exibirWellhub: false,
      permitirSaidaAntesInicio: true,
      permitirEscolherNumeroVaga: false,
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: true,
      exibirNoWodTv: false,
      finalizarAtividadeAutomaticamente: true,
      desabilitarListaEspera: false,
      ativo: true,
    },
    {
      id: "gr-2",
      tenantId: "tn-2",
      atividadeId: "atv-2",
      diasSemana: ["TER", "QUI"],
      definicaoHorario: "PREVIAMENTE",
      horaInicio: "18:00",
      horaFim: "19:00",
      capacidade: 8,
      checkinLiberadoMinutosAntes: 60,
      duracaoMinutos: 60,
      acessoClientes: "TODOS_CLIENTES",
      permiteReserva: true,
      limitarVagasAgregadores: false,
      exibirWellhub: false,
      permitirSaidaAntesInicio: true,
      permitirEscolherNumeroVaga: false,
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: true,
      exibirNoWodTv: false,
      finalizarAtividadeAutomaticamente: true,
      desabilitarListaEspera: false,
      ativo: true,
    },
  ];
  const reservasAulas: ReservaAula[] = [
    {
      id: "rv-1",
      tenantId: "tn-1",
      sessaoId: "sess-1",
      atividadeGradeId: "gr-1",
      atividadeId: "atv-1",
      atividadeNome: "Bike",
      alunoId: "al-1",
      alunoNome: "Ana",
      data: "2026-03-02",
      horaInicio: "08:00",
      horaFim: "09:00",
      origem: "PORTAL_CLIENTE",
      status: "CHECKIN",
      dataCriacao: "2026-03-02T07:30:00",
    },
    {
      id: "rv-2",
      tenantId: "tn-2",
      sessaoId: "sess-2",
      atividadeGradeId: "gr-2",
      atividadeId: "atv-2",
      atividadeNome: "Funcional",
      alunoId: "al-2",
      alunoNome: "Bruno",
      data: "2026-03-03",
      horaInicio: "18:00",
      horaFim: "19:00",
      origem: "PORTAL_CLIENTE",
      status: "CONFIRMADA",
      dataCriacao: "2026-03-03T17:20:00",
    },
  ];

  test("resolveBiScopeAccess restringe visão de rede por perfil", async () => {
    expect(resolveBiScopeAccess(false)).toEqual({
      canViewNetwork: false,
      defaultScope: "UNIDADE",
      scopeOptions: [{ value: "UNIDADE", label: "Unidade" }],
    });
    expect(resolveBiScopeAccess(true).scopeOptions).toHaveLength(2);
  });

  test("buildBiOperationalSnapshot agrega benchmark e série", async () => {
    const snapshot = buildBiOperationalSnapshot({
      academias,
      tenants,
      prospects,
      alunos,
      matriculas,
      pagamentos,
      atividadeGrades,
      reservasAulas,
      scope: "ACADEMIA",
      academiaId: "acd-1",
      startDate: "2026-03-01",
      endDate: "2026-03-07",
      segmento: "TODOS",
      canViewNetwork: true,
      nowIso: "2026-03-11T10:00:00",
    });

    expect(snapshot.scope).toBe("ACADEMIA");
    expect(snapshot.academiaNome).toBe("Rede Fit");
    expect(snapshot.kpis.receita).toBeCloseTo(269.8, 2);
    expect(snapshot.kpis.conversoes).toBe(2);
    expect(snapshot.benchmark).toHaveLength(2);
    expect(snapshot.benchmark[0]?.tenantNome).toBe("Unidade Norte");
    expect(snapshot.series).toHaveLength(6);
    expect(snapshot.quality.some((item) => item.status === "OK")).toBeTruthy();
  });

  test("buildBiOperationalSnapshot rebaixa escopo de rede sem permissão", async () => {
    const snapshot = buildBiOperationalSnapshot({
      academias,
      tenants,
      prospects,
      alunos,
      matriculas,
      pagamentos,
      atividadeGrades,
      reservasAulas,
      scope: "ACADEMIA",
      tenantId: "tn-1",
      academiaId: "acd-1",
      startDate: "2026-03-01",
      endDate: "2026-03-07",
      segmento: "TODOS",
      canViewNetwork: false,
      nowIso: "2026-03-11T10:00:00",
    });

    expect(snapshot.scope).toBe("UNIDADE");
    expect(snapshot.tenantId).toBe("tn-1");
    expect(snapshot.tenantNome).toBe("Unidade Centro");
    expect(snapshot.quality.find((item) => item.id === "escopo")?.detail).toContain("rebaixada");
  });

  test("buildBiExportCsv serializa resumo, benchmark e série", async () => {
    const snapshot = buildBiOperationalSnapshot({
      academias,
      tenants,
      prospects,
      alunos,
      matriculas,
      pagamentos,
      atividadeGrades,
      reservasAulas,
      scope: "UNIDADE",
      tenantId: "tn-1",
      startDate: "2026-03-01",
      endDate: "2026-03-07",
      segmento: "INSTAGRAM",
      canViewNetwork: true,
      nowIso: "2026-03-11T10:00:00",
    });

    const csv = buildBiExportCsv(snapshot);
    expect(csv).toContain('"kpi","valor"');
    expect(csv).toContain('"tenant","receita","ativos"');
    expect(csv).toContain('"periodo","receita","conversao_pct"');
    expect(csv).toContain("Unidade Centro");
  });
});

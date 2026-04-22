import { expect, test } from "@playwright/test";
import {
  BI_KPI_CATALOG,
  buildBiExportCsv,
  buildBiOperationalSnapshot,
  resolveBiScopeAccess,
} from "../../src/lib/tenant/bi/analytics";
import type {
  Academia,
  Aluno,
  AtividadeGrade,
  Contrato,
  Pagamento,
  Prospect,
  ReservaAula,
  Tenant,
} from "../../src/lib/types";

const academias: Academia[] = [{ id: "acd-1", nome: "Rede Fit", ativo: true }];

const tenants: Tenant[] = [
  { id: "tn-1", academiaId: "acd-1", nome: "Centro", ativo: true },
  { id: "tn-2", academiaId: "acd-1", nome: "Norte", ativo: true },
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
    statusLog: [{ status: "CONVERTIDO", data: "2026-03-03T10:00:00" }],
  },
  {
    id: "pr-2",
    tenantId: "tn-2",
    nome: "Bruno",
    telefone: "11888888888",
    origem: "WHATSAPP",
    status: "CONVERTIDO",
    dataCriacao: "2026-03-05T10:00:00",
    statusLog: [{ status: "CONVERTIDO", data: "2026-03-06T10:00:00" }],
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
    cpf: "12345678900",
    dataNascimento: "1990-01-01",
    sexo: "F",
    status: "ATIVO",
    dataCadastro: "2026-03-03T10:00:00",
  },
  {
    id: "al-2",
    tenantId: "tn-2",
    prospectId: "pr-2",
    nome: "Bruno",
    email: "bruno@email.com",
    telefone: "11888888888",
    cpf: "98765432100",
    dataNascimento: "1991-01-01",
    sexo: "M",
    status: "ATIVO",
    dataCadastro: "2026-03-06T10:00:00",
  },
];

const matriculas: Contrato[] = [
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
    dataCriacao: "2026-03-03T10:00:00",
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
    dataCriacao: "2026-03-06T10:00:00",
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
    dataCriacao: "2026-03-03T10:00:00",
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
    dataVencimento: "2026-03-07",
    status: "VENCIDO",
    dataCriacao: "2026-03-07T10:00:00",
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
    data: "2026-03-03",
    horaInicio: "08:00",
    horaFim: "09:00",
    origem: "PORTAL_CLIENTE",
    status: "CHECKIN",
    dataCriacao: "2026-03-03T07:30:00",
  },
];

function buildSnapshot(overrides: Partial<Parameters<typeof buildBiOperationalSnapshot>[0]> = {}) {
  return buildBiOperationalSnapshot({
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
    startDate: "2026-03-31",
    endDate: "2026-03-01",
    segmento: "TODOS",
    canViewNetwork: true,
    nowIso: "2026-03-31T09:00:00",
    ...overrides,
  });
}

test.describe("bi analytics full coverage", () => {
  test("mantém catálogo e acesso por escopo coerentes", async () => {
    expect(BI_KPI_CATALOG.map((item) => item.key)).toEqual([
      "CONVERSAO",
      "OCUPACAO",
      "INADIMPLENCIA",
      "RETENCAO",
      "RECEITA",
      "ATIVOS",
    ]);

    expect(resolveBiScopeAccess(false)).toEqual({
      canViewNetwork: false,
      defaultScope: "UNIDADE",
      scopeOptions: [{ value: "UNIDADE", label: "Unidade" }],
    });
  });

  test("normaliza intervalo invertido e faz fallback de academia para unidade sem acesso de rede", async () => {
    const snapshot = buildSnapshot({
      scope: "ACADEMIA",
      canViewNetwork: false,
    });

    expect(snapshot.scope).toBe("UNIDADE");
    expect(snapshot.startDate).toBe("2026-03-01");
    expect(snapshot.endDate).toBe("2026-03-31");
    expect(snapshot.tenantId).toBe("tn-1");
    expect(snapshot.kpis.receita).toBeCloseTo(129.9, 2);
    expect(snapshot.kpis.ativos).toBe(1);
    expect(snapshot.deltas.receita).toBeGreaterThanOrEqual(0);
  });

  test("filtra segmento, gera benchmark por receita e expõe checklist de qualidade", async () => {
    const snapshot = buildSnapshot({
      segmento: "INSTAGRAM",
    });

    expect(snapshot.kpis.prospects).toBe(1);
    expect(snapshot.kpis.conversoes).toBe(1);
    expect(snapshot.kpis.receita).toBeCloseTo(129.9, 2);
    expect(snapshot.benchmark).toHaveLength(2);
    expect(snapshot.benchmark[0]?.tenantId).toBe("tn-1");
    expect(snapshot.quality.find((item) => item.id === "escopo")?.detail).toContain("rede");
    expect(snapshot.generatedAt).toBe("2026-03-31T09:00:00");
  });

  test("responde com KPIs zerados e alertas quando não há dados no recorte", async () => {
    const snapshot = buildBiOperationalSnapshot({
      academias,
      tenants,
      prospects: [],
      alunos: [],
      matriculas: [],
      pagamentos: [],
      atividadeGrades: [],
      reservasAulas: [],
      scope: "UNIDADE",
      tenantId: "tn-1",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      segmento: "TODOS",
      canViewNetwork: false,
      nowIso: "2026-03-31T09:00:00",
    });

    expect(snapshot.kpis).toMatchObject({
      conversaoPct: 0,
      ocupacaoPct: 0,
      inadimplenciaPct: 0,
      retencaoPct: 0,
      receita: 0,
      ativos: 0,
      prospects: 0,
      conversoes: 0,
    });
    expect(snapshot.quality.find((item) => item.id === "atualizacao")?.status).toBe("ATENCAO");
    expect(snapshot.series).toHaveLength(6);
  });

  test("exporta CSV com seções de resumo, benchmark e série", async () => {
    const csv = buildBiExportCsv(buildSnapshot());
    const lines = csv.split("\n");

    expect(lines[0]).toBe('"kpi","valor"');
    expect(csv).toContain('"Conversão (%)"');
    expect(csv).toContain('"tenant","receita","ativos","conversao_pct","ocupacao_pct","inadimplencia_pct","retencao_pct"');
    expect(csv).toContain('"periodo","receita","conversao_pct","ocupacao_pct","inadimplencia_pct","retencao_pct"');
    expect(lines.length).toBeGreaterThan(10);
  });
});

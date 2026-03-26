import { formatDiaSemana, listDatesBetween } from "@/lib/aulas/reservas";
import type {
  Academia,
  Aluno,
  AtividadeGrade,
  BiBenchmarkTenant,
  BiEscopo,
  BiKpiDefinition,
  BiOperationalSnapshot,
  BiQualityItem,
  BiSegmento,
  Matricula,
  Pagamento,
  Prospect,
  ReservaAula,
  Tenant,
} from "@/lib/types";

type BuildBiSnapshotInput = {
  academias: Academia[];
  tenants: Tenant[];
  prospects: Prospect[];
  alunos: Aluno[];
  matriculas: Matricula[];
  pagamentos: Pagamento[];
  atividadeGrades: AtividadeGrade[];
  reservasAulas: ReservaAula[];
  scope: BiEscopo;
  tenantId?: string;
  academiaId?: string;
  startDate: string;
  endDate: string;
  segmento: BiSegmento;
  canViewNetwork: boolean;
  nowIso?: string;
};

type PeriodMetrics = {
  receita: number;
  prospects: number;
  conversoes: number;
  lugaresOcupados: number;
  lugaresDisponiveis: number;
  valorInadimplente: number;
  valorEmAberto: number;
  ativos: number;
  retidosBaseIds: string[];
};

export const BI_KPI_CATALOG: BiKpiDefinition[] = [
  {
    key: "CONVERSAO",
    label: "Conversão",
    description: "Percentual de prospects convertidos em clientes no período.",
    unit: "%",
  },
  {
    key: "OCUPACAO",
    label: "Ocupação",
    description: "Uso das vagas ofertadas nas sessões agendadas da grade.",
    unit: "%",
  },
  {
    key: "INADIMPLENCIA",
    label: "Inadimplência",
    description: "Percentual do valor vencido sobre a carteira em aberto no período.",
    unit: "%",
  },
  {
    key: "RETENCAO",
    label: "Retenção",
    description: "Base recorrente que permaneceu ativa do período anterior para o atual.",
    unit: "%",
  },
  {
    key: "RECEITA",
    label: "Receita",
    description: "Receita líquida recebida no período filtrado.",
    unit: "currency",
  },
  {
    key: "ATIVOS",
    label: "Ativos",
    description: "Clientes com vínculo ativo no recorte analisado.",
    unit: "count",
  },
];

export function resolveBiScopeAccess(canViewNetwork: boolean) {
  const scopeOptions: Array<{ value: BiEscopo; label: string }> = [{ value: "UNIDADE", label: "Unidade" }];
  if (canViewNetwork) {
    scopeOptions.push({ value: "ACADEMIA", label: "Academia / rede" });
  }
  return {
    canViewNetwork,
    defaultScope: "UNIDADE" as BiEscopo,
    scopeOptions,
  };
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function ratioPercent(numerator: number, denominator: number) {
  if (!denominator || denominator <= 0) return 0;
  return clampPercent((numerator / denominator) * 100);
}

function safeDateRange(startDate: string, endDate: string) {
  return startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

function shiftDate(dateIso: string, days: number) {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function previousRange(startDate: string, endDate: string) {
  const span = daysBetween(startDate, endDate);
  return {
    startDate: shiftDate(startDate, -span),
    endDate: shiftDate(endDate, -span),
  };
}

function monthBounds(reference: Date) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return {
    start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`,
    end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
    label: reference.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
  };
}

function buildMonthlyRanges(endDate: string, total = 6) {
  const reference = new Date(`${endDate}T00:00:00`);
  const ranges = [];
  for (let offset = total - 1; offset >= 0; offset -= 1) {
    const monthRef = new Date(reference.getFullYear(), reference.getMonth() - offset, 1);
    ranges.push(monthBounds(monthRef));
  }
  return ranges;
}

function inDateRange(value: string | undefined, startDate: string, endDate: string) {
  if (!value) return false;
  return value >= startDate && value <= endDate;
}

function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA <= endB && endA >= startB;
}

function resolveAcademiaId(input: {
  scope: BiEscopo;
  tenantId?: string;
  academiaId?: string;
  tenants: Tenant[];
}) {
  if (input.scope === "ACADEMIA" && input.academiaId) return input.academiaId;
  if (input.tenantId) {
    const tenant = input.tenants.find((item) => item.id === input.tenantId);
    return tenant?.academiaId ?? tenant?.groupId;
  }
  return input.academiaId;
}

function resolveTenantIds(input: {
  scope: BiEscopo;
  tenantId?: string;
  academiaId?: string;
  tenants: Tenant[];
}) {
  if (input.scope === "UNIDADE") {
    return input.tenantId ? [input.tenantId] : [];
  }
  return input.tenants
    .filter((tenant) => (tenant.academiaId ?? tenant.groupId) === input.academiaId)
    .map((tenant) => tenant.id);
}

function prospectMatchesSegment(prospect: Prospect | undefined, segmento: BiSegmento) {
  if (segmento === "TODOS") return true;
  return prospect?.origem === segmento;
}

function buildAlunoSegmentMatcher(prospects: Prospect[], segmento: BiSegmento) {
  const prospectMap = new Map(prospects.map((item) => [item.id, item] as const));
  return (aluno: Aluno | undefined) => {
    if (!aluno) return false;
    if (segmento === "TODOS") return true;
    return prospectMatchesSegment(aluno.prospectId ? prospectMap.get(aluno.prospectId) : undefined, segmento);
  };
}

function getConvertedAt(prospect: Prospect) {
  const log = prospect.statusLog?.find((item) => item.status === "CONVERTIDO");
  if (log?.data) return log.data.slice(0, 10);
  if (prospect.status === "CONVERTIDO") {
    return prospect.dataUltimoContato?.slice(0, 10) ?? prospect.dataCriacao.slice(0, 10);
  }
  return undefined;
}

function computeRetentionBase(
  alunos: Aluno[],
  matriculas: Matricula[],
  tenantIds: string[],
  startDate: string,
  endDate: string,
  matchesAlunoSegment: (aluno: Aluno | undefined) => boolean
) {
  const alunoMap = new Map(alunos.map((item) => [item.id, item] as const));
  const ids = new Set<string>();

  for (const aluno of alunos) {
    if (!tenantIds.includes(aluno.tenantId)) continue;
    if (aluno.status !== "ATIVO") continue;
    if (!matchesAlunoSegment(aluno)) continue;
    ids.add(aluno.id);
  }

  for (const matricula of matriculas) {
    if (!tenantIds.includes(matricula.tenantId)) continue;
    if (matricula.status !== "ATIVA") continue;
    if (!rangesOverlap(matricula.dataInicio, matricula.dataFim, startDate, endDate)) continue;
    const aluno = alunoMap.get(matricula.alunoId);
    if (!matchesAlunoSegment(aluno)) continue;
    ids.add(matricula.alunoId);
  }

  return Array.from(ids);
}

function computePeriodMetrics(input: {
  tenantIds: string[];
  startDate: string;
  endDate: string;
  prospects: Prospect[];
  alunos: Aluno[];
  matriculas: Matricula[];
  pagamentos: Pagamento[];
  atividadeGrades: AtividadeGrade[];
  reservasAulas: ReservaAula[];
  segmento: BiSegmento;
}) {
  const { tenantIds, startDate, endDate, segmento } = input;
  const alunos = input.alunos.filter((item) => tenantIds.includes(item.tenantId));
  const prospects = input.prospects.filter((item) => tenantIds.includes(item.tenantId));
  const matriculas = input.matriculas.filter((item) => tenantIds.includes(item.tenantId));
  const pagamentos = input.pagamentos.filter((item) => tenantIds.includes(item.tenantId));
  const grades = input.atividadeGrades.filter((item) => tenantIds.includes(item.tenantId) && item.ativo);
  const reservas = input.reservasAulas.filter((item) => tenantIds.includes(item.tenantId));
  const alunoMap = new Map(alunos.map((item) => [item.id, item] as const));
  const matchesAlunoSegment = buildAlunoSegmentMatcher(prospects, segmento);

  const prospectsNoPeriodo = prospects.filter(
    (item) =>
      inDateRange(item.dataCriacao.slice(0, 10), startDate, endDate) &&
      prospectMatchesSegment(item, segmento)
  );
  const conversoesNoPeriodo = prospects.filter(
    (item) =>
      prospectMatchesSegment(item, segmento) &&
      inDateRange(getConvertedAt(item), startDate, endDate)
  );

  const receita = pagamentos
    .filter(
      (item) =>
        item.status === "PAGO" &&
        inDateRange(item.dataPagamento, startDate, endDate) &&
        matchesAlunoSegment(alunoMap.get(item.alunoId))
    )
    .reduce((sum, item) => sum + Number(item.valorFinal ?? 0), 0);

  const valorInadimplente = pagamentos
    .filter(
      (item) =>
        item.status === "VENCIDO" &&
        inDateRange(item.dataVencimento, startDate, endDate) &&
        matchesAlunoSegment(alunoMap.get(item.alunoId))
    )
    .reduce((sum, item) => sum + Number(item.valorFinal ?? 0), 0);

  const valorEmAberto = pagamentos
    .filter(
      (item) =>
        (item.status === "PENDENTE" || item.status === "VENCIDO") &&
        inDateRange(item.dataVencimento, startDate, endDate) &&
        matchesAlunoSegment(alunoMap.get(item.alunoId))
    )
    .reduce((sum, item) => sum + Number(item.valorFinal ?? 0), 0);

  const retidosBaseIds = computeRetentionBase(
    alunos,
    matriculas,
    tenantIds,
    startDate,
    endDate,
    matchesAlunoSegment
  );

  let lugaresDisponiveis = 0;
  const dates = listDatesBetween(startDate, endDate);
  for (const grade of grades) {
    const occurrences = dates.filter((date) => grade.diasSemana.includes(formatDiaSemana(new Date(`${date}T00:00:00`))));
    lugaresDisponiveis += occurrences.length * Number(grade.capacidade ?? 0);
  }

  const lugaresOcupados = reservas.filter((item) => {
    if (!inDateRange(item.data, startDate, endDate)) return false;
    if (!(item.status === "CONFIRMADA" || item.status === "CHECKIN")) return false;
    return matchesAlunoSegment(alunoMap.get(item.alunoId));
  }).length;

  return {
    receita,
    prospects: prospectsNoPeriodo.length,
    conversoes: conversoesNoPeriodo.length,
    lugaresOcupados,
    lugaresDisponiveis,
    valorInadimplente,
    valorEmAberto,
    ativos: retidosBaseIds.length,
    retidosBaseIds,
  } satisfies PeriodMetrics;
}

function buildBenchmark(
  input: BuildBiSnapshotInput,
  academiaId: string | undefined,
  startDate: string,
  endDate: string
) {
  const tenantIds = academiaId
    ? input.tenants.filter((tenant) => (tenant.academiaId ?? tenant.groupId) === academiaId).map((tenant) => tenant.id)
    : input.tenantId
      ? [input.tenantId]
      : [];
  const rangePrev = previousRange(startDate, endDate);
  const academiasMap = new Map(input.academias.map((item) => [item.id, item] as const));

  const rows: BiBenchmarkTenant[] = tenantIds.map((tenantId) => {
    const tenant = input.tenants.find((item) => item.id === tenantId);
    const current = computePeriodMetrics({
      tenantIds: [tenantId],
      startDate,
      endDate,
      prospects: input.prospects,
      alunos: input.alunos,
      matriculas: input.matriculas,
      pagamentos: input.pagamentos,
      atividadeGrades: input.atividadeGrades,
      reservasAulas: input.reservasAulas,
      segmento: input.segmento,
    });
    const previous = computePeriodMetrics({
      tenantIds: [tenantId],
      startDate: rangePrev.startDate,
      endDate: rangePrev.endDate,
      prospects: input.prospects,
      alunos: input.alunos,
      matriculas: input.matriculas,
      pagamentos: input.pagamentos,
      atividadeGrades: input.atividadeGrades,
      reservasAulas: input.reservasAulas,
      segmento: input.segmento,
    });
    const retained = previous.retidosBaseIds.filter((id) => current.retidosBaseIds.includes(id)).length;
    const academiaKey = tenant?.academiaId ?? tenant?.groupId;

    return {
      tenantId,
      tenantNome: tenant?.nome ?? tenantId,
      academiaId: academiaKey,
      academiaNome: academiaKey ? academiasMap.get(academiaKey)?.nome : undefined,
      receita: current.receita,
      ativos: current.ativos,
      prospects: current.prospects,
      conversoes: current.conversoes,
      conversaoPct: ratioPercent(current.conversoes, Math.max(1, current.prospects)),
      ocupacaoPct: ratioPercent(current.lugaresOcupados, Math.max(1, current.lugaresDisponiveis)),
      inadimplenciaPct: ratioPercent(current.valorInadimplente, Math.max(1, current.valorEmAberto + current.receita)),
      retencaoPct: ratioPercent(retained, Math.max(1, previous.retidosBaseIds.length)),
    };
  });

  return rows.sort((a, b) => b.receita - a.receita || b.conversaoPct - a.conversaoPct);
}

function buildQualityChecklist(input: {
  canViewNetwork: boolean;
  requestedScope: BiEscopo;
  scope: BiEscopo;
  benchmarkRows: number;
  seriesPoints: number;
  tenantIds: string[];
  latestEventDate?: string;
}) {
  const items: BiQualityItem[] = [
    {
      id: "payload",
      label: "Payload agregado",
      status: input.benchmarkRows <= 20 && input.seriesPoints <= 6 ? "OK" : "ATENCAO",
      detail: `${input.benchmarkRows} unidade(s) comparadas e ${input.seriesPoints} pontos na série.`,
    },
    {
      id: "escopo",
      label: "Permissões por escopo",
      status: "OK",
      detail:
        input.requestedScope === "ACADEMIA" && !input.canViewNetwork
          ? "Solicitação de rede rebaixada para escopo unitário por falta de permissão."
          : input.scope === "ACADEMIA"
            ? "Escopo de rede liberado para perfil elevado."
            : "Escopo unitário sempre disponível.",
    },
    {
      id: "filtros",
      label: "Cobertura de filtros",
      status: input.tenantIds.length > 0 ? "OK" : "ATENCAO",
      detail: input.tenantIds.length > 0 ? `${input.tenantIds.length} unidade(s) no recorte.` : "Nenhuma unidade encontrada no recorte.",
    },
    {
      id: "atualizacao",
      label: "Atualização dos dados",
      status: input.latestEventDate ? "OK" : "ATENCAO",
      detail: input.latestEventDate ? `Último evento relevante em ${input.latestEventDate}.` : "Sem eventos recentes para o recorte.",
    },
  ];
  return items;
}

export function buildBiOperationalSnapshot(input: BuildBiSnapshotInput): BiOperationalSnapshot {
  const effectiveScope =
    input.scope === "ACADEMIA" && !input.canViewNetwork ? "UNIDADE" : input.scope;
  const range = safeDateRange(input.startDate, input.endDate);
  const previous = previousRange(range.startDate, range.endDate);
  const previousPrevious = previousRange(previous.startDate, previous.endDate);
  const academiaId = resolveAcademiaId({
    scope: effectiveScope,
    tenantId: input.tenantId,
    academiaId: input.academiaId,
    tenants: input.tenants,
  });
  const tenantIds = resolveTenantIds({
    scope: effectiveScope,
    tenantId: input.tenantId,
    academiaId,
    tenants: input.tenants,
  });

  const currentMetrics = computePeriodMetrics({
    tenantIds,
    startDate: range.startDate,
    endDate: range.endDate,
    prospects: input.prospects,
    alunos: input.alunos,
    matriculas: input.matriculas,
    pagamentos: input.pagamentos,
    atividadeGrades: input.atividadeGrades,
    reservasAulas: input.reservasAulas,
    segmento: input.segmento,
  });
  const previousMetrics = computePeriodMetrics({
    tenantIds,
    startDate: previous.startDate,
    endDate: previous.endDate,
    prospects: input.prospects,
    alunos: input.alunos,
    matriculas: input.matriculas,
    pagamentos: input.pagamentos,
    atividadeGrades: input.atividadeGrades,
    reservasAulas: input.reservasAulas,
    segmento: input.segmento,
  });
  const previousPreviousMetrics = computePeriodMetrics({
    tenantIds,
    startDate: previousPrevious.startDate,
    endDate: previousPrevious.endDate,
    prospects: input.prospects,
    alunos: input.alunos,
    matriculas: input.matriculas,
    pagamentos: input.pagamentos,
    atividadeGrades: input.atividadeGrades,
    reservasAulas: input.reservasAulas,
    segmento: input.segmento,
  });

  const retained = previousMetrics.retidosBaseIds.filter((id) => currentMetrics.retidosBaseIds.includes(id)).length;
  const conversaoPct = ratioPercent(currentMetrics.conversoes, Math.max(1, currentMetrics.prospects));
  const ocupacaoPct = ratioPercent(currentMetrics.lugaresOcupados, Math.max(1, currentMetrics.lugaresDisponiveis));
  const inadimplenciaPct = ratioPercent(
    currentMetrics.valorInadimplente,
    Math.max(1, currentMetrics.valorEmAberto + currentMetrics.receita)
  );
  const retencaoPct = ratioPercent(retained, Math.max(1, previousMetrics.retidosBaseIds.length));

  const previousConversaoPct = ratioPercent(previousMetrics.conversoes, Math.max(1, previousMetrics.prospects));
  const previousOcupacaoPct = ratioPercent(previousMetrics.lugaresOcupados, Math.max(1, previousMetrics.lugaresDisponiveis));
  const previousInadimplenciaPct = ratioPercent(
    previousMetrics.valorInadimplente,
    Math.max(1, previousMetrics.valorEmAberto + previousMetrics.receita)
  );
  const previousRetentionPct = ratioPercent(
    previousPreviousMetrics.retidosBaseIds.filter((id) => previousMetrics.retidosBaseIds.includes(id)).length,
    Math.max(1, previousPreviousMetrics.retidosBaseIds.length)
  );

  const series = buildMonthlyRanges(range.endDate).map((bucket) => {
    const current = computePeriodMetrics({
      tenantIds,
      startDate: bucket.start,
      endDate: bucket.end,
      prospects: input.prospects,
      alunos: input.alunos,
      matriculas: input.matriculas,
      pagamentos: input.pagamentos,
      atividadeGrades: input.atividadeGrades,
      reservasAulas: input.reservasAulas,
      segmento: input.segmento,
    });
    const prevBucket = previousRange(bucket.start, bucket.end);
    const previousBucket = computePeriodMetrics({
      tenantIds,
      startDate: prevBucket.startDate,
      endDate: prevBucket.endDate,
      prospects: input.prospects,
      alunos: input.alunos,
      matriculas: input.matriculas,
      pagamentos: input.pagamentos,
      atividadeGrades: input.atividadeGrades,
      reservasAulas: input.reservasAulas,
      segmento: input.segmento,
    });
    const retainedBucket = previousBucket.retidosBaseIds.filter((id) => current.retidosBaseIds.includes(id)).length;
    return {
      label: bucket.label,
      periodoInicio: bucket.start,
      periodoFim: bucket.end,
      receita: current.receita,
      conversaoPct: ratioPercent(current.conversoes, Math.max(1, current.prospects)),
      ocupacaoPct: ratioPercent(current.lugaresOcupados, Math.max(1, current.lugaresDisponiveis)),
      inadimplenciaPct: ratioPercent(current.valorInadimplente, Math.max(1, current.valorEmAberto + current.receita)),
      retencaoPct: ratioPercent(retainedBucket, Math.max(1, previousBucket.retidosBaseIds.length)),
    };
  });

  const academiasMap = new Map(input.academias.map((item) => [item.id, item] as const));
  const tenant = input.tenantId ? input.tenants.find((item) => item.id === input.tenantId) : undefined;
  const benchmark = buildBenchmark(input, academiaId, range.startDate, range.endDate);
  const latestPayment = input.pagamentos
    .filter((item) => tenantIds.includes(item.tenantId))
    .map((item) => item.dataPagamento ?? item.dataVencimento)
    .sort()
    .at(-1);
  const latestProspect = input.prospects
    .filter((item) => tenantIds.includes(item.tenantId))
    .map((item) => item.dataCriacao.slice(0, 10))
    .sort()
    .at(-1);
  const latestEventDate = [latestPayment, latestProspect].filter(Boolean).sort().at(-1);

  return {
    scope: effectiveScope,
    startDate: range.startDate,
    endDate: range.endDate,
    academiaId,
    academiaNome: academiaId ? academiasMap.get(academiaId)?.nome : undefined,
    tenantId: effectiveScope === "UNIDADE" ? input.tenantId : undefined,
    tenantNome: effectiveScope === "UNIDADE" ? tenant?.nome : undefined,
    segmento: input.segmento,
    kpis: {
      conversaoPct,
      ocupacaoPct,
      inadimplenciaPct,
      retencaoPct,
      receita: currentMetrics.receita,
      ativos: currentMetrics.ativos,
      prospects: currentMetrics.prospects,
      conversoes: currentMetrics.conversoes,
      lugaresOcupados: currentMetrics.lugaresOcupados,
      lugaresDisponiveis: currentMetrics.lugaresDisponiveis,
      valorInadimplente: currentMetrics.valorInadimplente,
      valorEmAberto: currentMetrics.valorEmAberto,
    },
    deltas: {
      conversaoPct: conversaoPct - previousConversaoPct,
      ocupacaoPct: ocupacaoPct - previousOcupacaoPct,
      inadimplenciaPct: inadimplenciaPct - previousInadimplenciaPct,
      retencaoPct: retencaoPct - previousRetentionPct,
      receita: currentMetrics.receita - previousMetrics.receita,
      ativos: currentMetrics.ativos - previousMetrics.ativos,
    },
    series,
    benchmark,
    quality: buildQualityChecklist({
      canViewNetwork: input.canViewNetwork,
      requestedScope: input.scope,
      scope: effectiveScope,
      benchmarkRows: benchmark.length,
      seriesPoints: series.length,
      tenantIds,
      latestEventDate,
    }),
    generatedAt: input.nowIso ?? new Date().toISOString().slice(0, 19),
  };
}

export function buildBiExportCsv(snapshot: BiOperationalSnapshot): string {
  const summaryHeaders = ["kpi", "valor"];
  const summaryRows = [
    ["Conversão (%)", snapshot.kpis.conversaoPct.toFixed(2)],
    ["Ocupação (%)", snapshot.kpis.ocupacaoPct.toFixed(2)],
    ["Inadimplência (%)", snapshot.kpis.inadimplenciaPct.toFixed(2)],
    ["Retenção (%)", snapshot.kpis.retencaoPct.toFixed(2)],
    ["Receita", snapshot.kpis.receita.toFixed(2)],
    ["Ativos", String(snapshot.kpis.ativos)],
  ];

  const benchmarkHeaders = ["tenant", "receita", "ativos", "conversao_pct", "ocupacao_pct", "inadimplencia_pct", "retencao_pct"];
  const benchmarkRows = snapshot.benchmark.map((row) => [
    row.tenantNome,
    row.receita.toFixed(2),
    String(row.ativos),
    row.conversaoPct.toFixed(2),
    row.ocupacaoPct.toFixed(2),
    row.inadimplenciaPct.toFixed(2),
    row.retencaoPct.toFixed(2),
  ]);

  const seriesHeaders = ["periodo", "receita", "conversao_pct", "ocupacao_pct", "inadimplencia_pct", "retencao_pct"];
  const seriesRows = snapshot.series.map((row) => [
    row.label,
    row.receita.toFixed(2),
    row.conversaoPct.toFixed(2),
    row.ocupacaoPct.toFixed(2),
    row.inadimplenciaPct.toFixed(2),
    row.retencaoPct.toFixed(2),
  ]);

  const sections = [
    [summaryHeaders, ...summaryRows],
    [[]],
    [benchmarkHeaders, ...benchmarkRows],
    [[]],
    [seriesHeaders, ...seriesRows],
  ];

  return sections
    .flat()
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

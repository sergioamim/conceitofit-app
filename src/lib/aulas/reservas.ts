import type {
  Atividade,
  AtividadeGrade,
  AulaSessao,
  DiaSemana,
  Funcionario,
  ReservaAula,
  ReservaAulaStatus,
  Sala,
} from "@/lib/types";

const DAY_ORDER: DiaSemana[] = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
const DAY_INDEX: Record<DiaSemana, number> = {
  SEG: 1,
  TER: 2,
  QUA: 3,
  QUI: 4,
  SEX: 5,
  SAB: 6,
  DOM: 0,
};

export const RESERVA_AULA_STATUS_LABEL: Record<ReservaAulaStatus, string> = {
  CONFIRMADA: "Confirmada",
  LISTA_ESPERA: "Lista de espera",
  CANCELADA: "Cancelada",
  CHECKIN: "Check-in",
};

export function createSessaoAulaId(atividadeGradeId: string, data: string): string {
  return `sessao-${atividadeGradeId}-${data}`;
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDiaSemana(date: Date): DiaSemana {
  return DAY_ORDER.find((day) => DAY_INDEX[day] === date.getDay()) ?? "SEG";
}

export function listDatesBetween(dateFrom: string, dateTo: string): string[] {
  const start = parseIsoDate(dateFrom);
  const end = parseIsoDate(dateTo);
  const dates: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    dates.push(toIsoDate(cursor));
  }
  return dates;
}

export function getNextOccurrenceForDiasSemana(
  diasSemana: DiaSemana[],
  reference = new Date()
): string {
  const base = new Date(reference);
  base.setHours(0, 0, 0, 0);
  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = addDays(base, offset);
    const day = formatDiaSemana(candidate);
    if (diasSemana.includes(day)) {
      return toIsoDate(candidate);
    }
  }
  return toIsoDate(base);
}

export function buildAulaSessao(input: {
  grade: AtividadeGrade;
  atividade: Atividade;
  data: string;
  sala?: Sala;
  funcionario?: Funcionario;
  vagasOcupadas: number;
  waitlistTotal: number;
}): AulaSessao {
  return {
    id: createSessaoAulaId(input.grade.id, input.data),
    tenantId: input.grade.tenantId,
    atividadeGradeId: input.grade.id,
    atividadeId: input.grade.atividadeId,
    atividadeNome: input.atividade.nome,
    data: input.data,
    diaSemana: formatDiaSemana(parseIsoDate(input.data)),
    horaInicio: input.grade.horaInicio,
    horaFim: input.grade.horaFim,
    capacidade: input.grade.capacidade,
    vagasOcupadas: input.vagasOcupadas,
    vagasDisponiveis: Math.max(0, input.grade.capacidade - input.vagasOcupadas),
    waitlistTotal: input.waitlistTotal,
    permiteReserva: input.grade.permiteReserva,
    listaEsperaHabilitada: !input.grade.desabilitarListaEspera,
    acessoClientes: input.grade.acessoClientes,
    exibirNoAppCliente: input.grade.exibirNoAppCliente,
    exibirNoAutoatendimento: input.grade.exibirNoAutoatendimento,
    checkinLiberadoMinutosAntes: input.grade.checkinLiberadoMinutosAntes,
    permiteCheckin: input.atividade.permiteCheckin,
    checkinObrigatorio: input.atividade.checkinObrigatorio,
    local: input.grade.local,
    salaNome: input.sala?.nome ?? input.grade.local,
    instrutorNome: input.funcionario?.nome ?? input.grade.instrutor,
    origemTipo: "GRADE_RECORRENTE",
    definicaoHorario: input.grade.definicaoHorario,
  };
}

export function sortSessoesAula(rows: AulaSessao[]): AulaSessao[] {
  return [...rows].sort((a, b) => {
    const dateCompare = a.data.localeCompare(b.data);
    if (dateCompare !== 0) return dateCompare;
    const startCompare = a.horaInicio.localeCompare(b.horaInicio);
    if (startCompare !== 0) return startCompare;
    return a.atividadeNome.localeCompare(b.atividadeNome, "pt-BR");
  });
}

export function sortReservasAula(rows: ReservaAula[]): ReservaAula[] {
  return [...rows].sort((a, b) => {
    if (a.posicaoListaEspera != null && b.posicaoListaEspera != null) {
      return a.posicaoListaEspera - b.posicaoListaEspera;
    }
    const createdCompare = a.dataCriacao.localeCompare(b.dataCriacao);
    if (createdCompare !== 0) return createdCompare;
    return a.alunoNome.localeCompare(b.alunoNome, "pt-BR");
  });
}

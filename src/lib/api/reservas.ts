/**
 * ⚠️ MÓDULO FANTASMA — Reservas de aulas (sessões, waitlist, check-in)
 *
 * Todos os endpoints `/api/v1/agenda/aulas/*` **ainda não existem no backend
 * Java** em 2026-04-10. Consumir este módulo hoje retorna 404.
 *
 * Status formalizado em ADR-001: manter o arquivo como "pronto para ligar".
 * Roadmap: PRD Q2 Épico 3.1 task 26 (portal do aluno "Minhas Aulas").
 *
 * Antes de consumir em nova tela: checar `isReservasAulasEnabled()` e esconder
 * o fluxo quando `false`. Normalizers, tipos e ordenação estão prontos — quando
 * o BE entregar, basta ligar a flag.
 *
 * @see docs/adr/ADR-001-modulos-fe-fantasma.md
 * @see docs/API_AUDIT_BACKEND_VS_FRONTEND.md seção A (P0)
 */
import { createSessaoAulaId, sortReservasAula, sortSessoesAula } from "@/lib/tenant/aulas/reservas";
import type {
  AulaOcupacao,
  AulaSessao,
  DiaSemana,
  ReservaAula,
  ReservaAulaOrigem,
} from "@/lib/types";
import { apiRequest } from "./http";

type ListPayload<T> =
  | T[]
  | {
      items?: T[];
      content?: T[];
      data?: T[];
      rows?: T[];
      result?: T[];
      itens?: T[];
    };

type AulaSessaoApiResponse = Partial<AulaSessao> & {
  id?: string | null;
  tenantId?: string | null;
  atividadeGradeId?: string | null;
  atividadeId?: string | null;
  atividadeNome?: string | null;
  data?: string | null;
  diaSemana?: DiaSemana | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  capacidade?: unknown;
  vagasOcupadas?: unknown;
  vagasDisponiveis?: unknown;
  waitlistTotal?: unknown;
  permiteReserva?: unknown;
  listaEsperaHabilitada?: unknown;
  acessoClientes?: AulaSessao["acessoClientes"] | null;
  exibirNoAppCliente?: unknown;
  exibirNoAutoatendimento?: unknown;
  checkinLiberadoMinutosAntes?: unknown;
  permiteCheckin?: unknown;
  checkinObrigatorio?: unknown;
  local?: string | null;
  salaNome?: string | null;
  instrutorNome?: string | null;
  origemTipo?: AulaSessao["origemTipo"] | null;
  ocorrenciaId?: string | null;
  definicaoHorario?: AulaSessao["definicaoHorario"] | null;
};

type ReservaAulaApiResponse = Partial<ReservaAula> & {
  id?: string | null;
  tenantId?: string | null;
  sessaoId?: string | null;
  atividadeGradeId?: string | null;
  atividadeId?: string | null;
  atividadeNome?: string | null;
  alunoId?: string | null;
  alunoNome?: string | null;
  data?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  origem?: ReservaAulaOrigem | null;
  status?: ReservaAula["status"] | null;
  posicaoListaEspera?: unknown;
  checkinEm?: string | null;
  canceladaEm?: string | null;
  local?: string | null;
  instrutorNome?: string | null;
  dataCriacao?: string | null;
  dataAtualizacao?: string | null;
};

type AulaOcupacaoApiResponse = Partial<AulaOcupacao> & {
  sessao?: AulaSessaoApiResponse | null;
  confirmadas?: ReservaAulaApiResponse[] | null;
  waitlist?: ReservaAulaApiResponse[] | null;
  canceladas?: ReservaAulaApiResponse[] | null;
  reservas?: ReservaAulaApiResponse[] | null;
  checkinsRealizados?: unknown;
};

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") return false;
  }
  return fallback;
}

function extractItems<T>(payload: ListPayload<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.content ?? payload.data ?? payload.rows ?? payload.result ?? payload.itens ?? [];
}

function normalizeSessao(input: AulaSessaoApiResponse, fallback?: Partial<AulaSessao>): AulaSessao {
  const atividadeGradeId = cleanString(input.atividadeGradeId) ?? fallback?.atividadeGradeId ?? "";
  const data = cleanString(input.data) ?? fallback?.data ?? "";
  const vagasOcupadas = Math.max(0, toNumber(input.vagasOcupadas, fallback?.vagasOcupadas ?? 0));
  const capacidade = Math.max(0, toNumber(input.capacidade, fallback?.capacidade ?? 0));
  const vagasDisponiveis = Math.max(
    0,
    toNumber(input.vagasDisponiveis, fallback?.vagasDisponiveis ?? capacidade - vagasOcupadas)
  );

  return {
    id: cleanString(input.id) ?? fallback?.id ?? createSessaoAulaId(atividadeGradeId, data),
    tenantId: cleanString(input.tenantId) ?? fallback?.tenantId ?? "",
    atividadeGradeId,
    atividadeId: cleanString(input.atividadeId) ?? fallback?.atividadeId ?? "",
    atividadeNome: cleanString(input.atividadeNome) ?? fallback?.atividadeNome ?? "",
    data,
    diaSemana: (input.diaSemana ?? fallback?.diaSemana ?? "SEG") as DiaSemana,
    horaInicio: cleanString(input.horaInicio) ?? fallback?.horaInicio ?? "00:00",
    horaFim: cleanString(input.horaFim) ?? fallback?.horaFim ?? "00:00",
    capacidade,
    vagasOcupadas,
    vagasDisponiveis,
    waitlistTotal: Math.max(0, toNumber(input.waitlistTotal, fallback?.waitlistTotal ?? 0)),
    permiteReserva: toBoolean(input.permiteReserva, fallback?.permiteReserva ?? true),
    listaEsperaHabilitada: toBoolean(
      input.listaEsperaHabilitada,
      fallback?.listaEsperaHabilitada ?? true
    ),
    acessoClientes: input.acessoClientes ?? fallback?.acessoClientes ?? "TODOS_CLIENTES",
    exibirNoAppCliente: toBoolean(input.exibirNoAppCliente, fallback?.exibirNoAppCliente ?? true),
    exibirNoAutoatendimento: toBoolean(
      input.exibirNoAutoatendimento,
      fallback?.exibirNoAutoatendimento ?? true
    ),
    checkinLiberadoMinutosAntes: Math.max(
      0,
      toNumber(input.checkinLiberadoMinutosAntes, fallback?.checkinLiberadoMinutosAntes ?? 15)
    ),
    permiteCheckin: toBoolean(input.permiteCheckin, fallback?.permiteCheckin ?? true),
    checkinObrigatorio: toBoolean(input.checkinObrigatorio, fallback?.checkinObrigatorio ?? false),
    local: cleanString(input.local) ?? fallback?.local,
    salaNome: cleanString(input.salaNome) ?? fallback?.salaNome,
    instrutorNome: cleanString(input.instrutorNome) ?? fallback?.instrutorNome,
    origemTipo: input.origemTipo ?? fallback?.origemTipo ?? "GRADE_RECORRENTE",
    ocorrenciaId: cleanString(input.ocorrenciaId) ?? fallback?.ocorrenciaId,
    definicaoHorario: input.definicaoHorario ?? fallback?.definicaoHorario,
  };
}

function normalizeReserva(input: ReservaAulaApiResponse, fallback?: Partial<ReservaAula>): ReservaAula {
  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    tenantId: cleanString(input.tenantId) ?? fallback?.tenantId ?? "",
    sessaoId: cleanString(input.sessaoId) ?? fallback?.sessaoId ?? "",
    atividadeGradeId: cleanString(input.atividadeGradeId) ?? fallback?.atividadeGradeId ?? "",
    atividadeId: cleanString(input.atividadeId) ?? fallback?.atividadeId ?? "",
    atividadeNome: cleanString(input.atividadeNome) ?? fallback?.atividadeNome ?? "",
    alunoId: cleanString(input.alunoId) ?? fallback?.alunoId ?? "",
    alunoNome: cleanString(input.alunoNome) ?? fallback?.alunoNome ?? "",
    data: cleanString(input.data) ?? fallback?.data ?? "",
    horaInicio: cleanString(input.horaInicio) ?? fallback?.horaInicio ?? "00:00",
    horaFim: cleanString(input.horaFim) ?? fallback?.horaFim ?? "00:00",
    origem: input.origem ?? fallback?.origem ?? "BACKOFFICE",
    status: input.status ?? fallback?.status ?? "CONFIRMADA",
    posicaoListaEspera:
      input.posicaoListaEspera == null && fallback?.posicaoListaEspera == null
        ? undefined
        : Math.max(1, toNumber(input.posicaoListaEspera, fallback?.posicaoListaEspera ?? 1)),
    checkinEm: cleanString(input.checkinEm) ?? fallback?.checkinEm,
    canceladaEm: cleanString(input.canceladaEm) ?? fallback?.canceladaEm,
    local: cleanString(input.local) ?? fallback?.local,
    instrutorNome: cleanString(input.instrutorNome) ?? fallback?.instrutorNome,
    dataCriacao: cleanString(input.dataCriacao) ?? fallback?.dataCriacao ?? new Date().toISOString(),
    dataAtualizacao: cleanString(input.dataAtualizacao) ?? fallback?.dataAtualizacao,
  };
}

function normalizeOcupacao(input: AulaOcupacaoApiResponse, tenantId: string, sessaoId: string): AulaOcupacao {
  const sessao = normalizeSessao(input.sessao ?? {}, {
    id: sessaoId,
    tenantId,
  });
  const fallbackBase = {
    tenantId,
    sessaoId,
    atividadeGradeId: sessao.atividadeGradeId,
    atividadeId: sessao.atividadeId,
    atividadeNome: sessao.atividadeNome,
    data: sessao.data,
    horaInicio: sessao.horaInicio,
    horaFim: sessao.horaFim,
    local: sessao.local,
    instrutorNome: sessao.instrutorNome,
  } satisfies Partial<ReservaAula>;

  const allReservas = Array.isArray(input.reservas)
    ? input.reservas.map((item) => normalizeReserva(item, fallbackBase))
    : [];

  const confirmadas = Array.isArray(input.confirmadas)
    ? input.confirmadas.map((item) => normalizeReserva(item, fallbackBase))
    : allReservas.filter((item) => item.status === "CONFIRMADA" || item.status === "CHECKIN");
  const waitlist = Array.isArray(input.waitlist)
    ? input.waitlist.map((item) => normalizeReserva(item, fallbackBase))
    : allReservas.filter((item) => item.status === "LISTA_ESPERA");
  const canceladas = Array.isArray(input.canceladas)
    ? input.canceladas.map((item) => normalizeReserva(item, fallbackBase))
    : allReservas.filter((item) => item.status === "CANCELADA");

  return {
    sessao,
    confirmadas: sortReservasAula(confirmadas),
    waitlist: sortReservasAula(waitlist),
    canceladas: sortReservasAula(canceladas),
    checkinsRealizados: Math.max(
      0,
      toNumber(
        input.checkinsRealizados,
        confirmadas.filter((item) => item.status === "CHECKIN" || Boolean(item.checkinEm)).length
      )
    ),
  };
}

export async function listAulasAgendaApi(input: {
  tenantId: string;
  dateFrom: string;
  dateTo: string;
  atividadeGradeId?: string;
  apenasPortal?: boolean;
}): Promise<AulaSessao[]> {
  const response = await apiRequest<ListPayload<AulaSessaoApiResponse>>({
    path: "/api/v1/agenda/aulas/sessoes",
    query: {
      tenantId: input.tenantId,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      atividadeGradeId: input.atividadeGradeId,
      apenasPortal: input.apenasPortal,
    },
  });

  return sortSessoesAula(
    extractItems(response).map((item) => normalizeSessao(item, { tenantId: input.tenantId }))
  );
}

export async function listReservasAulaApi(input: {
  tenantId: string;
  sessaoId?: string;
  alunoId?: string;
  status?: ReservaAula["status"];
}): Promise<ReservaAula[]> {
  const response = await apiRequest<ListPayload<ReservaAulaApiResponse>>({
    path: "/api/v1/agenda/aulas/reservas",
    query: {
      tenantId: input.tenantId,
      sessaoId: input.sessaoId,
      alunoId: input.alunoId,
      status: input.status,
    },
  });

  return sortReservasAula(
    extractItems(response).map((item) => normalizeReserva(item, { tenantId: input.tenantId }))
  );
}

export async function getAulaOcupacaoApi(input: {
  tenantId: string;
  sessaoId: string;
}): Promise<AulaOcupacao> {
  const response = await apiRequest<AulaOcupacaoApiResponse>({
    path: `/api/v1/agenda/aulas/sessoes/${input.sessaoId}/ocupacao`,
    query: {
      tenantId: input.tenantId,
    },
  });

  return normalizeOcupacao(response, input.tenantId, input.sessaoId);
}

export async function reservarAulaApi(input: {
  tenantId: string;
  data: {
    atividadeGradeId: string;
    data: string;
    alunoId: string;
    origem: ReservaAulaOrigem;
  };
}): Promise<ReservaAula> {
  const response = await apiRequest<ReservaAulaApiResponse>({
    path: "/api/v1/agenda/aulas/reservas",
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: input.data,
  });

  return normalizeReserva(response, {
    tenantId: input.tenantId,
    atividadeGradeId: input.data.atividadeGradeId,
    alunoId: input.data.alunoId,
    data: input.data.data,
    origem: input.data.origem,
  });
}

export async function cancelarReservaAulaApi(input: {
  tenantId: string;
  id: string;
}): Promise<ReservaAula> {
  const response = await apiRequest<ReservaAulaApiResponse>({
    path: `/api/v1/agenda/aulas/reservas/${input.id}/cancelar`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
  });

  return normalizeReserva(response, {
    id: input.id,
    tenantId: input.tenantId,
    status: "CANCELADA",
  });
}

export async function promoverReservaWaitlistApi(input: {
  tenantId: string;
  sessaoId: string;
}): Promise<ReservaAula | null> {
  const response = await apiRequest<ReservaAulaApiResponse | null>({
    path: `/api/v1/agenda/aulas/sessoes/${input.sessaoId}/promover-waitlist`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
  });

  if (!response) return null;
  return normalizeReserva(response, {
    tenantId: input.tenantId,
    sessaoId: input.sessaoId,
    status: "CONFIRMADA",
  });
}

export async function registrarCheckinAulaApi(input: {
  tenantId: string;
  id: string;
}): Promise<ReservaAula> {
  const response = await apiRequest<ReservaAulaApiResponse>({
    path: `/api/v1/agenda/aulas/reservas/${input.id}/checkin`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
  });

  return normalizeReserva(response, {
    id: input.id,
    tenantId: input.tenantId,
    status: "CHECKIN",
  });
}

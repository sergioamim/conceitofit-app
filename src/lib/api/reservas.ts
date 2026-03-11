import type {
  AulaOcupacao,
  AulaSessao,
  ReservaAula,
  ReservaAulaOrigem,
} from "@/lib/types";
import { apiRequest } from "./http";

type ListEnvelope<T> =
  | T[]
  | {
      items?: T[];
      content?: T[];
      data?: T[];
      rows?: T[];
      result?: T[];
      itens?: T[];
    };

function extractItems<T>(response: ListEnvelope<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? response.rows ?? response.result ?? response.itens ?? [];
}

export async function listAulasAgendaApi(input: {
  tenantId: string;
  dateFrom: string;
  dateTo: string;
  atividadeGradeId?: string;
  apenasPortal?: boolean;
}): Promise<AulaSessao[]> {
  const response = await apiRequest<ListEnvelope<AulaSessao>>({
    path: "/api/v1/academia/aulas/sessoes",
    query: {
      tenantId: input.tenantId,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      atividadeGradeId: input.atividadeGradeId,
      apenasPortal: input.apenasPortal,
    },
  });
  return extractItems(response);
}

export async function listReservasAulaApi(input: {
  tenantId: string;
  sessaoId?: string;
  alunoId?: string;
  status?: ReservaAula["status"];
}): Promise<ReservaAula[]> {
  const response = await apiRequest<ListEnvelope<ReservaAula>>({
    path: "/api/v1/academia/aulas/reservas",
    query: {
      tenantId: input.tenantId,
      sessaoId: input.sessaoId,
      alunoId: input.alunoId,
      status: input.status,
    },
  });
  return extractItems(response);
}

export async function getAulaOcupacaoApi(input: {
  tenantId: string;
  sessaoId: string;
}): Promise<AulaOcupacao> {
  return apiRequest<AulaOcupacao>({
    path: `/api/v1/academia/aulas/sessoes/${input.sessaoId}/ocupacao`,
    query: {
      tenantId: input.tenantId,
    },
  });
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
  return apiRequest<ReservaAula>({
    path: "/api/v1/academia/aulas/reservas",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function cancelarReservaAulaApi(input: {
  tenantId: string;
  id: string;
}): Promise<ReservaAula> {
  return apiRequest<ReservaAula>({
    path: `/api/v1/academia/aulas/reservas/${input.id}/cancelar`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

export async function promoverReservaWaitlistApi(input: {
  tenantId: string;
  sessaoId: string;
}): Promise<ReservaAula | null> {
  return apiRequest<ReservaAula | null>({
    path: `/api/v1/academia/aulas/sessoes/${input.sessaoId}/promover-waitlist`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

export async function registrarCheckinAulaApi(input: {
  tenantId: string;
  id: string;
}): Promise<ReservaAula> {
  return apiRequest<ReservaAula>({
    path: `/api/v1/academia/aulas/reservas/${input.id}/checkin`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

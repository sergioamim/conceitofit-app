import type {
  ConverterProspectInput,
  ConverterProspectResponse,
  CreateProspectInput,
  Prospect,
  ProspectAgendamento,
  ProspectMensagem,
  StatusAgendamento,
  StatusProspect,
} from "@/lib/types";
import { apiRequest } from "./http";

export async function listProspectsApi(input: {
  tenantId?: string;
  status?: StatusProspect;
  page?: number;
  size?: number;
}): Promise<Prospect[]> {
  return apiRequest<Prospect[]>({
    path: "/api/v1/crm/prospects",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      page: input.page,
      size: input.size,
    },
  });
}

export async function getProspectApi(input: {
  tenantId: string;
  id: string;
}): Promise<Prospect> {
  return apiRequest<Prospect>({
    path: `/api/v1/crm/prospects/${input.id}`,
    query: { tenantId: input.tenantId },
  });
}

export async function createProspectApi(input: {
  tenantId: string;
  data: CreateProspectInput;
}): Promise<Prospect> {
  return apiRequest<Prospect>({
    path: "/api/v1/crm/prospects",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function updateProspectApi(input: {
  tenantId: string;
  id: string;
  data: Partial<Omit<Prospect, "id" | "tenantId">>;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/crm/prospects/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function deleteProspectApi(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/crm/prospects/${input.id}`,
    method: "DELETE",
    query: { tenantId: input.tenantId },
  });
}

export async function updateProspectStatusApi(input: {
  tenantId: string;
  id: string;
  status: StatusProspect;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/crm/prospects/${input.id}/status`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
      status: input.status,
    },
  });
}

export async function marcarProspectPerdidoApi(input: {
  tenantId: string;
  id: string;
  motivo?: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/crm/prospects/${input.id}/perdido`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
      motivo: input.motivo,
    },
  });
}

export async function checkProspectDuplicateApi(input: {
  tenantId: string;
  telefone?: string;
  cpf?: string;
  email?: string;
}): Promise<boolean> {
  return apiRequest<boolean>({
    path: "/api/v1/crm/prospects/check-duplicate",
    query: {
      tenantId: input.tenantId,
      telefone: input.telefone,
      cpf: input.cpf,
      email: input.email,
    },
  });
}

export async function converterProspectApi(input: {
  tenantId: string;
  data: ConverterProspectInput;
}): Promise<ConverterProspectResponse> {
  return apiRequest<ConverterProspectResponse>({
    path: "/api/v1/crm/prospects/converter",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function listProspectMensagensApi(input: {
  tenantId: string;
  prospectId: string;
}): Promise<ProspectMensagem[]> {
  return apiRequest<ProspectMensagem[]>({
    path: `/api/v1/crm/prospects/${input.prospectId}/mensagens`,
    query: { tenantId: input.tenantId },
  });
}

export async function addProspectMensagemApi(input: {
  tenantId: string;
  prospectId: string;
  data: {
    texto: string;
    autorNome: string;
    autorId?: string;
  };
}): Promise<ProspectMensagem> {
  return apiRequest<ProspectMensagem>({
    path: `/api/v1/crm/prospects/${input.prospectId}/mensagens`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function listProspectAgendamentosApi(input: {
  tenantId: string;
  prospectId: string;
}): Promise<ProspectAgendamento[]> {
  return apiRequest<ProspectAgendamento[]>({
    path: `/api/v1/crm/prospects/${input.prospectId}/agendamentos`,
    query: { tenantId: input.tenantId },
  });
}

export async function criarProspectAgendamentoApi(input: {
  tenantId: string;
  prospectId: string;
  data: {
    funcionarioId: string;
    titulo: string;
    data: string;
    hora: string;
    observacoes?: string;
  };
}): Promise<ProspectAgendamento> {
  return apiRequest<ProspectAgendamento>({
    path: `/api/v1/crm/prospects/${input.prospectId}/agendamentos`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function updateProspectAgendamentoApi(input: {
  tenantId: string;
  id: string;
  status: StatusAgendamento;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/crm/prospect-agendamentos/${input.id}/status`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
      status: input.status,
    },
  });
}

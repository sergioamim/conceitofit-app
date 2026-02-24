import type { Aluno, Matricula, Pagamento, StatusAluno } from "@/lib/types";
import { apiRequest } from "./http";

type CreateAlunoInput = {
  nome: string;
  email: string;
  telefone: string;
  telefoneSec?: string;
  cpf: string;
  dataNascimento: string;
  sexo: "M" | "F" | "OUTRO";
  rg?: string;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  contatoEmergencia?: {
    nome: string;
    telefone: string;
    parentesco?: string;
  };
  observacoesMedicas?: string;
  foto?: string;
};

type CreateAlunoComMatriculaInput = CreateAlunoInput & {
  planoId: string;
  dataInicio: string;
  formaPagamento: string;
  desconto?: number;
  motivoDesconto?: string;
};

type CreateAlunoComMatriculaResponse = {
  aluno: Aluno;
  matricula: Matricula;
  pagamento: Pagamento;
};

export async function listAlunosApi(input: {
  tenantId: string;
  status?: StatusAluno;
  page?: number;
  size?: number;
}): Promise<Aluno[]> {
  return apiRequest<Aluno[]>({
    path: "/api/v1/comercial/alunos",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      page: input.page,
      size: input.size,
    },
  });
}

export async function getAlunoApi(input: {
  tenantId: string;
  id: string;
}): Promise<Aluno> {
  return apiRequest<Aluno>({
    path: `/api/v1/comercial/alunos/${input.id}`,
    query: { tenantId: input.tenantId },
  });
}

export async function createAlunoApi(input: {
  tenantId: string;
  data: CreateAlunoInput;
}): Promise<Aluno> {
  return apiRequest<Aluno>({
    path: "/api/v1/comercial/alunos",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function updateAlunoApi(input: {
  tenantId: string;
  id: string;
  data: Partial<Omit<Aluno, "id" | "tenantId" | "dataCadastro">>;
}): Promise<Aluno> {
  return apiRequest<Aluno>({
    path: `/api/v1/comercial/alunos/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

export async function updateAlunoStatusApi(input: {
  tenantId: string;
  id: string;
  status: StatusAluno;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/alunos/${input.id}/status`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
      status: input.status,
    },
  });
}

export async function createAlunoComMatriculaApi(input: {
  tenantId: string;
  data: CreateAlunoComMatriculaInput;
}): Promise<CreateAlunoComMatriculaResponse> {
  return apiRequest<CreateAlunoComMatriculaResponse>({
    path: "/api/v1/comercial/alunos-com-matricula",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

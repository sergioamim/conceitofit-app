import type { Atividade, AtividadeGrade, Cargo, Funcionario, Sala, CategoriaAtividade } from "@/lib/types";
import { apiRequest } from "./http";

export async function listCargosApi(apenasAtivos?: boolean): Promise<Cargo[]> {
  return apiRequest<Cargo[]>({
    path: "/api/v1/administrativo/cargos",
    query: { apenasAtivos: apenasAtivos ?? false },
  });
}

export async function createCargoApi(data: { nome: string }): Promise<Cargo> {
  return apiRequest<Cargo>({
    path: "/api/v1/administrativo/cargos",
    method: "POST",
    body: data,
  });
}

export async function updateCargoApi(id: string, data: Partial<Cargo>): Promise<Cargo> {
  return apiRequest<Cargo>({
    path: `/api/v1/administrativo/cargos/${id}`,
    method: "PUT",
    body: { nome: data.nome, ativo: data.ativo },
  });
}

export async function toggleCargoApi(id: string): Promise<Cargo> {
  return apiRequest<Cargo>({
    path: `/api/v1/administrativo/cargos/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteCargoApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/cargos/${id}`,
    method: "DELETE",
  });
}

export async function listFuncionariosApi(apenasAtivos?: boolean): Promise<Funcionario[]> {
  return apiRequest<Funcionario[]>({
    path: "/api/v1/administrativo/funcionarios",
    query: { apenasAtivos: apenasAtivos ?? true },
  });
}

export async function createFuncionarioApi(
  data: Omit<Funcionario, "id" | "ativo">
): Promise<Funcionario> {
  return apiRequest<Funcionario>({
    path: "/api/v1/administrativo/funcionarios",
    method: "POST",
    body: data,
  });
}

export async function updateFuncionarioApi(id: string, data: Partial<Funcionario>): Promise<Funcionario> {
  return apiRequest<Funcionario>({
    path: `/api/v1/administrativo/funcionarios/${id}`,
    method: "PUT",
    body: data,
  });
}

export async function toggleFuncionarioApi(id: string): Promise<Funcionario> {
  return apiRequest<Funcionario>({
    path: `/api/v1/administrativo/funcionarios/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteFuncionarioApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/funcionarios/${id}`,
    method: "DELETE",
  });
}

export async function listSalasApi(apenasAtivas?: boolean): Promise<Sala[]> {
  return apiRequest<Sala[]>({
    path: "/api/v1/administrativo/salas",
    query: { apenasAtivas: apenasAtivas ?? false },
  });
}

export async function createSalaApi(data: Omit<Sala, "id" | "tenantId" | "ativo">): Promise<Sala> {
  return apiRequest<Sala>({
    path: "/api/v1/administrativo/salas",
    method: "POST",
    body: data,
  });
}

export async function updateSalaApi(id: string, data: Partial<Sala>): Promise<Sala> {
  return apiRequest<Sala>({
    path: `/api/v1/administrativo/salas/${id}`,
    method: "PUT",
    body: data,
  });
}

export async function toggleSalaApi(id: string): Promise<Sala> {
  return apiRequest<Sala>({
    path: `/api/v1/administrativo/salas/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteSalaApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/salas/${id}`,
    method: "DELETE",
  });
}

export async function listAtividadesApi(params?: {
  apenasAtivas?: boolean;
  categoria?: CategoriaAtividade;
}): Promise<Atividade[]> {
  return apiRequest<Atividade[]>({
    path: "/api/v1/administrativo/atividades",
    query: {
      apenasAtivas: params?.apenasAtivas,
      categoria: params?.categoria,
    },
  });
}

export async function createAtividadeApi(
  data: Omit<Atividade, "id" | "tenantId" | "ativo">
): Promise<Atividade> {
  return apiRequest<Atividade>({
    path: "/api/v1/administrativo/atividades",
    method: "POST",
    body: data,
  });
}

export async function updateAtividadeApi(id: string, data: Partial<Atividade>): Promise<Atividade> {
  return apiRequest<Atividade>({
    path: `/api/v1/administrativo/atividades/${id}`,
    method: "PUT",
    body: data,
  });
}

export async function toggleAtividadeApi(id: string): Promise<Atividade> {
  return apiRequest<Atividade>({
    path: `/api/v1/administrativo/atividades/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteAtividadeApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/atividades/${id}`,
    method: "DELETE",
  });
}

export async function listAtividadeGradesApi(params?: {
  atividadeId?: string;
  apenasAtivas?: boolean;
}): Promise<AtividadeGrade[]> {
  return apiRequest<AtividadeGrade[]>({
    path: "/api/v1/administrativo/atividades-grade",
    query: {
      atividadeId: params?.atividadeId,
      apenasAtivas: params?.apenasAtivas,
    },
  });
}

export async function createAtividadeGradeApi(
  data: Omit<AtividadeGrade, "id" | "tenantId" | "ativo">
): Promise<AtividadeGrade> {
  return apiRequest<AtividadeGrade>({
    path: "/api/v1/administrativo/atividades-grade",
    method: "POST",
    body: data,
  });
}

export async function updateAtividadeGradeApi(
  id: string,
  data: Partial<AtividadeGrade>
): Promise<AtividadeGrade> {
  return apiRequest<AtividadeGrade>({
    path: `/api/v1/administrativo/atividades-grade/${id}`,
    method: "PUT",
    body: data,
  });
}

export async function toggleAtividadeGradeApi(id: string): Promise<AtividadeGrade> {
  return apiRequest<AtividadeGrade>({
    path: `/api/v1/administrativo/atividades-grade/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteAtividadeGradeApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/atividades-grade/${id}`,
    method: "DELETE",
  });
}

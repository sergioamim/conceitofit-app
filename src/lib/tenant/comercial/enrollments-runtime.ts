"use client";

import {
  cancelarMatriculaApi,
  createMatriculaApi,
  listMatriculasDashboardMensalApi,
  listMatriculasApi,
  listMatriculasByAlunoApi,
  listMatriculasPageApi,
  renovarMatriculaApi,
} from "@/lib/api/matriculas";
import { type Contrato, contratoFromMatricula } from "./contratos";

export async function listMatriculasService(input: {
  tenantId: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  return listMatriculasApi(input);
}

export async function listMatriculasPageService(input: {
  tenantId: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  return listMatriculasPageApi(input);
}

export async function getMatriculasDashboardMensalService(input: {
  tenantId: string;
  mes: string;
  page?: number;
  size?: number;
}) {
  return listMatriculasDashboardMensalApi(input);
}

export async function listMatriculasByAlunoService(input: {
  tenantId: string;
  alunoId: string;
  page?: number;
  size?: number;
}) {
  return listMatriculasByAlunoApi(input);
}

export async function createMatriculaService(input: {
  tenantId: string;
  data: Parameters<typeof createMatriculaApi>[0]["data"];
}) {
  return createMatriculaApi(input);
}

export async function cancelarMatriculaService(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  return cancelarMatriculaApi(input);
}

export async function renovarMatriculaService(input: {
  tenantId: string;
  id: string;
  planoId?: string;
}): Promise<void> {
  return renovarMatriculaApi(input);
}

export async function listContratosService(input: {
  tenantId: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<Contrato[]> {
  const matriculas = await listMatriculasApi(input);
  return matriculas.map(contratoFromMatricula);
}

export async function listContratosByAlunoService(input: {
  tenantId: string;
  alunoId: string;
  page?: number;
  size?: number;
}): Promise<Contrato[]> {
  const matriculas = await listMatriculasByAlunoApi(input);
  return matriculas.map(contratoFromMatricula);
}

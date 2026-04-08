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
import { createAssinaturaApi, cancelarAssinaturaApi } from "@/lib/api/billing";
import { logger } from "@/lib/shared/logger";
import { type Contrato, contratoFromMatricula } from "./contratos";

async function listMatriculasService(input: {
  tenantId: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  return listMatriculasApi(input);
}

async function listMatriculasPageService(input: {
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

async function createMatriculaService(input: {
  tenantId: string;
  data: Parameters<typeof createMatriculaApi>[0]["data"];
  planoRecorrente?: boolean;
  cicloPlano?: "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
}) {
  const matricula = await createMatriculaApi({
    tenantId: input.tenantId,
    data: input.data,
  });

  // Se plano recorrente, criar assinatura no gateway de billing
  if (input.planoRecorrente && matricula.alunoId && matricula.planoId) {
    try {
      const assinatura = await createAssinaturaApi({
        tenantId: input.tenantId,
        data: {
          alunoId: matricula.alunoId,
          planoId: matricula.planoId,
          dataInicio: matricula.dataInicio,
          ciclo: input.cicloPlano,
        },
      });
      matricula.assinaturaId = assinatura.id;
      matricula.assinaturaStatus = assinatura.status;
    } catch (error) {
      logger.warn("[Matricula] Falha ao criar assinatura recorrente, matrícula criada sem billing", {
        module: "enrollments",
        error,
      });
    }
  }

  return matricula;
}

export async function cancelarMatriculaService(input: {
  tenantId: string;
  id: string;
  assinaturaId?: string;
}): Promise<void> {
  await cancelarMatriculaApi({ tenantId: input.tenantId, id: input.id });

  // Propagar cancelamento para a assinatura se existir
  if (input.assinaturaId) {
    try {
      await cancelarAssinaturaApi({
        tenantId: input.tenantId,
        id: input.assinaturaId,
      });
    } catch (error) {
      logger.warn("[Matricula] Falha ao cancelar assinatura vinculada", {
        module: "enrollments",
        error,
      });
    }
  }
}

export async function renovarMatriculaService(input: {
  tenantId: string;
  id: string;
  planoId?: string;
}): Promise<void> {
  return renovarMatriculaApi(input);
}

async function listContratosService(input: {
  tenantId: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<Contrato[]> {
  const matriculas = await listMatriculasApi(input);
  return matriculas.map(contratoFromMatricula);
}

async function listContratosByAlunoService(input: {
  tenantId: string;
  alunoId: string;
  page?: number;
  size?: number;
}): Promise<Contrato[]> {
  const matriculas = await listMatriculasByAlunoApi(input);
  return matriculas.map(contratoFromMatricula);
}

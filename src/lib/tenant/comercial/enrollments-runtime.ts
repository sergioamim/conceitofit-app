"use client";

import {
  cancelarContratoApi,
  createContratoApi,
  listContratosDashboardMensalApi,
  listContratosApi,
  listContratosByAlunoApi,
  listContratosPageApi,
  renovarContratoApi,
} from "@/lib/api/matriculas";
import { createAssinaturaApi, cancelarAssinaturaApi } from "@/lib/api/billing";
import { logger } from "@/lib/shared/logger";
import { type ContratoView, contratoViewFromMatricula } from "./contratos";

async function listContratosService(input: {
  tenantId: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  return listContratosApi(input);
}

async function listContratosPageService(input: {
  tenantId: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  return listContratosPageApi(input);
}

export async function getContratosDashboardMensalService(input: {
  tenantId: string;
  mes: string;
  page?: number;
  size?: number;
}) {
  return listContratosDashboardMensalApi(input);
}

export async function listContratosByAlunoService(input: {
  tenantId: string;
  alunoId: string;
  page?: number;
  size?: number;
}) {
  return listContratosByAlunoApi(input);
}

async function createContratoService(input: {
  tenantId: string;
  data: Parameters<typeof createContratoApi>[0]["data"];
  planoRecorrente?: boolean;
  cicloPlano?: "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
}) {
  const contrato = await createContratoApi({
    tenantId: input.tenantId,
    data: input.data,
  });

  // Se plano recorrente, criar assinatura no gateway de billing
  if (input.planoRecorrente && contrato.alunoId && contrato.planoId) {
    try {
      const assinatura = await createAssinaturaApi({
        tenantId: input.tenantId,
        data: {
          alunoId: contrato.alunoId,
          planoId: contrato.planoId,
          dataInicio: contrato.dataInicio,
          ciclo: input.cicloPlano,
        },
      });
      contrato.assinaturaId = assinatura.id;
      contrato.assinaturaStatus = assinatura.status;
    } catch (error) {
      logger.warn("[Contrato] Falha ao criar assinatura recorrente, contrato criado sem billing", {
        module: "enrollments",
        error,
      });
    }
  }

  return contrato;
}

export async function cancelarContratoService(input: {
  tenantId: string;
  id: string;
  assinaturaId?: string;
}): Promise<void> {
  await cancelarContratoApi({ tenantId: input.tenantId, id: input.id });

  // Propagar cancelamento para a assinatura se existir
  if (input.assinaturaId) {
    try {
      await cancelarAssinaturaApi({
        tenantId: input.tenantId,
        id: input.assinaturaId,
      });
    } catch (error) {
      logger.warn("[Contrato] Falha ao cancelar assinatura vinculada", {
        module: "enrollments",
        error,
      });
    }
  }
}

export async function renovarContratoService(input: {
  tenantId: string;
  id: string;
  planoId?: string;
}): Promise<void> {
  return renovarContratoApi(input);
}

async function listContratosViewService(input: {
  tenantId: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<ContratoView[]> {
  const contratos = await listContratosApi(input);
  return contratos.map(contratoViewFromMatricula);
}

async function listContratosViewByAlunoService(input: {
  tenantId: string;
  alunoId: string;
  page?: number;
  size?: number;
}): Promise<ContratoView[]> {
  const contratos = await listContratosByAlunoApi(input);
  return contratos.map(contratoViewFromMatricula);
}

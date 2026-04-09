import { apiRequest } from "@/lib/api/http";
import type {
  UnidadeOnboardingOrigem,
  UnidadeOnboardingState,
  UnidadeOnboardingStatus,
  UnidadeOnboardingStrategy,
} from "@/lib/types";

type SaveUnidadeOnboardingInput = {
  tenantId: string;
  academiaId?: string;
  estrategia: UnidadeOnboardingStrategy;
  evoFilialId?: string;
  status?: UnidadeOnboardingStatus;
  ultimaMensagem?: string;
};

type RegistrarImportacaoOnboardingInput = {
  tenantId: string;
  academiaId?: string;
  jobId: string;
  origem: UnidadeOnboardingOrigem;
  estrategiaFallback?: UnidadeOnboardingStrategy;
  mensagem?: string;
};

type AtualizarImportacaoOnboardingStatusInput = {
  tenantId: string;
  academiaId?: string;
  jobId?: string;
  importStatus: "PROCESSANDO" | "CONCLUIDO" | "CONCLUIDO_COM_REJEICOES" | "FALHA";
  origem?: UnidadeOnboardingOrigem;
  mensagem?: string;
};

function trimString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function defaultStatusForStrategy(strategy: UnidadeOnboardingStrategy): UnidadeOnboardingStatus {
  switch (strategy) {
    case "CARGA_INICIAL":
      return "PENDENTE_SEED";
    case "IMPORTAR_DEPOIS":
    case "PREPARAR_ETL":
    default:
      return "AGUARDANDO_IMPORTACAO";
  }
}

export function getUnidadeOnboardingStrategyLabel(strategy?: UnidadeOnboardingStrategy) {
  switch (strategy) {
    case "CARGA_INICIAL":
      return "Carga inicial";
    case "IMPORTAR_DEPOIS":
      return "Importar depois";
    case "PREPARAR_ETL":
      return "Preparar ETL";
    default:
      return "Não definido";
  }
}

export function getUnidadeOnboardingStatusLabel(status?: UnidadeOnboardingStatus) {
  switch (status) {
    case "PENDENTE_SEED":
      return "Pendente de seed";
    case "AGUARDANDO_IMPORTACAO":
      return "Aguardando importação";
    case "EM_IMPORTACAO":
      return "Importando";
    case "PRONTA":
      return "Pronta";
    case "ERRO":
      return "Erro";
    default:
      return "Sem status";
  }
}

export async function listUnidadesOnboarding(): Promise<UnidadeOnboardingState[]> {
  return apiRequest<UnidadeOnboardingState[]>({
    path: "/api/v1/admin/unidades/onboarding",
  });
}

export async function saveUnidadeOnboarding(input: SaveUnidadeOnboardingInput): Promise<UnidadeOnboardingState> {
  const tenantId = trimString(input.tenantId);
  if (!tenantId) {
    throw new Error("tenantId é obrigatório para salvar onboarding.");
  }

  return apiRequest<UnidadeOnboardingState>({
    path: `/api/v1/admin/unidades/${tenantId}/onboarding`,
    method: "PUT",
    body: {
      tenantId,
      academiaId: trimString(input.academiaId),
      estrategia: input.estrategia,
      evoFilialId: trimString(input.evoFilialId),
      status: input.status ?? defaultStatusForStrategy(input.estrategia),
      ultimaMensagem: trimString(input.ultimaMensagem),
    },
  });
}

export async function registrarImportacaoOnboarding(
  input: RegistrarImportacaoOnboardingInput
): Promise<UnidadeOnboardingState> {
  return atualizarImportacaoOnboardingStatus({
    tenantId: input.tenantId,
    academiaId: input.academiaId,
    jobId: input.jobId,
    origem: input.origem,
    importStatus: "PROCESSANDO",
    mensagem: input.mensagem ?? `Job ${input.jobId} criado.`,
  });
}

export async function atualizarImportacaoOnboardingStatus(
  input: AtualizarImportacaoOnboardingStatusInput
): Promise<UnidadeOnboardingState> {
  return apiRequest<UnidadeOnboardingState>({
    path: `/api/v1/admin/unidades/${input.tenantId}/onboarding/job-status`,
    method: "POST",
    body: {
      tenantId: input.tenantId,
      academiaId: trimString(input.academiaId),
      jobId: trimString(input.jobId),
      importStatus: input.importStatus,
      origem: input.origem,
      mensagem: trimString(input.mensagem),
    },
  });
}

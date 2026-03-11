import { apiRequest, isRealApiEnabled } from "@/lib/api/http";
import type {
  UnidadeOnboardingEvent,
  UnidadeOnboardingOrigem,
  UnidadeOnboardingState,
  UnidadeOnboardingStatus,
  UnidadeOnboardingStrategy,
} from "@/lib/types";

const STORAGE_KEY = "backoffice-unidades-onboarding";

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

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function trimString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function readLocalState(): UnidadeOnboardingState[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is UnidadeOnboardingState => Boolean(item?.tenantId));
  } catch {
    return [];
  }
}

function writeLocalState(items: UnidadeOnboardingState[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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

function buildStrategyEvent(
  tenantId: string,
  strategy: UnidadeOnboardingStrategy,
  status: UnidadeOnboardingStatus
): UnidadeOnboardingEvent {
  if (strategy === "CARGA_INICIAL") {
    return {
      id: createId("evt"),
      tenantId,
      type: "SEED_AGENDADO",
      titulo: "Carga inicial configurada",
      descricao: "A unidade foi marcada para receber dados iniciais padrão.",
      status,
      origem: "SEED",
      criadoEm: nowIso(),
    };
  }
  if (strategy === "PREPARAR_ETL") {
    return {
      id: createId("evt"),
      tenantId,
      type: "IMPORTACAO_PREPARADA",
      titulo: "ETL preparado",
      descricao: "A unidade aguarda vínculo de filial EVO e criação do job de importação.",
      status,
      origem: "PACOTE",
      criadoEm: nowIso(),
    };
  }
  return {
    id: createId("evt"),
    tenantId,
    type: "ESTRATEGIA_DEFINIDA",
    titulo: "Importação adiada",
    descricao: "A unidade foi criada para importar dados depois.",
    status,
    origem: "MANUAL",
    criadoEm: nowIso(),
  };
}

function upsertLocalState(nextState: UnidadeOnboardingState) {
  const current = readLocalState();
  const updated = [nextState, ...current.filter((item) => item.tenantId !== nextState.tenantId)];
  writeLocalState(updated);
  return nextState;
}

function mapImportStatus(status: AtualizarImportacaoOnboardingStatusInput["importStatus"]): UnidadeOnboardingStatus {
  switch (status) {
    case "PROCESSANDO":
      return "EM_IMPORTACAO";
    case "CONCLUIDO":
    case "CONCLUIDO_COM_REJEICOES":
      return "PRONTA";
    case "FALHA":
    default:
      return "ERRO";
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
  if (isRealApiEnabled()) {
    try {
      return await apiRequest<UnidadeOnboardingState[]>({
        path: "/api/v1/admin/unidades/onboarding",
      });
    } catch (error) {
      console.warn("[backoffice][onboarding] Falha ao listar onboarding na API real. Usando storage local.", error);
    }
  }
  return readLocalState();
}

export async function getUnidadeOnboarding(tenantId: string): Promise<UnidadeOnboardingState | null> {
  if (isRealApiEnabled()) {
    try {
      return await apiRequest<UnidadeOnboardingState>({
        path: `/api/v1/admin/unidades/${tenantId}/onboarding`,
      });
    } catch (error) {
      console.warn("[backoffice][onboarding] Falha ao obter onboarding na API real. Usando storage local.", error);
    }
  }
  return readLocalState().find((item) => item.tenantId === tenantId) ?? null;
}

export async function saveUnidadeOnboarding(input: SaveUnidadeOnboardingInput): Promise<UnidadeOnboardingState> {
  const tenantId = trimString(input.tenantId);
  if (!tenantId) {
    throw new Error("tenantId é obrigatório para salvar onboarding.");
  }

  const estrategia = input.estrategia;
  const defaultStatus = defaultStatusForStrategy(estrategia);
  const status = input.status ?? defaultStatus;

  if (isRealApiEnabled()) {
    try {
      return await apiRequest<UnidadeOnboardingState>({
        path: `/api/v1/admin/unidades/${tenantId}/onboarding`,
        method: "PUT",
        body: {
          tenantId,
          academiaId: trimString(input.academiaId),
          estrategia,
          evoFilialId: trimString(input.evoFilialId),
          status,
          ultimaMensagem: trimString(input.ultimaMensagem),
        },
      });
    } catch (error) {
      console.warn("[backoffice][onboarding] Falha ao salvar onboarding na API real. Usando storage local.", error);
    }
  }

  const now = nowIso();
  const current = readLocalState().find((item) => item.tenantId === tenantId);
  const next: UnidadeOnboardingState = current
    ? {
        ...current,
        academiaId: trimString(input.academiaId) ?? current.academiaId,
        estrategia,
        status,
        evoFilialId: trimString(input.evoFilialId),
        ultimaMensagem: trimString(input.ultimaMensagem) ?? current.ultimaMensagem,
        atualizadoEm: now,
        eventos: [
          {
            id: createId("evt"),
            tenantId,
            type: "ESTRATEGIA_DEFINIDA",
            titulo: "Estratégia de onboarding atualizada",
            descricao: `Estratégia atual: ${getUnidadeOnboardingStrategyLabel(estrategia)}.`,
            status,
            origem: estrategia === "CARGA_INICIAL" ? "SEED" : "MANUAL",
            criadoEm: now,
          },
          ...current.eventos,
        ],
      }
    : {
        tenantId,
        academiaId: trimString(input.academiaId),
        estrategia,
        status,
        evoFilialId: trimString(input.evoFilialId),
        ultimaMensagem: trimString(input.ultimaMensagem),
        criadoEm: now,
        atualizadoEm: now,
        eventos: [
          {
            id: createId("evt"),
            tenantId,
            type: "UNIDADE_CRIADA",
            titulo: "Unidade adicionada ao backoffice",
            descricao: "Acompanhe o onboarding e a importação desta unidade nesta linha do tempo.",
            status,
            criadoEm: now,
          },
          buildStrategyEvent(tenantId, estrategia, status),
        ],
      };

  return upsertLocalState(next);
}

export async function registrarImportacaoOnboarding(
  input: RegistrarImportacaoOnboardingInput
): Promise<UnidadeOnboardingState> {
  const current =
    (await getUnidadeOnboarding(input.tenantId)) ??
    ({
      tenantId: input.tenantId,
      academiaId: input.academiaId,
      estrategia: input.estrategiaFallback ?? "PREPARAR_ETL",
      status: "AGUARDANDO_IMPORTACAO",
      criadoEm: nowIso(),
      atualizadoEm: nowIso(),
      eventos: [],
    } as UnidadeOnboardingState);

  return saveUnidadeOnboarding({
    tenantId: input.tenantId,
    academiaId: input.academiaId ?? current.academiaId,
    estrategia: current.estrategia ?? input.estrategiaFallback ?? "PREPARAR_ETL",
    evoFilialId: current.evoFilialId,
    status: "EM_IMPORTACAO",
    ultimaMensagem: input.mensagem ?? `Job ${input.jobId} criado.`,
  }).then((saved) => {
    const next: UnidadeOnboardingState = {
      ...saved,
      ultimoJobId: input.jobId,
      ultimaOrigem: input.origem,
      atualizadoEm: nowIso(),
      eventos: [
        {
          id: createId("evt"),
          tenantId: input.tenantId,
          type: "JOB_CRIADO",
          titulo: "Job de importação criado",
          descricao: input.mensagem ?? `Job ${input.jobId} iniciado para ${input.origem.toLowerCase()}.`,
          status: "EM_IMPORTACAO",
          origem: input.origem,
          jobId: input.jobId,
          criadoEm: nowIso(),
        },
        ...saved.eventos,
      ],
    };
    return upsertLocalState(next);
  });
}

export async function atualizarImportacaoOnboardingStatus(
  input: AtualizarImportacaoOnboardingStatusInput
): Promise<UnidadeOnboardingState> {
  const current =
    (await getUnidadeOnboarding(input.tenantId)) ??
    ({
      tenantId: input.tenantId,
      academiaId: input.academiaId,
      estrategia: "PREPARAR_ETL",
      status: "AGUARDANDO_IMPORTACAO",
      criadoEm: nowIso(),
      atualizadoEm: nowIso(),
      eventos: [],
    } as UnidadeOnboardingState);
  const nextStatus = mapImportStatus(input.importStatus);

  if (isRealApiEnabled()) {
    try {
      return await apiRequest<UnidadeOnboardingState>({
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
    } catch (error) {
      console.warn("[backoffice][onboarding] Falha ao atualizar status de importação na API real. Usando storage local.", error);
    }
  }

  const next: UnidadeOnboardingState = {
    ...current,
    academiaId: trimString(input.academiaId) ?? current.academiaId,
    status: nextStatus,
    ultimoJobId: trimString(input.jobId) ?? current.ultimoJobId,
    ultimaOrigem: input.origem ?? current.ultimaOrigem,
    ultimaMensagem: trimString(input.mensagem) ?? current.ultimaMensagem,
    atualizadoEm: nowIso(),
    eventos: [
      {
        id: createId("evt"),
        tenantId: input.tenantId,
        type: "JOB_STATUS_ATUALIZADO",
        titulo: `Status da importação: ${getUnidadeOnboardingStatusLabel(nextStatus)}`,
        descricao: trimString(input.mensagem) ?? `Job ${input.jobId ?? current.ultimoJobId ?? "—"} atualizado pelo backoffice.`,
        status: nextStatus,
        origem: input.origem ?? current.ultimaOrigem,
        jobId: trimString(input.jobId) ?? current.ultimoJobId,
        criadoEm: nowIso(),
      },
      ...current.eventos,
    ],
  };

  return upsertLocalState(next);
}

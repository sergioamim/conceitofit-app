import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SuggestionOption } from "@/components/shared/suggestion-input";
import { useToast } from "@/components/ui/use-toast";
import { ApiRequestError } from "@/lib/api/http";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import {
  type EvoImportColaboradoresBlocoResumo,
  type EvoImportColaboradoresResumo,
  type EvoImportEntidadeResumo as EntidadeResumo,
  type EvoImportJobResumo as JobResumo,
  type EvoImportJobStatus as EvoStatus,
  type EvoImportRejeicao as Rejeicao,
  type UploadAnaliseArquivo,
  type UploadAnaliseFilial,
  type UploadAnaliseResponse,
} from "@/lib/api/importacao-evo";
import { createGlobalUnidade, listGlobalAcademias, listGlobalUnidades } from "@/lib/backoffice/admin";
import {
  createBackofficeEvoP0CsvJob,
  createBackofficeEvoP0PacoteJob,
  type EvoArquivoHistoricoNormalizado,
  getBackofficeEvoImportJobResumo,
  getBackofficeEvoP0PacoteAnalise,
  listBackofficeEvoImportJobRejeicoes,
  normalizeEvoColaboradorDiagnostico,
  normalizeUploadAnaliseArquivoHistorico,
  uploadBackofficeEvoP0Pacote,
} from "@/lib/backoffice/importacao-evo";
import {
  atualizarImportacaoOnboardingStatus,
  getUnidadeOnboardingStatusLabel,
  getUnidadeOnboardingStrategyLabel,
  listUnidadesOnboarding,
  registrarImportacaoOnboarding,
  saveUnidadeOnboarding,
} from "@/lib/backoffice/onboarding";
import { listEligibleNewUnitAdminsPreview } from "@/lib/backoffice/seguranca";
import type { Academia, GlobalAdminUserSummary, Tenant, UnidadeOnboardingState } from "@/lib/types";
import { formatCnpj, isValidCnpj } from "@/lib/utils/cnpj";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { normalizeSubdomain } from "@/lib/utils/subdomain";
import { formatDateTime, formatJobAliasDate } from "../date-time-format";
import { logger } from "@/lib/shared/logger";

import {
  type JobHistoryMeta,
  type PacoteArquivoChave,
  type ColaboradorBlocoKey,
  type ColaboradorArquivoConfig,
  type PacoteArquivoDisponivel,
  type RejeicaoClassificada,
  type ColaboradorResumoCard,
  type FileMap,
  type MapeamentoFilial,
  type NovaUnidadePacoteForm,
  PACOTE_CHAVES_DISPONIVEIS,
  COLABORADOR_ARQUIVOS_CONFIG,
  COLABORADOR_BLOCO_CONFIG,
  IMPORT_RESUMO_CARD_CONFIG,
  JOB_HISTORY_KEY,
  JOB_HISTORY_LIMIT,
  STORAGE_KEY,
  ENTIDADE_TODAS,
  BLOCO_TODOS,
  resolveTenantForStorage,
  colaboradorArquivoAliasIndex,
  colaboradorBlocoMetaIndex,
  FILE_FIELDS,
  FILE_UPLOAD_GROUPS,
  isOnboardingCollectionRouteError,
  normalizeTenantId,
  parsePositiveInteger,
  normalizeComparableText,
  normalizeDocumentDigits,
  normalizeSearchKey,
  normalizeJobAlias,
  buildDefaultJobAlias,
  normalizeCatalogAlias,
  resolveColaboradorArquivoMetaFromValue,
  resolveColaboradorArquivoMetaFromUpload,
  resolvePacoteArquivoCanonico,
  isColaboradorArquivoChave,
  inferColaboradorBlocoFromText,
  resolveColaboradorBlocoFromRejeicao,
  formatPayloadForDisplay,
  formatResumoCount,
  resolveArquivoHistoricoBadge,
  getColaboradorResumoBloco,
  resolvePacoteNomeFilial,
  buildNovaUnidadePacoteForm,
  resolveUnidadeAcademiaId,
  buildEligibleAdminsResumo,
} from "../shared";

export function useEvoImportPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const preselectedTenantId = normalizeTenantId(searchParams.get("tenantId"));
  const [activeTab, setActiveTab] = useState<"nova" | "pacote" | "acompanhamento">("nova");
  const [dryRun, setDryRun] = useState(false);
  const [maxRejeicoes, setMaxRejeicoes] = useState(200);
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [unidades, setUnidades] = useState<Tenant[]>([]);
  const [unidadesOnboarding, setUnidadesOnboarding] = useState<UnidadeOnboardingState[]>([]);
  const [eligibleAdminsPreview, setEligibleAdminsPreview] = useState<{
    items: GlobalAdminUserSummary[];
    total: number;
    loading: boolean;
  }>({
    items: [],
    total: 0,
    loading: false,
  });
  const [loadingMapeamento, setLoadingMapeamento] = useState(false);
  const [mapeamentos, setMapeamentos] = useState<MapeamentoFilial[]>([
    { idFilialEvo: "", tenantId: "", academiaId: "", academiaNome: "", unidadeNome: "" },
  ]);
  const [files, setFiles] = useState<FileMap>({});
  const [submitting, setSubmitting] = useState(false);

  const [pacoteEvoUnidadeId, setPacoteEvoUnidadeId] = useState("");
  const [pacoteArquivo, setPacoteArquivo] = useState<File | null>(null);
  const [pacoteDryRun, setPacoteDryRun] = useState(false);
  const [pacoteMaxRejeicoes, setPacoteMaxRejeicoes] = useState(200);
  const [pacoteMapeamento, setPacoteMapeamento] = useState<MapeamentoFilial>({
    idFilialEvo: "",
    academiaId: "",
    academiaNome: "",
    unidadeNome: "",
    tenantId: "",
  });
  const [pacoteAnalise, setPacoteAnalise] = useState<UploadAnaliseResponse | null>(null);
  const [pacoteArquivosSelecionados, setPacoteArquivosSelecionados] = useState<string[]>([]);
  const [pacoteJobAlias, setPacoteJobAlias] = useState("");
  const [pacoteAnalisando, setPacoteAnalisando] = useState(false);
  const [pacoteCriandoJob, setPacoteCriandoJob] = useState(false);
  const [novaUnidadePacoteAberta, setNovaUnidadePacoteAberta] = useState(false);
  const [novaUnidadePacoteSalvando, setNovaUnidadePacoteSalvando] = useState(false);
  const [novaUnidadePacoteErro, setNovaUnidadePacoteErro] = useState<string | null>(null);
  const [novaUnidadePacoteForm, setNovaUnidadePacoteForm] = useState<NovaUnidadePacoteForm>(() =>
    buildNovaUnidadePacoteForm(null)
  );

  const [jobId, setJobId] = useState<string>("");
  const [jobTenantId, setJobTenantId] = useState<string>("");
  const [jobTenantIds, setJobTenantIds] = useState<string[]>([]);
  const [jobOrigem, setJobOrigem] = useState<"pacote" | "csv" | null>(null);
  const [jobContextoLabel, setJobContextoLabel] = useState({
    academiaNome: "Não informado",
    unidadeNome: "Não informado",
  });
  const [jobResumo, setJobResumo] = useState<JobResumo | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const [jobsHistorico, setJobsHistorico] = useState<JobHistoryMeta[]>([]);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [rejeicoes, setRejeicoes] = useState<Rejeicao[]>([]);
  const [rejPage, setRejPage] = useState(0);
  const [rejHasNext, setRejHasNext] = useState(false);
  const [rejeicoesLoading, setRejeicoesLoading] = useState(false);
  const [showRejeicoes, setShowRejeicoes] = useState(false);
  const [entidadeFiltro, setEntidadeFiltro] = useState<string>(ENTIDADE_TODAS);
  const [blocoFiltro, setBlocoFiltro] = useState<string>(BLOCO_TODOS);
  const [retrySelecao, setRetrySelecao] = useState<Record<string, RejeicaoClassificada>>({});
  const lastJobStatusRef = useRef<EvoStatus | null>(null);
  const [csvJobAlias, setCsvJobAlias] = useState("");
  const [jobAliasDraft, setJobAliasDraft] = useState("");

  const getStorageKeyForTenant = useCallback(
    (tenantId?: string | null) => `${STORAGE_KEY}:${resolveTenantForStorage(tenantId)}`,
    []
  );
  const getStoredJobId = useCallback(
    (tenantId?: string | null) => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(getStorageKeyForTenant(tenantId));
    },
    [getStorageKeyForTenant]
  );
  const setStoredJobId = useCallback(
    (tenantId: string | null | undefined, value: string) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(getStorageKeyForTenant(tenantId), value);
    },
    [getStorageKeyForTenant]
  );
  const clearStoredJobId = useCallback(
    (tenantId?: string | null) => {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(getStorageKeyForTenant(tenantId));
    },
    [getStorageKeyForTenant]
  );
  const resolveCurrentTenantId = useCallback(() => {
    const tenantId = getActiveTenantIdFromSession();
    return resolveTenantForStorage(tenantId);
  }, []);
  const resolveCurrentTenantIdRaw = useCallback(() => normalizeTenantId(getActiveTenantIdFromSession()), []);
  const tenantIndex = useMemo(() => {
    const map = new Map<string, Tenant>();
    unidades.forEach((tenant) => {
      map.set(normalizeTenantId(tenant.id), tenant);
    });
    return map;
  }, [unidades]);
  const academiaIndex = useMemo(() => {
    const map = new Map<string, Academia>();
    academias.forEach((academia) => {
      map.set(normalizeTenantId(academia.id), academia);
    });
    return map;
  }, [academias]);
  const onboardingIndex = useMemo(() => {
    const map = new Map<string, UnidadeOnboardingState>();
    unidadesOnboarding.forEach((item) => {
      map.set(normalizeTenantId(item.tenantId), item);
    });
    return map;
  }, [unidadesOnboarding]);

  const resolveTenantLabel = useCallback(
    (tenantId?: string) => {
      const tenant = tenantIndex.get(normalizeTenantId(tenantId) || "");
      if (!tenant) {
        return { tenantNome: "Não informado", academiaNome: "Não informado", unidadeNome: "Não informado" };
      }
      const academia = tenant.academiaId ? academiaIndex.get(normalizeTenantId(tenant.academiaId)) : null;
      return {
        tenantNome: tenant.nome || "Não informado",
        unidadeNome: tenant.nome || "Não informado",
        academiaNome: academia?.nome || "Não informado",
      };
    },
    [academiaIndex, tenantIndex]
  );

  const getStoredJobsHistorico = useCallback((): JobHistoryMeta[] => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(JOB_HISTORY_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const cleaned = parsed.filter((item): item is JobHistoryMeta => {
        if (!item || typeof item !== "object") return false;
        return (
          typeof item.jobId === "string" &&
          item.jobId.trim().length > 0 &&
          typeof item.tenantId === "string" &&
          item.tenantId.trim().length > 0
        );
      });
      return cleaned.map((item) => ({
        tenantId: item.tenantId?.toString().trim(),
        jobId: item.jobId?.toString().trim(),
        alias: normalizeJobAlias(item.alias?.toString()),
        academiaNome: item.academiaNome?.toString() || "Não informado",
        unidadeNome: item.unidadeNome?.toString() || "Não informado",
        origem: item.origem === "pacote" || item.origem === "csv" ? item.origem : "csv",
        criadoEm: item.criadoEm?.toString() || new Date().toISOString(),
        status: (item.status as EvoStatus) || undefined,
        arquivosSelecionados: Array.isArray(item.arquivosSelecionados)
          ? item.arquivosSelecionados
              .map((value) => value?.toString().trim())
              .filter((value): value is string => Boolean(value))
          : undefined,
        arquivosDisponiveis: Array.isArray(item.arquivosDisponiveis)
          ? item.arquivosDisponiveis
              .map((value) => value?.toString().trim())
              .filter((value): value is string => Boolean(value))
          : undefined,
      }));
    } catch {
      return [];
    }
  }, []);
  const setStoredJobsHistorico = useCallback((items: JobHistoryMeta[]) => {
    if (typeof window === "undefined") return;
    const normalized = [...items]
      .map((item) => {
        return {
          ...item,
          tenantId: item.tenantId.toLowerCase(),
          jobId: item.jobId.trim(),
          alias: normalizeJobAlias(item.alias),
          academiaNome: item.academiaNome || "Não informado",
          unidadeNome: item.unidadeNome || "Não informado",
          arquivosSelecionados: item.arquivosSelecionados?.map((value) => value.trim()).filter(Boolean),
          arquivosDisponiveis: item.arquivosDisponiveis?.map((value) => value.trim()).filter(Boolean),
        };
      })
      .filter((item) => item.jobId && item.tenantId)
      .slice(0, JOB_HISTORY_LIMIT);
    window.localStorage.setItem(JOB_HISTORY_KEY, JSON.stringify(normalized));
    setJobsHistorico(normalized);
  }, []);

  const upsertJobHistorico = useCallback(
    (entry: JobHistoryMeta) => {
      const atual = getStoredJobsHistorico();
      const next = [entry, ...atual.filter((item) => item.jobId !== entry.jobId)];
      setStoredJobsHistorico(next);
    },
    [getStoredJobsHistorico, setStoredJobsHistorico]
  );

  const atualizarJobHistoricoMeta = useCallback(
    (jobId: string, tenantId: string, patch: Partial<JobHistoryMeta>) => {
      if (!jobId || !tenantId) return;
      const atual = getStoredJobsHistorico();
      const next = atual.map((item) =>
        item.jobId === jobId && normalizeTenantId(item.tenantId) === normalizeTenantId(tenantId)
          ? {
              ...item,
              ...patch,
              alias: patch.alias !== undefined ? normalizeJobAlias(patch.alias) : item.alias,
            }
          : item
      );
      setStoredJobsHistorico(next);
    },
    [getStoredJobsHistorico, setStoredJobsHistorico]
  );

  const atualizarJobHistoricoStatus = useCallback(
    (jobId: string, tenantId: string, status?: EvoStatus) => {
      if (!jobId || !tenantId) return;
      const atual = getStoredJobsHistorico();
      const itemAtual = atual.find(
        (item) => item.jobId === jobId && normalizeTenantId(item.tenantId) === normalizeTenantId(tenantId)
      );
      atualizarJobHistoricoMeta(jobId, tenantId, {
        status,
        criadoEm: itemAtual?.criadoEm || new Date().toISOString(),
      });
    },
    [atualizarJobHistoricoMeta, getStoredJobsHistorico]
  );

  const carregarJobHistorico = useCallback(() => {
    setJobsHistorico(getStoredJobsHistorico());
  }, [getStoredJobsHistorico]);
  const academiaOptions = useMemo<SuggestionOption[]>(
    () =>
      academias.map((academia) => ({
        id: academia.id,
        label: academia.nome,
        searchText: `${academia.nome} ${academia.documento ?? ""} ${academia.razaoSocial ?? ""}`,
      })),
    [academias]
  );
  const unidadesPorAcademia = useMemo(() => {
    const map = new Map<string, SuggestionOption[]>();
    unidades.forEach((tenant) => {
      const academiaId = tenant.academiaId ?? tenant.groupId;
      if (!academiaId) return;
      const itens = map.get(academiaId) ?? [];
      itens.push({
        id: tenant.id,
        label: tenant.nome,
        searchText: `${tenant.subdomain ?? ""} ${tenant.documento ?? ""} ${tenant.email ?? ""}`,
      });
      map.set(academiaId, itens);
    });
    for (const [academiaId, itens] of map.entries()) {
      map.set(academiaId, [...itens].sort((a, b) => a.label.localeCompare(b.label, "pt-BR")));
    }
    return map;
  }, [unidades]);
  const getUnidadesOptions = useCallback((academiaId?: string) => {
    if (!academiaId) return [];
    return unidadesPorAcademia.get(academiaId) ?? [];
  }, [unidadesPorAcademia]);
  const resolveRejeicao = useCallback((rejeicao: Partial<Rejeicao> & { createdAt?: string }) => ({
    id: rejeicao.id,
    entidade: rejeicao.entidade ?? "—",
    arquivo: rejeicao.arquivo ?? "—",
    linhaArquivo: rejeicao.linhaArquivo ?? 0,
    sourceId: rejeicao.sourceId,
    motivo: rejeicao.motivo ?? "Sem motivo informado",
    criadoEm: rejeicao.criadoEm ?? rejeicao.createdAt ?? "",
    bloco: rejeicao.bloco,
    subdominio: rejeicao.subdominio,
    payload: rejeicao.payload,
    mensagemAcionavel: rejeicao.mensagemAcionavel,
    reprocessamento: rejeicao.reprocessamento ?? null,
  }), []);

  const formatErrorBody = useCallback((value: unknown) => {
    if (typeof value !== "string") {
      if (value === undefined || value === null) return "";
      if (typeof value === "object") {
        try {
          return JSON.stringify(value).slice(0, 3000);
        } catch {
          return String(value);
        }
      }
      return String(value);
    }
    return value.slice(0, 3000);
  }, []);

  const formatApiErrorForLog = useCallback((error: ApiRequestError) => {
    const body = formatErrorBody(error.responseBody);
    return {
      status: error.status,
      path: error.path,
      message: error.message,
      error: error.error,
      fieldErrors: error.fieldErrors,
      responseBody: body || undefined,
    };
  }, [formatErrorBody]);

  const parseApiErrorBody = useCallback((value?: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== "object") return null;
      const candidate = parsed as {
        message?: unknown;
        error?: unknown;
      };
      if (typeof candidate.message === "string" && candidate.message.trim()) {
        return candidate.message;
      }
      if (typeof candidate.error === "string" && candidate.error.trim()) {
        return candidate.error;
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  const extractErrorMessage = useCallback((error: ApiRequestError) => {
    const parsedBodyMessage = parseApiErrorBody(error.responseBody);
    if (parsedBodyMessage) {
      return parsedBodyMessage;
    }
    const body = formatErrorBody(error.responseBody);
    if (body) return body;
    if (error.message) return error.message;
    if (error.error) return error.error;
    return `Erro na requisição (${error.status}).`;
  }, [formatErrorBody, parseApiErrorBody]);

  const upsertOnboardingState = useCallback((next: UnidadeOnboardingState) => {
    setUnidadesOnboarding((current) => [next, ...current.filter((item) => item.tenantId !== next.tenantId)]);
  }, []);

  const persistOnboardingContext = useCallback(async (
    tenantId: string,
    academiaId: string | undefined,
    evoFilialId: string | undefined
  ) => {
    const normalizedTenant = normalizeTenantId(tenantId);
    if (!normalizedTenant) return null;
    const current = onboardingIndex.get(normalizedTenant);
    const saved = await saveUnidadeOnboarding({
      tenantId,
      academiaId,
      estrategia: current?.estrategia ?? "PREPARAR_ETL",
      evoFilialId,
      status: current?.status,
      ultimaMensagem: current?.ultimaMensagem,
    });
    upsertOnboardingState(saved);
    return saved;
  }, [onboardingIndex, upsertOnboardingState]);

  const registrarOnboardingDoJob = useCallback(async (input: {
    tenantId: string;
    academiaId?: string;
    evoFilialId?: string;
    jobId: string;
    origem: "CSV" | "PACOTE";
    mensagem?: string;
  }) => {
    await persistOnboardingContext(input.tenantId, input.academiaId, input.evoFilialId);
    const next = await registrarImportacaoOnboarding({
      tenantId: input.tenantId,
      academiaId: input.academiaId,
      jobId: input.jobId,
      origem: input.origem,
      mensagem: input.mensagem,
    });
    upsertOnboardingState(next);
  }, [persistOnboardingContext, upsertOnboardingState]);

  const atualizarStatusOnboardingDoJob = useCallback(async (input: {
    tenantIds: string[];
    jobId: string;
    status: EvoStatus;
    origem: "CSV" | "PACOTE";
    mensagem?: string;
  }) => {
    if (!input.jobId || input.tenantIds.length === 0) return;
    if (lastJobStatusRef.current === input.status) return;
    lastJobStatusRef.current = input.status;
    await Promise.all(
      input.tenantIds.map(async (tenantId) => {
        const normalizedTenant = normalizeTenantId(tenantId);
        if (!normalizedTenant) return;
        const unidade = tenantIndex.get(normalizedTenant);
        const current = onboardingIndex.get(normalizedTenant);
        const updated = await atualizarImportacaoOnboardingStatus({
          tenantId,
          academiaId: current?.academiaId ?? unidade?.academiaId,
          jobId: input.jobId,
          importStatus: input.status,
          origem: input.origem,
          mensagem: input.mensagem,
        });
        upsertOnboardingState(updated);
      })
    );
  }, [onboardingIndex, tenantIndex, upsertOnboardingState]);

  const aplicarPresetTenant = useCallback((tenantId: string) => {
    const normalizedTenant = normalizeTenantId(tenantId);
    if (!normalizedTenant) return;
    const unidade = tenantIndex.get(normalizedTenant);
    if (!unidade) return;
    const academiaId = unidade.academiaId ?? unidade.groupId ?? "";
    const academia = academiaId ? academiaIndex.get(normalizeTenantId(academiaId)) : null;
    const onboarding = onboardingIndex.get(normalizedTenant);
    const academiaNome = academia?.nome ?? "Não informado";
    const unidadeNome = unidade.nome ?? "Não informado";
    const evoFilialId = onboarding?.evoFilialId ?? "";

    setMapeamentos([
      {
        idFilialEvo: evoFilialId,
        tenantId: unidade.id,
        academiaId,
        academiaNome,
        unidadeNome,
      },
    ]);
    setPacoteMapeamento({
      idFilialEvo: evoFilialId,
      tenantId: unidade.id,
      academiaId,
      academiaNome,
      unidadeNome,
    });
    if (evoFilialId) {
      setPacoteEvoUnidadeId(evoFilialId);
    }
  }, [academiaIndex, onboardingIndex, tenantIndex]);

  const setJobLabelFromContext = useCallback(
    (tenantId: string, academiaNome?: string, unidadeNome?: string) => {
      const fallback = resolveTenantLabel(tenantId);
      setJobContextoLabel({
        academiaNome: academiaNome?.trim() || fallback.academiaNome,
        unidadeNome: unidadeNome?.trim() || fallback.unidadeNome,
      });
    },
    [resolveTenantLabel]
  );

  const resolveJobAlias = useCallback((job: Partial<JobHistoryMeta> | null | undefined) => {
    if (!job) return "";
    return (
      normalizeJobAlias(job.alias) ||
      buildDefaultJobAlias({
        origem: job.origem === "pacote" ? "pacote" : "csv",
        unidadeNome: job.unidadeNome,
        academiaNome: job.academiaNome,
        criadoEm: job.criadoEm,
      })
    );
  }, []);

  const jobsEmExecucao = useMemo(() => {
    return jobsHistorico
      .filter((job) => !job.status || job.status === "PROCESSANDO")
      .sort((a, b) => {
        const aa = new Date(a.criadoEm).getTime();
        const bb = new Date(b.criadoEm).getTime();
        if (Number.isNaN(aa) || Number.isNaN(bb)) return 0;
        return bb - aa;
      });
  }, [jobsHistorico]);

  const jobsRecentes = useMemo(() => {
    return [...jobsHistorico]
      .sort((a, b) => {
        const aa = new Date(a.criadoEm).getTime();
        const bb = new Date(b.criadoEm).getTime();
        if (Number.isNaN(aa) || Number.isNaN(bb)) return 0;
        return bb - aa;
      })
      .slice(0, 8);
  }, [jobsHistorico]);

  const entidadePorArquivoChave = useMemo(
    () => new Map(IMPORT_RESUMO_CARD_CONFIG.map((item) => [item.arquivoChave, item.entidade] as const)),
    []
  );

  const resumoAtualPorArquivoChave = useMemo(
    () =>
      new Map(
        IMPORT_RESUMO_CARD_CONFIG.map((item) => [item.arquivoChave, jobResumo?.[item.key] as EntidadeResumo | undefined] as const)
      ),
    [jobResumo]
  );

  const pacoteArquivosDisponiveis = useMemo<PacoteArquivoDisponivel[]>(() => {
    if (!pacoteAnalise) return [];
    const tenantHistorico = normalizeTenantId(pacoteMapeamento.tenantId)
      || normalizeTenantId(pacoteAnalise.tenantId)
      || resolveCurrentTenantIdRaw();
    const currentJobHistorico = jobsHistorico.find(
      (job) => normalizeTenantId(job.jobId) === normalizeTenantId(jobId)
    ) ?? null;
    const resolveResumoAtualArquivo = (arquivo: {
      chaveCanonica: PacoteArquivoChave | null;
      bloco?: string | null;
    }): EntidadeResumo | null => {
      if (arquivo.bloco) {
        return getColaboradorResumoBloco(jobResumo?.colaboradoresDetalhe, arquivo.bloco as ColaboradorBlocoKey) ?? null;
      }
      if (!arquivo.chaveCanonica) return null;
      return resumoAtualPorArquivoChave.get(arquivo.chaveCanonica) ?? null;
    };
    const jobRelacionaArquivo = (
      job: Pick<JobHistoryMeta, "tenantId" | "arquivosSelecionados" | "arquivosDisponiveis">,
      arquivo: { chaveCanonica: PacoteArquivoChave | null; chaveOriginal: string; chave: string }
    ) => {
      if (tenantHistorico && normalizeTenantId(job.tenantId) !== tenantHistorico) {
        return false;
      }
      const chavesDoJob = [...(job.arquivosSelecionados ?? []), ...(job.arquivosDisponiveis ?? [])];
      return chavesDoJob.some((value) => {
        const canonica = resolvePacoteArquivoCanonico(value);
        if (arquivo.chaveCanonica && canonica === arquivo.chaveCanonica) return true;
        const normalizedValue = normalizeSearchKey(value);
        return (
          normalizedValue === normalizeSearchKey(arquivo.chaveOriginal)
          || normalizedValue === normalizeSearchKey(arquivo.chave)
        );
      });
    };
    const enriched = [...pacoteAnalise.arquivos].map((arquivo) => {
      const meta = resolveColaboradorArquivoMetaFromUpload(arquivo);
      if (!meta) {
        return {
          ...arquivo,
          chaveOriginal: arquivo.chave,
          chaveCanonica: resolvePacoteArquivoCanonico(arquivo.chave),
          catalogadoPeloBackend: true,
        };
      }
      return {
        ...arquivo,
        chaveOriginal: arquivo.chave,
        chaveCanonica: meta.pacoteChave,
        catalogadoPeloBackend: true,
        rotulo: arquivo.rotulo || meta.rotuloResumo,
        arquivoEsperado: arquivo.arquivoEsperado || meta.label,
        bloco: arquivo.bloco ?? meta.bloco,
        dominio: arquivo.dominio ?? "colaboradores",
        descricao: arquivo.descricao ?? meta.descricao,
        impactoAusencia: arquivo.impactoAusencia ?? meta.impactoAusencia,
      };
    });
    COLABORADOR_ARQUIVOS_CONFIG.forEach((meta) => {
      if (enriched.some((arquivo) => arquivo.chaveCanonica === meta.pacoteChave)) return;
      enriched.push({
        chave: meta.pacoteChave,
        chaveOriginal: meta.pacoteChave,
        chaveCanonica: meta.pacoteChave,
        catalogadoPeloBackend: false,
        rotulo: meta.rotuloResumo,
        arquivoEsperado: meta.label,
        disponivel: false,
        dominio: "colaboradores",
        bloco: meta.bloco,
        descricao: meta.descricao,
        impactoAusencia: meta.impactoAusencia,
      });
    });
    const deduplicado = new Map<string, (typeof enriched)[number]>();
    enriched.forEach((arquivo) => {
      const dedupeKey = arquivo.chaveCanonica ?? arquivo.chaveOriginal;
      const existente = deduplicado.get(dedupeKey);
      if (!existente) {
        deduplicado.set(dedupeKey, arquivo);
        return;
      }
      if (!existente.disponivel && arquivo.disponivel) {
        deduplicado.set(dedupeKey, arquivo);
      }
    });
    const ordenado = [...deduplicado.values()]
      .map((arquivo) => {
        const historicoBackend = normalizeUploadAnaliseArquivoHistorico(arquivo.ultimoProcessamento);
        const resumoAtualArquivo = resolveResumoAtualArquivo(arquivo);
        const jobAtualRelacionado =
          currentJobHistorico && jobRelacionaArquivo(currentJobHistorico, arquivo) ? currentJobHistorico : null;
        const historicoLocalRelacionado = [...jobsHistorico]
          .filter((job) => jobRelacionaArquivo(job, arquivo))
          .sort((a, b) => {
            const aa = new Date(a.criadoEm).getTime();
            const bb = new Date(b.criadoEm).getTime();
            if (Number.isNaN(aa) || Number.isNaN(bb)) return 0;
            return bb - aa;
          })[0] ?? null;
        const historicoAtual = jobAtualRelacionado && (resumoAtualArquivo || jobResumo?.status)
          ? normalizeUploadAnaliseArquivoHistorico({
              jobId: jobId || jobAtualRelacionado.jobId,
              alias: jobAtualRelacionado.alias,
              status: jobResumo?.status ?? jobAtualRelacionado.status ?? null,
              processadoEm: jobResumo?.finalizadoEm ?? jobResumo?.solicitadoEm ?? jobAtualRelacionado.criadoEm,
              resumo: resumoAtualArquivo,
              parcial:
                arquivo.bloco
                  ? Boolean(getColaboradorResumoBloco(jobResumo?.colaboradoresDetalhe, arquivo.bloco as ColaboradorBlocoKey)?.parcial)
                  : false,
              mensagemParcial:
                arquivo.bloco
                  ? getColaboradorResumoBloco(jobResumo?.colaboradoresDetalhe, arquivo.bloco as ColaboradorBlocoKey)?.mensagemParcial
                  : null,
            })
          : null;
        const historicoLocal = historicoLocalRelacionado
          ? normalizeUploadAnaliseArquivoHistorico({
              jobId: historicoLocalRelacionado.jobId,
              alias: historicoLocalRelacionado.alias,
              status: historicoLocalRelacionado.status ?? null,
              processadoEm: historicoLocalRelacionado.criadoEm,
              resumo: null,
            })
          : null;
        const historico = historicoBackend.temHistorico
          ? {
              ...historicoBackend,
              fonte: "backend" as const,
              aliasResolvido: historicoBackend.alias,
              jobIdExibicao: historicoBackend.jobId,
              processadoEmExibicao: historicoBackend.processadoEm,
              jobRelacionado: null,
            }
          : historicoAtual?.temHistorico
            ? {
                ...historicoAtual,
                fonte: "jobAtual" as const,
                aliasResolvido: currentJobHistorico ? resolveJobAlias(currentJobHistorico) : null,
                jobIdExibicao: historicoAtual.jobId,
                processadoEmExibicao: historicoAtual.processadoEm,
                jobRelacionado: currentJobHistorico,
              }
            : historicoLocal?.temHistorico
              ? {
                  ...historicoLocal,
                  fonte: "historicoLocal" as const,
                  aliasResolvido: historicoLocalRelacionado ? resolveJobAlias(historicoLocalRelacionado) : null,
                  jobIdExibicao: historicoLocal.jobId,
                  processadoEmExibicao: historicoLocal.processadoEm,
                  jobRelacionado: historicoLocalRelacionado,
                }
              : {
                  ...normalizeUploadAnaliseArquivoHistorico(null),
                  fonte: "nenhum" as const,
                  aliasResolvido: null,
                  jobIdExibicao: null,
                  processadoEmExibicao: null,
                  jobRelacionado: null,
                };
        const entidadeFiltro = arquivo.chaveCanonica ? entidadePorArquivoChave.get(arquivo.chaveCanonica) ?? null : null;
        const blocoFiltro = arquivo.bloco ? (arquivo.bloco as ColaboradorBlocoKey) : null;
        return {
          ...arquivo,
          historico,
          entidadeFiltro,
          blocoFiltro,
        };
      })
      .sort((a, b) => {
        const indexA = a.chaveCanonica ? PACOTE_CHAVES_DISPONIVEIS.indexOf(a.chaveCanonica) : -1;
        const indexB = b.chaveCanonica ? PACOTE_CHAVES_DISPONIVEIS.indexOf(b.chaveCanonica) : -1;
        if (indexA === -1 && indexB === -1) return a.rotulo.localeCompare(b.rotulo, "pt-BR");
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    return ordenado;
  }, [entidadePorArquivoChave, jobId, jobResumo, jobsHistorico, pacoteAnalise, pacoteMapeamento.tenantId, resolveCurrentTenantIdRaw, resolveJobAlias, resumoAtualPorArquivoChave]);

  const pacoteColaboradoresBlocos = useMemo(() => {
    const index = new Map(
      pacoteArquivosDisponiveis
        .filter((arquivo) => arquivo.chaveCanonica)
        .map((arquivo) => [arquivo.chaveCanonica as PacoteArquivoChave, arquivo] as const)
    );
    return COLABORADOR_BLOCO_CONFIG.map((bloco) => {
      const arquivos = bloco.arquivos.map((meta) => {
        const arquivo = index.get(meta.pacoteChave);
        return (
          arquivo ?? {
            chave: meta.pacoteChave,
            rotulo: meta.rotuloResumo,
            arquivoEsperado: meta.label,
            disponivel: false,
            chaveOriginal: meta.pacoteChave,
            chaveCanonica: meta.pacoteChave,
            catalogadoPeloBackend: false,
            bloco: meta.bloco,
            dominio: "colaboradores",
            descricao: meta.descricao,
            impactoAusencia: meta.impactoAusencia,
          }
        );
      });
      const disponiveis = arquivos.filter((arquivo) => arquivo.disponivel);
      const status =
        disponiveis.length === arquivos.length
          ? "completo"
          : disponiveis.length > 0
            ? "parcial"
            : arquivos.every((arquivo) => arquivo.catalogadoPeloBackend)
              ? "naoEnviado"
              : "naoReconhecido";
      return {
        ...bloco,
        arquivos,
        disponiveis,
        status,
      };
    });
  }, [pacoteArquivosDisponiveis]);

  const csvUploadGroups = useMemo(() => {
    const fieldIndex = new Map(FILE_FIELDS.map((field) => [field.key, field] as const));
    return FILE_UPLOAD_GROUPS.map((group) => ({
      ...group,
      files: group.fields
        .map((fieldKey) => fieldIndex.get(fieldKey))
        .filter((field): field is { key: keyof FileMap; label: string; field: string } => Boolean(field)),
    }));
  }, []);

  const pacoteEvoUnidadeInformada = useMemo(() => parsePositiveInteger(pacoteEvoUnidadeId), [pacoteEvoUnidadeId]);

  const pacoteEvoUnidadeResolvida = useMemo(() => parsePositiveInteger(pacoteAnalise?.evoUnidadeId), [pacoteAnalise?.evoUnidadeId]);

  const pacoteFilialResolvida = useMemo<UploadAnaliseFilial | null>(() => {
    return pacoteAnalise?.filialResolvida ?? null;
  }, [pacoteAnalise]);

  const pacoteFiliaisEncontradas = useMemo<UploadAnaliseFilial[]>(() => {
    return Array.isArray(pacoteAnalise?.filiaisEncontradas) ? pacoteAnalise.filiaisEncontradas : [];
  }, [pacoteAnalise]);

  const pacoteFilialReferencia = useMemo<UploadAnaliseFilial | null>(() => {
    return pacoteFilialResolvida ?? pacoteFiliaisEncontradas[0] ?? null;
  }, [pacoteFilialResolvida, pacoteFiliaisEncontradas]);

  const pacoteNomeFilialReferencia = useMemo(() => {
    return resolvePacoteNomeFilial(pacoteFilialReferencia?.nome, pacoteMapeamento.academiaNome);
  }, [pacoteFilialReferencia?.nome, pacoteMapeamento.academiaNome]);

  const pacoteUnidadesSugeridas = useMemo(() => {
    const documento = normalizeDocumentDigits(pacoteFilialReferencia?.documento);
    const nome = normalizeComparableText(
      pacoteNomeFilialReferencia.unidadeNome || pacoteFilialReferencia?.nome || pacoteFilialReferencia?.abreviacao
    );
    const cidade = normalizeComparableText(pacoteFilialReferencia?.cidade);
    if (!documento && !nome) return [];

    return unidades
      .filter((unidade) => {
        const documentoUnidade = normalizeDocumentDigits(unidade.documento);
        if (documento && documentoUnidade && documento === documentoUnidade) {
          return true;
        }

        const nomeUnidade = normalizeComparableText(unidade.nome);
        if (!nome || !nomeUnidade) return false;
        const nomeCompativel = nomeUnidade.includes(nome) || nome.includes(nomeUnidade);
        if (!nomeCompativel) return false;

        const cidadeUnidade = normalizeComparableText(unidade.endereco?.cidade);
        return !cidade || !cidadeUnidade || cidade === cidadeUnidade;
      })
      .slice(0, 5)
      .map((unidade) => ({
        unidade,
        academiaNome:
          academiaIndex.get(normalizeTenantId(resolveUnidadeAcademiaId(unidade)))?.nome ?? "Academia não informada",
      }));
  }, [academiaIndex, pacoteFilialReferencia, pacoteNomeFilialReferencia.unidadeNome, unidades]);

  const pacoteSelecaoFilialPendente = useMemo(() => {
    return Boolean(pacoteAnalise && !pacoteEvoUnidadeResolvida && pacoteFiliaisEncontradas.length > 1);
  }, [pacoteAnalise, pacoteEvoUnidadeResolvida, pacoteFiliaisEncontradas.length]);

  const pacoteTenantAnalise = useMemo(() => normalizeTenantId(pacoteAnalise?.tenantId), [pacoteAnalise?.tenantId]);

  const pacoteTenantDestino = useMemo(() => normalizeTenantId(pacoteMapeamento.tenantId), [pacoteMapeamento.tenantId]);

  const pacotePrecisaVincularTenant = useMemo(() => {
    if (!pacoteAnalise || !pacoteTenantDestino) return false;
    return pacoteTenantAnalise !== pacoteTenantDestino;
  }, [pacoteAnalise, pacoteTenantAnalise, pacoteTenantDestino]);

  const pacotePrecisaReanaliseManual = useMemo(() => {
    return Boolean(
      pacoteArquivo &&
      pacoteEvoUnidadeInformada &&
      pacoteEvoUnidadeInformada !== pacoteEvoUnidadeResolvida
    );
  }, [pacoteArquivo, pacoteEvoUnidadeInformada, pacoteEvoUnidadeResolvida]);

  const formatBytes = useCallback((value?: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "—";
    if (value === 0) return "0 B";
    const unidades = ["B", "KB", "MB", "GB", "TB"];
    let tamanho = value;
    let idx = 0;
    while (tamanho >= 1024 && idx < unidades.length - 1) {
      tamanho /= 1024;
      idx += 1;
    }
    return `${tamanho.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${unidades[idx]}`;
  }, []);

  const pacoteArquivosSelecionadosSet = useMemo(() => new Set(pacoteArquivosSelecionados), [pacoteArquivosSelecionados]);
  const pacoteResumoAcessoAutomatico = useMemo(() => {
    if (eligibleAdminsPreview.loading || eligibleAdminsPreview.total <= 0) return null;
    return buildEligibleAdminsResumo(eligibleAdminsPreview.total);
  }, [eligibleAdminsPreview.loading, eligibleAdminsPreview.total]);
  const arquivoCanonicoPorCsvField = useMemo(
    () => new Map(IMPORT_RESUMO_CARD_CONFIG.map((item) => [item.csvField, item.arquivoChave] as const)),
    []
  );

  const carregarMapeamentoData = useCallback(async () => {
    setLoadingMapeamento(true);
    try {
      const [loadedAcademias, loadedUnidades] = await Promise.all([listGlobalAcademias(), listGlobalUnidades()]);
      setAcademias(loadedAcademias);
      setUnidades(loadedUnidades);

      try {
        const loadedOnboarding = await listUnidadesOnboarding();
        setUnidadesOnboarding(loadedOnboarding);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setUnidadesOnboarding([]);
        if (!isOnboardingCollectionRouteError(message)) {
          toast({
            title: "Erro ao carregar dados de onboarding",
            description: message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro ao carregar dados de mapeamento", description: message, variant: "destructive" });
    } finally {
      setLoadingMapeamento(false);
    }
  }, [toast]);

  useEffect(() => {
    void carregarMapeamentoData();
  }, [carregarMapeamentoData]);

  useEffect(() => {
    if (!preselectedTenantId) return;
    if (tenantIndex.size === 0) return;
    aplicarPresetTenant(preselectedTenantId);
  }, [aplicarPresetTenant, preselectedTenantId, tenantIndex.size]);

  useEffect(() => {
    carregarJobHistorico();
  }, [carregarJobHistorico]);

  const progress = useMemo(() => {
    const geral = jobResumo?.geral;
    if (!geral || !geral.total) return 0;
    const pct = Math.min(100, Math.max(0, (geral.processadas / geral.total) * 100));
    return Math.round(pct);
  }, [jobResumo?.geral]);

  const getPercentual = (resumo?: EntidadeResumo) => {
    if (!resumo) return { percentual: 0, temTotal: false };
    const total = Number(resumo.total ?? 0);
    if (!Number.isFinite(total) || total <= 0) return { percentual: 0, temTotal: false };
    const pct = Math.min(100, Math.max(0, (Number(resumo.processadas ?? 0) / total) * 100));
    return { percentual: Math.round(pct), temTotal: true };
  };
  const resumoEntidadeMap = useMemo(
    () =>
      Object.fromEntries(IMPORT_RESUMO_CARD_CONFIG.map((item) => [item.key, item.entidade])) as Partial<
        Record<keyof JobResumo, string>
      >,
    []
  );
  const resumoCards = useMemo(
    () => [{ key: "geral" as keyof JobResumo, label: "Geral", arquivoChave: null as null | PacoteArquivoChave }, ...IMPORT_RESUMO_CARD_CONFIG],
    []
  );
  const jobHistoricoAtual = useMemo(
    () => jobsHistorico.find((item) => normalizeTenantId(item.jobId) === normalizeTenantId(jobId)),
    [jobId, jobsHistorico]
  );
  const jobAliasAtual = useMemo(
    () =>
      resolveJobAlias(
        jobHistoricoAtual
          ? jobHistoricoAtual
          : jobId
            ? {
                jobId,
                alias: undefined,
                origem: jobOrigem ?? "csv",
                unidadeNome: jobContextoLabel.unidadeNome,
                academiaNome: jobContextoLabel.academiaNome,
                criadoEm: jobResumo?.solicitadoEm ?? undefined,
              }
            : null
      ),
    [jobContextoLabel.academiaNome, jobContextoLabel.unidadeNome, jobHistoricoAtual, jobId, jobOrigem, jobResumo?.solicitadoEm, resolveJobAlias]
  );
  const jobArquivosSelecionados = useMemo(
    () => Array.from(new Set(jobHistoricoAtual?.arquivosSelecionados?.filter(Boolean) ?? [])),
    [jobHistoricoAtual?.arquivosSelecionados]
  );
  const jobArquivosDisponiveis = useMemo(
    () => Array.from(new Set(jobHistoricoAtual?.arquivosDisponiveis?.filter(Boolean) ?? [])),
    [jobHistoricoAtual?.arquivosDisponiveis]
  );
  const jobArquivosSelecionadosCanonicos = useMemo(
    () => new Set(jobArquivosSelecionados.map((arquivo) => resolvePacoteArquivoCanonico(arquivo)).filter(Boolean)),
    [jobArquivosSelecionados]
  );
  const jobArquivosDisponiveisCanonicos = useMemo(
    () => new Set(jobArquivosDisponiveis.map((arquivo) => resolvePacoteArquivoCanonico(arquivo)).filter(Boolean)),
    [jobArquivosDisponiveis]
  );
  const colaboradoresResumoDetalhado = jobResumo?.colaboradoresDetalhe;
  const jobTemMalhaColaboradores = useMemo(
    () => {
      if (!colaboradoresResumoDetalhado) {
        return jobArquivosSelecionados.some((arquivo) => isColaboradorArquivoChave(arquivo));
      }
      return COLABORADOR_BLOCO_CONFIG.some((bloco) => {
        const resumo = getColaboradorResumoBloco(colaboradoresResumoDetalhado, bloco.key);
        const diagnostico = normalizeEvoColaboradorDiagnostico({
          resumo,
          fallbackArquivosSelecionados: bloco.arquivos
            .filter((arquivo) => jobArquivosSelecionadosCanonicos.has(arquivo.pacoteChave))
            .map((arquivo) => arquivo.pacoteChave),
          canonicalizeFile: (value) => resolvePacoteArquivoCanonico(value),
        });
        return diagnostico.status !== "naoSelecionado" || Boolean(resumo);
      });
    },
    [colaboradoresResumoDetalhado, jobArquivosSelecionados, jobArquivosSelecionadosCanonicos]
  );

  const resumoCardsVisiveis = useMemo(() => {
    if (!jobArquivosSelecionados.length) return resumoCards;
    const selecionados = new Set(jobArquivosSelecionados);
    return resumoCards.filter((card) => {
      if (card.key === "geral") return true;
      if (card.key === "funcionarios") {
        return jobTemMalhaColaboradores || selecionados.has("funcionarios");
      }
      return card.arquivoChave
        ? selecionados.has(card.arquivoChave) || jobArquivosSelecionadosCanonicos.has(card.arquivoChave)
        : false;
    });
  }, [jobArquivosSelecionados, jobArquivosSelecionadosCanonicos, jobTemMalhaColaboradores, resumoCards]);

  const resumoCardsOcultos = useMemo(() => {
    if (!jobArquivosSelecionados.length) return [] as typeof resumoCards;
    if (!jobArquivosDisponiveis.length) return [] as typeof resumoCards;
    const selecionados = new Set(jobArquivosSelecionados);
    const disponiveis = new Set(jobArquivosDisponiveis);
    const colaboradorDisponivel = jobArquivosDisponiveis.some((arquivo) => isColaboradorArquivoChave(arquivo));
    return resumoCards.filter((card) => {
      if (card.key === "geral" || !card.arquivoChave) return false;
      if (card.key === "funcionarios") {
        return colaboradorDisponivel && !jobTemMalhaColaboradores;
      }
      return (
        (disponiveis.has(card.arquivoChave) || jobArquivosDisponiveisCanonicos.has(card.arquivoChave)) &&
        !selecionados.has(card.arquivoChave) &&
        !jobArquivosSelecionadosCanonicos.has(card.arquivoChave)
      );
    });
  }, [
    jobArquivosDisponiveis,
    jobArquivosDisponiveisCanonicos,
    jobArquivosSelecionados,
    jobArquivosSelecionadosCanonicos,
    jobTemMalhaColaboradores,
    resumoCards,
  ]);

  const colaboradoresResumoCards = useMemo<ColaboradorResumoCard[]>(() => {
    if (!jobTemMalhaColaboradores && !colaboradoresResumoDetalhado && !jobResumo?.funcionarios) return [];
    return COLABORADOR_BLOCO_CONFIG.map((bloco) => {
      const resumo = getColaboradorResumoBloco(colaboradoresResumoDetalhado, bloco.key);
      const fallbackResumo =
        !resumo && bloco.key === "fichaPrincipal" ? (jobResumo?.funcionarios as EvoImportColaboradoresBlocoResumo | undefined) : undefined;
      const resumoEfetivo = resumo ?? fallbackResumo;
      const diagnostico = normalizeEvoColaboradorDiagnostico({
        resumo: resumoEfetivo,
        fallbackArquivosSelecionados: bloco.arquivos
          .filter((arquivo) => jobArquivosSelecionadosCanonicos.has(arquivo.pacoteChave))
          .map((arquivo) => arquivo.pacoteChave),
        fallbackArquivosAusentes: colaboradoresResumoDetalhado
          ? []
          : bloco.arquivos
              .filter((arquivo) => !jobArquivosSelecionadosCanonicos.has(arquivo.pacoteChave))
              .map((arquivo) => arquivo.pacoteChave),
        canonicalizeFile: (value) => resolvePacoteArquivoCanonico(value),
      });
      return {
        ...bloco,
        resumo: resumoEfetivo,
        arquivosSelecionados: bloco.arquivos.filter((arquivo) =>
          diagnostico.arquivosSelecionados.includes(arquivo.pacoteChave)
        ),
        arquivosAusentes: bloco.arquivos.filter((arquivo) =>
          diagnostico.arquivosAusentes.includes(arquivo.pacoteChave)
        ),
        status: diagnostico.status,
      };
    }).filter((bloco) => {
      if (colaboradoresResumoDetalhado) {
        return bloco.status !== "naoSelecionado" || Boolean(bloco.resumo);
      }
      return bloco.status !== "naoSelecionado" || Boolean(bloco.resumo);
    });
  }, [
    colaboradoresResumoDetalhado,
    jobArquivosSelecionadosCanonicos,
    jobResumo?.funcionarios,
    jobTemMalhaColaboradores,
  ]);

  const colaboradoresResumoAlertas = useMemo(() => {
    const alertas =
      colaboradoresResumoDetalhado?.alertas?.filter((item): item is NonNullable<typeof item> => Boolean(item)) ?? [];
    if (alertas.length > 0) {
      return alertas.map((alerta) => ({
        bloco: inferColaboradorBlocoFromText(alerta.bloco),
        mensagem: alerta.mensagem,
        severidade: alerta.severidade ?? "warning",
      }));
    }
    if (!jobTemMalhaColaboradores) return [];
    return colaboradoresResumoCards
      .filter((bloco) => bloco.status !== "sucesso")
      .map((bloco) => ({
        bloco: bloco.key,
        mensagem:
          bloco.status === "naoSelecionado"
            ? `${bloco.label} não foi selecionado neste job.`
            : bloco.status === "semLinhas"
              ? `${bloco.label} foi executado sem linhas no pacote importado.`
              : bloco.resumo?.mensagemParcial?.trim() || `${bloco.label} retornou rejeições ou execução parcial.`,
        severidade: bloco.status === "comRejeicoes" ? ("error" as const) : ("warning" as const),
      }));
  }, [colaboradoresResumoCards, colaboradoresResumoDetalhado?.alertas, jobTemMalhaColaboradores]);

  useEffect(() => {
    if (!jobId) {
      setJobAliasDraft("");
      return;
    }
    setJobAliasDraft(jobAliasAtual);
  }, [jobAliasAtual, jobId]);

  function setFile(key: keyof FileMap, file: File | null) {
    setFiles((prev) => ({ ...prev, [key]: file }));
  }

  function updateMapeamento(idx: number, patch: Partial<MapeamentoFilial>) {
    setMapeamentos((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  const aplicarDestinoPacotePorUnidade = useCallback((unidade: Tenant, overrides?: { evoFilialId?: string }) => {
    const academiaId = resolveUnidadeAcademiaId(unidade);
    const academia = academiaId ? academiaIndex.get(normalizeTenantId(academiaId)) : null;
    const onboarding = onboardingIndex.get(normalizeTenantId(unidade.id));
    const nextEvoFilialId =
      overrides?.evoFilialId ??
      onboarding?.evoFilialId ??
      (pacoteEvoUnidadeResolvida ? String(pacoteEvoUnidadeResolvida) : pacoteEvoUnidadeId.trim());

    setPacoteMapeamento({
      idFilialEvo: nextEvoFilialId,
      tenantId: unidade.id,
      academiaId,
      academiaNome: academia?.nome ?? "Não informado",
      unidadeNome: unidade.nome ?? "Não informado",
    });

    if (nextEvoFilialId) {
      setPacoteEvoUnidadeId(nextEvoFilialId);
    }
  }, [academiaIndex, onboardingIndex, pacoteEvoUnidadeId, pacoteEvoUnidadeResolvida]);

  const aplicarDestinoPacotePorTenantId = useCallback((tenantId: string) => {
    const normalizedTenant = normalizeTenantId(tenantId);
    if (!normalizedTenant) return;
    const unidade = tenantIndex.get(normalizedTenant);
    if (!unidade) return;
    aplicarDestinoPacotePorUnidade(unidade);
  }, [aplicarDestinoPacotePorUnidade, tenantIndex]);

  const abrirNovaUnidadePacote = useCallback(() => {
    if (!pacoteFilialReferencia) {
      toast({
        title: "Sem metadados da filial",
        description: "Analise o pacote antes de criar uma nova unidade a partir dos dados do ZIP.",
        variant: "destructive",
      });
      return;
    }
    if (!pacoteMapeamento.academiaId) {
      toast({
        title: "Selecione a academia",
        description: "Defina a academia no passo 1 antes de criar uma nova unidade.",
        variant: "destructive",
      });
      return;
    }
    setNovaUnidadePacoteForm(buildNovaUnidadePacoteForm(pacoteFilialReferencia, pacoteMapeamento.academiaNome));
    setNovaUnidadePacoteErro(null);
    setNovaUnidadePacoteAberta(true);
  }, [pacoteFilialReferencia, pacoteMapeamento.academiaId, pacoteMapeamento.academiaNome, toast]);

  const salvarNovaUnidadePacote = useCallback(async () => {
    if (!pacoteMapeamento.academiaId) {
      setNovaUnidadePacoteErro("Selecione a academia antes de criar a unidade.");
      return;
    }
    if (!novaUnidadePacoteForm.nome.trim()) {
      setNovaUnidadePacoteErro("Informe o nome da unidade.");
      return;
    }
    const normalizedSubdomain = normalizeSubdomain(novaUnidadePacoteForm.subdomain);
    if (!normalizedSubdomain) {
      setNovaUnidadePacoteErro("Informe um subdominio valido para a nova unidade.");
      return;
    }
    if (!isValidCnpj(novaUnidadePacoteForm.documento)) {
      setNovaUnidadePacoteErro("Informe um CNPJ valido para a nova unidade.");
      return;
    }

    setNovaUnidadePacoteSalvando(true);
    setNovaUnidadePacoteErro(null);
    try {
      const persisted = await createGlobalUnidade({
        nome: novaUnidadePacoteForm.nome.trim(),
        academiaId: pacoteMapeamento.academiaId,
        groupId: pacoteMapeamento.academiaId,
        razaoSocial: novaUnidadePacoteForm.nomeOriginal.trim() || undefined,
        subdomain: normalizedSubdomain,
        documento: formatCnpj(novaUnidadePacoteForm.documento),
        email: novaUnidadePacoteForm.email.trim() || undefined,
        telefone: novaUnidadePacoteForm.telefone.trim() || undefined,
        endereco: {
          bairro: novaUnidadePacoteForm.bairro.trim() || undefined,
          cidade: novaUnidadePacoteForm.cidade.trim() || undefined,
        },
        ativo: true,
      });

      setUnidades((current) => [persisted, ...current.filter((item) => item.id !== persisted.id)]);

      const evoFilialId =
        (pacoteEvoUnidadeResolvida ? String(pacoteEvoUnidadeResolvida) : pacoteEvoUnidadeId.trim()) || undefined;

      try {
        const savedOnboarding = await saveUnidadeOnboarding({
          tenantId: persisted.id,
          academiaId: pacoteMapeamento.academiaId,
          estrategia: "PREPARAR_ETL",
          evoFilialId,
        });
        upsertOnboardingState(savedOnboarding);
      } catch (onboardingError) {
        toast({
          title: "Unidade criada, mas o onboarding nao foi salvo",
          description: normalizeErrorMessage(onboardingError),
          variant: "destructive",
        });
      }

      aplicarDestinoPacotePorUnidade(persisted, { evoFilialId });
      setNovaUnidadePacoteAberta(false);
      toast({
        title: "Nova unidade criada",
        description: `${persisted.nome} foi criada e selecionada como destino da importacao.`,
      });
    } catch (saveError) {
      setNovaUnidadePacoteErro(normalizeErrorMessage(saveError));
    } finally {
      setNovaUnidadePacoteSalvando(false);
    }
  }, [
    aplicarDestinoPacotePorUnidade,
    novaUnidadePacoteForm.bairro,
    novaUnidadePacoteForm.cidade,
    novaUnidadePacoteForm.documento,
    novaUnidadePacoteForm.email,
    novaUnidadePacoteForm.nome,
    novaUnidadePacoteForm.nomeOriginal,
    novaUnidadePacoteForm.subdomain,
    novaUnidadePacoteForm.telefone,
    pacoteEvoUnidadeId,
    pacoteEvoUnidadeResolvida,
    pacoteMapeamento.academiaId,
    toast,
    upsertOnboardingState,
  ]);

  function handleSelecionarAcademia(idx: number, option: SuggestionOption) {
    const unidadeOptions = getUnidadesOptions(option.id);
    if (unidadeOptions.length === 1) {
      const unidadeUnica = unidadeOptions[0];
      const onboarding = onboardingIndex.get(normalizeTenantId(unidadeUnica?.id));
      updateMapeamento(idx, {
        idFilialEvo: onboarding?.evoFilialId ?? "",
        academiaId: option.id,
        academiaNome: option.label,
        unidadeNome: unidadeUnica?.label ?? "",
        tenantId: unidadeUnica?.id ?? "",
      });
      return;
    }
    updateMapeamento(idx, {
      academiaId: option.id,
      academiaNome: option.label,
      unidadeNome: "",
      tenantId: "",
    });
  }

  function handleSelecionarUnidade(idx: number, option: SuggestionOption) {
    const onboarding = onboardingIndex.get(normalizeTenantId(option.id));
    updateMapeamento(idx, {
      idFilialEvo: onboarding?.evoFilialId ?? "",
      unidadeNome: option.label,
      tenantId: option.id,
    });
  }

  function handlePacoteSelecionarAcademia(option: SuggestionOption) {
    const unidadeOptions = getUnidadesOptions(option.id);
    if (unidadeOptions.length === 1) {
      const unidadeUnica = unidadeOptions[0];
      const onboarding = onboardingIndex.get(normalizeTenantId(unidadeUnica?.id));
      setPacoteMapeamento({
        ...pacoteMapeamento,
        idFilialEvo: onboarding?.evoFilialId ?? "",
        academiaId: option.id,
        academiaNome: option.label,
        unidadeNome: unidadeUnica?.label ?? "",
        tenantId: unidadeUnica?.id ?? "",
      });
      if (onboarding?.evoFilialId) {
        setPacoteEvoUnidadeId(onboarding.evoFilialId);
      }
      return;
    }
    setPacoteMapeamento({
      ...pacoteMapeamento,
      idFilialEvo: "",
      academiaId: option.id,
      academiaNome: option.label,
      unidadeNome: "",
      tenantId: "",
    });
  }

  function handlePacoteSelecionarUnidade(option: SuggestionOption) {
    const onboarding = onboardingIndex.get(normalizeTenantId(option.id));
    setPacoteMapeamento({
      ...pacoteMapeamento,
      idFilialEvo: onboarding?.evoFilialId ?? "",
      unidadeNome: option.label,
      tenantId: option.id,
    });
    if (onboarding?.evoFilialId) {
      setPacoteEvoUnidadeId(onboarding.evoFilialId);
    }
  }

  function handleAcademiaNomeChange(idx: number, value: string) {
    updateMapeamento(idx, {
      academiaNome: value,
      academiaId: "",
      unidadeNome: "",
      tenantId: "",
    });
  }

  function handlePacoteAcademiaNomeChange(value: string) {
    setPacoteMapeamento({
      ...pacoteMapeamento,
      academiaNome: value,
      academiaId: "",
      unidadeNome: "",
      tenantId: "",
    });
  }

  function handleUnidadeNomeChange(idx: number, value: string) {
    updateMapeamento(idx, {
      unidadeNome: value,
      tenantId: "",
    });
  }

  function handlePacoteUnidadeNomeChange(value: string) {
    setPacoteMapeamento({
      ...pacoteMapeamento,
      unidadeNome: value,
      tenantId: "",
    });
  }

  function togglePacoteArquivo(chave: string, checked: boolean) {
    setPacoteArquivosSelecionados((prev) => {
      if (checked) {
        return prev.includes(chave) ? prev : [...prev, chave];
      }
      return prev.filter((item) => item !== chave);
    });
  }

  function escolherArquivoPacote(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0] ?? null;
    setPacoteArquivo(arquivo);
    if (!arquivo) {
      setPacoteAnalise(null);
      setPacoteArquivosSelecionados([]);
    }
  }

  const validarFormPacote = useCallback((): string | null => {
    if (pacoteEvoUnidadeId.trim() && !parsePositiveInteger(pacoteEvoUnidadeId)) {
      return "Quando informado, EVO Unidade deve ser um número inteiro válido.";
    }
    if (!pacoteArquivo) {
      return "Selecione o arquivo de pacote (.zip ou .csv).";
    }
    if (Number.isNaN(pacoteMaxRejeicoes) || pacoteMaxRejeicoes < 0 || pacoteMaxRejeicoes > 10000) {
      return "maxRejeicoesRetorno deve estar entre 0 e 10000.";
    }
    return null;
  }, [pacoteArquivo, pacoteEvoUnidadeId, pacoteMaxRejeicoes]);

  const aplicarAnalisePacote = useCallback((analise: UploadAnaliseResponse, preserveSelection = false) => {
    setPacoteAnalise(analise);
    const disponiveis = analise.arquivos.filter((arquivo) => arquivo.disponivel).map((arquivo) => arquivo.chave);
    setPacoteArquivosSelecionados((prev) => {
      if (!preserveSelection) {
        return disponiveis;
      }
      return prev.filter((chave) => disponiveis.includes(chave));
    });

    const evoUnidadeId = parsePositiveInteger(analise.evoUnidadeId);
    if (evoUnidadeId) {
      const normalizedId = String(evoUnidadeId);
      setPacoteEvoUnidadeId(normalizedId);
      setPacoteMapeamento((current) => ({ ...current, idFilialEvo: normalizedId }));
    }
  }, []);

  const arquivosSelecionadosDaAnalise = useMemo(() => {
    if (!pacoteAnalise) return [];
    return pacoteArquivosSelecionados.filter((chave) => {
      const encontrado = pacoteAnalise.arquivos.find((arquivo) => arquivo.chave === chave);
      return Boolean(encontrado?.disponivel);
    });
  }, [pacoteAnalise, pacoteArquivosSelecionados]);

  async function analisarArquivoPacote() {
    const validation = validarFormPacote();
    if (validation) {
      toast({
        title: "Corrija os campos",
        description: validation,
        variant: "destructive",
      });
      return;
    }

    if (!pacoteArquivo) return;

    setPacoteAnalisando(true);
    try {
      const evoUnidadeId = parsePositiveInteger(pacoteEvoUnidadeId);
      const analise = await uploadBackofficeEvoP0Pacote({
        tenantId: pacoteMapeamento.tenantId || undefined,
        evoUnidadeId,
        arquivo: pacoteArquivo,
        contextoTenantId: pacoteMapeamento.tenantId || undefined,
      });
      aplicarAnalisePacote(analise);
      const disponiveis = analise.arquivos.filter((arquivo) => arquivo.disponivel).map((arquivo) => arquivo.chave);
      toast({
        title: "Pacote analisado",
        description: `Upload ${analise.uploadId} pronto. ${disponiveis.length} de ${analise.arquivos.length} arquivo(s) disponíveis.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof ApiRequestError) {
        logger.error("Erro ao analisar pacote EVO", { module: "evo-import", error: formatApiErrorForLog(error) });
        toast({
          title: "Erro ao analisar pacote",
          description: extractErrorMessage(error),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao analisar pacote",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setPacoteAnalisando(false);
    }
  }

  async function atualizarAnalisePacote() {
    if (!pacoteAnalise?.uploadId) {
      toast({
        title: "Sem análise ativa",
        description: "Envie um pacote para atualizar a análise.",
        variant: "destructive",
      });
      return;
    }

    setPacoteAnalisando(true);
    try {
      if (pacoteArquivo && pacotePrecisaReanaliseManual) {
        const analise = await uploadBackofficeEvoP0Pacote({
          tenantId: pacoteMapeamento.tenantId || undefined,
          evoUnidadeId: pacoteEvoUnidadeInformada,
          arquivo: pacoteArquivo,
          contextoTenantId: pacoteMapeamento.tenantId || undefined,
        });
        aplicarAnalisePacote(analise);
        toast({ title: "Pacote reanalisado", description: "Nova análise concluída com a EVO Unidade informada." });
        return;
      }

      const analise = await getBackofficeEvoP0PacoteAnalise({
        uploadId: pacoteAnalise.uploadId,
        tenantId: pacoteMapeamento.tenantId || pacoteAnalise.tenantId || undefined,
      });
      aplicarAnalisePacote(analise, true);
      toast({ title: "Análise atualizada", description: "Revalidação de pacote concluída." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro ao atualizar análise", description: message, variant: "destructive" });
    } finally {
      setPacoteAnalisando(false);
    }
  }

  async function criarJobPacote() {
    if (!pacoteAnalise) {
      toast({
        title: "Sem análise de pacote",
        description: "Faça a análise do pacote antes de criar o job.",
        variant: "destructive",
      });
      return;
    }

    if (!pacoteEvoUnidadeResolvida) {
      toast({
        title: "Filial pendente",
        description:
          "O pacote ainda não tem uma EVO Unidade resolvida. Informe a unidade manualmente e analise novamente antes de criar o job.",
        variant: "destructive",
      });
      return;
    }

    if (!pacoteMapeamento.academiaId || !pacoteMapeamento.tenantId) {
      toast({
        title: "Destino pendente",
        description: "Escolha uma unidade existente ou crie uma nova unidade antes de criar o job.",
        variant: "destructive",
      });
      return;
    }

    const arquivosParaImportar = arquivosSelecionadosDaAnalise;
    if (!arquivosParaImportar.length) {
      toast({
        title: "Selecione arquivos",
        description: "Escolha pelo menos um arquivo disponível ou mantenha todos marcados por padrão.",
        variant: "destructive",
      });
      return;
    }

    setPacoteCriandoJob(true);
    try {
      let analiseAtiva = pacoteAnalise;
      if (pacotePrecisaVincularTenant) {
        if (!pacoteArquivo) {
          toast({
            title: "Reanalise necessária",
            description:
              "O pacote foi analisado sem vínculo de unidade. Reenvie o ZIP com a unidade destino escolhida antes de criar o job.",
            variant: "destructive",
          });
          return;
        }

        const analiseVinculada = await uploadBackofficeEvoP0Pacote({
          tenantId: pacoteMapeamento.tenantId,
          evoUnidadeId: pacoteEvoUnidadeResolvida,
          arquivo: pacoteArquivo,
          contextoTenantId: pacoteMapeamento.tenantId,
        });
        aplicarAnalisePacote(analiseVinculada, true);
        analiseAtiva = analiseVinculada;
        toast({
          title: "Pacote vinculado a unidade destino",
          description: "O ZIP foi reprocessado com a unidade selecionada antes da criação do job.",
        });
      }
      const evoUnidadeIdParaJob = parsePositiveInteger(analiseAtiva.evoUnidadeId) ?? pacoteEvoUnidadeResolvida;

      const job = await createBackofficeEvoP0PacoteJob({
        uploadId: analiseAtiva.uploadId,
        dryRun: pacoteDryRun,
        maxRejeicoesRetorno: pacoteMaxRejeicoes,
        arquivos: arquivosParaImportar,
        tenantId: pacoteMapeamento.tenantId,
        evoUnidadeId: evoUnidadeIdParaJob,
      });

      const tenant = normalizeTenantId(pacoteMapeamento.tenantId);
      const nomeAcademia = pacoteMapeamento.academiaNome || "Não informado";
      const nomeUnidade = pacoteMapeamento.unidadeNome || "Não informado";
      const alias = normalizeJobAlias(pacoteJobAlias) ??
        buildDefaultJobAlias({
          origem: "pacote",
          unidadeNome: nomeUnidade,
          academiaNome: nomeAcademia,
          criadoEm: new Date().toISOString(),
        });
      await registrarOnboardingDoJob({
        tenantId: pacoteMapeamento.tenantId,
        academiaId: pacoteMapeamento.academiaId,
        evoFilialId: String(evoUnidadeIdParaJob),
        jobId: job.jobId,
        origem: "PACOTE",
        mensagem: `Job ${job.jobId} criado a partir do pacote EVO.`,
      });
      upsertJobHistorico({
        tenantId: tenant,
        jobId: job.jobId,
        alias,
        academiaNome: nomeAcademia,
        unidadeNome: nomeUnidade,
        origem: "pacote",
        criadoEm: new Date().toISOString(),
        status: "PROCESSANDO",
        arquivosSelecionados: arquivosParaImportar,
        arquivosDisponiveis: analiseAtiva.arquivos.filter((arquivo) => arquivo.disponivel).map((arquivo) => arquivo.chave),
      });
      setJobId(job.jobId);
      setJobTenantId(tenant);
      setJobTenantIds([tenant]);
      setJobOrigem("pacote");
      setJobAliasDraft(alias);
      setPacoteJobAlias("");
      lastJobStatusRef.current = null;
      setJobLabelFromContext(tenant, nomeAcademia, nomeUnidade);
      setStoredJobId(tenant, job.jobId);
      setActiveTab("acompanhamento");
      startPolling(job.jobId, true, [tenant], "pacote", tenant);
      toast({
        title: "Job criado",
        description: `Job ${job.jobId} criado com sucesso.`,
      });
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) {
        logger.error("Erro ao criar job do pacote EVO", { module: "evo-import", error: formatApiErrorForLog(error) });
        toast({
          title: "Erro ao criar job",
          description: extractErrorMessage(error),
          variant: "destructive",
        });
      } else {
        const message = error instanceof Error ? error.message : String(error);
        toast({
          title: "Erro ao criar job",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setPacoteCriandoJob(false);
    }
  }

  async function tentarSomenteErrosDoArquivo(arquivo: PacoteArquivoDisponivel) {
    const analiseAtiva = pacoteAnalise;
    if (!analiseAtiva?.uploadId) {
      toast({
        title: "Analise o pacote novamente",
        description: "O upload atual expirou ou não foi carregado para este retry.",
        variant: "destructive",
      });
      return;
    }
    if (!arquivo.historico.retrySomenteErrosSuportado) {
      return;
    }
    if (arquivo.historico.status === "processando") {
      toast({
        title: "Retry já em andamento",
        description: "Já existe um processamento em aberto para este arquivo lógico.",
      });
      return;
    }
    const tenant = pacoteMapeamento.tenantId || resolveCurrentTenantIdRaw();
    if (!tenant) {
      toast({
        title: "Selecione a unidade",
        description: "A unidade alvo é obrigatória para criar o retry somente erros.",
        variant: "destructive",
      });
      return;
    }
    const aliasBase = buildDefaultJobAlias({
      origem: "pacote",
      unidadeNome: pacoteMapeamento.unidadeNome || jobContextoLabel.unidadeNome,
      academiaNome: pacoteMapeamento.academiaNome || jobContextoLabel.academiaNome,
      criadoEm: new Date().toISOString(),
    });
    const alias = `Retry erros · ${arquivo.rotulo || arquivo.chave} · ${aliasBase}`;
    const evoUnidadeIdParaJob = pacoteEvoUnidadeResolvida ?? pacoteEvoUnidadeInformada ?? undefined;

    setPacoteCriandoJob(true);
    try {
      const job = await createBackofficeEvoP0PacoteJob({
        uploadId: analiseAtiva.uploadId,
        dryRun: pacoteDryRun,
        maxRejeicoesRetorno: pacoteMaxRejeicoes,
        arquivos: [arquivo.chave],
        retrySomenteErros: true,
        tenantId: tenant,
        evoUnidadeId: evoUnidadeIdParaJob,
      });
      await registrarOnboardingDoJob({
        tenantId: pacoteMapeamento.tenantId || tenant,
        academiaId: pacoteMapeamento.academiaId,
        evoFilialId: evoUnidadeIdParaJob ? String(evoUnidadeIdParaJob) : undefined,
        jobId: job.jobId,
        origem: "PACOTE",
        mensagem: `Retry somente erros criado para ${arquivo.rotulo || arquivo.chave}.`,
      });
      upsertJobHistorico({
        tenantId: tenant,
        jobId: job.jobId,
        alias,
        academiaNome: pacoteMapeamento.academiaNome || jobContextoLabel.academiaNome,
        unidadeNome: pacoteMapeamento.unidadeNome || jobContextoLabel.unidadeNome,
        origem: "pacote",
        criadoEm: new Date().toISOString(),
        status: "PROCESSANDO",
        arquivosSelecionados: [arquivo.chave],
        arquivosDisponiveis: analiseAtiva.arquivos.filter((item) => item.disponivel).map((item) => item.chave),
      });
      setJobId(job.jobId);
      setJobTenantId(tenant);
      setJobTenantIds([tenant]);
      setJobOrigem("pacote");
      setJobAliasDraft(alias);
      setStoredJobId(tenant, job.jobId);
      lastJobStatusRef.current = null;
      setJobLabelFromContext(
        tenant,
        pacoteMapeamento.academiaNome || jobContextoLabel.academiaNome,
        pacoteMapeamento.unidadeNome || jobContextoLabel.unidadeNome
      );
      setActiveTab("acompanhamento");
      startPolling(job.jobId, true, [tenant], "pacote", tenant);
      toast({
        title: "Retry somente erros criado",
        description: `Job ${job.jobId} preparado para ${arquivo.rotulo || arquivo.chave}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Erro ao criar retry",
        description: message,
        variant: "destructive",
      });
    } finally {
      setPacoteCriandoJob(false);
    }
  }



  const validarForm = useCallback((): string | null => {
    const hasInvalidIdFilial = mapeamentos.some((m) => Number.isNaN(Number(m.idFilialEvo)) || Number(m.idFilialEvo) < 0);
    if (hasInvalidIdFilial) {
      return "ID Filial EVO inválido. Informe um número inteiro válido para cada mapeamento.";
    }
    if (Number.isNaN(maxRejeicoes) || maxRejeicoes < 0 || maxRejeicoes > 10000) {
      return "maxRejeicoesRetorno deve estar entre 0 e 10000.";
    }
    if (!mapeamentos.length || mapeamentos.some((m) => !m.idFilialEvo || !m.academiaId || !m.tenantId)) {
      return "Informe ao menos um mapeamento com idFilialEvo, academia e unidade.";
    }
    const algumArquivo = FILE_FIELDS.some((f) => files[f.key]);
    if (!algumArquivo) {
      return "Envie pelo menos um arquivo CSV (idealmente todos).";
    }
    return null;
  }, [files, mapeamentos, maxRejeicoes]);

  async function handleSubmit() {
    const validation = validarForm();
    if (validation) {
      toast({ title: "Corrija os campos", description: validation, variant: "destructive" });
      return;
    }
    const payloadMapeamentos = mapeamentos.map((mapeamento) => ({
      idFilialEvo: Number(mapeamento.idFilialEvo),
      tenantId: mapeamento.tenantId,
    }));
    setSubmitting(true);
    try {
      const body = await createBackofficeEvoP0CsvJob({
        dryRun,
        maxRejeicoesRetorno: maxRejeicoes,
        mapeamentoFiliais: payloadMapeamentos,
        arquivos: FILE_FIELDS.flatMap(({ key, field }) => {
          const file = files[key];
          return file ? [{ field, file }] : [];
        }),
        tenantId: resolveCurrentTenantIdRaw(),
      });
      const newJobId = body.jobId ?? "";
      const currentStatus = (body.status as EvoStatus | undefined) ?? "PROCESSANDO";
      setJobResumo({
        status: currentStatus,
        solicitadoEm: body.solicitadoEm,
        finalizadoEm: body.finalizadoEm,
        geral: body.geral,
        tenantIds: body.tenantIds,
      });
      if (newJobId) {
        const tenantIds = [...new Set(payloadMapeamentos.map((item) => normalizeTenantId(item.tenantId)).filter(Boolean))];
        await Promise.all(
          mapeamentos.map(async (mapeamento) => {
            if (!mapeamento.tenantId) return;
            await registrarOnboardingDoJob({
              tenantId: mapeamento.tenantId,
              academiaId: mapeamento.academiaId,
              evoFilialId: mapeamento.idFilialEvo,
              jobId: newJobId,
              origem: "CSV",
              mensagem: `Job ${newJobId} criado para a trilha CSV EVO.`,
            });
          })
        );
        const currentTenant = tenantIds[0] || normalizeTenantId(resolveCurrentTenantIdRaw());
        const mapeamentoPrimario =
          mapeamentos.find((m) => normalizeTenantId(m.tenantId) === currentTenant) ?? mapeamentos[0];
        const nomeAcademia = mapeamentoPrimario?.academiaNome || "Não informado";
        const nomeUnidade = mapeamentoPrimario?.unidadeNome || "Não informado";
        const alias = normalizeJobAlias(csvJobAlias) ??
          buildDefaultJobAlias({
            origem: "csv",
            unidadeNome: nomeUnidade,
            academiaNome: nomeAcademia,
            criadoEm: new Date().toISOString(),
          });
        upsertJobHistorico({
          tenantId: currentTenant,
          jobId: newJobId,
          alias,
          academiaNome: nomeAcademia,
          unidadeNome: nomeUnidade,
          origem: "csv",
          criadoEm: new Date().toISOString(),
          status: currentStatus,
          arquivosSelecionados: FILE_FIELDS.flatMap(({ key, field }) => {
            if (!files[key]) return [];
            const arquivoCanonico = arquivoCanonicoPorCsvField.get(field);
            return arquivoCanonico ? [arquivoCanonico] : [];
          }),
          arquivosDisponiveis: FILE_FIELDS.flatMap(({ key, field }) => {
            if (!files[key]) return [];
            const arquivoCanonico = arquivoCanonicoPorCsvField.get(field);
            return arquivoCanonico ? [arquivoCanonico] : [];
          }),
        });
        setJobTenantId(currentTenant);
        setJobTenantIds(body.tenantIds?.map((item) => normalizeTenantId(item)).filter(Boolean) ?? tenantIds);
        setJobOrigem("csv");
        setJobAliasDraft(alias);
        setCsvJobAlias("");
        lastJobStatusRef.current = null;
        setJobLabelFromContext(currentTenant, nomeAcademia, nomeUnidade);
        setJobId(newJobId);
        setStoredJobId(currentTenant, newJobId);
        setActiveTab("acompanhamento");
        startPolling(newJobId, true, body.tenantIds?.map((item) => normalizeTenantId(item)).filter(Boolean) ?? tenantIds, "csv", currentTenant);
      }
      toast({ title: "Importação iniciada", description: newJobId ? `Job ${newJobId}` : undefined });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof ApiRequestError) {
        const trimmedBody = formatErrorBody(error.responseBody);
        logger.error("Erro na importação EVO", { module: "evo-import",
          status: error.status,
          path: error.path,
          body: trimmedBody,
        });
        toast({
          title: "Erro ao enviar importação",
          description: `Servidor retornou ${error.status}. Verifique o contrato e tente novamente. Consulte console para detalhe.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Erro ao enviar importação", description: message, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = null;
    setPolling(false);
  }, []);

  useEffect(() => {
    if (!polling || !pollStartedAt) return;
    const timeout = setInterval(() => {
      if (!pollStartedAt) return;
      if (Date.now() - pollStartedAt > 60 * 60 * 1000) {
        stopPolling();
        toast({ title: "Polling encerrado após 60 minutos", variant: "destructive" });
      }
    }, 10000);
    return () => clearInterval(timeout);
  }, [pollStartedAt, polling, stopPolling, toast]);

  const pollOnce = useCallback(async (
    id: string,
    tenantIdsOverride?: string[],
    origemOverride?: "pacote" | "csv" | null,
    tenantOverride?: string
  ) => {
    try {
      const tenantParaConsulta = normalizeTenantId(tenantOverride || jobTenantId);
      const data = await getBackofficeEvoImportJobResumo({
        jobId: id,
        tenantId: tenantParaConsulta,
      });
      setJobResumo(data);
      const tenantIds = data.tenantIds?.map((item) => normalizeTenantId(item)).filter(Boolean) ?? tenantIdsOverride ?? jobTenantIds;
      if (tenantIds.length > 0) {
        setJobTenantIds(tenantIds);
      }
      if (tenantParaConsulta) {
        atualizarJobHistoricoStatus(id, tenantParaConsulta, data.status);
        const itemSelecionado = jobsHistorico.find(
          (job) => normalizeTenantId(job.tenantId) === tenantParaConsulta && job.jobId === id
        );
        const labels = resolveTenantLabel(tenantParaConsulta);
        setJobLabelFromContext(
          tenantParaConsulta,
          itemSelecionado?.academiaNome ?? labels.academiaNome,
          itemSelecionado?.unidadeNome ?? labels.unidadeNome
        );
      }
      const origem = (origemOverride ?? jobOrigem ?? jobsHistorico.find((item) => item.jobId === id)?.origem ?? "csv").toUpperCase() as
        | "CSV"
        | "PACOTE";
      const tenantsParaOnboarding = tenantIds.length > 0 ? tenantIds : tenantParaConsulta ? [tenantParaConsulta] : [];
      await atualizarStatusOnboardingDoJob({
        tenantIds: tenantsParaOnboarding,
        jobId: id,
        status: data.status,
        origem,
        mensagem: data.rejeicoes?.mensagem,
      });
      if (data.status === "FALHA") {
        toast({ title: "Job falhou", description: data?.rejeicoes?.mensagem, variant: "destructive" });
      }
      if (data.status === "CONCLUIDO" || data.status === "CONCLUIDO_COM_REJEICOES" || data.status === "FALHA") {
        stopPolling();
      }
    } catch (error: unknown) {
      stopPolling();
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof ApiRequestError && error.status === 404) {
        clearStoredJobId(tenantOverride || resolveCurrentTenantId());
        setJobId("");
      }
      toast({ title: "Erro no acompanhamento", description: message, variant: "destructive" });
    }
  }, [
    atualizarStatusOnboardingDoJob,
    atualizarJobHistoricoStatus,
    clearStoredJobId,
    jobOrigem,
    jobTenantId,
    jobTenantIds,
    jobsHistorico,
    resolveTenantLabel,
    resolveCurrentTenantId,
    setJobLabelFromContext,
    stopPolling,
    toast,
  ]);

  const startPolling = useCallback((
    id: string,
    resetTimer: boolean,
    tenantIds: string[] = [],
    origem: "pacote" | "csv" | null = null,
    tenantId?: string
  ) => {
    if (!id) return;
    const tenant = normalizeTenantId(tenantId) || resolveCurrentTenantIdRaw();
    if (tenant) {
      setJobTenantId(tenant);
    }
    if (tenantIds.length > 0) {
      setJobTenantIds(tenantIds);
    }
    if (origem) {
      setJobOrigem(origem);
    }
    if (pollTimer.current) clearInterval(pollTimer.current);
    if (resetTimer) setPollStartedAt(Date.now());
    setPolling(true);
    pollOnce(id, tenantIds, origem, tenant);
    pollTimer.current = setInterval(() => pollOnce(id, tenantIds, origem, tenant), 3000);
  }, [pollOnce, resolveCurrentTenantIdRaw]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    const tenantId = resolveCurrentTenantId();
    const tenantAtual = normalizeTenantId(tenantId);
    const legacy = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!legacy && typeof window !== "undefined") {
      window.localStorage.removeItem(getStorageKeyForTenant(tenantId));
    } else if (legacy && typeof window !== "undefined" && legacy.trim()) {
      setStoredJobId(tenantId, legacy);
      window.localStorage.removeItem(STORAGE_KEY);
    }
    const queryJobId = searchParams.get("jobId")?.trim() ?? "";
    const saved = queryJobId || getStoredJobId(tenantId);
    if (saved) {
      setJobId(saved);
      const historicoSelecionado = jobsHistorico.find(
        (job) => normalizeTenantId(job.jobId) === normalizeTenantId(saved) && normalizeTenantId(job.tenantId) === tenantAtual
      );
      const tenantParaAcompanhar = normalizeTenantId(historicoSelecionado?.tenantId) || tenantAtual;
      const origemHistorico = historicoSelecionado?.origem ?? null;
      setStoredJobId(tenantParaAcompanhar, saved);
      if (tenantParaAcompanhar) {
        setJobTenantId(tenantParaAcompanhar);
        setJobLabelFromContext(tenantParaAcompanhar, historicoSelecionado?.academiaNome, historicoSelecionado?.unidadeNome);
      }
      lastJobStatusRef.current = null;
      setActiveTab("acompanhamento");
      startPolling(saved, false, tenantParaAcompanhar ? [tenantParaAcompanhar] : [], origemHistorico, tenantParaAcompanhar || tenantAtual);
    }
  }, [
    searchParams,
    jobsHistorico,
    getStoredJobId,
    getStorageKeyForTenant,
    setJobLabelFromContext,
    setStoredJobId,
    startPolling,
    resolveCurrentTenantId,
    resolveCurrentTenantIdRaw,
  ]);

  function handleJobIdInput(value: string) {
    const jobIdValue = value.trim();
    const tenantAtual = resolveCurrentTenantId();
    const historicoSelecionado = jobsHistorico.find((job) => normalizeTenantId(job.jobId) === normalizeTenantId(jobIdValue));
    setJobId(jobIdValue);
    const tenantParaUsar = normalizeTenantId(historicoSelecionado?.tenantId) || tenantAtual;
    setStoredJobId(tenantParaUsar, jobIdValue);
    if (tenantParaUsar) {
      setJobTenantId(tenantParaUsar);
      setJobTenantIds([tenantParaUsar]);
      setJobOrigem(historicoSelecionado?.origem ?? null);
      const labels = resolveTenantLabel(tenantParaUsar);
      setJobLabelFromContext(
        tenantParaUsar,
        historicoSelecionado?.academiaNome || labels.academiaNome,
        historicoSelecionado?.unidadeNome || labels.unidadeNome
      );
    }
  }

  function selecionarJobDoHistorico(job: JobHistoryMeta) {
    setJobId(job.jobId);
    setStoredJobId(job.tenantId, job.jobId);
    setJobTenantId(job.tenantId);
    setJobTenantIds([job.tenantId]);
    setJobOrigem(job.origem);
    setJobAliasDraft(resolveJobAlias(job));
    lastJobStatusRef.current = null;
    setJobLabelFromContext(job.tenantId, job.academiaNome, job.unidadeNome);
    setActiveTab("acompanhamento");
    startPolling(job.jobId, true, [job.tenantId], job.origem, job.tenantId);
  }

  async function selecionarJobDaLista(jobIdSelecionado: string) {
    const job = jobsEmExecucao.find((item) => item.jobId === jobIdSelecionado) ?? jobsHistorico.find((item) => item.jobId === jobIdSelecionado);
    if (!job) {
      return;
    }
    selecionarJobDoHistorico(job);
  }

  function salvarAliasJobAtual() {
    if (!jobId) {
      toast({ title: "Selecione um job", description: "Escolha um job para salvar o alias.", variant: "destructive" });
      return;
    }
    const tenantParaSalvar =
      normalizeTenantId(jobHistoricoAtual?.tenantId) || normalizeTenantId(jobTenantId) || resolveCurrentTenantIdRaw();
    if (!tenantParaSalvar) {
      toast({ title: "Sem contexto do job", description: "Não foi possível identificar a unidade do job.", variant: "destructive" });
      return;
    }
    if (jobHistoricoAtual) {
      atualizarJobHistoricoMeta(jobId, tenantParaSalvar, {
        alias: jobAliasDraft,
      });
    } else {
      upsertJobHistorico({
        tenantId: tenantParaSalvar,
        jobId,
        alias: jobAliasDraft,
        academiaNome: jobContextoLabel.academiaNome,
        unidadeNome: jobContextoLabel.unidadeNome,
        origem: jobOrigem ?? "csv",
        criadoEm: jobResumo?.solicitadoEm ?? new Date().toISOString(),
        status: jobResumo?.status,
      });
    }
    toast({
      title: normalizeJobAlias(jobAliasDraft) ? "Alias salvo" : "Alias removido",
      description: normalizeJobAlias(jobAliasDraft)
        ? "O alias foi salvo neste navegador para facilitar buscas futuras."
        : "O job voltou a usar o nome automático.",
    });
  }

  function openRejeicoesPorEntidade(
    entidade?: string,
    bloco?: ColaboradorBlocoKey | null,
    forceShow = true,
    jobIdOverride?: string,
    tenantOverride?: string
  ) {
    const filtro = entidade ?? ENTIDADE_TODAS;
    setEntidadeFiltro(filtro);
    setBlocoFiltro(bloco ?? BLOCO_TODOS);
    setRejPage(0);
    if (forceShow) setShowRejeicoes(true);
    const jobTarget = jobIdOverride ?? jobId;
    if (jobTarget) {
      void loadRejeicoes(0, jobTarget, tenantOverride);
    } else {
      toast({ title: "Informe um job para consultar rejeições", variant: "destructive" });
    }
  }

  async function handleLoadJob() {
    if (!jobId) {
      toast({ title: "Informe o jobId", variant: "destructive" });
      return;
    }
    const selecionado = jobsHistorico.find((item) => item.jobId === jobId);
    const tenantParaConsulta = normalizeTenantId(selecionado?.tenantId) || normalizeTenantId(jobTenantId) || resolveCurrentTenantIdRaw();
    const labels = tenantParaConsulta ? resolveTenantLabel(tenantParaConsulta) : null;
    if (tenantParaConsulta) {
      setJobTenantId(tenantParaConsulta);
      setJobTenantIds([tenantParaConsulta]);
      setJobOrigem(selecionado?.origem ?? jobOrigem);
      setStoredJobId(tenantParaConsulta, jobId);
      setJobLabelFromContext(
        tenantParaConsulta,
        selecionado?.academiaNome || labels?.academiaNome,
        selecionado?.unidadeNome || labels?.unidadeNome
      );
    }
    lastJobStatusRef.current = null;
    startPolling(jobId, true, tenantParaConsulta ? [tenantParaConsulta] : [], selecionado?.origem ?? jobOrigem, tenantParaConsulta);
  }

  async function loadRejeicoes(page = 0, jobIdOverride?: string, tenantIdOverride?: string) {
    const targetJobId = jobIdOverride ?? jobId;
    if (!targetJobId) return;
    setRejeicoesLoading(true);
    try {
      const data = await listBackofficeEvoImportJobRejeicoes({
        jobId: targetJobId,
        page,
        size: 50,
        tenantId: tenantIdOverride ?? jobTenantId,
      });
      const items = (data.items ?? data.content ?? []) as Rejeicao[];
      const mapped = items.map((r) => resolveRejeicao(r));
      const hasNext = data.hasNext ?? (Array.isArray(mapped) && mapped.length === 50);
      setRejeicoes(mapped);
      setRetrySelecao({});
      setRejPage(page);
      setRejHasNext(hasNext);
      setShowRejeicoes(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro ao carregar rejeições", description: message, variant: "destructive" });
    } finally {
      setRejeicoesLoading(false);
    }
  }

  function abrirRejeicoesDoHistoricoArquivo(arquivo: PacoteArquivoDisponivel) {
    const targetJobId = arquivo.historico.jobIdExibicao;
    const targetTenant = normalizeTenantId(arquivo.historico.jobRelacionado?.tenantId)
      || normalizeTenantId(pacoteMapeamento.tenantId)
      || resolveCurrentTenantIdRaw();
    if (!targetJobId) {
      toast({
        title: "Sem job histórico",
        description: "Este arquivo ainda não possui um job anterior para consulta de rejeições.",
        variant: "destructive",
      });
      return;
    }
    setJobId(targetJobId);
    if (targetTenant) {
      setJobTenantId(targetTenant);
      setJobTenantIds([targetTenant]);
      setStoredJobId(targetTenant, targetJobId);
      setJobLabelFromContext(
        targetTenant,
        pacoteMapeamento.academiaNome || jobContextoLabel.academiaNome,
        pacoteMapeamento.unidadeNome || jobContextoLabel.unidadeNome
      );
    }
    if (arquivo.historico.aliasResolvido) {
      setJobAliasDraft(arquivo.historico.aliasResolvido);
    }
    setActiveTab("acompanhamento");
    lastJobStatusRef.current = null;
    startPolling(targetJobId, true, targetTenant ? [targetTenant] : [], "pacote", targetTenant);
    openRejeicoesPorEntidade(
      arquivo.entidadeFiltro ?? ENTIDADE_TODAS,
      arquivo.blocoFiltro ?? null,
      true,
      targetJobId,
      targetTenant
    );
  }

  function toggleRetrySelecao(rejeicao: RejeicaoClassificada, checked: boolean) {
    setRetrySelecao((current) => {
      if (!checked) {
        const next = { ...current };
        delete next[rejeicao.idNormalizado];
        return next;
      }
      return {
        ...current,
        [rejeicao.idNormalizado]: rejeicao,
      };
    });
  }

  async function copiarPayloadRetry() {
    if (!retryPayload) return;
    try {
      await navigator.clipboard.writeText(retryPayload);
      toast({
        title: "Payload de retry copiado",
        description: "A seleção foi serializada para uso assim que o backend expuser o endpoint granular.",
      });
    } catch (error) {
      toast({
        title: "Falha ao copiar payload",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  }

  function statusVariant(status?: EvoStatus) {
    switch (status) {
      case "PROCESSANDO":
        return { variant: "secondary" as const, className: "bg-amber-500/20 text-amber-200 border-amber-400/40" };
      case "CONCLUIDO":
        return { variant: "secondary" as const, className: "bg-emerald-500/15 text-emerald-200 border-emerald-400/40" };
      case "CONCLUIDO_COM_REJEICOES":
        return { variant: "secondary" as const, className: "bg-orange-500/15 text-orange-200 border-orange-400/40" };
      case "FALHA":
        return { variant: "destructive" as const, className: "" };
      default:
        return { variant: "outline" as const, className: "" };
    }
  }

  function resumoValue(field: keyof EntidadeResumo, resumo?: EntidadeResumo) {
    return resumo ? resumo[field] ?? 0 : 0;
  }

  const rejeicoesClassificadas = useMemo<RejeicaoClassificada[]>(() => {
    return rejeicoes.map((rejeicao, index) => {
      const blocoClassificado = resolveColaboradorBlocoFromRejeicao(rejeicao);
      const blocoMeta = blocoClassificado ? colaboradorBlocoMetaIndex.get(blocoClassificado) : null;
      const retry = rejeicao.reprocessamento
        ? {
            suportado: Boolean(rejeicao.reprocessamento.suportado),
            escopo:
              rejeicao.reprocessamento.escopo?.trim() ||
              rejeicao.reprocessamento.chave?.trim() ||
              blocoClassificado ||
              "colaboradores",
            label:
              rejeicao.reprocessamento.label?.trim() ||
              blocoMeta?.retryLabel ||
              "Reprocessar bloco de colaboradores",
            descricao: rejeicao.reprocessamento.descricao ?? rejeicao.reprocessamento.motivoBloqueio,
          }
        : blocoMeta
          ? {
              suportado: false,
              escopo: blocoClassificado ?? "colaboradores",
              label: blocoMeta.retryLabel,
              descricao: "Aguardando suporte do backend para retry granular deste bloco.",
            }
          : null;
      return {
        ...rejeicao,
        idNormalizado:
          rejeicao.id?.trim() ||
          [rejeicao.entidade, rejeicao.arquivo, rejeicao.linhaArquivo, rejeicao.sourceId, String(index)].join(":"),
        blocoClassificado,
        blocoLabel: blocoMeta?.label ?? null,
        diagnostico: rejeicao.mensagemAcionavel ?? blocoMeta?.impactoAusencia ?? null,
        retryConfig: retry,
        payloadFormatado: formatPayloadForDisplay(rejeicao.payload),
      };
    });
  }, [rejeicoes]);

  const entidadesDisponiveis = useMemo(() => {
    const mapa = new Set<string>();
    rejeicoesClassificadas.forEach((r) => {
      if (r.entidade) mapa.add(r.entidade);
    });
    return Array.from(mapa).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [rejeicoesClassificadas]);

  const blocosDisponiveis = useMemo(() => {
    const mapa = new Set<ColaboradorBlocoKey>();
    rejeicoesClassificadas.forEach((rejeicao) => {
      if (rejeicao.blocoClassificado) mapa.add(rejeicao.blocoClassificado);
    });
    return COLABORADOR_BLOCO_CONFIG.filter((bloco) => mapa.has(bloco.key));
  }, [rejeicoesClassificadas]);

  const rejeicoesFiltradas = useMemo(() => {
    return rejeicoesClassificadas.filter((rejeicao) => {
      const entidadeOk = entidadeFiltro === ENTIDADE_TODAS || rejeicao.entidade === entidadeFiltro;
      const blocoOk = blocoFiltro === BLOCO_TODOS || rejeicao.blocoClassificado === blocoFiltro;
      return entidadeOk && blocoOk;
    });
  }, [blocoFiltro, entidadeFiltro, rejeicoesClassificadas]);

  const retryRejeicoesSelecionadas = useMemo(
    () => Object.values(retrySelecao),
    [retrySelecao]
  );

  const retryPayload = useMemo(() => {
    if (retryRejeicoesSelecionadas.length === 0) return null;
    return JSON.stringify(
      {
        jobId,
        origem: "colaboradores",
        itens: retryRejeicoesSelecionadas.map((rejeicao) => ({
          id: rejeicao.idNormalizado,
          entidade: rejeicao.entidade,
          bloco: rejeicao.blocoClassificado,
          escopo: rejeicao.retryConfig?.escopo,
          sourceId: rejeicao.sourceId ?? null,
          linhaArquivo: rejeicao.linhaArquivo,
          arquivo: rejeicao.arquivo,
        })),
      },
      null,
      2
    );
  }, [jobId, retryRejeicoesSelecionadas]);
  const tenantFoco = normalizeTenantId(pacoteMapeamento.tenantId || preselectedTenantId || mapeamentos[0]?.tenantId);
  const onboardingFoco = onboardingIndex.get(tenantFoco);
  const aliasSugestaoCsv = useMemo(() => {
    const mapeamentoPrimario = mapeamentos.find((item) => item.unidadeNome || item.academiaNome) ?? mapeamentos[0];
    return buildDefaultJobAlias({
      origem: "csv",
      unidadeNome: mapeamentoPrimario?.unidadeNome,
      academiaNome: mapeamentoPrimario?.academiaNome,
    });
  }, [mapeamentos]);
  const aliasSugestaoPacote = useMemo(
    () =>
      buildDefaultJobAlias({
        origem: "pacote",
        unidadeNome: pacoteMapeamento.unidadeNome,
        academiaNome: pacoteMapeamento.academiaNome,
      }),
    [pacoteMapeamento.academiaNome, pacoteMapeamento.unidadeNome]
  );
  const tenantFocoAcademiaId = useMemo(() => {
    const tenant = tenantIndex.get(tenantFoco);
    return normalizeTenantId(resolveUnidadeAcademiaId(tenant));
  }, [tenantFoco, tenantIndex]);

  useEffect(() => {
    let mounted = true;
    async function loadEligibleAdmins() {
      if (!tenantFocoAcademiaId) {
        if (!mounted) return;
        setEligibleAdminsPreview({ items: [], total: 0, loading: false });
        return;
      }

      setEligibleAdminsPreview((current) => ({ ...current, loading: true }));
      try {
        const response = await listEligibleNewUnitAdminsPreview({
          academiaId: tenantFocoAcademiaId,
          size: 4,
        });
        if (!mounted) return;
        setEligibleAdminsPreview({
          items: response.items,
          total: response.total ?? response.items.length,
          loading: false,
        });
      } catch {
        if (!mounted) return;
        setEligibleAdminsPreview({ items: [], total: 0, loading: false });
      }
    }

    void loadEligibleAdmins();
    return () => {
      mounted = false;
    };
  }, [tenantFocoAcademiaId]);

  return {
    // Tab state
    activeTab, setActiveTab,
    preselectedTenantId,

    // Shared data
    academias, academiaOptions, unidades, loadingMapeamento,
    getUnidadesOptions, carregarMapeamentoData,
    tenantFoco, onboardingFoco,
    resolveTenantLabel,

    // CSV tab (nova)
    dryRun, setDryRun,
    maxRejeicoes, setMaxRejeicoes,
    csvJobAlias, setCsvJobAlias, aliasSugestaoCsv,
    mapeamentos, setMapeamentos,
    files, setFile,
    csvUploadGroups,
    submitting, handleSubmit,
    handleAcademiaNomeChange, handleUnidadeNomeChange,
    handleSelecionarAcademia, handleSelecionarUnidade,

    // Pacote tab
    pacoteMapeamento, setPacoteMapeamento,
    pacoteArquivo, escolherArquivoPacote,
    pacoteDryRun, setPacoteDryRun,
    pacoteMaxRejeicoes, setPacoteMaxRejeicoes,
    pacoteJobAlias, setPacoteJobAlias, aliasSugestaoPacote,
    pacoteEvoUnidadeId, setPacoteEvoUnidadeId,
    pacoteAnalisando, pacoteCriandoJob,
    pacoteAnalise, pacoteEvoUnidadeResolvida,
    pacoteFilialResolvida, pacoteFiliaisEncontradas,
    pacoteFilialReferencia, pacoteNomeFilialReferencia,
    pacoteUnidadesSugeridas, pacoteSelecaoFilialPendente,
    pacotePrecisaVincularTenant, pacotePrecisaReanaliseManual,
    pacoteArquivosDisponiveis, pacoteColaboradoresBlocos,
    pacoteArquivosSelecionados, setPacoteArquivosSelecionados,
    pacoteArquivosSelecionadosSet,
    arquivosSelecionadosDaAnalise,
    eligibleAdminsPreview, pacoteResumoAcessoAutomatico, tenantFocoAcademiaId,
    analisarArquivoPacote, atualizarAnalisePacote,
    criarJobPacote, tentarSomenteErrosDoArquivo,
    togglePacoteArquivo,
    aplicarDestinoPacotePorTenantId,
    abrirNovaUnidadePacote, abrirRejeicoesDoHistoricoArquivo,
    handlePacoteAcademiaNomeChange, handlePacoteUnidadeNomeChange,
    handlePacoteSelecionarAcademia, handlePacoteSelecionarUnidade,
    formatBytes,

    // Dialog nova unidade
    novaUnidadePacoteAberta, setNovaUnidadePacoteAberta,
    novaUnidadePacoteSalvando,
    novaUnidadePacoteErro, setNovaUnidadePacoteErro,
    novaUnidadePacoteForm, setNovaUnidadePacoteForm,
    salvarNovaUnidadePacote,

    // Acompanhamento tab
    jobId, jobResumo, polling, jobTenantId, jobTenantIds, jobOrigem,
    jobContextoLabel,
    jobsEmExecucao, jobsRecentes,
    jobAliasAtual, jobAliasDraft, setJobAliasDraft, jobHistoricoAtual,
    progress, getPercentual,
    resumoCards, resumoCardsVisiveis, resumoCardsOcultos, resumoEntidadeMap,
    colaboradoresResumoCards, colaboradoresResumoAlertas, jobTemMalhaColaboradores,
    showRejeicoes, rejeicoesLoading,
    rejeicoesFiltradas, rejPage, setRejPage, rejHasNext,
    entidadeFiltro, setEntidadeFiltro, blocoFiltro, setBlocoFiltro,
    entidadesDisponiveis, blocosDisponiveis,
    retrySelecao, retryRejeicoesSelecionadas, retryPayload,
    handleJobIdInput, selecionarJobDoHistorico, selecionarJobDaLista,
    salvarAliasJobAtual, openRejeicoesPorEntidade,
    handleLoadJob, loadRejeicoes,
    startPolling, pollOnce, stopPolling,
    resolveCurrentTenantIdRaw, resolveJobAlias,
    statusVariant, resumoValue,
    toggleRetrySelecao, copiarPayloadRetry,
    toast,
  };
}

export type EvoImportPageState = ReturnType<typeof useEvoImportPage>;

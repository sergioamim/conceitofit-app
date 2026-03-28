"use client";

import Link from "next/link";
import { Suspense, type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, RefreshCw, Copy, UploadCloud, XCircle } from "lucide-react";
import { SuggestionInput, type SuggestionOption } from "@/components/shared/suggestion-input";
import { MapeamentoAcademiaUnidadeSelector } from "@/components/admin/importacao-academia-unidade-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
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
import { formatDateTime, formatJobAliasDate } from "./date-time-format";
import { logger } from "@/lib/shared/logger";

export const dynamic = "force-dynamic";

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
} from "./shared";

function ImportacaoEvoP0PageContent() {
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
    const deduplicado = new Map<string, PacoteArquivoDisponivel>();
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
        logger.error("Erro ao analisar pacote EVO", { module: "importacao-evo", ...formatApiErrorForLog(error) });
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
        logger.error("Erro ao criar job do pacote EVO", { module: "importacao-evo", ...formatApiErrorForLog(error) });
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
        logger.error("Erro na importação EVO", {
          module: "importacao-evo",
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Integrações &gt; EVO</p>
        <h1 className="text-3xl font-display font-bold leading-tight">Acompanhamento de Importação EVO</h1>
        <p className="text-sm text-muted-foreground">
          Dispare e acompanhe jobs de importação EVO. O último job fica salvo para retomar depois.
        </p>
      </div>

      {tenantFoco && onboardingFoco ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <Badge variant="secondary">{getUnidadeOnboardingStrategyLabel(onboardingFoco.estrategia)}</Badge>
          <Badge variant="outline">{getUnidadeOnboardingStatusLabel(onboardingFoco.status)}</Badge>
          <span className="text-muted-foreground">
            Unidade foco: {resolveTenantLabel(tenantFoco).unidadeNome} · EVO {onboardingFoco.evoFilialId || "não vinculado"}
          </span>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="nova">Nova Importação</TabsTrigger>
          <TabsTrigger value="pacote">Importar por Pacote (ZIP/CSV)</TabsTrigger>
          <TabsTrigger value="acompanhamento">Acompanhar Job</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parâmetros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="accent-gym-accent"
                  />
                  Dry-run (não gravar)
                </Label>
                <div className="w-48 space-y-2">
                  <Label htmlFor="maxRejeicoes">Max rejeições retorno</Label>
                  <Input
                    id="maxRejeicoes"
                    type="number"
                    min={0}
                    max={10000}
                    value={maxRejeicoes}
                    onChange={(e) => setMaxRejeicoes(Number(e.target.value))}
                  />
                </div>
                <div className="min-w-72 flex-1 space-y-2">
                  <Label htmlFor="csvJobAlias">Alias do job</Label>
                  <Input
                    id="csvJobAlias"
                    value={csvJobAlias}
                    onChange={(e) => setCsvJobAlias(e.target.value)}
                    placeholder={aliasSugestaoCsv}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional. Se vazio, a tela gera um nome automático para facilitar encontrar o job depois.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Mapeamento de filiais (EVO → unidade)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMapeamentos((prev) => [
                        ...prev,
                        { idFilialEvo: "", tenantId: "", academiaId: "", academiaNome: "", unidadeNome: "" },
                      ])
                    }
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-3">
                  {mapeamentos.map((m, idx) => (
                    <MapeamentoAcademiaUnidadeSelector
                      key={idx}
                      showIdFilial
                      idFilialLabel="ID Filial EVO"
                      idFilialValue={m.idFilialEvo}
                      onIdFilialChange={(value) =>
                        setMapeamentos((prev) => prev.map((row, i) => (i === idx ? { ...row, idFilialEvo: value } : row)))
                      }
                      academiaNome={m.academiaNome}
                      unidadeNome={m.unidadeNome}
                      academiaId={m.academiaId}
                      academiaOptions={academiaOptions}
                      unidadesOptions={getUnidadesOptions(m.academiaId)}
                      loadingAcademias={loadingMapeamento}
                      onAcademiaNomeChange={(value) => handleAcademiaNomeChange(idx, value)}
                      onUnidadeNomeChange={(value) => handleUnidadeNomeChange(idx, value)}
                      onAcademiaSelect={(option) => handleSelecionarAcademia(idx, option)}
                      onUnidadeSelect={(option) => handleSelecionarUnidade(idx, option)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-semibold">Uploads (CSV)</p>
                <div className="space-y-4">
                  {csvUploadGroups.map((group) => (
                    <div key={group.key} className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{group.label}</p>
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {group.files.map(({ key, label, field }) => (
                          <label
                            key={field}
                            className={cn(
                              "flex cursor-pointer items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm hover:border-gym-accent",
                              files[key] ? "border-gym-accent/80 bg-gym-accent/5" : "border-border"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <UploadCloud className="size-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span className="font-medium">{label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {files[key]?.name ?? "Selecione um arquivo CSV"}
                                </span>
                              </div>
                            </div>
                            <Input
                              type="file"
                              accept=".csv,text/csv"
                              className="hidden"
                              onChange={(e) => setFile(key, e.target.files?.[0] ?? null)}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Enviando..." : "Iniciar importação"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pacote" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Importação por pacote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <Label className="font-semibold">1. Analisar pacote</Label>
                <p className="text-sm text-muted-foreground">
                  Se quiser, já selecione a academia para contextualizar as sugestões. A EVO Unidade fica para depois da leitura do ZIP.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Academia</Label>
                  <SuggestionInput
                    value={pacoteMapeamento.academiaNome}
                    onValueChange={handlePacoteAcademiaNomeChange}
                    onSelect={handlePacoteSelecionarAcademia}
                    options={academiaOptions}
                    minCharsToSearch={0}
                    placeholder="Pesquise por nome da academia"
                    emptyText={loadingMapeamento ? "Carregando academias..." : "Nenhuma academia encontrada"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional nesta etapa. Ajuda a filtrar sugestões e a abertura do cadastro de nova unidade.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pacoteArquivo">Arquivo</Label>
                  <Input
                    id="pacoteArquivo"
                    type="file"
                    accept=".zip,.csv,application/zip,text/csv"
                    onChange={escolherArquivoPacote}
                  />
                  <p className="text-xs text-muted-foreground">
                    Arquivo .zip contendo exportação EVO ou CSV unitário.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={pacoteDryRun}
                    onChange={(e) => setPacoteDryRun(e.target.checked)}
                    className="accent-gym-accent"
                  />
                  Dry-run (não gravar)
                </Label>
                <div className="w-56 space-y-2">
                  <Label htmlFor="pacoteMaxRejeicoes">Max rejeições retorno</Label>
                  <Input
                    id="pacoteMaxRejeicoes"
                    type="number"
                    min={0}
                    max={10000}
                    value={pacoteMaxRejeicoes}
                    onChange={(e) => setPacoteMaxRejeicoes(Number(e.target.value))}
                  />
                </div>
                <div className="min-w-72 flex-1 space-y-2">
                  <Label htmlFor="pacoteJobAlias">Alias do job</Label>
                  <Input
                    id="pacoteJobAlias"
                    value={pacoteJobAlias}
                    onChange={(e) => setPacoteJobAlias(e.target.value)}
                    placeholder={aliasSugestaoPacote}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional. Use um nome curto para reencontrar este job sem depender do ID.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={analisarArquivoPacote} disabled={pacoteAnalisando || !pacoteArquivo}>
                  {pacoteAnalisando ? "Analisando pacote..." : "Analisar pacote"}
                </Button>
              </div>

              {pacoteArquivo && (
                <p className="text-xs text-muted-foreground">
                  Arquivo selecionado: {pacoteArquivo.name} ({formatBytes(pacoteArquivo.size)})
                </p>
              )}

              {pacoteAnalise && (
                <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <p>
                      <span className="font-medium">Upload ID:</span> {pacoteAnalise.uploadId}
                    </p>
                    <p>
                      <span className="font-medium">EVO Unidade:</span> {pacoteEvoUnidadeResolvida ?? "pendente"}
                    </p>
                    <p>
                      <span className="font-medium">Expira em:</span> {formatDateTime(pacoteAnalise.expiraEm)}
                    </p>
                    <p>
                      <span className="font-medium">Disponíveis:</span> {arquivosSelecionadosDaAnalise.length} / {pacoteAnalise.arquivos.length}
                    </p>
                  </div>

                  {pacoteFilialResolvida && (
                    <>
                      <Separator />
                      <div className="space-y-3 rounded-md border border-border bg-background p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">Filial detectada no pacote</p>
                          {pacoteEvoUnidadeResolvida ? (
                            <Badge variant="secondary">EVO Unidade {pacoteEvoUnidadeResolvida}</Badge>
                          ) : (
                            <Badge variant="outline">Sem EVO Unidade resolvida</Badge>
                          )}
                        </div>
                        <div className="grid gap-2 text-sm md:grid-cols-2">
                          <p>
                            <span className="font-medium">Nome no pacote:</span> {pacoteNomeFilialReferencia.nomeOriginal || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Unidade/filial:</span> {pacoteNomeFilialReferencia.unidadeNome || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Documento:</span> {pacoteFilialResolvida.documento?.trim() || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Abreviação:</span> {pacoteFilialResolvida.abreviacao?.trim() || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Local:</span>{" "}
                            {[pacoteFilialResolvida.bairro, pacoteFilialResolvida.cidade]
                              .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
                              .join(" · ") || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Email:</span> {pacoteFilialResolvida.email?.trim() || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Telefone:</span> {pacoteFilialResolvida.telefone?.trim() || "—"}
                          </p>
                          <p>
                            <span className="font-medium">EVO Filial ID:</span>{" "}
                            {typeof pacoteFilialResolvida.evoFilialId === "number" ? pacoteFilialResolvida.evoFilialId : "—"}
                          </p>
                          <p>
                            <span className="font-medium">EVO Academia ID:</span>{" "}
                            {typeof pacoteFilialResolvida.evoAcademiaId === "number" ? pacoteFilialResolvida.evoAcademiaId : "—"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {pacoteFiliaisEncontradas.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Filiais encontradas no pacote</p>
                        <div className="grid gap-2">
                          {pacoteFiliaisEncontradas.map((filial, index) => {
                            const nome = filial.nome?.trim() || filial.abreviacao?.trim() || `Filial ${index + 1}`;
                            const detalhes = [
                              filial.documento?.trim(),
                              filial.bairro?.trim(),
                              filial.cidade?.trim(),
                              filial.email?.trim(),
                              filial.telefone?.trim(),
                            ].filter((value): value is string => Boolean(value));
                            const filialResolvida = pacoteEvoUnidadeResolvida && filial.evoFilialId === pacoteEvoUnidadeResolvida;
                            return (
                              <div key={`${filial.evoFilialId ?? filial.documento ?? nome}-${index}`} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium">{nome}</p>
                                  {filialResolvida ? <Badge variant="secondary">Resolvida</Badge> : null}
                                  {typeof filial.evoFilialId === "number" ? (
                                    <Badge variant="outline">EVO {filial.evoFilialId}</Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {detalhes.length > 0 ? detalhes.join(" · ") : "Sem detalhes adicionais."}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {!pacoteEvoUnidadeResolvida && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 size-4" />
                        <div>
                          <p className="font-semibold">
                            {pacoteSelecaoFilialPendente ? "Seleção de filial pendente" : "EVO Unidade ainda não resolvida"}
                          </p>
                          <p>
                            {pacoteSelecaoFilialPendente
                              ? "O pacote contém múltiplas filiais. Informe manualmente a EVO Unidade correta e rode a análise novamente antes de criar o job."
                              : "A análise ainda não retornou uma EVO Unidade válida. Se necessário, preencha o campo manualmente e reanalise o pacote antes de criar o job."}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">2. Confirmar EVO Unidade e unidade destino</p>
                      <p className="text-xs text-muted-foreground">
                        Com os metadados do pacote, informe a EVO Unidade se necessário e então escolha uma unidade existente ou crie uma nova.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pacoteEvoUnidadeId">EVO Unidade</Label>
                        <Input
                          id="pacoteEvoUnidadeId"
                          type="number"
                          min={1}
                          placeholder="Ex.: 1"
                          value={pacoteEvoUnidadeId}
                          onChange={(e) => {
                            setPacoteEvoUnidadeId(e.target.value);
                            setPacoteMapeamento((current) => ({ ...current, idFilialEvo: e.target.value }));
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Se você informar manualmente uma EVO Unidade depois da análise, use{" "}
                          {pacotePrecisaReanaliseManual ? '"Atualizar análise"' : '"Analisar pacote"'} para reprocessar o ZIP com esse valor.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Academia selecionada</Label>
                        <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                          <p className="font-medium">{pacoteMapeamento.academiaNome || "Nenhuma academia selecionada"}</p>
                          <p className="text-xs text-muted-foreground">
                            {pacoteMapeamento.academiaId
                              ? "Você pode ajustar a academia e a unidade logo abaixo, se necessário."
                              : "Selecione uma academia no passo 1 ou ajuste abaixo antes de criar o job."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {pacoteUnidadesSugeridas.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Sugestões de unidades existentes</p>
                        <div className="grid gap-2">
                          {pacoteUnidadesSugeridas.map(({ unidade, academiaNome }) => {
                            const selecionada = unidade.id === pacoteMapeamento.tenantId;
                            return (
                              <div
                                key={unidade.id}
                                className="flex flex-col gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium">{unidade.nome}</p>
                                    {selecionada ? <Badge variant="secondary">Selecionada</Badge> : null}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {academiaNome}
                                    {unidade.documento ? ` · ${unidade.documento}` : ""}
                                    {unidade.endereco?.cidade ? ` · ${unidade.endereco.cidade}` : ""}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={selecionada ? "secondary" : "outline"}
                                  onClick={() => aplicarDestinoPacotePorTenantId(unidade.id)}
                                >
                                  {selecionada ? "Destino atual" : "Usar esta unidade"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma unidade existente corresponde automaticamente aos metadados detectados.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={abrirNovaUnidadePacote}
                        disabled={!pacoteFilialReferencia || !pacoteMapeamento.academiaId}
                      >
                        Criar nova unidade
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void carregarMapeamentoData()}
                        disabled={loadingMapeamento}
                      >
                        {loadingMapeamento ? "Atualizando unidades..." : "Atualizar unidades"}
                      </Button>
                    </div>

                    <MapeamentoAcademiaUnidadeSelector
                      academiaNome={pacoteMapeamento.academiaNome}
                      unidadeNome={pacoteMapeamento.unidadeNome}
                      academiaId={pacoteMapeamento.academiaId}
                      academiaOptions={academiaOptions}
                      unidadesOptions={getUnidadesOptions(pacoteMapeamento.academiaId)}
                      loadingAcademias={loadingMapeamento}
                      onAcademiaNomeChange={handlePacoteAcademiaNomeChange}
                      onUnidadeNomeChange={handlePacoteUnidadeNomeChange}
                      onAcademiaSelect={handlePacoteSelecionarAcademia}
                      onUnidadeSelect={handlePacoteSelecionarUnidade}
                    />

                    {pacoteMapeamento.academiaId && pacoteMapeamento.tenantId ? (
                      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                        <p className="font-medium">Destino selecionado</p>
                        <p className="text-muted-foreground">
                          {pacoteMapeamento.academiaNome || "Academia não informada"} · {pacoteMapeamento.unidadeNome || "Unidade não informada"}
                        </p>
                        {pacotePrecisaVincularTenant ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            O pacote atual ainda será vinculado a essa unidade antes da criação do job.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 size-4" />
                        <div>
                          <p className="font-semibold">Destino ainda não selecionado</p>
                          <p>Escolha uma unidade existente ou crie uma nova unidade antes de criar o job.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Arquivos reconhecidos</p>
                    <p className="text-xs text-muted-foreground">
                      A malha de colaboradores abaixo evidencia o que o backend reconheceu no pacote, para deixar explícitos blocos completos, parciais e não reconhecidos.
                    </p>
                  </div>
                  {pacoteArquivosDisponiveis.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum arquivo reconhecido neste pacote.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">Malha de colaboradores</p>
                          <p className="text-xs text-muted-foreground">
                            Se um arquivo existir no ZIP, mas não estiver nesta malha, ele não foi reconhecido pelo backend durante a análise do pacote.
                          </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {pacoteColaboradoresBlocos.map((bloco) => {
                            const badgeLabel =
                              bloco.status === "completo"
                                ? "Completo"
                                : bloco.status === "parcial"
                                  ? "Parcial"
                                  : bloco.status === "naoEnviado"
                                    ? "Não enviado"
                                    : "Não reconhecido";
                            const badgeClassName =
                              bloco.status === "completo"
                                ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/40"
                                : bloco.status === "parcial"
                                  ? "bg-amber-500/15 text-amber-200 border-amber-400/40"
                                  : bloco.status === "naoEnviado"
                                    ? "bg-slate-500/15 text-slate-200 border-slate-400/40"
                                    : "bg-destructive/10 text-destructive border-destructive/40";
                            return (
                              <div key={bloco.key} className="rounded-md border border-border bg-muted/20 p-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium">{bloco.label}</p>
                                    <p className="text-xs text-muted-foreground">{bloco.descricao}</p>
                                  </div>
                                  <Badge variant="outline" className={badgeClassName}>
                                    {badgeLabel}
                                  </Badge>
                                </div>
                                <div className="mt-3 space-y-2">
                                  {bloco.arquivos.map((arquivo) => (
                                    <div
                                      key={arquivo.chave}
                                      className="flex items-start justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
                                    >
                                      <div className="space-y-1">
                                        <p className="text-sm font-medium">{arquivo.arquivoEsperado}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {arquivo.descricao ?? "Arquivo auxiliar de colaboradores."}
                                        </p>
                                      </div>
                                      <Badge variant={arquivo.disponivel ? "secondary" : "outline"}>
                                        {arquivo.disponivel
                                          ? "Disponível"
                                          : arquivo.catalogadoPeloBackend
                                            ? "Não enviado"
                                            : "Não reconhecido"}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                                {bloco.status !== "completo" ? (
                                  <p className="mt-3 text-xs text-muted-foreground">{bloco.impactoAusencia}</p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Selecionados: {arquivosSelecionadosDaAnalise.length} de {pacoteArquivosDisponiveis.filter((arquivo) => arquivo.disponivel).length} disponíveis
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setPacoteArquivosSelecionados(
                                pacoteArquivosDisponiveis.filter((arquivo) => arquivo.disponivel).map((arquivo) => arquivo.chave)
                              )
                            }
                          >
                            Selecionar disponíveis
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setPacoteArquivosSelecionados([])}
                          >
                            Desmarcar todos
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        {pacoteArquivosDisponiveis.map((arquivo) => {
                          const selecionado = pacoteArquivosSelecionadosSet.has(arquivo.chave);
                          const badgeHistorico = resolveArquivoHistoricoBadge(arquivo.historico);
                          const podeAbrirRejeicoes = Boolean(arquivo.blocoFiltro || arquivo.entidadeFiltro)
                            && (arquivo.historico.status === "comErros" || arquivo.historico.status === "parcial");
                          const podeRetrySomenteErros = arquivo.historico.retrySomenteErrosSuportado
                            && (arquivo.historico.status === "comErros" || arquivo.historico.status === "parcial")
                            && arquivo.historico.status !== "processando";
                          const labelRetrySomenteErros = arquivo.historico.retrySomenteErrosSuportado
                            ? "Tentar somente erros"
                            : "Tentar somente erros (aguardando backend)";
                          return (
                            <label
                              key={arquivo.chave}
                              className={cn(
                                "grid grid-cols-[1fr_auto] gap-2 rounded-md border border-border px-3 py-2 text-sm",
                                arquivo.disponivel ? "bg-background" : "bg-muted/40"
                              )}
                            >
                              <div className="space-y-1">
                                <p className="font-medium">{arquivo.rotulo || arquivo.chave}</p>
                                <p className="text-xs text-muted-foreground">
                                  {arquivo.arquivoEsperado} | enviado: {arquivo.nomeArquivoEnviado ?? "—"} | {formatBytes(arquivo.tamanhoBytes)}
                                </p>
                                <p className="text-xs text-muted-foreground">Chave: {arquivo.chave}</p>
                                <div className="rounded-md border border-border bg-secondary/20 px-2.5 py-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={cn("text-[11px]", badgeHistorico.className)}>
                                      {badgeHistorico.label}
                                    </Badge>
                                    <span className="text-[11px] text-muted-foreground">
                                      {arquivo.historico.aliasResolvido || arquivo.historico.jobIdExibicao || "Sem job anterior"}
                                    </span>
                                  </div>
                                  <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground md:grid-cols-2">
                                    <p>
                                      <span className="font-medium text-foreground">Job:</span> {arquivo.historico.jobIdExibicao ?? "—"}
                                    </p>
                                    <p>
                                      <span className="font-medium text-foreground">Processado em:</span>{" "}
                                      {arquivo.historico.processadoEmExibicao ? formatDateTime(arquivo.historico.processadoEmExibicao) : "—"}
                                    </p>
                                    <p>
                                      <span className="font-medium text-foreground">Processadas:</span>{" "}
                                      {formatResumoCount(arquivo.historico.resumo?.processadas ?? null)}
                                    </p>
                                    <p>
                                      <span className="font-medium text-foreground">Criadas:</span>{" "}
                                      {formatResumoCount(arquivo.historico.resumo?.criadas ?? null)}
                                    </p>
                                    <p>
                                      <span className="font-medium text-foreground">Atualizadas:</span>{" "}
                                      {formatResumoCount(arquivo.historico.resumo?.atualizadas ?? null)}
                                    </p>
                                    <p>
                                      <span className="font-medium text-foreground">Rejeitadas:</span>{" "}
                                      {formatResumoCount(arquivo.historico.resumo?.rejeitadas ?? null)}
                                    </p>
                                  </div>
                                  {arquivo.historico.mensagemParcial ? (
                                    <p className="mt-2 text-[11px] text-muted-foreground">{arquivo.historico.mensagemParcial}</p>
                                  ) : null}
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {podeAbrirRejeicoes ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7"
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          abrirRejeicoesDoHistoricoArquivo(arquivo);
                                        }}
                                      >
                                        Ver rejeições
                                      </Button>
                                    ) : null}
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-7"
                                      disabled={!podeRetrySomenteErros || pacoteCriandoJob}
                                      onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        void tentarSomenteErrosDoArquivo(arquivo);
                                      }}
                                    >
                                      {labelRetrySomenteErros}
                                    </Button>
                                  </div>
                                </div>
                                {selecionado && (arquivo.chave === "clientes" || arquivo.chave === "funcionarios") ? (
                                  <div className="rounded-md border border-border bg-secondary/20 px-2.5 py-2 text-xs text-muted-foreground">
                                    <p className="font-medium text-foreground">
                                      {eligibleAdminsPreview.loading
                                        ? "Consultando propagação automática de acessos..."
                                        : pacoteResumoAcessoAutomatico ?? "Nenhum usuário administrativo está elegível para propagação automática nesta academia."}
                                    </p>
                                    {tenantFocoAcademiaId ? (
                                      <Link
                                        href={`/admin/seguranca/usuarios?academiaId=${tenantFocoAcademiaId}&eligible=1`}
                                        className="mt-2 inline-flex text-xs font-medium text-gym-accent hover:underline"
                                      >
                                        Abrir segurança
                                      </Link>
                                    ) : null}
                                  </div>
                                ) : null}
                                {arquivo.descricao ? (
                                  <p className="text-xs text-muted-foreground">{arquivo.descricao}</p>
                                ) : null}
                                {!arquivo.disponivel && arquivo.impactoAusencia ? (
                                  <p className="text-xs text-muted-foreground">{arquivo.impactoAusencia}</p>
                                ) : null}
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  disabled={!arquivo.disponivel}
                                  checked={selecionado}
                                  onChange={(e) => togglePacoteArquivo(arquivo.chave, e.target.checked)}
                                />
                                {!arquivo.disponivel && (
                                  <span className="ml-2 text-xs text-destructive">
                                    {arquivo.catalogadoPeloBackend ? "Não enviado" : "Não reconhecido"}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={criarJobPacote}
                      disabled={pacoteCriandoJob || arquivosSelecionadosDaAnalise.length === 0}
                    >
                      {pacoteCriandoJob ? "Criando job..." : "Criar Job"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={atualizarAnalisePacote}
                      disabled={pacoteAnalisando}
                      className="ml-2"
                    >
                      {pacotePrecisaReanaliseManual ? "Reanalisar com EVO Unidade" : "Atualizar análise"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acompanhamento" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job de importação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Job ID</Label>
                  <Input
                    placeholder="Informe ou use o último job salvo"
                    value={jobId}
                    onChange={(e) => handleJobIdInput(e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={handleLoadJob} disabled={!jobId || polling}>
                    Carregar job
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      startPolling(
                        jobId,
                        true,
                        jobTenantIds.length > 0
                          ? jobTenantIds
                          : jobTenantId || resolveCurrentTenantIdRaw()
                            ? [jobTenantId || resolveCurrentTenantIdRaw()]
                            : [],
                        jobOrigem,
                        jobTenantId || resolveCurrentTenantIdRaw()
                      )
                    }
                    disabled={!jobId}
                  >
                    Atualizar agora
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (jobId) navigator.clipboard.writeText(jobId);
                      toast({ title: "jobId copiado" });
                    }}
                    disabled={!jobId}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              {jobsEmExecucao.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="job-em-execucao" className="text-sm">
                    Jobs em execução
                  </Label>
                  <Select value={jobId} onValueChange={selecionarJobDaLista}>
                    <SelectTrigger className="w-full md:max-w-xl" id="job-em-execucao">
                      <SelectValue placeholder="Selecione um job em execução" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobsEmExecucao.map((job) => {
                        const academia = job.academiaNome || "Não informado";
                        const unidade = job.unidadeNome || "Não informado";
                        const alias = resolveJobAlias(job);
                        return (
                          <SelectItem key={job.jobId} value={job.jobId}>
                            <span className="inline-flex w-full items-center justify-between gap-2">
                              <span className="flex flex-col text-left">
                                <span>{alias}</span>
                                <span className="font-mono text-[11px] text-muted-foreground">{job.jobId}</span>
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {academia} · {unidade}
                              </span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {jobsRecentes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-sm">Últimos jobs salvos</Label>
                    <p className="text-xs text-muted-foreground">Histórico local deste navegador</p>
                  </div>
                  <div className="grid gap-2">
                    {jobsRecentes.map((job) => {
                      const alias = resolveJobAlias(job);
                      const status = statusVariant(job.status);
                      return (
                        <button
                          key={`${job.tenantId}-${job.jobId}`}
                          type="button"
                          className={cn(
                            "rounded-md border border-border bg-background px-3 py-3 text-left transition hover:bg-muted/40",
                            job.jobId === jobId ? "border-gym-accent/40 bg-gym-accent/5" : ""
                          )}
                          onClick={() => selecionarJobDoHistorico(job)}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{alias}</p>
                              <p className="font-mono text-xs text-muted-foreground">{job.jobId}</p>
                              <p className="text-xs text-muted-foreground">
                                {job.academiaNome} · {job.unidadeNome} · {formatDateTime(job.criadoEm)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{job.origem === "pacote" ? "Pacote" : "CSV"}</Badge>
                              <Badge variant={status.variant} className={status.className}>
                                {job.status ?? "SALVO"}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator />

              {!jobId && <p className="text-sm text-muted-foreground">Nenhuma importação em andamento.</p>}

              {jobId && (
                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">Job</span>
                        <span className="text-sm font-semibold text-foreground">{jobAliasAtual || "Sem alias"}</span>
                      {(() => {
                        const v = statusVariant(jobResumo?.status);
                        return (
                          <Badge variant={v.variant} className={v.className}>
                            {jobResumo?.status ?? "—"}
                          </Badge>
                        );
                      })()}
                      {polling && <span className="text-xs text-muted-foreground">Atualizando a cada 3s…</span>}
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{jobId}</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        Academia: <span className="font-medium text-foreground">{jobContextoLabel.academiaNome}</span>
                      </p>
                      <p>
                        Unidade: <span className="font-medium text-foreground">{jobContextoLabel.unidadeNome}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => loadRejeicoes(0)} disabled={!jobResumo}>
                        Abrir rejeições
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => pollOnce(jobId)} disabled={!jobResumo}>
                        <RefreshCw className="size-4" />
                        Atualizar agora
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="space-y-2">
                      <Label htmlFor="jobAliasDraft">Alias do job</Label>
                      <Input
                        id="jobAliasDraft"
                        value={jobAliasDraft}
                        onChange={(e) => setJobAliasDraft(e.target.value)}
                        placeholder={jobAliasAtual || "Ex.: EVO Centro março"}
                      />
                      <p className="text-xs text-muted-foreground">
                        Salvo localmente neste navegador para facilitar localizar o job depois.
                      </p>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" variant="outline" onClick={salvarAliasJobAtual}>
                        Salvar alias
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Solicitado em</p>
                      <p className="text-sm">{formatDateTime(jobResumo?.solicitadoEm)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Finalizado em</p>
                      <p className="text-sm">{formatDateTime(jobResumo?.finalizadoEm)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Progresso</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-gym-accent"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{progress}%</span>
                      </div>
                    </div>
                  </div>

                  {jobResumo?.status === "FALHA" && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                      <XCircle className="mt-0.5 size-4" />
                      <div>
                        <p className="font-semibold">Job falhou</p>
                        <p>{jobResumo?.rejeicoes?.mensagem ?? "Verifique as rejeições para detalhes."}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    {resumoCardsVisiveis.map(({ key, label }) => {
                      const resumo = jobResumo?.[key] as EntidadeResumo | undefined;
                      const { percentual, temTotal } = getPercentual(resumo);
                      const entityFilter =
                        key === "funcionarios" && jobTemMalhaColaboradores ? ENTIDADE_TODAS : resumoEntidadeMap[key];
                      const canOpenDetails = key === "geral" || Boolean(entityFilter);
                      return (
                        <Card
                          key={key}
                          className={cn(
                            "border-border",
                            canOpenDetails ? "focus-ring-brand cursor-pointer transition hover:bg-muted/40" : ""
                          )}
                          role={canOpenDetails ? "link" : undefined}
                          tabIndex={canOpenDetails ? 0 : -1}
                          onClick={() => {
                            if (!canOpenDetails) return;
                            openRejeicoesPorEntidade(entityFilter);
                          }}
                          onKeyDown={(event) => {
                            if (!canOpenDetails) return;
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openRejeicoesPorEntidade(entityFilter);
                            }
                          }}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{label}</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <span>Total</span>
                            <span className="text-right text-foreground">{resumoValue("total", resumo)}</span>
                            <span>Processadas</span>
                            <span className="text-right text-foreground">{resumoValue("processadas", resumo)}</span>
                            <span>Criadas</span>
                            <span className="text-right text-foreground">{resumoValue("criadas", resumo)}</span>
                            <span>Atualizadas</span>
                            <span className="text-right text-foreground">{resumoValue("atualizadas", resumo)}</span>
                            <span className="text-gym-danger">Rejeitadas</span>
                            <span className="text-right text-gym-danger font-semibold">{resumoValue("rejeitadas", resumo)}</span>
                            <span className="col-span-2 pt-2">Evolução</span>
                            <span className="col-span-2">
                              <span className="inline-flex w-full items-center gap-2">
                                <span className="text-foreground">
                                  {temTotal ? `${percentual}%` : "Aguardando total"}
                                </span>
                                <span className="flex-1 rounded-full bg-muted h-2">
                                  <span
                                    className="block h-2 rounded-full bg-gym-accent transition-all duration-300"
                                    style={{ width: temTotal ? `${percentual}%` : "0%" }}
                                  />
                                </span>
                              </span>
                            </span>
                            {canOpenDetails && (
                              <span className="col-span-2 pt-2 text-[11px] text-muted-foreground">
                                Abrir detalhes de rejeições
                              </span>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {colaboradoresResumoCards.length > 0 ? (
                    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Diagnóstico de colaboradores</p>
                        <p className="text-xs text-muted-foreground">
                          O job agora separa ficha principal, funções, tipos, contratação, horários e perfil legado para evidenciar importações parciais.
                        </p>
                      </div>

                      {colaboradoresResumoAlertas.length > 0 ? (
                        <div className="space-y-2">
                          {colaboradoresResumoAlertas.map((alerta, index) => (
                            <div
                              key={`${alerta.bloco ?? "geral"}-${index}`}
                              className={cn(
                                "rounded-md border px-3 py-2 text-sm",
                                alerta.severidade === "error"
                                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                                  : "border-amber-400/40 bg-amber-500/10 text-amber-100"
                              )}
                            >
                              {alerta.mensagem}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {colaboradoresResumoCards.map((bloco) => {
                          const resumo = bloco.resumo;
                          const { percentual, temTotal } = getPercentual(resumo);
                          const statusLabel =
                            bloco.status === "naoSelecionado"
                              ? "Não selecionado"
                              : bloco.status === "semLinhas"
                                ? "Sem linhas"
                                : bloco.status === "comRejeicoes"
                                  ? "Com rejeições"
                                  : "Sucesso";
                          const statusVariant = bloco.status === "sucesso" ? ("secondary" as const) : ("outline" as const);
                          return (
                            <Card
                              key={bloco.key}
                              className="cursor-pointer border-border transition hover:bg-muted/40"
                              role="link"
                              tabIndex={0}
                              onClick={() => openRejeicoesPorEntidade(ENTIDADE_TODAS, bloco.key)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openRejeicoesPorEntidade(ENTIDADE_TODAS, bloco.key);
                                }
                              }}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <CardTitle className="text-sm">{bloco.label}</CardTitle>
                                  <Badge variant={statusVariant}>
                                    {statusLabel}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{bloco.descricao}</p>
                              </CardHeader>
                              <CardContent className="space-y-3 text-xs text-muted-foreground">
                                <div className="grid grid-cols-2 gap-2">
                                  <span>Total</span>
                                  <span className="text-right text-foreground">{resumoValue("total", resumo)}</span>
                                  <span>Processadas</span>
                                  <span className="text-right text-foreground">{resumoValue("processadas", resumo)}</span>
                                  <span>Criadas</span>
                                  <span className="text-right text-foreground">{resumoValue("criadas", resumo)}</span>
                                  <span>Atualizadas</span>
                                  <span className="text-right text-foreground">{resumoValue("atualizadas", resumo)}</span>
                                  <span className="text-gym-danger">Rejeitadas</span>
                                  <span className="text-right font-semibold text-gym-danger">
                                    {resumoValue("rejeitadas", resumo)}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-foreground">{temTotal ? `${percentual}%` : "Aguardando total"}</span>
                                    <span className="h-2 flex-1 rounded-full bg-muted">
                                      <span
                                        className="block h-2 rounded-full bg-gym-accent transition-all duration-300"
                                        style={{ width: temTotal ? `${percentual}%` : "0%" }}
                                      />
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {bloco.arquivosSelecionados.length > 0 ? (
                                      bloco.arquivosSelecionados.map((arquivo) => (
                                        <span
                                          key={arquivo.field}
                                          className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground"
                                        >
                                          {arquivo.label}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="rounded-full border border-destructive/40 px-2 py-1 text-[11px] text-destructive">
                                        Bloco não incluído
                                      </span>
                                    )}
                                    {bloco.arquivosAusentes.length > 0 && bloco.status !== "naoSelecionado" ? (
                                      <span className="rounded-full border border-amber-400/40 px-2 py-1 text-[11px] text-amber-100">
                                        {bloco.arquivosAusentes.length} arquivo(s) ausente(s)
                                      </span>
                                    ) : null}
                                  </div>
                                  {resumo?.mensagemParcial ? (
                                    <p className="text-[11px] text-muted-foreground">{resumo.mensagemParcial}</p>
                                  ) : bloco.status === "semLinhas" ? (
                                    <p className="text-[11px] text-muted-foreground">
                                      O backend executou este bloco, mas não encontrou linhas aplicáveis no job.
                                    </p>
                                  ) : bloco.status === "naoSelecionado" ? (
                                    <p className="text-[11px] text-muted-foreground">
                                      O resumo do backend indica que este bloco não participou da execução.
                                    </p>
                                  ) : bloco.arquivosAusentes.length > 0 ? (
                                    <p className="text-[11px] text-muted-foreground">
                                      {bloco.impactoAusencia}
                                    </p>
                                  ) : null}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {resumoCardsOcultos.length > 0 ? (
                    <details className="rounded-lg border border-border bg-muted/20 p-4">
                      <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                        Arquivos ignorados nesta execução ({resumoCardsOcultos.length})
                      </summary>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Estes blocos não foram selecionados na criação do job e ficam recolhidos para não poluir a tela.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resumoCardsOcultos.map((card) => (
                          <span
                            key={String(card.key)}
                            className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground"
                          >
                            {card.label}
                          </span>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {showRejeicoes && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Rejeições</CardTitle>
                  <p className="text-sm text-muted-foreground">Página {rejPage + 1}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="min-w-56">
                    <Label htmlFor="filtro-entidade" className="text-xs">
                      Filtrar por entidade
                    </Label>
                    <Select
                      value={entidadeFiltro}
                      onValueChange={(value) => {
                        setEntidadeFiltro(value);
                        setRejPage(0);
                      }}
                    >
                      <SelectTrigger className="mt-1 h-9 w-full" id="filtro-entidade">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ENTIDADE_TODAS}>Todas</SelectItem>
                        {entidadesDisponiveis.map((entidade) => (
                          <SelectItem key={entidade} value={entidade}>
                            {entidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-56">
                    <Label htmlFor="filtro-bloco" className="text-xs">
                      Filtrar por bloco
                    </Label>
                    <Select
                      value={blocoFiltro}
                      onValueChange={(value) => {
                        setBlocoFiltro(value);
                        setRejPage(0);
                      }}
                    >
                      <SelectTrigger className="mt-1 h-9 w-full" id="filtro-bloco">
                        <SelectValue placeholder="Todos os blocos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={BLOCO_TODOS}>Todos os blocos</SelectItem>
                        {blocosDisponiveis.map((bloco) => (
                          <SelectItem key={bloco.key} value={bloco.key}>
                            {bloco.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={rejPage === 0 || rejeicoesLoading} onClick={() => loadRejeicoes(rejPage - 1)}>
                      Anterior
                    </Button>
                    <Button size="sm" variant="outline" disabled={!rejHasNext || rejeicoesLoading} onClick={() => loadRejeicoes(rejPage + 1)}>
                      Próxima
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rejeicoesLoading && <p className="text-sm text-muted-foreground">Carregando rejeições…</p>}
                {!rejeicoesLoading && rejeicoesFiltradas.length === 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    <AlertCircle className="mt-0.5 size-4" />
                    Nenhuma rejeição encontrada nesta página.
                  </div>
                )}
                {!rejeicoesLoading && retryRejeicoesSelecionadas.length > 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Reprocesso seletivo preparado</p>
                        <p className="text-xs text-muted-foreground">
                          {retryRejeicoesSelecionadas.length} rejeição(ões) selecionada(s) para retry granular por bloco.
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => void copiarPayloadRetry()}>
                        Copiar payload de retry
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {retryRejeicoesSelecionadas.map((rejeicao) => (
                        <span
                          key={rejeicao.idNormalizado}
                          className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground"
                        >
                          {rejeicao.blocoLabel ?? rejeicao.entidade} · linha {rejeicao.linhaArquivo}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {!rejeicoesLoading && rejeicoesFiltradas.length > 0 && (
                  <div className="space-y-3">
                    {rejeicoesFiltradas.map((rejeicao) => {
                      const retrySelecionado = Boolean(retrySelecao[rejeicao.idNormalizado]);
                      return (
                        <div key={rejeicao.idNormalizado} className="rounded-lg border border-border bg-background p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{rejeicao.entidade}</Badge>
                                {rejeicao.blocoLabel ? <Badge variant="secondary">{rejeicao.blocoLabel}</Badge> : null}
                                {rejeicao.retryConfig ? (
                                  <Badge variant={rejeicao.retryConfig.suportado ? "secondary" : "outline"}>
                                    {rejeicao.retryConfig.suportado ? "Retry disponível" : "Retry aguardando backend"}
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="text-sm font-medium text-foreground">{rejeicao.motivo}</p>
                              {rejeicao.diagnostico ? (
                                <p className="text-xs text-muted-foreground">{rejeicao.diagnostico}</p>
                              ) : null}
                            </div>
                            {rejeicao.retryConfig ? (
                              <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <input
                                  type="checkbox"
                                  checked={retrySelecionado}
                                  disabled={!rejeicao.retryConfig.suportado}
                                  onChange={(event) => toggleRetrySelecao(rejeicao, event.target.checked)}
                                  className="accent-gym-accent"
                                />
                                Selecionar para retry
                              </Label>
                            ) : null}
                          </div>

                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                            <p>
                              <span className="font-medium text-foreground">Arquivo:</span> {rejeicao.arquivo}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Linha:</span> {rejeicao.linhaArquivo}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Source ID:</span> {rejeicao.sourceId ?? "—"}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Criado em:</span> {formatDateTime(rejeicao.criadoEm)}
                            </p>
                          </div>

                          {rejeicao.retryConfig?.descricao ? (
                            <div className="mt-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Retry:</span> {rejeicao.retryConfig.descricao}
                            </div>
                          ) : null}

                          {rejeicao.payloadFormatado ? (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium text-foreground">Payload útil para correção</p>
                              <pre className="overflow-auto rounded-md border border-border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                                {rejeicao.payloadFormatado}
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={novaUnidadePacoteAberta}
        onOpenChange={(open) => {
          setNovaUnidadePacoteAberta(open);
          if (!open) {
            setNovaUnidadePacoteErro(null);
          }
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar nova unidade a partir do ZIP</DialogTitle>
            <DialogDescription>
              Os dados detectados no pacote foram pre-carregados e podem ser ajustados antes da criacao da unidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
              <p className="font-medium">{pacoteMapeamento.academiaNome || "Academia nao informada"}</p>
              <p className="text-xs text-muted-foreground">A nova unidade sera criada dentro desta academia.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nova-unidade-pacote-nome-original">Nome detectado no pacote</Label>
                <Input
                  id="nova-unidade-pacote-nome-original"
                  value={novaUnidadePacoteForm.nomeOriginal}
                  onChange={(event) =>
                    setNovaUnidadePacoteForm((current) => ({ ...current, nomeOriginal: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo deste pacote: academia + unidade/filial, como `Academia Sergio Amim - S6`.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-nome">Nome da unidade</Label>
                <Input
                  id="nova-unidade-pacote-nome"
                  value={novaUnidadePacoteForm.nome}
                  onChange={(event) =>
                    setNovaUnidadePacoteForm((current) => ({ ...current, nome: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-subdomain">Subdominio</Label>
                <Input
                  id="nova-unidade-pacote-subdomain"
                  placeholder="academia-sergio-amim-s6"
                  value={novaUnidadePacoteForm.subdomain}
                  onChange={(event) =>
                    setNovaUnidadePacoteForm((current) => ({
                      ...current,
                      subdomain: normalizeSubdomain(event.target.value),
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Obrigatorio. O valor e normalizado para letras minusculas, numeros e hifens.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-documento">CNPJ</Label>
                <Input
                  id="nova-unidade-pacote-documento"
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  value={novaUnidadePacoteForm.documento}
                  onChange={(event) =>
                    setNovaUnidadePacoteForm((current) => ({
                      ...current,
                      documento: formatCnpj(event.target.value),
                    }))
                  }
                />
                {novaUnidadePacoteForm.documento && !isValidCnpj(novaUnidadePacoteForm.documento) ? (
                  <p className="text-xs text-destructive">Informe um CNPJ valido no padrao 00.000.000/0000-00.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">O CNPJ e padronizado e validado antes de salvar.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-email">Email</Label>
                <Input
                  id="nova-unidade-pacote-email"
                  type="email"
                  value={novaUnidadePacoteForm.email}
                  onChange={(event) =>
                    setNovaUnidadePacoteForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-telefone">Telefone</Label>
                <Input
                  id="nova-unidade-pacote-telefone"
                  value={novaUnidadePacoteForm.telefone}
                  onChange={(event) =>
                    setNovaUnidadePacoteForm((current) => ({ ...current, telefone: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-bairro">Bairro</Label>
                <Input
                  id="nova-unidade-pacote-bairro"
                  value={novaUnidadePacoteForm.bairro}
                  onChange={(event) =>
                    setNovaUnidadePacoteForm((current) => ({ ...current, bairro: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-cidade">Cidade</Label>
                <Input
                  id="nova-unidade-pacote-cidade"
                  value={novaUnidadePacoteForm.cidade}
                  onChange={(event) =>
                    setNovaUnidadePacoteForm((current) => ({ ...current, cidade: event.target.value }))
                  }
                />
              </div>
            </div>

            {novaUnidadePacoteErro ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {novaUnidadePacoteErro}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNovaUnidadePacoteAberta(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={salvarNovaUnidadePacote} disabled={novaUnidadePacoteSalvando}>
              {novaUnidadePacoteSalvando ? "Criando unidade..." : "Criar e usar unidade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ImportacaoEvoP0Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Importação EVO</h1>
            <p className="mt-1 text-sm text-muted-foreground">Carregando parâmetros da importação...</p>
          </div>
        </div>
      }
    >
      <ImportacaoEvoP0PageContent />
    </Suspense>
  );
}

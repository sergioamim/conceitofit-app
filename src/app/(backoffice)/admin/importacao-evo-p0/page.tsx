"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, RefreshCw, Copy, UploadCloud, XCircle } from "lucide-react";
import { type SuggestionOption } from "@/components/shared/suggestion-input";
import { MapeamentoAcademiaUnidadeSelector } from "@/components/admin/importacao-academia-unidade-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  type EvoImportEntidadeResumo as EntidadeResumo,
  type EvoImportJobResumo as JobResumo,
  type EvoImportJobStatus as EvoStatus,
  type EvoImportRejeicao as Rejeicao,
  type UploadAnaliseArquivo,
  type UploadAnaliseResponse,
} from "@/lib/api/importacao-evo";
import { listGlobalAcademias, listGlobalUnidades } from "@/lib/backoffice/admin";
import {
  createBackofficeEvoP0CsvJob,
  createBackofficeEvoP0PacoteJob,
  getBackofficeEvoImportJobResumo,
  getBackofficeEvoP0PacoteAnalise,
  listBackofficeEvoImportJobRejeicoes,
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
import type { Academia, Tenant, UnidadeOnboardingState } from "@/lib/types";

export const dynamic = "force-dynamic";

type JobHistoryMeta = {
  tenantId: string;
  jobId: string;
  academiaNome: string;
  unidadeNome: string;
  origem: "pacote" | "csv";
  criadoEm: string;
  status?: EvoStatus;
};

const PACOTE_CHAVES_DISPONIVEIS = [
  "clientes",
  "prospects",
  "contratos",
  "clientesContratos",
  "vendas",
  "vendasItens",
  "recebimentos",
  "maquininhas",
  "produtos",
  "produtoMovimentacoes",
  "servicos",
  "funcionarios",
  "treinos",
  "treinosExercicios",
  "treinosGruposExercicios",
  "treinosSeries",
  "treinosSeriesItens",
  "contasBancarias",
  "contasPagar",
] as const;

const JOB_HISTORY_KEY = "evo-importacao-jobs-historico";
const JOB_HISTORY_LIMIT = 30;
const STORAGE_KEY = "evo-ultima-importacao-jobId";
const ENTIDADE_TODAS = "__todas__";
const resolveTenantForStorage = (tenantId?: string | null) =>
  (tenantId ?? "global").trim().toLowerCase() || "global";

function normalizeTenantId(value?: string | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

const FILE_FIELDS: { key: keyof FileMap; label: string; field: string }[] = [
  { key: "clientesFile", label: "CLIENTES.csv", field: "clientesFile" },
  { key: "prospectsFile", label: "PROSPECTS.csv", field: "prospectsFile" },
  { key: "contratosFile", label: "CONTRATOS.csv", field: "contratosFile" },
  { key: "clientesContratosFile", label: "CLIENTES_CONTRATOS.csv", field: "clientesContratosFile" },
  { key: "vendasFile", label: "VENDAS.csv", field: "vendasFile" },
  { key: "vendasItensFile", label: "VENDAS_ITENS.csv", field: "vendasItensFile" },
  { key: "recebimentosFile", label: "RECEBIMENTOS.csv", field: "recebimentosFile" },
  { key: "maquininhasFile", label: "MAQUININHAS.csv", field: "maquininhasFile" },
  { key: "produtosFile", label: "PRODUTOS.csv", field: "produtosFile" },
  { key: "produtoMovimentacoesFile", label: "PRODUTOS_MOVIMENTACOES.csv", field: "produtoMovimentacoesFile" },
  { key: "servicosFile", label: "SERVICOS.csv", field: "servicosFile" },
  { key: "funcionariosFile", label: "FUNCIONARIOS.csv", field: "funcionariosFile" },
  { key: "treinosExerciciosFile", label: "TREINOS_EXERCICIOS.csv", field: "treinosExerciciosFile" },
  { key: "treinosFile", label: "TREINOS.csv", field: "treinosFile" },
  { key: "treinosGruposExerciciosFile", label: "TREINOS_GRUPOS_EXERCICIOS.csv", field: "treinosGruposExerciciosFile" },
  { key: "treinosSeriesFile", label: "TREINOS_SERIES.csv", field: "treinosSeriesFile" },
  { key: "treinosSeriesItensFile", label: "TREINOS_SERIES_ITENS.csv", field: "treinosSeriesItensFile" },
  { key: "contasBancariasFile", label: "CONTAS_BANCARIAS.csv", field: "contasBancariasFile" },
  { key: "contasPagarFile", label: "CONTAS_PAGAR.csv", field: "contasPagarFile" },
];

type FileMap = {
  clientesFile?: File | null;
  prospectsFile?: File | null;
  contratosFile?: File | null;
  clientesContratosFile?: File | null;
  vendasFile?: File | null;
  vendasItensFile?: File | null;
  recebimentosFile?: File | null;
  contasBancariasFile?: File | null;
  contasPagarFile?: File | null;
  maquininhasFile?: File | null;
  produtosFile?: File | null;
  produtoMovimentacoesFile?: File | null;
  servicosFile?: File | null;
  funcionariosFile?: File | null;
  treinosExerciciosFile?: File | null;
  treinosGruposExerciciosFile?: File | null;
  treinosFile?: File | null;
  treinosSeriesFile?: File | null;
  treinosSeriesItensFile?: File | null;
};

type MapeamentoFilial = {
  idFilialEvo: string;
  academiaId: string;
  academiaNome: string;
  unidadeNome: string;
  tenantId: string;
};

export default function ImportacaoEvoP0Page() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const preselectedTenantId = normalizeTenantId(searchParams.get("tenantId"));
  const [activeTab, setActiveTab] = useState<"nova" | "pacote" | "acompanhamento">("nova");
  const [dryRun, setDryRun] = useState(false);
  const [maxRejeicoes, setMaxRejeicoes] = useState(200);
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [unidades, setUnidades] = useState<Tenant[]>([]);
  const [unidadesOnboarding, setUnidadesOnboarding] = useState<UnidadeOnboardingState[]>([]);
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
  const [pacoteAnalisando, setPacoteAnalisando] = useState(false);
  const [pacoteCriandoJob, setPacoteCriandoJob] = useState(false);

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
  const lastJobStatusRef = useRef<EvoStatus | null>(null);

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
        academiaNome: item.academiaNome?.toString() || "Não informado",
        unidadeNome: item.unidadeNome?.toString() || "Não informado",
        origem: item.origem === "pacote" || item.origem === "csv" ? item.origem : "csv",
        criadoEm: item.criadoEm?.toString() || new Date().toISOString(),
        status: (item.status as EvoStatus) || undefined,
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
          academiaNome: item.academiaNome || "Não informado",
          unidadeNome: item.unidadeNome || "Não informado",
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

  const atualizarJobHistoricoStatus = useCallback(
    (jobId: string, tenantId: string, status?: EvoStatus) => {
      if (!jobId || !tenantId) return;
      const atual = getStoredJobsHistorico();
      const next = atual.map((item) =>
        item.jobId === jobId && normalizeTenantId(item.tenantId) === normalizeTenantId(tenantId)
          ? { ...item, status, criadoEm: item.criadoEm || new Date().toISOString() }
          : item
      );
      setStoredJobsHistorico(next);
    },
    [getStoredJobsHistorico, setStoredJobsHistorico]
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
    entidade: rejeicao.entidade ?? "—",
    arquivo: rejeicao.arquivo ?? "—",
    linhaArquivo: rejeicao.linhaArquivo ?? 0,
    sourceId: rejeicao.sourceId,
    motivo: rejeicao.motivo ?? "Sem motivo informado",
    criadoEm: rejeicao.criadoEm ?? rejeicao.createdAt ?? new Date().toISOString(),
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

  const pacoteArquivosDisponiveis = useMemo<UploadAnaliseArquivo[]>(() => {
    if (!pacoteAnalise) return [];
    const ordenado = [...pacoteAnalise.arquivos]
      .sort((a, b) => {
        const indexA = PACOTE_CHAVES_DISPONIVEIS.indexOf(a.chave as (typeof PACOTE_CHAVES_DISPONIVEIS)[number]);
        const indexB = PACOTE_CHAVES_DISPONIVEIS.indexOf(b.chave as (typeof PACOTE_CHAVES_DISPONIVEIS)[number]);
        if (indexA === -1 && indexB === -1) return a.rotulo.localeCompare(b.rotulo, "pt-BR");
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    return ordenado;
  }, [pacoteAnalise]);

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

  useEffect(() => {
    let mounted = true;
    async function loadMapeamentoData() {
      setLoadingMapeamento(true);
      try {
        const [loadedAcademias, loadedUnidades, loadedOnboarding] = await Promise.all([
          listGlobalAcademias(),
          listGlobalUnidades(),
          listUnidadesOnboarding(),
        ]);
        if (!mounted) return;
        setAcademias(loadedAcademias);
        setUnidades(loadedUnidades);
        setUnidadesOnboarding(loadedOnboarding);
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : String(error);
        toast({ title: "Erro ao carregar dados de mapeamento", description: message, variant: "destructive" });
      } finally {
        if (mounted) setLoadingMapeamento(false);
      }
    }
    void loadMapeamentoData();
    return () => {
      mounted = false;
    };
  }, [toast]);

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

  const resumoEntidadeMap: Partial<Record<keyof JobResumo, string>> = {
    clientes: "CLIENTES",
    prospects: "PROSPECTS",
    contratos: "CONTRATOS",
    clientesContratos: "CLIENTES_CONTRATOS",
    maquininhas: "MAQUININHAS",
    produtos: "PRODUTOS",
    produtoMovimentacoes: "PRODUTOS_MOVIMENTACOES",
    servicos: "SERVICOS",
    funcionarios: "FUNCIONARIOS",
    exerciciosTreino: "TREINOS_EXERCICIOS",
    treinos: "TREINOS",
    gruposExercicio: "TREINOS_GRUPOS_EXERCICIOS",
    treinosSeries: "TREINOS_SERIES",
    treinosSeriesItens: "TREINOS_SERIES_ITENS",
    vendas: "VENDAS",
    vendasItens: "VENDAS_ITENS",
    recebimentos: "RECEBIMENTOS",
    contasBancarias: "CONTAS_BANCÁRIAS",
    contasPagar: "CONTAS_PAGAR",
  };

  const resumoCards: { key: keyof JobResumo; label: string }[] = [
    { key: "geral", label: "Geral" },
    { key: "clientes", label: "Clientes" },
    { key: "prospects", label: "Prospects" },
    { key: "contratos", label: "Contratos" },
    { key: "clientesContratos", label: "ClientesContrato" },
    { key: "maquininhas", label: "Maquininhas" },
    { key: "produtos", label: "Produtos" },
    { key: "produtoMovimentacoes", label: "Movimentações de Produto" },
    { key: "servicos", label: "Serviços" },
    { key: "funcionarios", label: "Funcionários" },
    { key: "gruposExercicio", label: "Grupos de Exercícios" },
    { key: "exerciciosTreino", label: "Exercícios de Treino" },
    { key: "treinos", label: "Treinos" },
    { key: "treinosSeries", label: "Séries de Treino" },
    { key: "treinosSeriesItens", label: "Itens de Séries" },
    { key: "vendas", label: "Vendas" },
    { key: "vendasItens", label: "VendasItens" },
    { key: "recebimentos", label: "Recebimentos" },
    { key: "contasBancarias", label: "ContasBancárias" },
    { key: "contasPagar", label: "Contas a Pagar" },
  ];

  function setFile(key: keyof FileMap, file: File | null) {
    setFiles((prev) => ({ ...prev, [key]: file }));
  }

  function updateMapeamento(idx: number, patch: Partial<MapeamentoFilial>) {
    setMapeamentos((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

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
      setPacoteAnalise(null);
      setPacoteArquivosSelecionados([]);
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
    setPacoteAnalise(null);
    setPacoteArquivosSelecionados([]);
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
    setPacoteAnalise(null);
    setPacoteArquivosSelecionados([]);
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
    setPacoteAnalise(null);
    setPacoteArquivosSelecionados([]);
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
    setPacoteAnalise(null);
    setPacoteArquivosSelecionados([]);
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
    if (!pacoteMapeamento.academiaId || !pacoteMapeamento.tenantId) {
      return "Selecione academia e unidade do pacote.";
    }
    const unidadeNum = Number(pacoteEvoUnidadeId);
    if (!pacoteEvoUnidadeId || Number.isNaN(unidadeNum) || unidadeNum <= 0) {
      return "Informe o EVO Unidade como número inteiro válido.";
    }
    if (!pacoteArquivo) {
      return "Selecione o arquivo de pacote (.zip ou .csv).";
    }
    if (Number.isNaN(pacoteMaxRejeicoes) || pacoteMaxRejeicoes < 0 || pacoteMaxRejeicoes > 10000) {
      return "maxRejeicoesRetorno deve estar entre 0 e 10000.";
    }
    return null;
  }, [pacoteArquivo, pacoteEvoUnidadeId, pacoteMapeamento.academiaId, pacoteMapeamento.tenantId, pacoteMaxRejeicoes]);

  const arquivosSelecionadosDaAnalise = useMemo(() => {
    if (!pacoteAnalise) return [];
    if (!pacoteArquivosSelecionados.length) {
      const disponiveis = pacoteAnalise.arquivos.filter((arquivo) => arquivo.disponivel).map((arquivo) => arquivo.chave);
      return [...disponiveis];
    }
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
      const analise = await uploadBackofficeEvoP0Pacote({
        tenantId: pacoteMapeamento.tenantId,
        evoUnidadeId: Number(pacoteEvoUnidadeId),
        arquivo: pacoteArquivo,
        contextoTenantId: pacoteMapeamento.tenantId,
      });
      setPacoteAnalise(analise);
      const disponiveis = analise.arquivos.filter((arquivo) => arquivo.disponivel).map((arquivo) => arquivo.chave);
      setPacoteArquivosSelecionados(disponiveis);
      toast({
        title: "Pacote analisado",
        description: `Upload ${analise.uploadId} pronto. ${disponiveis.length} de ${analise.arquivos.length} arquivo(s) disponíveis.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof ApiRequestError) {
        console.error("Erro ao analisar pacote EVO", JSON.stringify(formatApiErrorForLog(error), null, 2));
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
      const analise = await getBackofficeEvoP0PacoteAnalise({
        uploadId: pacoteAnalise.uploadId,
        tenantId: pacoteAnalise.tenantId,
      });
      setPacoteAnalise(analise);
      const disponiveis = analise.arquivos.filter((arquivo) => arquivo.disponivel).map((arquivo) => arquivo.chave);
      setPacoteArquivosSelecionados((prev) => {
        const interseccao = prev.filter((chave) => disponiveis.includes(chave));
        if (interseccao.length > 0) return interseccao;
        return disponiveis;
      });
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
      const job = await createBackofficeEvoP0PacoteJob({
        uploadId: pacoteAnalise.uploadId,
        dryRun: pacoteDryRun,
        maxRejeicoesRetorno: pacoteMaxRejeicoes,
        arquivos: arquivosParaImportar,
        tenantId: pacoteAnalise.tenantId,
      });

      const tenant = normalizeTenantId(pacoteAnalise.tenantId);
      const nomeAcademia = pacoteMapeamento.academiaNome || "Não informado";
      const nomeUnidade = pacoteMapeamento.unidadeNome || "Não informado";
      await registrarOnboardingDoJob({
        tenantId: pacoteAnalise.tenantId,
        academiaId: pacoteMapeamento.academiaId,
        evoFilialId: pacoteEvoUnidadeId,
        jobId: job.jobId,
        origem: "PACOTE",
        mensagem: `Job ${job.jobId} criado a partir do pacote EVO.`,
      });
      upsertJobHistorico({
        tenantId: tenant,
        jobId: job.jobId,
        academiaNome: nomeAcademia,
        unidadeNome: nomeUnidade,
        origem: "pacote",
        criadoEm: new Date().toISOString(),
        status: "PROCESSANDO",
      });
      setJobId(job.jobId);
      setJobTenantId(tenant);
      setJobTenantIds([tenant]);
      setJobOrigem("pacote");
      lastJobStatusRef.current = null;
      setJobLabelFromContext(tenant, nomeAcademia, nomeUnidade);
      setStoredJobId(tenant, job.jobId);
      setActiveTab("acompanhamento");
      startPolling(job.jobId, true, [tenant], "pacote", normalizeTenantId(pacoteAnalise.tenantId));
      toast({
        title: "Job criado",
        description: `Job ${job.jobId} criado com sucesso.`,
      });
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) {
        console.error("Erro ao criar job do pacote EVO", JSON.stringify(formatApiErrorForLog(error), null, 2));
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
        upsertJobHistorico({
          tenantId: currentTenant,
          jobId: newJobId,
          academiaNome: nomeAcademia,
          unidadeNome: nomeUnidade,
          origem: "csv",
          criadoEm: new Date().toISOString(),
          status: currentStatus,
        });
        setJobTenantId(currentTenant);
        setJobTenantIds(body.tenantIds?.map((item) => normalizeTenantId(item)).filter(Boolean) ?? tenantIds);
        setJobOrigem("csv");
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
        console.error("Erro na importação EVO P0", {
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

  async function selecionarJobDaLista(jobIdSelecionado: string) {
    const job = jobsEmExecucao.find((item) => item.jobId === jobIdSelecionado);
    if (!job) {
      return;
    }
    setJobId(job.jobId);
    setStoredJobId(job.tenantId, job.jobId);
    setJobTenantId(job.tenantId);
    setJobTenantIds([job.tenantId]);
    setJobOrigem(job.origem);
    lastJobStatusRef.current = null;
    setJobLabelFromContext(job.tenantId, job.academiaNome, job.unidadeNome);
    startPolling(job.jobId, true, [job.tenantId], job.origem, job.tenantId);
  }

  function openRejeicoesPorEntidade(entidade?: string, forceShow = true) {
    const filtro = entidade ?? ENTIDADE_TODAS;
    setEntidadeFiltro(filtro);
    setRejPage(0);
    if (forceShow) setShowRejeicoes(true);
    if (jobId) {
      void loadRejeicoes(0);
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

  async function loadRejeicoes(page = 0) {
    if (!jobId) return;
    setRejeicoesLoading(true);
    try {
      const data = await listBackofficeEvoImportJobRejeicoes({
        jobId,
        page,
        size: 50,
        tenantId: jobTenantId,
      });
      const items = (data.items ?? data.content ?? []) as Rejeicao[];
      const mapped = items.map((r) => resolveRejeicao(r));
      const hasNext = data.hasNext ?? (Array.isArray(mapped) && mapped.length === 50);
      setRejeicoes(mapped);
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

  function formatDateTime(value?: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
  }

  function resumoValue(field: keyof EntidadeResumo, resumo?: EntidadeResumo) {
    return resumo ? resumo[field] ?? 0 : 0;
  }

  const entidadesDisponiveis = useMemo(() => {
    const mapa = new Set<string>();
    rejeicoes.forEach((r) => {
      if (r.entidade) mapa.add(r.entidade);
    });
    return Array.from(mapa).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [rejeicoes]);

  const rejeicoesFiltradas = useMemo(() => {
    if (entidadeFiltro === ENTIDADE_TODAS) return rejeicoes;
    return rejeicoes.filter((r) => r.entidade === entidadeFiltro);
  }, [entidadeFiltro, rejeicoes]);
  const tenantFoco = normalizeTenantId(pacoteMapeamento.tenantId || preselectedTenantId || mapeamentos[0]?.tenantId);
  const onboardingFoco = onboardingIndex.get(tenantFoco);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Integrações &gt; EVO</p>
        <h1 className="text-3xl font-display font-bold leading-tight">Acompanhamento de Importação EVO P0</h1>
        <p className="text-sm text-muted-foreground">
          Dispare e acompanhe jobs de importação EVO P0. Salva automaticamente o último job para retomar depois.
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
                <div className="grid gap-3 md:grid-cols-2">
                  {FILE_FIELDS.map(({ key, label, field }) => (
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
              <div className="space-y-3">
                <Label className="font-semibold">Destino da importação</Label>
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
                      <span className="font-medium">Expira em:</span> {formatDateTime(pacoteAnalise.expiraEm)}
                    </p>
                    <p>
                      <span className="font-medium">Disponíveis:</span> {pacoteArquivosSelecionados.length} / {pacoteAnalise.arquivos.length}
                    </p>
                  </div>

                  <Separator />

                  <p className="text-sm font-semibold">Arquivos reconhecidos</p>
                  {pacoteArquivosDisponiveis.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum arquivo reconhecido neste pacote.</p>
                  ) : (
                    <div className="grid gap-2">
                      {pacoteArquivosDisponiveis.map((arquivo) => {
                        const selecionado = pacoteArquivosSelecionadosSet.has(arquivo.chave);
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
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                disabled={!arquivo.disponivel}
                                checked={selecionado}
                                onChange={(e) => togglePacoteArquivo(arquivo.chave, e.target.checked)}
                              />
                              {!arquivo.disponivel && <span className="ml-2 text-xs text-destructive">Não disponível</span>}
                            </div>
                          </label>
                        );
                      })}
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
                      Atualizar análise
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
                        return (
                          <SelectItem key={job.jobId} value={job.jobId}>
                            <span className="inline-flex w-full items-center justify-between gap-2">
                              <span>{job.jobId}</span>
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

              <Separator />

              {!jobId && <p className="text-sm text-muted-foreground">Nenhuma importação em andamento.</p>}

              {jobId && (
                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Job</span>
                      <span className="font-mono text-sm">{jobId}</span>
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
                    {resumoCards.map(({ key, label }) => {
                      const resumo = jobResumo?.[key] as EntidadeResumo | undefined;
                      const { percentual, temTotal } = getPercentual(resumo);
                      const entityFilter = resumoEntidadeMap[key];
                      const canOpenDetails = key === "geral" || Boolean(entityFilter);
                      return (
                        <Card
                          key={key}
                          className={cn(
                            "border-border",
                            canOpenDetails ? "cursor-pointer transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gym-accent" : ""
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
                  <div className="flex gap-2">
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
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={rejPage === 0 || rejeicoesLoading} onClick={() => loadRejeicoes(rejPage - 1)}>
                      Anterior
                    </Button>
                    <Button size="sm" variant="outline" disabled={!rejHasNext || rejeicoesLoading} onClick={() => loadRejeicoes(rejPage + 1)}>
                      Próxima
                  </Button>
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
                {!rejeicoesLoading && rejeicoesFiltradas.length > 0 && (
                  <div className="overflow-auto rounded-md border border-border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Entidade</th>
                          <th className="px-3 py-2 text-left font-semibold">Arquivo</th>
                          <th className="px-3 py-2 text-left font-semibold">Linha</th>
                          <th className="px-3 py-2 text-left font-semibold">Source ID</th>
                          <th className="px-3 py-2 text-left font-semibold">Motivo</th>
                          <th className="px-3 py-2 text-left font-semibold">Criado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejeicoesFiltradas.map((r, idx) => (
                          <tr key={idx} className="border-t border-border/70">
                            <td className="px-3 py-2">{r.entidade}</td>
                            <td className="px-3 py-2">{r.arquivo}</td>
                            <td className="px-3 py-2">{r.linhaArquivo}</td>
                            <td className="px-3 py-2">{r.sourceId ?? "—"}</td>
                            <td className="px-3 py-2">{r.motivo}</td>
                            <td className="px-3 py-2">{formatDateTime(r.criadoEm)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

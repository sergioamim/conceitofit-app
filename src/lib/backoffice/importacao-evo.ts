import { isRealApiEnabled } from "@/lib/api/http";
import {
  createEvoP0CsvUploadApi,
  createEvoP0PacoteJobApi,
  getEvoImportJobResumoApi,
  getEvoP0PacoteAnaliseApi,
  listEvoImportJobRejeicoesApi,
  uploadEvoP0PacoteApi,
  type EvoImportEntidadeResumo,
  type EvoImportJobResumo,
  type EvoImportJobStatus,
  type EvoImportRejeicao,
  type EvoImportRejeicoesResponse,
  type UploadAnaliseArquivo,
  type UploadAnaliseResponse,
} from "@/lib/api/importacao-evo";

const STORAGE_KEY = "backoffice-importacao-evo-state";

const PACOTE_ARQUIVOS: Array<{ chave: string; rotulo: string; arquivoEsperado: string }> = [
  { chave: "clientes", rotulo: "CLIENTES", arquivoEsperado: "CLIENTES.csv" },
  { chave: "prospects", rotulo: "PROSPECTS", arquivoEsperado: "PROSPECTS.csv" },
  { chave: "contratos", rotulo: "CONTRATOS", arquivoEsperado: "CONTRATOS.csv" },
  { chave: "clientesContratos", rotulo: "CLIENTES_CONTRATOS", arquivoEsperado: "CLIENTES_CONTRATOS.csv" },
  { chave: "vendas", rotulo: "VENDAS", arquivoEsperado: "VENDAS.csv" },
  { chave: "vendasItens", rotulo: "VENDAS_ITENS", arquivoEsperado: "VENDAS_ITENS.csv" },
  { chave: "recebimentos", rotulo: "RECEBIMENTOS", arquivoEsperado: "RECEBIMENTOS.csv" },
  { chave: "maquininhas", rotulo: "MAQUININHAS", arquivoEsperado: "MAQUININHAS.csv" },
  { chave: "produtos", rotulo: "PRODUTOS", arquivoEsperado: "PRODUTOS.csv" },
  { chave: "produtoMovimentacoes", rotulo: "PRODUTOS_MOVIMENTACOES", arquivoEsperado: "PRODUTOS_MOVIMENTACOES.csv" },
  { chave: "servicos", rotulo: "SERVICOS", arquivoEsperado: "SERVICOS.csv" },
  { chave: "funcionarios", rotulo: "FUNCIONARIOS", arquivoEsperado: "FUNCIONARIOS.csv" },
  { chave: "treinos", rotulo: "TREINOS", arquivoEsperado: "TREINOS.csv" },
  { chave: "exerciciosTreino", rotulo: "TREINOS_EXERCICIOS", arquivoEsperado: "TREINOS_EXERCICIOS.csv" },
  { chave: "gruposExercicio", rotulo: "TREINOS_GRUPOS_EXERCICIOS", arquivoEsperado: "TREINOS_GRUPOS_EXERCICIOS.csv" },
  { chave: "treinosSeries", rotulo: "TREINOS_SERIES", arquivoEsperado: "TREINOS_SERIES.csv" },
  { chave: "treinosSeriesItens", rotulo: "TREINOS_SERIES_ITENS", arquivoEsperado: "TREINOS_SERIES_ITENS.csv" },
  { chave: "contasBancarias", rotulo: "CONTAS_BANCARIAS", arquivoEsperado: "CONTAS_BANCARIAS.csv" },
  { chave: "contasPagar", rotulo: "CONTAS_PAGAR", arquivoEsperado: "CONTAS_PAGAR.csv" },
];

const CSV_FIELD_TO_RESUMO_KEY: Record<string, string> = {
  clientesFile: "clientes",
  prospectsFile: "prospects",
  contratosFile: "contratos",
  clientesContratosFile: "clientesContratos",
  vendasFile: "vendas",
  vendasItensFile: "vendasItens",
  recebimentosFile: "recebimentos",
  contasBancariasFile: "contasBancarias",
  contasPagarFile: "contasPagar",
  maquininhasFile: "maquininhas",
  produtosFile: "produtos",
  produtoMovimentacoesFile: "produtoMovimentacoes",
  servicosFile: "servicos",
  funcionariosFile: "funcionarios",
  treinosExerciciosFile: "exerciciosTreino",
  treinosGruposExerciciosFile: "gruposExercicio",
  treinosFile: "treinos",
  treinosSeriesFile: "treinosSeries",
  treinosSeriesItensFile: "treinosSeriesItens",
};

type ResumoKey = Exclude<keyof EvoImportJobResumo, "jobId" | "tenantId" | "tenantIds" | "status" | "solicitadoEm" | "finalizadoEm" | "rejeicoes">;

type LocalUploadRecord = UploadAnaliseResponse & {
  arquivoNome: string;
};

type LocalJobRecord = {
  jobId: string;
  tenantId: string;
  tenantIds: string[];
  origem: "csv" | "pacote";
  dryRun: boolean;
  status: EvoImportJobStatus;
  solicitadoEm: string;
  finalizadoEm?: string | null;
  maxRejeicoesRetorno: number;
  pollCount: number;
  resumoFinal: Partial<Record<ResumoKey, EvoImportEntidadeResumo>>;
  rejeicoes: EvoImportRejeicao[];
  erroMensagem?: string;
};

type LocalState = {
  uploads: LocalUploadRecord[];
  jobs: LocalJobRecord[];
};

export type BackofficeEvoJobAceitoResponse = {
  jobId: string;
  status: string;
  solicitadoEm?: string;
  finalizadoEm?: string;
  geral?: EvoImportEntidadeResumo;
  dryRun?: boolean;
  tenantIds?: string[];
};

type CsvJobInput = {
  dryRun: boolean;
  maxRejeicoesRetorno: number;
  mapeamentoFiliais: Array<{ idFilialEvo: number; tenantId: string }>;
  arquivos: Array<{ field: string; file: File }>;
  tenantId?: string;
  contextoTenantId?: string;
};

type PacoteJobInput = {
  uploadId: string;
  dryRun: boolean;
  maxRejeicoesRetorno: number;
  arquivos?: string[] | null;
  tenantId?: string;
  contextoTenantId?: string;
};

type PackageUploadInput = {
  tenantId: string;
  evoUnidadeId: number;
  arquivo: File;
  contextoTenantId?: string;
};

type PackageAnaliseInput = {
  uploadId: string;
  tenantId?: string;
  contextoTenantId?: string;
};

type JobResumoInput = {
  jobId: string;
  maxRejeicoesRetorno?: number;
  tenantId?: string;
  contextoTenantId?: string;
};

type RejeicoesInput = {
  jobId: string;
  page?: number;
  size?: number;
  tenantId?: string;
  contextoTenantId?: string;
};

let memoryState: LocalState = { uploads: [], jobs: [] };

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTenantId(value?: string | null) {
  return value?.trim() ?? "";
}

function readLocalState(): LocalState {
  if (typeof window === "undefined") {
    return memoryState;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return memoryState;
  }
  try {
    const parsed = JSON.parse(raw) as LocalState;
    memoryState = {
      uploads: Array.isArray(parsed?.uploads) ? parsed.uploads : [],
      jobs: Array.isArray(parsed?.jobs) ? parsed.jobs : [],
    };
  } catch {
    memoryState = { uploads: [], jobs: [] };
  }
  return memoryState;
}

function writeLocalState(next: LocalState) {
  memoryState = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

function buildPacoteArquivos(arquivo: File): UploadAnaliseArquivo[] {
  return PACOTE_ARQUIVOS.map((item) => ({
    chave: item.chave,
    rotulo: item.rotulo,
    arquivoEsperado: item.arquivoEsperado,
    disponivel: true,
    nomeArquivoEnviado: arquivo.name.endsWith(".zip") ? item.arquivoEsperado : arquivo.name,
    tamanhoBytes: arquivo.size,
  }));
}

function buildResumo(total: number, rejeitadas = 0): EvoImportEntidadeResumo {
  const saneTotal = Math.max(1, total);
  const saneRejeitadas = Math.max(0, Math.min(rejeitadas, saneTotal));
  const atualizadas = Math.max(0, Math.floor((saneTotal - saneRejeitadas) * 0.35));
  const criadas = Math.max(0, saneTotal - saneRejeitadas - atualizadas);
  return {
    total: saneTotal,
    processadas: saneTotal,
    criadas,
    atualizadas,
    rejeitadas: saneRejeitadas,
  };
}

function combineResumo(values: EvoImportEntidadeResumo[]): EvoImportEntidadeResumo {
  return values.reduce<EvoImportEntidadeResumo>(
    (acc, current) => ({
      total: acc.total + current.total,
      processadas: acc.processadas + current.processadas,
      criadas: acc.criadas + current.criadas,
      atualizadas: acc.atualizadas + current.atualizadas,
      rejeitadas: acc.rejeitadas + current.rejeitadas,
    }),
    { total: 0, processadas: 0, criadas: 0, atualizadas: 0, rejeitadas: 0 }
  );
}

function buildProgressResumo(finalResumo: EvoImportEntidadeResumo, progress: number, finished: boolean): EvoImportEntidadeResumo {
  if (finished) {
    return { ...finalResumo };
  }
  const safeProgress = Math.min(1, Math.max(0, progress));
  return {
    total: finalResumo.total,
    processadas: Math.max(0, Math.round(finalResumo.total * safeProgress)),
    criadas: Math.max(0, Math.round(finalResumo.criadas * safeProgress)),
    atualizadas: Math.max(0, Math.round(finalResumo.atualizadas * safeProgress)),
    rejeitadas: 0,
  };
}

function buildRejeicoes(keys: string[], maxRejeicoesRetorno: number, dryRun: boolean): EvoImportRejeicao[] {
  if (!dryRun || maxRejeicoesRetorno <= 0 || keys.length === 0) {
    return [];
  }
  return keys.slice(0, Math.min(2, maxRejeicoesRetorno)).map((key, index) => ({
    entidade: key,
    arquivo: `${key}.csv`,
    linhaArquivo: index + 2,
    sourceId: `${key}-${index + 1}`,
    motivo: "Registro inválido identificado durante a simulação.",
    criadoEm: nowIso(),
  }));
}

function buildCsvResumo(
  arquivos: Array<{ field: string; file: File }>,
  maxRejeicoesRetorno: number,
  dryRun: boolean
): {
  resumoFinal: Partial<Record<ResumoKey, EvoImportEntidadeResumo>>;
  rejeicoes: EvoImportRejeicao[];
} {
  const resumoFinal: Partial<Record<ResumoKey, EvoImportEntidadeResumo>> = {};
  const keys = arquivos
    .map(({ field }) => CSV_FIELD_TO_RESUMO_KEY[field])
    .filter((value): value is ResumoKey => Boolean(value));

  keys.forEach((key, index) => {
    resumoFinal[key] = buildResumo(18 + index * 7, dryRun && index === 0 ? 1 : 0);
  });

  const rejeicoes = buildRejeicoes(keys, maxRejeicoesRetorno, dryRun);
  return { resumoFinal, rejeicoes };
}

function buildPacoteResumo(
  arquivos: string[],
  maxRejeicoesRetorno: number,
  dryRun: boolean
): {
  resumoFinal: Partial<Record<ResumoKey, EvoImportEntidadeResumo>>;
  rejeicoes: EvoImportRejeicao[];
} {
  const resumoFinal: Partial<Record<ResumoKey, EvoImportEntidadeResumo>> = {};
  const keys = arquivos.filter((value): value is ResumoKey => Boolean(value));
  keys.forEach((key, index) => {
    resumoFinal[key] = buildResumo(24 + index * 5, dryRun && index === 0 ? 1 : 0);
  });
  const rejeicoes = buildRejeicoes(keys, maxRejeicoesRetorno, dryRun);
  return { resumoFinal, rejeicoes };
}

function summarizeJob(job: LocalJobRecord): EvoImportJobResumo {
  const progress = job.pollCount <= 1 ? 0.42 : job.pollCount === 2 ? 0.78 : 1;
  const finished = progress >= 1;
  const status: EvoImportJobStatus =
    finished
      ? job.erroMensagem
        ? "FALHA"
        : job.rejeicoes.length > 0
          ? "CONCLUIDO_COM_REJEICOES"
          : "CONCLUIDO"
      : "PROCESSANDO";

  const resumoEntries = Object.entries(job.resumoFinal)
    .filter((entry): entry is [ResumoKey, EvoImportEntidadeResumo] => Boolean(entry[1]))
    .map(([key, value]) => [key, buildProgressResumo(value, progress, finished)] as const);

  const geral = combineResumo(resumoEntries.map(([, value]) => value));
  const snapshot: EvoImportJobResumo = {
    jobId: job.jobId,
    tenantId: job.tenantId,
    tenantIds: job.tenantIds,
    status,
    solicitadoEm: job.solicitadoEm,
    finalizadoEm: finished ? job.finalizadoEm ?? nowIso() : null,
    geral,
    rejeicoes: job.erroMensagem
      ? { mensagem: job.erroMensagem }
      : job.rejeicoes.length > 0
        ? { mensagem: `${job.rejeicoes.length} rejeição(ões) registradas.` }
        : undefined,
  };

  resumoEntries.forEach(([key, value]) => {
    snapshot[key] = value;
  });

  return snapshot;
}

function updateLocalJob(jobId: string, updater: (current: LocalJobRecord) => LocalJobRecord): LocalJobRecord {
  const state = readLocalState();
  const current = state.jobs.find((item) => item.jobId === jobId);
  if (!current) {
    throw new Error("Job de importação não encontrado.");
  }
  const updated = updater(current);
  writeLocalState({
    ...state,
    jobs: [updated, ...state.jobs.filter((item) => item.jobId !== jobId)],
  });
  return updated;
}

export async function uploadBackofficeEvoP0Pacote(input: PackageUploadInput): Promise<UploadAnaliseResponse> {
  if (isRealApiEnabled()) {
    return uploadEvoP0PacoteApi(input);
  }

  const upload: LocalUploadRecord = {
    uploadId: createId("upload"),
    tenantId: normalizeTenantId(input.tenantId),
    evoUnidadeId: input.evoUnidadeId,
    criadoEm: nowIso(),
    expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    totalArquivosDisponiveis: PACOTE_ARQUIVOS.length,
    arquivos: buildPacoteArquivos(input.arquivo),
    arquivoNome: input.arquivo.name,
  };
  const state = readLocalState();
  writeLocalState({
    ...state,
    uploads: [upload, ...state.uploads.filter((item) => item.uploadId !== upload.uploadId)],
  });
  return upload;
}

export async function getBackofficeEvoP0PacoteAnalise(input: PackageAnaliseInput): Promise<UploadAnaliseResponse> {
  if (isRealApiEnabled()) {
    return getEvoP0PacoteAnaliseApi(input);
  }
  const upload = readLocalState().uploads.find((item) => item.uploadId === input.uploadId);
  if (!upload) {
    throw new Error("Upload do pacote não encontrado.");
  }
  return upload;
}

export async function createBackofficeEvoP0PacoteJob(input: PacoteJobInput): Promise<BackofficeEvoJobAceitoResponse> {
  if (isRealApiEnabled()) {
    const response = await createEvoP0PacoteJobApi(input);
    return response;
  }

  const upload = readLocalState().uploads.find((item) => item.uploadId === input.uploadId);
  if (!upload) {
    throw new Error("Upload do pacote não encontrado.");
  }

  const arquivos = Array.isArray(input.arquivos) && input.arquivos.length > 0
    ? input.arquivos
    : upload.arquivos.filter((item) => item.disponivel).map((item) => item.chave);
  const { resumoFinal, rejeicoes } = buildPacoteResumo(arquivos, input.maxRejeicoesRetorno, input.dryRun);
  const jobId = createId("job");
  const solicitadoEm = nowIso();
  const job: LocalJobRecord = {
    jobId,
    tenantId: upload.tenantId,
    tenantIds: [upload.tenantId],
    origem: "pacote",
    dryRun: input.dryRun,
    status: "PROCESSANDO",
    solicitadoEm,
    maxRejeicoesRetorno: input.maxRejeicoesRetorno,
    pollCount: 0,
    resumoFinal,
    rejeicoes,
  };
  const state = readLocalState();
  writeLocalState({
    ...state,
    jobs: [job, ...state.jobs.filter((item) => item.jobId !== jobId)],
  });

  return {
    jobId,
    status: "PROCESSANDO",
    solicitadoEm,
    tenantIds: [upload.tenantId],
  };
}

export async function createBackofficeEvoP0CsvJob(input: CsvJobInput): Promise<BackofficeEvoJobAceitoResponse> {
  if (isRealApiEnabled()) {
    return createEvoP0CsvUploadApi(input);
  }

  const tenantIds = [...new Set(input.mapeamentoFiliais.map((item) => normalizeTenantId(item.tenantId)).filter(Boolean))];
  if (tenantIds.length === 0) {
    throw new Error("Informe ao menos uma unidade válida para criar o job.");
  }

  const { resumoFinal, rejeicoes } = buildCsvResumo(input.arquivos, input.maxRejeicoesRetorno, input.dryRun);
  const erroMensagem = input.arquivos.some(({ file }) => file.name.toLowerCase().includes("falha"))
    ? "Falha simulada no ETL local para validação de erros."
    : undefined;
  const jobId = createId("job");
  const solicitadoEm = nowIso();
  const job: LocalJobRecord = {
    jobId,
    tenantId: tenantIds[0],
    tenantIds,
    origem: "csv",
    dryRun: input.dryRun,
    status: "PROCESSANDO",
    solicitadoEm,
    maxRejeicoesRetorno: input.maxRejeicoesRetorno,
    pollCount: 0,
    resumoFinal,
    rejeicoes,
    erroMensagem,
  };
  const state = readLocalState();
  writeLocalState({
    ...state,
    jobs: [job, ...state.jobs.filter((item) => item.jobId !== jobId)],
  });

  return {
    jobId,
    status: "PROCESSANDO",
    solicitadoEm,
    geral: combineResumo(Object.values(resumoFinal).filter(Boolean) as EvoImportEntidadeResumo[]),
    tenantIds,
  };
}

export async function getBackofficeEvoImportJobResumo(input: JobResumoInput): Promise<EvoImportJobResumo> {
  if (isRealApiEnabled()) {
    return getEvoImportJobResumoApi(input);
  }

  const updated = updateLocalJob(input.jobId, (current) => {
    const preview = summarizeJob(current);
    const finished = preview.status === "CONCLUIDO" || preview.status === "CONCLUIDO_COM_REJEICOES" || preview.status === "FALHA";
    return {
      ...current,
      pollCount: current.pollCount + 1,
      status: preview.status,
      finalizadoEm: finished ? current.finalizadoEm ?? nowIso() : current.finalizadoEm,
    };
  });
  return summarizeJob(updated);
}

export async function listBackofficeEvoImportJobRejeicoes(input: RejeicoesInput): Promise<EvoImportRejeicoesResponse> {
  if (isRealApiEnabled()) {
    return listEvoImportJobRejeicoesApi(input);
  }

  const job = readLocalState().jobs.find((item) => item.jobId === input.jobId);
  if (!job) {
    throw new Error("Job de importação não encontrado.");
  }
  const page = input.page ?? 0;
  const size = input.size ?? 50;
  const start = page * size;
  const items = job.rejeicoes.slice(start, start + size);
  return {
    items,
    page,
    size,
    hasNext: start + size < job.rejeicoes.length,
  };
}

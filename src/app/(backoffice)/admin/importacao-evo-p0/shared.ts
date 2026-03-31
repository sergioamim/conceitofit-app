// Shared types, constants and utility functions for EVO import
// Extracted from page.tsx for modularity

import type {
  EvoImportColaboradoresBlocoResumo,
  EvoImportColaboradoresResumo,
  EvoImportEntidadeResumo as EntidadeResumo,
  EvoImportJobResumo as JobResumo,
  EvoImportJobStatus as EvoStatus,
  EvoImportRejeicao as Rejeicao,
  UploadAnaliseArquivo,
  UploadAnaliseFilial,
  UploadAnaliseResponse,
} from "@/lib/api/importacao-evo";
import type { EvoArquivoHistoricoNormalizado } from "@/lib/backoffice/importacao-evo";
import type { Tenant } from "@/lib/types";
import { formatCnpj } from "@/lib/utils/cnpj";
import { normalizeSubdomain } from "@/lib/utils/subdomain";
import { formatJobAliasDate } from "./date-time-format";


export type JobHistoryMeta = {
  tenantId: string;
  jobId: string;
  alias?: string;
  academiaNome: string;
  unidadeNome: string;
  origem: "pacote" | "csv";
  criadoEm: string;
  status?: EvoStatus;
  arquivosSelecionados?: string[];
  arquivosDisponiveis?: string[];
};

export const PACOTE_CHAVES_DISPONIVEIS = [
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
  "funcionariosFuncoes",
  "funcionariosFuncoesExercidas",
  "funcionariosTipos",
  "tiposFuncionarios",
  "funcionariosHorarios",
  "permissoes",
  "treinos",
  "treinosExercicios",
  "treinosGruposExercicios",
  "treinosSeries",
  "treinosSeriesItens",
  "contasBancarias",
  "contasPagar",
] as const;

export type PacoteArquivoChave = (typeof PACOTE_CHAVES_DISPONIVEIS)[number];

export type ColaboradorBlocoKey =
  | "fichaPrincipal"
  | "funcoes"
  | "tiposOperacionais"
  | "horarios"
  | "contratacao"
  | "perfilLegado";

export type ColaboradorArquivoConfig = {
  key: keyof FileMap;
  label: string;
  field: string;
  pacoteChave: PacoteArquivoChave;
  aliases: string[];
  bloco: ColaboradorBlocoKey;
  rotuloResumo: string;
  descricao: string;
  impactoAusencia: string;
};

export const COLABORADOR_ARQUIVOS_CONFIG: ColaboradorArquivoConfig[] = [
  {
    key: "funcionariosFile",
    label: "FUNCIONARIOS.csv",
    field: "funcionariosFile",
    pacoteChave: "funcionarios",
    aliases: ["funcionarios", "FUNCIONARIOS.csv"],
    bloco: "fichaPrincipal",
    rotuloResumo: "Cadastro principal",
    descricao: "Base do colaborador, vínculo principal e dados cadastrais.",
    impactoAusencia: "Sem este arquivo, a malha de colaboradores não tem base mínima para importação.",
  },
  {
    key: "funcionariosFuncoesFile",
    label: "FUNCIONARIOS_FUNCOES.csv",
    field: "funcionariosFuncoesFile",
    pacoteChave: "funcionariosFuncoes",
    aliases: ["funcionarios_funcoes", "FUNCIONARIOS_FUNCOES.csv"],
    bloco: "funcoes",
    rotuloResumo: "Catálogo de funções",
    descricao: "Catálogo legado de cargos e funções vindos do EVO.",
    impactoAusencia: "Sem o catálogo, vínculos de função podem ficar rejeitados ou sem reconciliação.",
  },
  {
    key: "funcionariosFuncoesExercidasFile",
    label: "FUNCIONARIOS_FUNCOES_EXERCIDAS.csv",
    field: "funcionariosFuncoesExercidasFile",
    pacoteChave: "funcionariosFuncoesExercidas",
    aliases: ["funcionarios_funcoes_exercidas", "FUNCIONARIOS_FUNCOES_EXERCIDAS.csv"],
    bloco: "funcoes",
    rotuloResumo: "Funções exercidas",
    descricao: "Relaciona cada colaborador às funções exercidas na operação.",
    impactoAusencia: "Sem este vínculo, o colaborador entra sem função/cargo operacional resolvido.",
  },
  {
    key: "tiposFuncionariosFile",
    label: "TIPOS_FUNCIONARIOS.csv",
    field: "tiposFuncionariosFile",
    pacoteChave: "tiposFuncionarios",
    aliases: ["tipos_funcionarios", "TIPOS_FUNCIONARIOS.csv"],
    bloco: "tiposOperacionais",
    rotuloResumo: "Tipos operacionais",
    descricao: "Catálogo de tipos operacionais e perfis técnicos usados na contratação.",
    impactoAusencia: "Sem o catálogo de tipos, a contratação fica dependente de fallback legado.",
  },
  {
    key: "funcionariosTiposFile",
    label: "FUNCIONARIOS_TIPOS.csv",
    field: "funcionariosTiposFile",
    pacoteChave: "funcionariosTipos",
    aliases: ["funcionarios_tipos", "FUNCIONARIOS_TIPOS.csv"],
    bloco: "contratacao",
    rotuloResumo: "Contratação e vínculos",
    descricao: "Relaciona o colaborador aos tipos operacionais e vínculos contratuais.",
    impactoAusencia: "Sem este CSV, o colaborador pode entrar sem vínculo operacional/contratual resolvido.",
  },
  {
    key: "funcionariosHorariosFile",
    label: "FUNCIONARIOS_HORARIOS.csv",
    field: "funcionariosHorariosFile",
    pacoteChave: "funcionariosHorarios",
    aliases: ["funcionarios_horarios", "FUNCIONARIOS_HORARIOS.csv"],
    bloco: "horarios",
    rotuloResumo: "Horários semanais",
    descricao: "Jornadas e grade horária semanal do colaborador.",
    impactoAusencia: "Sem horários, a importação fica parcial para agenda e disponibilidade operacional.",
  },
  {
    key: "permissoesFile",
    label: "PERMISSOES.csv",
    field: "permissoesFile",
    pacoteChave: "permissoes",
    aliases: ["permissoes", "PERMISSOES.csv", "permissoes_legadas", "PERMISSOES_LEGADAS.csv"],
    bloco: "perfilLegado",
    rotuloResumo: "Perfil legado",
    descricao: "Permissões/perfil legado para reconciliação com papéis administrativos.",
    impactoAusencia: "Sem permissões, a reconciliação do perfil legado fica pendente ou parcial.",
  },
];

export const COLABORADOR_BLOCO_CONFIG: Array<{
  key: ColaboradorBlocoKey;
  label: string;
  descricao: string;
  impactoAusencia: string;
  entidadeFiltros: string[];
  arquivos: ColaboradorArquivoConfig[];
  retryLabel: string;
}> = [
  {
    key: "fichaPrincipal",
    label: "Ficha principal",
    descricao: "Cadastro-base do colaborador.",
    impactoAusencia: "Sem cadastro principal, os demais blocos não conseguem consolidar a ficha do colaborador.",
    entidadeFiltros: ["FUNCIONARIOS"],
    arquivos: COLABORADOR_ARQUIVOS_CONFIG.filter((arquivo) => arquivo.bloco === "fichaPrincipal"),
    retryLabel: "Reprocessar ficha principal",
  },
  {
    key: "funcoes",
    label: "Funções e cargos",
    descricao: "Catálogo legado e funções exercidas por colaborador.",
    impactoAusencia: "Sem estes arquivos, a importação não consegue consolidar cargo/função operacional.",
    entidadeFiltros: ["FUNCIONARIOS", "FUNCIONARIOS_FUNCOES", "FUNCIONARIOS_FUNCOES_EXERCIDAS"],
    arquivos: COLABORADOR_ARQUIVOS_CONFIG.filter((arquivo) => arquivo.bloco === "funcoes"),
    retryLabel: "Reprocessar funções",
  },
  {
    key: "tiposOperacionais",
    label: "Tipos operacionais",
    descricao: "Catálogo de tipos usados pela contratação.",
    impactoAusencia: "Sem o catálogo, vínculos contratuais podem cair em fallback ou rejeição.",
    entidadeFiltros: ["TIPOS_FUNCIONARIOS", "FUNCIONARIOS_TIPOS"],
    arquivos: COLABORADOR_ARQUIVOS_CONFIG.filter((arquivo) => arquivo.bloco === "tiposOperacionais"),
    retryLabel: "Reprocessar tipos operacionais",
  },
  {
    key: "contratacao",
    label: "Contratação",
    descricao: "Vínculos do colaborador com tipos operacionais.",
    impactoAusencia: "Sem contratação, o colaborador entra sem vínculo operacional final.",
    entidadeFiltros: ["FUNCIONARIOS_TIPOS", "TIPOS_FUNCIONARIOS"],
    arquivos: COLABORADOR_ARQUIVOS_CONFIG.filter((arquivo) => arquivo.bloco === "contratacao"),
    retryLabel: "Reprocessar contratação",
  },
  {
    key: "horarios",
    label: "Horários",
    descricao: "Grade semanal e disponibilidade.",
    impactoAusencia: "Sem horários, a operação precisa complementar manualmente a jornada.",
    entidadeFiltros: ["FUNCIONARIOS_HORARIOS"],
    arquivos: COLABORADOR_ARQUIVOS_CONFIG.filter((arquivo) => arquivo.bloco === "horarios"),
    retryLabel: "Reprocessar horários",
  },
  {
    key: "perfilLegado",
    label: "Perfil legado",
    descricao: "Reconciliação de permissões e papéis antigos.",
    impactoAusencia: "Sem perfil legado, acessos administrativos dependem de ajuste posterior.",
    entidadeFiltros: ["PERMISSOES"],
    arquivos: COLABORADOR_ARQUIVOS_CONFIG.filter((arquivo) => arquivo.bloco === "perfilLegado"),
    retryLabel: "Reprocessar perfil legado",
  },
];

export const IMPORT_RESUMO_CARD_CONFIG: Array<{
  key: keyof JobResumo;
  label: string;
  arquivoChave: PacoteArquivoChave;
  csvField: string;
  entidade: string;
}> = [
  { key: "clientes", label: "Clientes", arquivoChave: "clientes", csvField: "clientesFile", entidade: "CLIENTES" },
  { key: "prospects", label: "Prospects", arquivoChave: "prospects", csvField: "prospectsFile", entidade: "PROSPECTS" },
  { key: "contratos", label: "Contratos", arquivoChave: "contratos", csvField: "contratosFile", entidade: "CONTRATOS" },
  {
    key: "clientesContratos",
    label: "ClientesContrato",
    arquivoChave: "clientesContratos",
    csvField: "clientesContratosFile",
    entidade: "CLIENTES_CONTRATOS",
  },
  { key: "maquininhas", label: "Maquininhas", arquivoChave: "maquininhas", csvField: "maquininhasFile", entidade: "MAQUININHAS" },
  { key: "produtos", label: "Produtos", arquivoChave: "produtos", csvField: "produtosFile", entidade: "PRODUTOS" },
  {
    key: "produtoMovimentacoes",
    label: "Movimentações de Produto",
    arquivoChave: "produtoMovimentacoes",
    csvField: "produtoMovimentacoesFile",
    entidade: "PRODUTOS_MOVIMENTACOES",
  },
  { key: "servicos", label: "Serviços", arquivoChave: "servicos", csvField: "servicosFile", entidade: "SERVICOS" },
  {
    key: "funcionarios",
    label: "Colaboradores",
    arquivoChave: "funcionarios",
    csvField: "funcionariosFile",
    entidade: "FUNCIONARIOS",
  },
  {
    key: "gruposExercicio",
    label: "Grupos de Exercícios",
    arquivoChave: "treinosGruposExercicios",
    csvField: "treinosGruposExerciciosFile",
    entidade: "TREINOS_GRUPOS_EXERCICIOS",
  },
  {
    key: "exerciciosTreino",
    label: "Exercícios de Treino",
    arquivoChave: "treinosExercicios",
    csvField: "treinosExerciciosFile",
    entidade: "TREINOS_EXERCICIOS",
  },
  { key: "treinos", label: "Treinos", arquivoChave: "treinos", csvField: "treinosFile", entidade: "TREINOS" },
  {
    key: "treinosSeries",
    label: "Séries de Treino",
    arquivoChave: "treinosSeries",
    csvField: "treinosSeriesFile",
    entidade: "TREINOS_SERIES",
  },
  {
    key: "treinosSeriesItens",
    label: "Itens de Séries",
    arquivoChave: "treinosSeriesItens",
    csvField: "treinosSeriesItensFile",
    entidade: "TREINOS_SERIES_ITENS",
  },
  { key: "vendas", label: "Vendas", arquivoChave: "vendas", csvField: "vendasFile", entidade: "VENDAS" },
  {
    key: "vendasItens",
    label: "VendasItens",
    arquivoChave: "vendasItens",
    csvField: "vendasItensFile",
    entidade: "VENDAS_ITENS",
  },
  {
    key: "recebimentos",
    label: "Recebimentos",
    arquivoChave: "recebimentos",
    csvField: "recebimentosFile",
    entidade: "RECEBIMENTOS",
  },
  {
    key: "contasBancarias",
    label: "Contas bancárias",
    arquivoChave: "contasBancarias",
    csvField: "contasBancariasFile",
    entidade: "CONTAS_BANCÁRIAS",
  },
  {
    key: "contasPagar",
    label: "Contas a pagar",
    arquivoChave: "contasPagar",
    csvField: "contasPagarFile",
    entidade: "CONTAS_PAGAR",
  },
];

export const JOB_HISTORY_KEY = "evo-importacao-jobs-historico";
export const JOB_HISTORY_LIMIT = 30;
export const STORAGE_KEY = "evo-ultima-importacao-jobId";
export const ENTIDADE_TODAS = "__todas__";
export const BLOCO_TODOS = "__todos_blocos__";
export const resolveTenantForStorage = (tenantId?: string | null) =>
  (tenantId ?? "global").trim().toLowerCase() || "global";

export const colaboradorArquivoAliasIndex = new Map<string, ColaboradorArquivoConfig>();
COLABORADOR_ARQUIVOS_CONFIG.forEach((arquivo) => {
  [arquivo.pacoteChave, arquivo.label, arquivo.field, ...arquivo.aliases].forEach((alias) => {
    colaboradorArquivoAliasIndex.set(normalizeSearchKey(alias).replace(/[^a-z0-9]/g, ""), arquivo);
  });
});

export const colaboradorBlocoMetaIndex = new Map(
  COLABORADOR_BLOCO_CONFIG.map((bloco) => [bloco.key, bloco] as const)
);

export type PacoteArquivoDisponivel = UploadAnaliseArquivo & {
  chaveOriginal: string;
  chaveCanonica: PacoteArquivoChave | null;
  catalogadoPeloBackend: boolean;
  historico: EvoArquivoHistoricoNormalizado & {
    fonte: "backend" | "jobAtual" | "historicoLocal" | "nenhum";
    aliasResolvido: string | null;
    jobIdExibicao: string | null;
    processadoEmExibicao: string | null;
    jobRelacionado?: JobHistoryMeta | null;
  };
  entidadeFiltro: string | null;
  blocoFiltro: ColaboradorBlocoKey | null;
};

export type RejeicaoClassificada = Rejeicao & {
  idNormalizado: string;
  blocoClassificado: ColaboradorBlocoKey | null;
  blocoLabel: string | null;
  diagnostico: string | null;
  retryConfig:
    | {
        suportado: boolean;
        escopo: string;
        label: string;
        descricao?: string | null;
      }
    | null;
  payloadFormatado: string | null;
};

export type ColaboradorResumoCard = (typeof COLABORADOR_BLOCO_CONFIG)[number] & {
  resumo?: EvoImportColaboradoresBlocoResumo;
  arquivosSelecionados: ColaboradorArquivoConfig[];
  arquivosAusentes: ColaboradorArquivoConfig[];
  status: "naoSelecionado" | "semLinhas" | "comRejeicoes" | "sucesso";
};

export function isOnboardingCollectionRouteError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("invalid uuid string: onboarding") || normalized.includes("/admin/unidades/onboarding");
}

export function normalizeTenantId(value?: string | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

export function normalizeComparableText(value?: string | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeDocumentDigits(value?: string | null): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

export function normalizeSearchKey(value?: string | null): string {
  return typeof value === "string"
    ? value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()
    : "";
}

export function normalizeJobAlias(value?: string | null): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized ? normalized : undefined;
}

export function buildDefaultJobAlias(input: {
  origem: "pacote" | "csv";
  unidadeNome?: string | null;
  academiaNome?: string | null;
  criadoEm?: string | null;
}): string {
  const origem = input.origem === "pacote" ? "Pacote" : "CSV";
  const contexto = input.unidadeNome?.trim() || input.academiaNome?.trim() || "Importação EVO";
  const data = formatJobAliasDate(input.criadoEm);
  return data ? `${origem} · ${contexto} · ${data}` : `${origem} · ${contexto}`;
}

export function normalizeCatalogAlias(value?: string | null): string {
  return normalizeSearchKey(value).replace(/[^a-z0-9]/g, "");
}

export function resolveColaboradorArquivoMetaFromValue(value?: string | null): ColaboradorArquivoConfig | null {
  if (!value) return null;
  return colaboradorArquivoAliasIndex.get(normalizeCatalogAlias(value)) ?? null;
}

export function resolveColaboradorArquivoMetaFromUpload(
  arquivo?: Partial<UploadAnaliseArquivo> | null
): ColaboradorArquivoConfig | null {
  if (!arquivo) return null;
  return (
    resolveColaboradorArquivoMetaFromValue(arquivo.chave) ??
    resolveColaboradorArquivoMetaFromValue(arquivo.arquivoEsperado) ??
    resolveColaboradorArquivoMetaFromValue(arquivo.nomeArquivoEnviado) ??
    resolveColaboradorArquivoMetaFromValue(arquivo.rotulo)
  );
}

export function resolvePacoteArquivoCanonico(value?: string | null): PacoteArquivoChave | null {
  const colaboradorMeta = resolveColaboradorArquivoMetaFromValue(value);
  if (colaboradorMeta) return colaboradorMeta.pacoteChave;
  if (value && PACOTE_CHAVES_DISPONIVEIS.includes(value as PacoteArquivoChave)) {
    return value as PacoteArquivoChave;
  }
  return null;
}

export function isColaboradorArquivoChave(chave?: string | null): chave is PacoteArquivoChave {
  return Boolean(resolveColaboradorArquivoMetaFromValue(chave));
}

export function inferColaboradorBlocoFromText(value?: string | null): ColaboradorBlocoKey | null {
  const normalized = normalizeSearchKey(value);
  if (!normalized) return null;
  if (normalized.includes("horario")) return "horarios";
  if (normalized.includes("permiss") || normalized.includes("perfil legado")) return "perfilLegado";
  if (normalized.includes("funcao") || normalized.includes("cargo")) return "funcoes";
  if (normalized.includes("tipo")) return normalized.includes("contrat") ? "contratacao" : "tiposOperacionais";
  if (normalized.includes("contrat") || normalized.includes("vinculo")) return "contratacao";
  if (normalized.includes("funcionario") || normalized.includes("colaborador")) return "fichaPrincipal";
  return null;
}

export function resolveColaboradorBlocoFromRejeicao(rejeicao: Rejeicao): ColaboradorBlocoKey | null {
  const blocoExplcito = inferColaboradorBlocoFromText(rejeicao.bloco ?? rejeicao.subdominio);
  if (blocoExplcito) return blocoExplcito;
  const arquivoMeta = resolveColaboradorArquivoMetaFromValue(rejeicao.arquivo);
  if (arquivoMeta) {
    return arquivoMeta.bloco;
  }
  return (
    inferColaboradorBlocoFromText(rejeicao.entidade) ??
    inferColaboradorBlocoFromText(rejeicao.arquivo) ??
    inferColaboradorBlocoFromText(rejeicao.motivo)
  );
}

export function formatPayloadForDisplay(payload: unknown): string | null {
  if (payload === undefined || payload === null) return null;
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed ? trimmed : null;
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export function formatResumoCount(value?: number | null): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("pt-BR") : "—";
}

export function resolveArquivoHistoricoBadge(
  historico: EvoArquivoHistoricoNormalizado
): { label: string; className: string } {
  switch (historico.status) {
    case "processando":
      return {
        label: "Em processamento",
        className: "border-amber-400/40 bg-amber-500/15 text-amber-200",
      };
    case "sucesso":
      return {
        label: "Sucesso",
        className: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
      };
    case "parcial":
      return {
        label: "Parcial",
        className: "border-orange-400/40 bg-orange-500/15 text-orange-200",
      };
    case "comErros":
      return {
        label: "Com erros",
        className: "border-destructive/40 bg-destructive/10 text-destructive",
      };
    default:
      return {
        label: "Nunca importado",
        className: "border-border bg-muted/50 text-muted-foreground",
      };
  }
}

export function getColaboradorResumoBloco(
  resumo: EvoImportColaboradoresResumo | undefined,
  bloco: ColaboradorBlocoKey
): EvoImportColaboradoresBlocoResumo | undefined {
  if (!resumo) return undefined;
  const direto = resumo[bloco];
  if (direto) return direto;
  const aliasMap: Record<ColaboradorBlocoKey, string[]> = {
    fichaPrincipal: ["cadastroPrincipal", "principal", "funcionarios"],
    funcoes: ["funcoesCargos", "funcoesECargos"],
    tiposOperacionais: ["tipos", "tiposOperacionaisCatalogo"],
    horarios: ["jornadas", "gradeHoraria"],
    contratacao: ["vinculos", "tiposVinculados"],
    perfilLegado: ["permissoes", "perfilLegadoReconciliado"],
  };
  for (const alias of aliasMap[bloco]) {
    const candidate = (resumo as Record<string, EvoImportColaboradoresBlocoResumo | undefined>)[alias];
    if (candidate) return candidate;
  }
  return undefined;
}

export const FILE_FIELDS: { key: keyof FileMap; label: string; field: string }[] = [
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
  ...COLABORADOR_ARQUIVOS_CONFIG.map(({ key, label, field }) => ({ key, label, field })),
  { key: "treinosExerciciosFile", label: "TREINOS_EXERCICIOS.csv", field: "treinosExerciciosFile" },
  { key: "treinosFile", label: "TREINOS.csv", field: "treinosFile" },
  { key: "treinosGruposExerciciosFile", label: "TREINOS_GRUPOS_EXERCICIOS.csv", field: "treinosGruposExerciciosFile" },
  { key: "treinosSeriesFile", label: "TREINOS_SERIES.csv", field: "treinosSeriesFile" },
  { key: "treinosSeriesItensFile", label: "TREINOS_SERIES_ITENS.csv", field: "treinosSeriesItensFile" },
  { key: "contasBancariasFile", label: "CONTAS_BANCARIAS.csv", field: "contasBancariasFile" },
  { key: "contasPagarFile", label: "CONTAS_PAGAR.csv", field: "contasPagarFile" },
];

export const FILE_UPLOAD_GROUPS: Array<{
  key: string;
  label: string;
  description: string;
  fields: Array<keyof FileMap>;
}> = [
  {
    key: "comercial",
    label: "Base comercial e relacionamento",
    description: "Clientes, prospects, contratos e documentos comerciais.",
    fields: [
      "clientesFile",
      "prospectsFile",
      "contratosFile",
      "clientesContratosFile",
      "vendasFile",
      "vendasItensFile",
      "recebimentosFile",
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro e estoque",
    description: "Caixa, produtos, serviços, maquininhas e contas.",
    fields: [
      "contasBancariasFile",
      "contasPagarFile",
      "maquininhasFile",
      "produtosFile",
      "produtoMovimentacoesFile",
      "servicosFile",
    ],
  },
  {
    key: "colaboradores",
    label: "Colaboradores",
    description: "Malha enriquecida com cadastro principal, funções, contratação, horários e perfil legado.",
    fields: COLABORADOR_ARQUIVOS_CONFIG.map((arquivo) => arquivo.key),
  },
  {
    key: "treinos",
    label: "Treinos",
    description: "Estrutura de treinos, grupos, séries e exercícios.",
    fields: [
      "treinosExerciciosFile",
      "treinosFile",
      "treinosGruposExerciciosFile",
      "treinosSeriesFile",
      "treinosSeriesItensFile",
    ],
  },
];

export type FileMap = {
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
  funcionariosFuncoesFile?: File | null;
  funcionariosFuncoesExercidasFile?: File | null;
  funcionariosTiposFile?: File | null;
  tiposFuncionariosFile?: File | null;
  funcionariosHorariosFile?: File | null;
  permissoesFile?: File | null;
  treinosExerciciosFile?: File | null;
  treinosGruposExerciciosFile?: File | null;
  treinosFile?: File | null;
  treinosSeriesFile?: File | null;
  treinosSeriesItensFile?: File | null;
};

export type MapeamentoFilial = {
  idFilialEvo: string;
  academiaId: string;
  academiaNome: string;
  unidadeNome: string;
  tenantId: string;
};

export type NovaUnidadePacoteForm = {
  nomeOriginal: string;
  nome: string;
  subdomain: string;
  documento: string;
  email: string;
  telefone: string;
  bairro: string;
  cidade: string;
};

export function resolvePacoteNomeFilial(rawName?: string | null, academiaName?: string | null) {
  const nomeOriginal = typeof rawName === "string" ? rawName.trim() : "";
  const academiaSelecionada = typeof academiaName === "string" ? academiaName.trim() : "";
  if (!nomeOriginal) {
    return {
      nomeOriginal: "",
      academiaNome: academiaSelecionada,
      unidadeNome: "",
    };
  }

  const nomeOriginalKey = normalizeSearchKey(nomeOriginal);
  const academiaSelecionadaKey = normalizeSearchKey(academiaSelecionada);
  if (academiaSelecionada && academiaSelecionadaKey && nomeOriginalKey.startsWith(academiaSelecionadaKey)) {
    const unidadeNome = nomeOriginal
      .slice(academiaSelecionada.length)
      .replace(/^[\s\-–—:/|]+/, "")
      .trim();
    if (unidadeNome) {
      return {
        nomeOriginal,
        academiaNome: academiaSelecionada,
        unidadeNome,
      };
    }
  }

  const partes = nomeOriginal.split(/\s[-–—]\s/).map((parte) => parte.trim()).filter(Boolean);
  if (partes.length > 1) {
    return {
      nomeOriginal,
      academiaNome: academiaSelecionada || partes[0],
      unidadeNome: partes.slice(1).join(" - "),
    };
  }

  return {
    nomeOriginal,
    academiaNome: academiaSelecionada,
    unidadeNome: nomeOriginal,
  };
}

export function buildNovaUnidadePacoteForm(filial: UploadAnaliseFilial | null, academiaName?: string | null): NovaUnidadePacoteForm {
  const nomes = resolvePacoteNomeFilial(filial?.nome, academiaName);
  const subdomainBase = nomes.nomeOriginal || [academiaName, nomes.unidadeNome].filter(Boolean).join(" - ");
  return {
    nomeOriginal: nomes.nomeOriginal,
    nome: nomes.unidadeNome || nomes.nomeOriginal,
    subdomain: normalizeSubdomain(subdomainBase),
    documento: formatCnpj(filial?.documento),
    email: filial?.email?.trim() || "",
    telefone: filial?.telefone?.trim() || "",
    bairro: filial?.bairro?.trim() || "",
    cidade: filial?.cidade?.trim() || "",
  };
}

export function resolveUnidadeAcademiaId(unidade?: Tenant | null): string {
  return unidade?.academiaId ?? unidade?.groupId ?? "";
}

export function buildEligibleAdminsResumo(total: number): string {
  return `${total} usuário(s) administrativos da academia receberão acesso automático em unidades novas.`;
}

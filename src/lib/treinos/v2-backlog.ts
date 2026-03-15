export type TreinoV2BacklogTaskId = 20 | 21 | 22 | 23 | 24;

export interface TreinoV2BacklogCoverageEntry {
  taskId: TreinoV2BacklogTaskId;
  title: string;
  scope: string;
  screens: string[];
  requirements: string[];
  acceptance: string[];
  deferredRequirements?: string[];
  notes?: string[];
}

export const TREINOS_V2_BACKLOG_COVERAGE: TreinoV2BacklogCoverageEntry[] = [
  {
    taskId: 20,
    title: "Listagem operacional de Treino Padrao",
    scope: "Listagem administrativa enxuta, paginada, recency-first e sem misturar treinos atribuidos.",
    screens: ["10.1"],
    requirements: ["RF11", "RF12", "RF13", "RF13.1"],
    acceptance: ["CA06"],
    notes: [
      "Quick filter ou drawer de revisao so entra quando existir backlog de migracao ou revisao.",
      "A listagem retorna apenas templates.",
    ],
  },
  {
    taskId: 21,
    title: "Editor unificado de template e treino atribuido",
    scope: "Shell unico com metadados obrigatorios, blocos em abas, grade inline, tecnicas especiais e versao simplificada.",
    screens: ["10.2"],
    requirements: ["RF01", "RF02", "RF03", "RF04", "RF05", "RF06", "RF07", "RF09", "RF10", "RF10.1", "RF10.2"],
    acceptance: ["CA01", "CA02", "CA03", "CA05"],
    notes: [
      "O mesmo editor-base atende template e treino atribuido; diferem so a governanca e o contexto.",
      "Exportar e imprimir ficam no cabecalho do editor.",
    ],
  },
  {
    taskId: 22,
    title: "Biblioteca lateral e drawer de exercicios",
    scope: "Catalogo rico de exercicios com busca, insercao rapida, cadastro lateral e reutilizacao imediata.",
    screens: ["10.2", "10.3"],
    requirements: ["RF04", "RF08"],
    acceptance: ["CA02", "CA04"],
    notes: [
      "Taxonomia obrigatoria: codigo, grupo de exercicios, grupo muscular, tipo, objetivo padrao, unidade, midia, app flag e similares.",
    ],
  },
  {
    taskId: 23,
    title: "Atribuicao individual e em massa",
    scope: "Drawer/modal de atribuicao, job assincrono para lote, snapshot obrigatorio e politicas de conflito.",
    screens: ["10.4"],
    requirements: ["RF17", "RF18", "RF19", "RF20", "RF21", "RF22", "RF22.1"],
    acceptance: ["CA07", "CA08", "CA09", "CA10", "CA11"],
    notes: [
      "Aba Segmento fica apenas preparada para futuro, sem implementacao funcional em P0.",
      "A atribuicao em massa precisa explicitar a lista final de clientes processados.",
    ],
  },
  {
    taskId: 24,
    title: "Governanca, revisao e operacao pos-atribuicao",
    scope: "Ciclo de vida do template, fila de revisao, listagem de treinos atribuidos e rastreabilidade por origem e versao.",
    screens: ["10.1", "10.5"],
    requirements: ["RF14", "RF15", "RF16", "RF16.1", "RF23", "RF24", "RF25"],
    acceptance: ["CA05", "CA09", "CA10", "CA11"],
    deferredRequirements: ["RF26", "RF27"],
    notes: [
      "Exportar treino de cliente como template e importar do ADM Geral ficam em P1.",
      "A listagem operacional de treinos atribuidos e separada da listagem de templates.",
    ],
  },
];

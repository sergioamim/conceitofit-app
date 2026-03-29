import { z } from "zod";

export const contaPagarFormSchema = z.object({
  tipoContaId: z.string().min(1, "Selecione o tipo de conta."),
  fornecedor: z.string().trim().min(1, "Informe o fornecedor."),
  documentoFornecedor: z.string().trim().optional().default(""),
  descricao: z.string().trim().min(1, "Informe a descrição."),
  categoria: z.enum([
    "FOLHA", "ALUGUEL", "UTILIDADES", "IMPOSTOS",
    "MARKETING", "MANUTENCAO", "FORNECEDORES", "OUTROS",
  ]).default("OUTROS"),
  grupoDre: z.enum([
    "CUSTO_VARIAVEL", "DESPESA_OPERACIONAL", "DESPESA_FINANCEIRA", "IMPOSTOS",
  ]).default("DESPESA_OPERACIONAL"),
  centroCusto: z.string().trim().optional().default(""),
  regime: z.enum(["AVULSA", "FIXA"]).default("AVULSA"),
  competencia: z.string().optional().default(""),
  dataEmissao: z.string().optional().default(""),
  dataVencimento: z.string().min(1, "Informe a data de vencimento."),
  valorOriginal: z.string().min(1, "Informe o valor."),
  desconto: z.string().default("0"),
  jurosMulta: z.string().default("0"),
  observacoes: z.string().trim().optional().default(""),
  recorrente: z.boolean().default(false),
  recorrenciaTipo: z.enum(["MENSAL", "INTERVALO_DIAS"]).default("MENSAL"),
  recorrenciaIntervaloDias: z.string().default("30"),
  recorrenciaDiaDoMes: z.string().optional().default(""),
  recorrenciaDataInicial: z.string().optional().default(""),
  recorrenciaTermino: z.enum(["SEM_FIM", "EM_DATA", "APOS_OCORRENCIAS"]).default("SEM_FIM"),
  recorrenciaDataFim: z.string().optional().default(""),
  recorrenciaNumeroOcorrencias: z.string().default("12"),
  criarLancamentoInicialAgora: z.boolean().default(true),
});

export type ContaPagarFormValues = z.infer<typeof contaPagarFormSchema>;

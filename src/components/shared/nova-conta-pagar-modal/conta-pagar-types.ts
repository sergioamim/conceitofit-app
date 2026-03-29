import type {
  CategoriaContaPagar,
  ContaPagar,
  FormaPagamento,
  GrupoDre,
  TipoContaPagar,
  TipoFormaPagamento,
} from "@/lib/types";

export const CATEGORIA_LABEL: Record<CategoriaContaPagar, string> = {
  FOLHA: "Folha",
  ALUGUEL: "Aluguel",
  UTILIDADES: "Utilidades",
  IMPOSTOS: "Impostos",
  MARKETING: "Marketing",
  MANUTENCAO: "Manutenção",
  FORNECEDORES: "Fornecedores",
  OUTROS: "Outros",
};

export const GRUPO_DRE_LABEL: Record<GrupoDre, string> = {
  CUSTO_VARIAVEL: "Custo variável",
  DESPESA_OPERACIONAL: "Despesa operacional",
  DESPESA_FINANCEIRA: "Despesa financeira",
  IMPOSTOS: "Impostos",
};

export const FORMA_PAGAMENTO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

export type NovaContaFormState = {
  tipoContaId: string;
  fornecedor: string;
  documentoFornecedor: string;
  descricao: string;
  categoria: CategoriaContaPagar;
  grupoDre: GrupoDre;
  centroCusto: string;
  regime: ContaPagar["regime"];
  competencia: string;
  dataEmissao: string;
  dataVencimento: string;
  valorOriginal: string;
  desconto: string;
  jurosMulta: string;
  observacoes: string;
  recorrente: boolean;
  recorrenciaTipo: "MENSAL" | "INTERVALO_DIAS";
  recorrenciaIntervaloDias: string;
  recorrenciaDiaDoMes: string;
  recorrenciaDataInicial: string;
  recorrenciaTermino: "SEM_FIM" | "EM_DATA" | "APOS_OCORRENCIAS";
  recorrenciaDataFim: string;
  recorrenciaNumeroOcorrencias: string;
  criarLancamentoInicialAgora: boolean;
};

export type PagamentoNoCadastroState = {
  dataPagamento: string;
  formaPagamento: TipoFormaPagamento;
  valorPago: string;
  observacoes: string;
};

export type NovaContaPagarSubmitData = {
  form: NovaContaFormState;
  registrarComoPaga: boolean;
  pagamento: PagamentoNoCadastroState;
};

export type NovaContaPagarModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiposAtivos: TipoContaPagar[];
  tiposConta: TipoContaPagar[];
  formasPagamentoUnicas: FormaPagamento[];
  defaultCompetencia: string;
  defaultDataVencimento: string;
  todayISO: string;
  onSubmit: (data: NovaContaPagarSubmitData) => Promise<void>;
};

export function formatBRL(value: number) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

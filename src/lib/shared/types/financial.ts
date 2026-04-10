import type { UUID, LocalDate, LocalDateTime } from './comum';

// ---------------------------------------------------------------------------
// Accounts (Contas Contábeis)
// ---------------------------------------------------------------------------

export type FinancialAccountType = "ATIVO" | "PASSIVO" | "RECEITA" | "DESPESA" | "PATRIMONIO";
export type FinancialAccountStatus = "ATIVA" | "INATIVA";

export interface FinancialAccount {
  id: UUID;
  tenantId?: UUID;
  codigo: string;
  nome: string;
  tipo: FinancialAccountType;
  descricao?: string;
  contaPaiId?: UUID;
  nivel: number;
  status: FinancialAccountStatus;
  saldoAtual: number;
  createdAt?: LocalDateTime;
  updatedAt?: LocalDateTime;
}

// ---------------------------------------------------------------------------
// Ledgers (Livros Razão)
// ---------------------------------------------------------------------------

export type LedgerStatus = "ABERTO" | "FECHADO";

export interface Ledger {
  id: UUID;
  tenantId?: UUID;
  nome: string;
  descricao?: string;
  referencia: string;
  dataInicio: LocalDate;
  dataFim: LocalDate;
  status: LedgerStatus;
  totalDebitos: number;
  totalCreditos: number;
  createdAt?: LocalDateTime;
}

export type LedgerEntryType = "DEBITO" | "CREDITO";

export interface LedgerEntry {
  id: UUID;
  ledgerId: UUID;
  contaId: UUID;
  contaCodigo?: string;
  contaNome?: string;
  tipo: LedgerEntryType;
  valor: number;
  descricao?: string;
  dataLancamento: LocalDate;
  transacaoId?: UUID;
  createdAt?: LocalDateTime;
}

// ---------------------------------------------------------------------------
// Transactions (Transações)
// ---------------------------------------------------------------------------

export type FinancialTransactionStatus = "PENDENTE" | "CONFIRMADA" | "REVERTIDA" | "CANCELADA";
export type FinancialTransactionType = "RECEITA" | "DESPESA" | "TRANSFERENCIA" | "AJUSTE";

export interface FinancialTransaction {
  id: UUID;
  tenantId?: UUID;
  tipo: FinancialTransactionType;
  descricao: string;
  valor: number;
  data: LocalDate;
  contaOrigemId?: UUID;
  contaOrigemNome?: string;
  contaDestinoId?: UUID;
  contaDestinoNome?: string;
  status: FinancialTransactionStatus;
  referencia?: string;
  observacoes?: string;
  reversaoDeId?: UUID;
  createdAt?: LocalDateTime;
  updatedAt?: LocalDateTime;
}

// ---------------------------------------------------------------------------
// Reports (Relatórios)
// ---------------------------------------------------------------------------

export interface BalancoPatrimonialLinha {
  contaId: UUID;
  contaCodigo: string;
  contaNome: string;
  tipo: FinancialAccountType;
  saldo: number;
}

export interface BalancoPatrimonial {
  referencia: string;
  dataBase: LocalDate;
  totalAtivos: number;
  totalPassivos: number;
  totalPatrimonio: number;
  linhas: BalancoPatrimonialLinha[];
  generatedAt?: LocalDateTime;
}

export interface FluxoCaixaItem {
  periodo: string;
  entradas: number;
  saidas: number;
  saldoLiquido: number;
}

export interface FluxoCaixa {
  referencia: string;
  dataInicio: LocalDate;
  dataFim: LocalDate;
  saldoInicial: number;
  saldoFinal: number;
  items: FluxoCaixaItem[];
  generatedAt?: LocalDateTime;
}

export interface ExtratoLinha {
  data: LocalDate;
  descricao: string;
  tipo: LedgerEntryType;
  valor: number;
  saldoAcumulado: number;
  transacaoId?: UUID;
}

export interface ExtratoConta {
  contaId: UUID;
  contaCodigo: string;
  contaNome: string;
  dataInicio: LocalDate;
  dataFim: LocalDate;
  saldoInicial: number;
  saldoFinal: number;
  linhas: ExtratoLinha[];
  generatedAt?: LocalDateTime;
}

// ---------------------------------------------------------------------------
// Monitoring (Monitoramento)
// ---------------------------------------------------------------------------

export type MonitorAlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface TransacaoSuspeita {
  id: UUID;
  transacaoId: UUID;
  descricao: string;
  motivo: string;
  severidade: MonitorAlertSeverity;
  valor: number;
  data: LocalDate;
  revisada: boolean;
  createdAt?: LocalDateTime;
}

export interface PadraoIncomum {
  id: UUID;
  descricao: string;
  tipo: string;
  detalhes: string;
  severidade: MonitorAlertSeverity;
  detectadoEm: LocalDateTime;
  resolvido: boolean;
}

export interface AltaFrequencia {
  contaId: UUID;
  contaCodigo: string;
  contaNome: string;
  quantidadeTransacoes: number;
  periodo: string;
  valorTotal: number;
  severidade: MonitorAlertSeverity;
}

/**
 * Transacao individual de alto valor detectada pelo BE
 * (GET /api/v1/financial/monitoring/high-value/{tenantId}).
 * Usada no painel anti-fraude (Task #549).
 */
export interface AltoValor {
  id: UUID;
  transacaoId: UUID;
  descricao: string;
  valor: number;
  data: LocalDate;
  tipo?: string;
  contaCodigo?: string;
  contaNome?: string;
  severidade: MonitorAlertSeverity;
}

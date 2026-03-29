import type {
  AltaFrequencia,
  BalancoPatrimonial,
  ExtratoConta,
  FinancialAccount,
  FinancialTransaction,
  FluxoCaixa,
  Ledger,
  LedgerEntry,
  PadraoIncomum,
  TransacaoSuspeita,
} from "@/lib/types";
import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Envelope helper
// ---------------------------------------------------------------------------

type Envelope<T> = T | { data?: T; content?: T; result?: T; items?: T };

function extract<T>(response: Envelope<T>): T {
  if (!response || typeof response !== "object") return {} as T;
  if ("data" in response || "content" in response || "result" in response || "items" in response) {
    const w = response as Exclude<Envelope<T>, T>;
    return w.data ?? w.content ?? w.result ?? w.items ?? ({} as T);
  }
  return response as T;
}

function extractList<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];
  const obj = response as Record<string, unknown>;
  const list = obj.data ?? obj.content ?? obj.result ?? obj.items ?? obj.rows;
  return Array.isArray(list) ? list : [];
}

function num(v: unknown, f = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function listFinancialAccountsApi(opts?: {
  tenantId?: string;
  tipo?: string;
  status?: string;
}): Promise<FinancialAccount[]> {
  const response = await apiRequest<unknown>({
    path: "/api/v1/financial/accounts",
    query: {
      tenantId: opts?.tenantId,
      tipo: opts?.tipo,
      status: opts?.status,
    },
  });
  return extractList<FinancialAccount>(response).map((item) => ({
    ...item,
    saldoAtual: num(item.saldoAtual),
    nivel: num(item.nivel, 1),
  }));
}

export async function getFinancialAccountApi(id: string): Promise<FinancialAccount> {
  return apiRequest<FinancialAccount>({ path: `/api/v1/financial/accounts/${id}` });
}

export async function createFinancialAccountApi(data: {
  tenantId?: string;
  codigo: string;
  nome: string;
  tipo: string;
  descricao?: string;
  contaPaiId?: string;
}): Promise<FinancialAccount> {
  return apiRequest<FinancialAccount>({
    path: "/api/v1/financial/accounts",
    method: "POST",
    body: data,
  });
}

export async function updateFinancialAccountApi(
  id: string,
  data: Partial<{ nome: string; descricao: string; status: string }>
): Promise<FinancialAccount> {
  return apiRequest<FinancialAccount>({
    path: `/api/v1/financial/accounts/${id}`,
    method: "PUT",
    body: data,
  });
}

// ---------------------------------------------------------------------------
// Ledgers
// ---------------------------------------------------------------------------

export async function listLedgersApi(opts?: {
  tenantId?: string;
  status?: string;
}): Promise<Ledger[]> {
  const response = await apiRequest<unknown>({
    path: "/api/v1/financial/ledgers",
    query: { tenantId: opts?.tenantId, status: opts?.status },
  });
  return extractList<Ledger>(response).map((item) => ({
    ...item,
    totalDebitos: num(item.totalDebitos),
    totalCreditos: num(item.totalCreditos),
  }));
}

export async function getLedgerApi(id: string): Promise<Ledger> {
  return apiRequest<Ledger>({ path: `/api/v1/financial/ledgers/${id}` });
}

export async function createLedgerApi(data: {
  tenantId?: string;
  nome: string;
  descricao?: string;
  referencia: string;
  dataInicio: string;
  dataFim: string;
}): Promise<Ledger> {
  return apiRequest<Ledger>({
    path: "/api/v1/financial/ledgers",
    method: "POST",
    body: data,
  });
}

export async function closeLedgerApi(id: string): Promise<Ledger> {
  return apiRequest<Ledger>({
    path: `/api/v1/financial/ledgers/${id}/close`,
    method: "PATCH",
  });
}

// ---------------------------------------------------------------------------
// Ledger Entries
// ---------------------------------------------------------------------------

export async function listLedgerEntriesApi(ledgerId: string, opts?: {
  contaId?: string;
}): Promise<LedgerEntry[]> {
  const response = await apiRequest<unknown>({
    path: `/api/v1/financial/ledgers/${ledgerId}/entries`,
    query: { contaId: opts?.contaId },
  });
  return extractList<LedgerEntry>(response).map((item) => ({
    ...item,
    valor: num(item.valor),
  }));
}

export async function createLedgerEntryApi(ledgerId: string, data: {
  contaId: string;
  tipo: string;
  valor: number;
  descricao?: string;
  dataLancamento: string;
  transacaoId?: string;
}): Promise<LedgerEntry> {
  return apiRequest<LedgerEntry>({
    path: `/api/v1/financial/ledgers/${ledgerId}/entries`,
    method: "POST",
    body: data,
  });
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export async function listFinancialTransactionsApi(opts?: {
  tenantId?: string;
  status?: string;
  tipo?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FinancialTransaction[]> {
  const response = await apiRequest<unknown>({
    path: "/api/v1/financial/transactions",
    query: {
      tenantId: opts?.tenantId,
      status: opts?.status,
      tipo: opts?.tipo,
      startDate: opts?.startDate,
      endDate: opts?.endDate,
    },
  });
  return extractList<FinancialTransaction>(response).map((item) => ({
    ...item,
    valor: num(item.valor),
  }));
}

export async function getFinancialTransactionApi(id: string): Promise<FinancialTransaction> {
  return apiRequest<FinancialTransaction>({ path: `/api/v1/financial/transactions/${id}` });
}

export async function createFinancialTransactionApi(data: {
  tenantId?: string;
  tipo: string;
  descricao: string;
  valor: number;
  data: string;
  contaOrigemId?: string;
  contaDestinoId?: string;
  referencia?: string;
  observacoes?: string;
}): Promise<FinancialTransaction> {
  return apiRequest<FinancialTransaction>({
    path: "/api/v1/financial/transactions",
    method: "POST",
    body: data,
  });
}

export async function confirmTransactionApi(id: string): Promise<FinancialTransaction> {
  return apiRequest<FinancialTransaction>({
    path: `/api/v1/financial/transactions/${id}/confirm`,
    method: "PATCH",
  });
}

export async function reverseTransactionApi(id: string, data?: {
  motivo?: string;
}): Promise<FinancialTransaction> {
  return apiRequest<FinancialTransaction>({
    path: `/api/v1/financial/transactions/${id}/reverse`,
    method: "POST",
    body: data,
  });
}

export async function cancelTransactionApi(id: string, data?: {
  motivo?: string;
}): Promise<FinancialTransaction> {
  return apiRequest<FinancialTransaction>({
    path: `/api/v1/financial/transactions/${id}/cancel`,
    method: "PATCH",
    body: data,
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function getBalancoPatrimonialApi(opts?: {
  tenantId?: string;
  dataBase?: string;
}): Promise<BalancoPatrimonial> {
  const response = await apiRequest<Envelope<BalancoPatrimonial>>({
    path: "/api/v1/financial/reports/balanco",
    query: { tenantId: opts?.tenantId, dataBase: opts?.dataBase },
  });
  return extract(response);
}

export async function getFluxoCaixaApi(opts?: {
  tenantId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FluxoCaixa> {
  const response = await apiRequest<Envelope<FluxoCaixa>>({
    path: "/api/v1/financial/reports/fluxo-caixa",
    query: { tenantId: opts?.tenantId, startDate: opts?.startDate, endDate: opts?.endDate },
  });
  return extract(response);
}

export async function getExtratoContaApi(contaId: string, opts?: {
  startDate?: string;
  endDate?: string;
}): Promise<ExtratoConta> {
  const response = await apiRequest<Envelope<ExtratoConta>>({
    path: `/api/v1/financial/reports/extrato/${contaId}`,
    query: { startDate: opts?.startDate, endDate: opts?.endDate },
  });
  return extract(response);
}

// ---------------------------------------------------------------------------
// Monitoring
// ---------------------------------------------------------------------------

export async function listTransacoesSuspeitasApi(opts?: {
  tenantId?: string;
  revisada?: boolean;
}): Promise<TransacaoSuspeita[]> {
  const response = await apiRequest<unknown>({
    path: "/api/v1/financial/monitoring/suspicious",
    query: {
      tenantId: opts?.tenantId,
      revisada: opts?.revisada != null ? String(opts.revisada) : undefined,
    },
  });
  return extractList<TransacaoSuspeita>(response);
}

export async function listPadroesIncomunsApi(opts?: {
  tenantId?: string;
}): Promise<PadraoIncomum[]> {
  const response = await apiRequest<unknown>({
    path: "/api/v1/financial/monitoring/patterns",
    query: { tenantId: opts?.tenantId },
  });
  return extractList<PadraoIncomum>(response);
}

export async function listAltaFrequenciaApi(opts?: {
  tenantId?: string;
}): Promise<AltaFrequencia[]> {
  const response = await apiRequest<unknown>({
    path: "/api/v1/financial/monitoring/high-frequency",
    query: { tenantId: opts?.tenantId },
  });
  return extractList<AltaFrequencia>(response);
}

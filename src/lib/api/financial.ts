/**
 * Financial (contas contábeis) — reconciliado com backend real (Task #553).
 *
 * Paths alinhados com o backend Java em 2026-04-10:
 *
 *   FE                                           →  BE real
 *   ────────────────────────────────────────────────────────────────────────
 *   /financial/accounts                          →  AccountApi                 ✅
 *   /financial/transactions                      →  TransactionApi             ✅
 *   /financial/ledgers                           →  LedgerApi                  ✅
 *   /financial/ledger-entries?tenantId=          →  LedgerEntryApi.list        ✅ (Task #553)
 *   /financial/monitoring/suspicious-transactions →  MonitoringController      ✅ (Task #553)
 *   /financial/monitoring/unusual-patterns/{id}  →  MonitoringController      ✅ (Task #553)
 *   /financial/monitoring/high-frequency/{id}    →  MonitoringController      ✅ (Task #553)
 *   /api/v1/relatorios/fluxo-caixa               →  RelatorioFinanceiroCtrl    ✅ (Task #553)
 *
 * Endpoints ainda não implementados no BE (retornam estrutura vazia com warning):
 *   ❌ BalancoPatrimonial  — BE não expõe; getBalancoPatrimonialApi retorna vazio
 *   ❌ ExtratoConta        — BE não expõe; getExtratoContaApi retorna vazio
 *
 * Para validar: `node scripts/smoke-test-be-fe.mjs --filter=financial`
 *
 * @see docs/adr/ADR-001-modulos-fe-fantasma.md seção 2
 */
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

async function getFinancialAccountApi(id: string): Promise<FinancialAccount> {
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

async function getLedgerApi(id: string): Promise<Ledger> {
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

/**
 * Lista entradas de ledger. BE não expõe "entradas por ledger" — só por tenant,
 * conta ou transação. A filtragem por ledger (via data do lançamento) é feita
 * client-side no componente consumidor.
 *
 * Assinatura mudou em Task #553: agora requer tenantId. O ledgerId opcional
 * é mantido apenas para compatibilidade semântica (o caller pode filtrar
 * client-side se precisar).
 */
export async function listLedgerEntriesApi(opts: {
  tenantId: string;
  contaId?: string;
}): Promise<LedgerEntry[]> {
  // Se contaId for informado, usa endpoint by-account (mais eficiente)
  const path = opts.contaId
    ? `/api/v1/financial/ledger-entries/by-account/${opts.contaId}`
    : "/api/v1/financial/ledger-entries";
  const response = await apiRequest<unknown>({
    path,
    query: { tenantId: opts.tenantId },
  });
  return extractList<LedgerEntry>(response).map((item) => ({
    ...item,
    valor: num(item.valor),
  }));
}

async function createLedgerEntryApi(ledgerId: string, data: {
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

async function getFinancialTransactionApi(id: string): Promise<FinancialTransaction> {
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

/**
 * BE ainda não expõe balanço patrimonial. Retorna estrutura vazia + warning
 * para que a UI possa renderizar estado "sem dados" sem quebrar.
 *
 * Acompanha ADR-001 e Task #553. Ativar quando o endpoint for implementado.
 */
export async function getBalancoPatrimonialApi(_opts?: {
  tenantId?: string;
  dataBase?: string;
}): Promise<BalancoPatrimonial> {
  if (typeof console !== "undefined") {
    console.warn(
      "[financial.getBalancoPatrimonialApi] Endpoint não implementado no backend. Retornando estrutura vazia."
    );
  }
  return {} as BalancoPatrimonial;
}

/**
 * Fluxo de caixa consome `/api/v1/relatorios/fluxo-caixa` (RelatorioFinanceiroController),
 * prefixo diferente do resto do módulo financeiro. Migrado em Task #553.
 */
export async function getFluxoCaixaApi(opts?: {
  tenantId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FluxoCaixa> {
  const response = await apiRequest<Envelope<FluxoCaixa>>({
    path: "/api/v1/relatorios/fluxo-caixa",
    query: { tenantId: opts?.tenantId, startDate: opts?.startDate, endDate: opts?.endDate },
  });
  return extract(response);
}

/**
 * BE ainda não expõe extrato por conta. Retorna estrutura vazia + warning.
 */
async function getExtratoContaApi(_contaId: string, _opts?: {
  startDate?: string;
  endDate?: string;
}): Promise<ExtratoConta> {
  if (typeof console !== "undefined") {
    console.warn(
      "[financial.getExtratoContaApi] Endpoint não implementado no backend. Retornando estrutura vazia."
    );
  }
  return {} as ExtratoConta;
}

// ---------------------------------------------------------------------------
// Monitoring
// ---------------------------------------------------------------------------

export async function listTransacoesSuspeitasApi(opts?: {
  tenantId?: string;
  revisada?: boolean;
}): Promise<TransacaoSuspeita[]> {
  const response = await apiRequest<unknown>({
    path: "/api/v1/financial/monitoring/suspicious-transactions",
    query: {
      tenantId: opts?.tenantId,
      revisada: opts?.revisada != null ? String(opts.revisada) : undefined,
    },
  });
  return extractList<TransacaoSuspeita>(response);
}

export async function listPadroesIncomunsApi(opts: {
  tenantId: string;
}): Promise<PadraoIncomum[]> {
  // BE usa path param (UUID), não query param.
  const response = await apiRequest<unknown>({
    path: `/api/v1/financial/monitoring/unusual-patterns/${opts.tenantId}`,
  });
  return extractList<PadraoIncomum>(response);
}

export async function listAltaFrequenciaApi(opts: {
  tenantId: string;
}): Promise<AltaFrequencia[]> {
  // BE usa path param (UUID), não query param.
  const response = await apiRequest<unknown>({
    path: `/api/v1/financial/monitoring/high-frequency/${opts.tenantId}`,
  });
  return extractList<AltaFrequencia>(response);
}

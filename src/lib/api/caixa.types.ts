/**
 * Tipos TypeScript compartilhados para o domínio Caixa Operacional.
 *
 * Espelham os records Java em
 * `modulo-financeiro/src/main/java/fit/conceito/financeiro/dto/caixa/`.
 *
 * Convenções:
 * - UUIDs e datetimes Java (LocalDateTime/LocalDate) viajam como `string`
 *   em JSON (formato ISO-8601).
 * - BigDecimal é serializado como `number` no BE (padrão Jackson do projeto)
 *   e normalizado via `toNumber(...)` no FE — ver pagamentos.ts.
 *
 * Esta story (CXO-002) entrega apenas os tipos. As funções de API client
 * que os consomem serão criadas em CXO-105.
 */

export interface AbrirCaixaRequest {
  valorAbertura: number;
  observacoes?: string | null;
}

export interface CaixaResponse {
  id: string;
  status: string;
  abertoEm: string;
  fechadoEm: string | null;
  valorAbertura: number;
  valorFechamento: number | null;
  valorInformado: number | null;
  operadorId: string;
  operadorNome: string;
}

export interface SaldoParcialResponse {
  caixaId: string;
  total: number;
  porFormaPagamento: Record<string, number>;
  movimentosCount: number;
}

export interface SangriaRequest {
  valor: number;
  motivo: string;
  autorizadoPor: string;
}

export interface FecharCaixaRequest {
  valorInformado: number;
  observacoes?: string | null;
}

export interface FecharCaixaResponse {
  caixa: CaixaResponse;
  breakdown: SaldoParcialResponse;
  diferenca: number;
  status: string;
}

export interface AjusteAdminRequest {
  tipo: string;
  valor: number;
  formaPagamento?: string | null;
  motivo: string;
}

export interface DashboardDiarioResponse {
  data: string;
  caixasAbertos: CaixaResponse[];
  caixasFechados: CaixaResponse[];
  totalMovimentado: SaldoParcialResponse;
  alertasDiferencaCount: number;
}

export interface DiferencaItemResponse {
  caixaId: string;
  operadorId: string;
  operadorNome: string;
  diferenca: number;
  dataFechamento: string;
}

export interface MovimentoResumoResponse {
  id: string;
  tipo: string;
  valor: number;
  formaPagamento: string | null;
  dataMovimento: string;
}

/** Projecao de ajuste administrativo (CXO-302). */
export interface CaixaAjusteResponse {
  id: string;
  tipo: string;
  valor: number;
  formaPagamento: string | null;
  motivo: string | null;
  adminNome: string | null;
  criadoEm: string;
}

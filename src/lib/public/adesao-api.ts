/**
 * Client HTTP para os endpoints reais de adesão pública do backend.
 * Base: POST/GET /api/v1/publico/adesao/*
 *
 * Após a criação de uma adesão (trial ou cadastro), o backend retorna
 * um `tokenPublico` que deve ser enviado no header `X-Adesao-Token`
 * em todas as operações subsequentes daquela adesão.
 */

// ---------------------------------------------------------------------------
// Types — espelham os DTOs do backend Java
// ---------------------------------------------------------------------------

export type AdesaoDigitalOrigem = "TRIAL" | "CADASTRO_PUBLICO";

export type AdesaoDigitalStatus =
  | "TRIAL_INICIADO"
  | "CADASTRO_RECEBIDO"
  | "CHECKOUT_INICIADO"
  | "AGUARDANDO_CONTRATO"
  | "AGUARDANDO_PAGAMENTO"
  | "CONCLUIDA"
  | "CANCELADA";

export type AdesaoPendenciaCodigo = "DADOS_CADASTRAIS" | "PAGAMENTO" | "CONTRATO";

export type AdesaoMeioPagamento =
  | "CARTAO_CREDITO"
  | "CARTAO_DEBITO"
  | "PIX"
  | "BOLETO"
  | "CARNE"
  | "OUTRO";

export type AdesaoPagamentoStatus =
  | "CRIADO"
  | "AUTORIZADO"
  | "CAPTURADO"
  | "LIQUIDADO"
  | "CANCELADO"
  | "CHARGEBACK"
  | "FALHA";

export type AdesaoContratoStatus = "PENDENTE" | "ASSINADO" | "EXPIRADO";

export type Sexo = "M" | "F" | "OUTRO";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface AdesaoPendenciaResponse {
  codigo: AdesaoPendenciaCodigo;
  descricao: string;
  obrigatoria: boolean;
  resolvida: boolean;
  resolvidaEm: string | null;
}

export interface AdesaoStatusResponse {
  id: string;
  tokenPublico: string | null;
  tenantId: string;
  academiaId: string;
  planoId: string | null;
  origem: AdesaoDigitalOrigem;
  status: AdesaoDigitalStatus;
  candidatoNome: string;
  candidatoEmail: string;
  candidatoTelefone: string | null;
  candidatoCpf: string | null;
  trialDias: number | null;
  mensagemStatus: string | null;
  alunoId: string | null;
  contratoId: string | null;
  contratoStatus: AdesaoContratoStatus | null;
  pagamentoId: string | null;
  pagamentoStatus: AdesaoPagamentoStatus | null;
  pendencias: AdesaoPendenciaResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanoCatalogoResponse {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  duracaoDias: number;
  valor: number;
  valorMatricula: number;
  destaque: boolean;
  beneficios: string[];
}

export interface CatalogoPublicoResponse {
  tenantId: string;
  academiaId: string;
  nomeUnidade: string;
  subdomain: string;
  planos: PlanoCatalogoResponse[];
}

export interface OtpAdesaoResponse {
  enviadoEm: string;
  otpValidoAte: string;
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface CriarTrialRequest {
  tenantId?: string;
  subdomain?: string;
  nome: string;
  email: string;
  telefone?: string;
  trialDias?: number;
  aceiteTermos: boolean;
  aceiteComercial?: boolean;
  antiFraudeToken?: string;
}

export interface CriarCadastroRequest {
  tenantId?: string;
  subdomain?: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf: string;
  dataNascimento: string;
  sexo: Sexo;
  aceiteTermos: boolean;
  aceiteComercial?: boolean;
  antiFraudeToken?: string;
}

export interface CompletarCadastroRequest {
  nome: string;
  email: string;
  telefone?: string;
  cpf: string;
  dataNascimento: string;
  sexo: Sexo;
  aceiteTermos: boolean;
  aceiteComercial?: boolean;
  antiFraudeToken?: string;
}

export interface CheckoutRequest {
  planoId: string;
  meioPagamento: AdesaoMeioPagamento;
  idempotencyKey?: string;
}

export interface AtualizarPendenciaRequest {
  resolvida: boolean;
  descricao?: string;
}

export interface EnviarOtpContratoRequest {
  destino?: string;
}

export interface AssinarContratoRequest {
  otp: string;
  evidenciasJson?: string;
  pdfAssinadoKey?: string;
}

export interface ConfirmarPagamentoRequest {
  status: AdesaoPagamentoStatus;
  pagamentoId?: string;
  mensagem?: string;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function resolveBaseUrl(): string {
  const baseUrl =
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : undefined) ?? "";
  return baseUrl
    ? `${baseUrl}/api/v1/publico/adesao`
    : "/backend/api/v1/publico/adesao";
}

async function adesaoFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    query?: Record<string, string | undefined>;
  } = {},
): Promise<T> {
  const base = resolveBaseUrl();
  const url = new URL(`${base}${path}`, globalThis.location?.origin ?? "http://localhost:3000");

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value != null && value !== "") url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (options.token) {
    headers["X-Adesao-Token"] = options.token;
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let message = `Erro na adesão (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** GET /catalogo — catálogo público de planos por unidade */
export async function getCatalogoPublico(params: {
  tenantId?: string;
  subdomain?: string;
}): Promise<CatalogoPublicoResponse> {
  return adesaoFetch<CatalogoPublicoResponse>("/catalogo", {
    query: { tenantId: params.tenantId, subdomain: params.subdomain },
  });
}

/** POST /trials — iniciar trial público */
export async function criarTrialPublico(
  data: CriarTrialRequest,
): Promise<AdesaoStatusResponse> {
  return adesaoFetch<AdesaoStatusResponse>("/trials", {
    method: "POST",
    body: data,
  });
}

/** POST /cadastros — criar cadastro para adesão digital */
export async function criarCadastroPublico(
  data: CriarCadastroRequest,
): Promise<AdesaoStatusResponse> {
  return adesaoFetch<AdesaoStatusResponse>("/cadastros", {
    method: "POST",
    body: data,
  });
}

/** PUT /{id}/cadastro — completar cadastro de uma adesão (trial → cadastro) */
export async function completarCadastro(
  id: string,
  token: string,
  data: CompletarCadastroRequest,
): Promise<AdesaoStatusResponse> {
  return adesaoFetch<AdesaoStatusResponse>(`/${id}/cadastro`, {
    method: "PUT",
    body: data,
    token,
  });
}

/** POST /{id}/checkout — iniciar checkout */
export async function iniciarCheckout(
  id: string,
  token: string,
  data: CheckoutRequest,
): Promise<AdesaoStatusResponse> {
  return adesaoFetch<AdesaoStatusResponse>(`/${id}/checkout`, {
    method: "POST",
    body: data,
    token,
  });
}

/** GET /{id} — consultar status da adesão */
export async function getAdesaoStatus(
  id: string,
  token: string,
): Promise<AdesaoStatusResponse> {
  return adesaoFetch<AdesaoStatusResponse>(`/${id}`, { token });
}

/** GET /{id}/pendencias — listar pendências */
export async function getAdesaoPendencias(
  id: string,
  token: string,
): Promise<AdesaoPendenciaResponse[]> {
  return adesaoFetch<AdesaoPendenciaResponse[]>(`/${id}/pendencias`, { token });
}

/** PATCH /{id}/pendencias/{codigo} — atualizar pendência */
export async function atualizarPendencia(
  id: string,
  token: string,
  codigo: AdesaoPendenciaCodigo,
  data: AtualizarPendenciaRequest,
): Promise<AdesaoStatusResponse> {
  return adesaoFetch<AdesaoStatusResponse>(`/${id}/pendencias/${codigo}`, {
    method: "PATCH",
    body: data,
    token,
  });
}

/** POST /{id}/contrato/otp — enviar OTP para assinatura de contrato */
export async function enviarOtpContrato(
  id: string,
  token: string,
  data?: EnviarOtpContratoRequest,
): Promise<OtpAdesaoResponse> {
  return adesaoFetch<OtpAdesaoResponse>(`/${id}/contrato/otp`, {
    method: "POST",
    body: data ?? {},
    token,
  });
}

/** POST /{id}/contrato/assinaturas — assinar contrato com OTP */
export async function assinarContrato(
  id: string,
  token: string,
  data: AssinarContratoRequest,
): Promise<AdesaoStatusResponse> {
  return adesaoFetch<AdesaoStatusResponse>(`/${id}/contrato/assinaturas`, {
    method: "POST",
    body: data,
    token,
  });
}

/** POST /{id}/pagamento/confirmacao — confirmar pagamento */
export async function confirmarPagamento(
  id: string,
  token: string,
  data: ConfirmarPagamentoRequest,
): Promise<AdesaoStatusResponse> {
  return adesaoFetch<AdesaoStatusResponse>(`/${id}/pagamento/confirmacao`, {
    method: "POST",
    body: data,
    token,
  });
}

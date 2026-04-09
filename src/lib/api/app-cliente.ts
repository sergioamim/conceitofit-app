import { apiRequest } from "./http";

// Re-export multipartFetch via storage helper
async function multipartFetch<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const res = await fetch(`/backend${path}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Upload falhou (${res.status}): ${text || res.statusText}`,
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------------------

export interface AppClienteContexto {
  tenantId: string;
  academiaId: string;
  alunoId: string;
  academiaNome: string;
  unidadeNome: string;
  branding: {
    logo?: string;
    corPrimaria?: string;
    corSecundaria?: string;
  } | null;
  capabilities: Record<string, boolean>;
}

export async function getAppClienteContextoApi(input: {
  tenantId: string;
}): Promise<AppClienteContexto> {
  return apiRequest<AppClienteContexto>({
    path: "/api/v1/app-cliente/contexto",
    query: { tenantId: input.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Home Snapshot
// ---------------------------------------------------------------------------

export interface HomeSnapshot {
  financeiro: {
    totalPendente: number;
    totalVencido: number;
    proximoVencimento: string | null;
  };
  agenda: {
    proximaAula: {
      nome: string;
      horario: string;
      data: string;
    } | null;
    totalReservasHoje: number;
  };
  treino: {
    treinoAtivoNome: string | null;
    ultimaExecucao: string | null;
    aderenciaPercentual: number | null;
  };
  checkin: {
    ultimoCheckin: string | null;
    totalMes: number;
  };
  avaliacao: {
    proximaAvaliacao: string | null;
  };
}

export async function getHomeSnapshotApi(input: {
  tenantId: string;
}): Promise<HomeSnapshot> {
  return apiRequest<HomeSnapshot>({
    path: "/api/v1/app-cliente/home-snapshot",
    query: { tenantId: input.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Carteirinha Digital
// ---------------------------------------------------------------------------

export interface CarteirinhaDigital {
  identidadeId: string;
  version: number;
  token: string;
  qrPayload: string;
  expiresAt: string;
  alunoNome: string;
  fotoUrl: string | null;
}

export async function getCarteirinhaDigitalApi(input: {
  tenantId: string;
}): Promise<CarteirinhaDigital> {
  return apiRequest<CarteirinhaDigital>({
    path: "/api/v1/app-cliente/carteirinha-digital",
    query: { tenantId: input.tenantId },
  });
}

export async function rotacionarCarteirinhaApi(input: {
  tenantId: string;
}): Promise<CarteirinhaDigital> {
  return apiRequest<CarteirinhaDigital>({
    path: "/api/v1/app-cliente/carteirinha-digital/rotacionar",
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Portabilidade
// ---------------------------------------------------------------------------

export interface Portabilidade {
  alunoId: string;
  unidadeOrigem: string;
  unidadesPermitidas: Array<{
    tenantId: string;
    nome: string;
    endereco: string | null;
  }>;
  portabilidadeAtiva: boolean;
}

export async function getPortabilidadeApi(input: {
  tenantId: string;
}): Promise<Portabilidade> {
  return apiRequest<Portabilidade>({
    path: "/api/v1/app-cliente/portabilidade",
    query: { tenantId: input.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Avaliação Fotos
// ---------------------------------------------------------------------------

export interface AvaliacaoFoto {
  id: string;
  url: string;
  tipo: string;
  avaliacaoId: string | null;
  criadaEm: string;
}

export async function uploadAvaliacaoFotoApi(input: {
  tenantId: string;
  file: File;
  tipo: string;
  avaliacaoId?: string;
}): Promise<AvaliacaoFoto> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("tipo", input.tipo);
  if (input.avaliacaoId) form.append("avaliacaoId", input.avaliacaoId);

  const params = new URLSearchParams({ tenantId: input.tenantId });
  return multipartFetch<AvaliacaoFoto>(
    `/api/v1/app-cliente/avaliacoes/fotos?${params.toString()}`,
    form,
  );
}

// ---------------------------------------------------------------------------
// Device Tokens (Push Notifications)
// ---------------------------------------------------------------------------

export async function registrarDeviceTokenApi(input: {
  tenantId: string;
  token: string;
  plataforma: string;
  deviceInfo?: Record<string, string>;
}): Promise<{ id: string; token: string }> {
  return apiRequest<{ id: string; token: string }>({
    path: "/api/v1/app-cliente/notificacoes/device-token",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: {
      token: input.token,
      plataforma: input.plataforma,
      ...(input.deviceInfo ? { deviceInfo: input.deviceInfo } : {}),
    },
  });
}

export async function removerDeviceTokenApi(input: {
  tenantId: string;
  token: string;
}): Promise<void> {
  await apiRequest<void>({
    path: "/api/v1/app-cliente/notificacoes/device-token",
    method: "DELETE",
    query: { tenantId: input.tenantId },
    body: { token: input.token },
  });
}

// ---------------------------------------------------------------------------
// Loja
// ---------------------------------------------------------------------------

export interface CatalogoItem {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  tipo: "PRODUTO" | "SERVICO";
  imagemUrl: string | null;
  disponivel: boolean;
}

export interface PedidoLojaItem {
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface PedidoLoja {
  id: string;
  items: PedidoLojaItem[];
  total: number;
  status: string;
  criadoEm: string;
}

export async function getCatalogoLojaApi(input: {
  tenantId: string;
}): Promise<CatalogoItem[]> {
  return apiRequest<CatalogoItem[]>({
    path: "/api/v1/app-cliente/loja/catalogo",
    query: { tenantId: input.tenantId },
  });
}

export async function listPedidosLojaApi(input: {
  tenantId: string;
}): Promise<PedidoLoja[]> {
  return apiRequest<PedidoLoja[]>({
    path: "/api/v1/app-cliente/loja/pedidos",
    query: { tenantId: input.tenantId },
  });
}

export async function criarPedidoLojaApi(input: {
  tenantId: string;
  items: Array<{ itemId: string; quantidade: number }>;
}): Promise<PedidoLoja> {
  return apiRequest<PedidoLoja>({
    path: "/api/v1/app-cliente/loja/pedidos",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: { items: input.items },
  });
}

export async function getPedidoLojaApi(input: {
  id: string;
  tenantId: string;
}): Promise<PedidoLoja> {
  return apiRequest<PedidoLoja>({
    path: `/api/v1/app-cliente/loja/pedidos/${input.id}`,
    query: { tenantId: input.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Referral
// ---------------------------------------------------------------------------

export interface ReferralIndicacao {
  id: string;
  indicadoNome: string;
  status: string;
  pontosEmitidos: number;
  dataCriacao: string;
}

export interface ReferralInfo {
  campanhaId: string;
  campanhaNome: string;
  pontosIndicacao: number;
  pontosConversao: number;
  shareLink: string;
  indicacoesFeitas: number;
  conversoes: number;
  pontosAcumulados: number;
  indicacoes: ReferralIndicacao[];
}

export async function getReferralInfoApi(input: {
  tenantId: string;
}): Promise<ReferralInfo> {
  return apiRequest<ReferralInfo>({
    path: "/api/v1/app-cliente/referral",
    query: { tenantId: input.tenantId },
  });
}

export async function criarReferralApi(input: {
  tenantId: string;
  indicadoNome: string;
  indicadoEmail?: string;
  indicadoTelefone?: string;
}): Promise<{ id: string; indicadoNome: string; status: string }> {
  return apiRequest<{ id: string; indicadoNome: string; status: string }>({
    path: "/api/v1/app-cliente/referral",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: {
      indicadoNome: input.indicadoNome,
      indicadoEmail: input.indicadoEmail,
      indicadoTelefone: input.indicadoTelefone,
    },
  });
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

export interface RewardsHistoricoItem {
  tipo: string;
  motivo: string;
  pontos: number;
  saldoApos: number;
  data: string;
}

export interface RewardsOpcaoResgate {
  id: string;
  descricao: string;
  pontosNecessarios: number;
}

export interface RewardsWallet {
  saldoPontos: number;
  totalCreditos: number;
  totalDebitos: number;
  historico: RewardsHistoricoItem[];
  opcoesResgate: RewardsOpcaoResgate[] | null;
}

export async function getRewardsWalletApi(input: {
  tenantId: string;
}): Promise<RewardsWallet> {
  return apiRequest<RewardsWallet>({
    path: "/api/v1/app-cliente/rewards",
    query: { tenantId: input.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Campanhas
// ---------------------------------------------------------------------------

export interface CampanhaCliente {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  imagemUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  lida: boolean;
  criadaEm: string;
}

export async function listCampanhasClienteApi(input: {
  tenantId: string;
}): Promise<CampanhaCliente[]> {
  return apiRequest<CampanhaCliente[]>({
    path: "/api/v1/app-cliente/campanhas",
    query: { tenantId: input.tenantId },
  });
}

export async function marcarCampanhaLidaApi(input: {
  id: string;
  tenantId: string;
}): Promise<void> {
  return apiRequest<void>({
    path: `/api/v1/app-cliente/campanhas/${input.id}/lida`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Contratos
// ---------------------------------------------------------------------------

export interface ContratoResumo {
  id: string;
  planoNome: string;
  status: string;
  dataInicio: string;
  dataFim: string | null;
}

export interface ContratoDetalhe extends ContratoResumo {
  valorMensal: number;
  diaVencimento: number;
  formaPagamento: string;
  assinado: boolean;
  assinadoEm: string | null;
}

export interface ContratoPdf {
  url: string;
}

/** GET /api/v1/app-cliente/contratos */
export async function listContratosClienteApi(input: {
  tenantId: string;
}): Promise<ContratoResumo[]> {
  return apiRequest<ContratoResumo[]>({
    path: "/api/v1/app-cliente/contratos",
    query: { tenantId: input.tenantId },
  });
}

/** GET /api/v1/app-cliente/contratos/{id} */
export async function getContratoClienteApi(input: {
  id: string;
  tenantId: string;
}): Promise<ContratoDetalhe> {
  return apiRequest<ContratoDetalhe>({
    path: `/api/v1/app-cliente/contratos/${input.id}`,
    query: { tenantId: input.tenantId },
  });
}

/** GET /api/v1/app-cliente/contratos/{id}/pdf */
export async function getContratoPdfApi(input: {
  id: string;
  tenantId: string;
}): Promise<ContratoPdf> {
  return apiRequest<ContratoPdf>({
    path: `/api/v1/app-cliente/contratos/${input.id}/pdf`,
    query: { tenantId: input.tenantId },
  });
}

/** POST /api/v1/app-cliente/contratos/{id}/otp — Solicita codigo OTP para assinatura */
export async function enviarContratoOtpApi(input: {
  id: string;
  tenantId: string;
}): Promise<{ mensagem: string; expiresInMinutes: number }> {
  return apiRequest<{ mensagem: string; expiresInMinutes: number }>({
    path: `/api/v1/app-cliente/contratos/${input.id}/otp`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

/** POST /api/v1/app-cliente/contratos/{id}/assinaturas — Assina contrato com OTP */
export async function assinarContratoApi(input: {
  id: string;
  tenantId: string;
  codigoOtp: string;
}): Promise<{ assinaturaId: string; assinadoEm: string }> {
  return apiRequest<{ assinaturaId: string; assinadoEm: string }>({
    path: `/api/v1/app-cliente/contratos/${input.id}/assinaturas`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: { codigoOtp: input.codigoOtp },
  });
}

// ---------------------------------------------------------------------------
// Cobrancas
// ---------------------------------------------------------------------------

export interface CobrancaCliente {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
  formaPagamento: string;
}

export interface CobrancaDetalhe extends CobrancaCliente {
  linkPagamento: string | null;
  pixCopiaECola: string | null;
  boletoUrl: string | null;
}

/** GET /api/v1/app-cliente/cobrancas */
export async function listCobrancasClienteApi(input: {
  tenantId: string;
}): Promise<CobrancaCliente[]> {
  return apiRequest<CobrancaCliente[]>({
    path: "/api/v1/app-cliente/cobrancas",
    query: { tenantId: input.tenantId },
  });
}

/** GET /api/v1/app-cliente/cobrancas/{id} */
export async function getCobrancaClienteApi(input: {
  id: string;
  tenantId: string;
}): Promise<CobrancaDetalhe> {
  return apiRequest<CobrancaDetalhe>({
    path: `/api/v1/app-cliente/cobrancas/${input.id}`,
    query: { tenantId: input.tenantId },
  });
}

/** POST /api/v1/app-cliente/cobrancas/{id}/segunda-via */
export async function solicitarSegundaViaApi(input: {
  id: string;
  tenantId: string;
  formaPagamento?: string;
}): Promise<{ link: string; tipo: string }> {
  return apiRequest<{ link: string; tipo: string }>({
    path: `/api/v1/app-cliente/cobrancas/${input.id}/segunda-via`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.formaPagamento ? { formaPagamento: input.formaPagamento } : undefined,
  });
}

// ---------------------------------------------------------------------------
// Financeiro — Inadimplencia
// ---------------------------------------------------------------------------

export interface FinanceiroInadimplencia {
  inadimplente: boolean;
  valorTotal: number;
  contasVencidas: number;
  diasAtraso: number;
  tentativasCobranca: number;
}

/** GET /api/v1/app-cliente/financeiro/inadimplencia */
export async function getInadimplenciaClienteApi(input: {
  tenantId: string;
}): Promise<FinanceiroInadimplencia> {
  return apiRequest<FinanceiroInadimplencia>({
    path: "/api/v1/app-cliente/financeiro/inadimplencia",
    query: { tenantId: input.tenantId },
  });
}

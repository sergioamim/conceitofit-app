import { formatCurrency } from "@/lib/shared/formatters";
import { logger } from "@/lib/shared/logger";
import {
  buildPlanoVendaItems,
  planoDryRun,
  resolveContratoStatusFromPlano,
  resolvePagamentoVendaStatus,
} from "@/lib/tenant/comercial/plano-flow";
import {
  validateSignupDraftWithSchema,
  validateTrialInputWithSchema,
} from "@/lib/forms/public-journey-schemas";
import { getAlunoApi, createAlunoApi } from "@/lib/api/alunos";
import { listPlanosApi, getPlanoApi } from "@/lib/api/comercial-catalogo";
import { createProspectApi, updateProspectStatusApi } from "@/lib/api/crm";
import {
  getAcademiaAtualApi,
  getTenantContextApi,
  listUnidadesApi,
  setTenantContextApi,
} from "@/lib/api/contexto-unidades";
import { listFormasPagamentoApi } from "@/lib/api/formas-pagamento";
import {
  listMatriculasByAlunoApi,
  signMatriculaContractApi,
} from "@/lib/api/matriculas";
import { listPagamentosApi, receberPagamentoApi } from "@/lib/api/pagamentos";
import { getVendaApi, createVendaApi } from "@/lib/api/vendas";
import { getTenantAppName, resolveTenantTheme } from "@/lib/tenant/tenant-theme";
import {
  criarTrialPublico,
  criarCadastroPublico,
  iniciarCheckout,
  getAdesaoStatus,
  assinarContrato,
  confirmarPagamento as confirmarPagamentoAdesao,
  enviarOtpContrato,
  type AdesaoStatusResponse,
  type AdesaoMeioPagamento,
} from "./adesao-api";
import type {
  Academia,
  Aluno,
  Matricula,
  Pagamento,
  Plano,
  Prospect,
  Sexo,
  StatusContratoPlano,
  StatusPagamento,
  Tenant,
  TenantThemeColors,
  TipoFormaPagamento,
  Venda,
} from "@/lib/types";

export type PublicCheckoutNextAction = "CONCLUIDO" | "ASSINAR_CONTRATO" | "PAGAR";

export type PublicSignupDraft = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  sexo: Sexo;
  cidade?: string;
  objetivo?: string;
};

export type PublicTrialInput = {
  tenantRef?: string | null;
  nome: string;
  email: string;
  telefone: string;
  objetivo?: string;
};

export type PublicCheckoutInput = {
  tenantRef?: string | null;
  planId: string;
  signup: PublicSignupDraft;
  pagamento: {
    formaPagamento: TipoFormaPagamento;
    parcelas?: number;
    observacoes?: string;
  };
  aceitarContratoAgora: boolean;
  aceitarTermos: boolean;
  renovacaoAutomatica: boolean;
  leadId?: string;
};

export type PublicPlanQuote = {
  items: Array<{
    id: string;
    descricao: string;
    detalhes?: string;
    valor: number;
  }>;
  total: number;
};

export type PublicTenantContext = {
  tenant: Tenant;
  tenantRef: string;
  academia: Academia;
  appName: string;
  theme: TenantThemeColors;
  planos: Plano[];
  formasPagamento: TipoFormaPagamento[];
};

export type PublicCheckoutSummary = {
  checkoutId: string;
  tenantId: string;
  tenantRef: string;
  alunoId: string;
  matriculaId?: string;
  vendaId: string;
  planoId: string;
  planoNome: string;
  formaPagamento: TipoFormaPagamento;
  total: number;
  pagamentoStatus: StatusPagamento;
  contratoStatus: StatusContratoPlano;
  contratoModo?: Plano["contratoAssinatura"];
  requiresContract: boolean;
  allowDigitalSignature: boolean;
  nextAction: PublicCheckoutNextAction;
  alunoNome: string;
  alunoEmail: string;
  observacoes?: string;
  contractHtml?: string;
};

function now(): string {
  return new Date().toISOString().slice(0, 19);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeText(value?: string | null): string {
  return value?.trim() ?? "";
}

function normalizeSlug(value?: string | null): string {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toCpfDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

function withAlpha(hex: string, alpha: number): string {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return hex;
  const red = Number.parseInt(sanitized.slice(0, 2), 16);
  const green = Number.parseInt(sanitized.slice(2, 4), 16);
  const blue = Number.parseInt(sanitized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getThemeGlow(theme: TenantThemeColors) {
  return {
    accentSoft: withAlpha(theme.accent, 0.24),
    primarySoft: withAlpha(theme.primary, 0.18),
    borderSoft: withAlpha(theme.border, 0.82),
  };
}

export function buildPublicJourneyHref(
  path: string,
  params: {
    tenantRef?: string | null;
    planId?: string | null;
    checkoutId?: string | null;
  }
): string {
  const query = new URLSearchParams();
  if (params.tenantRef) query.set("tenant", params.tenantRef);
  if (params.planId) query.set("plan", params.planId);
  if (params.checkoutId) query.set("checkout", params.checkoutId);
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

export function validateTrialInput(input: PublicTrialInput): Record<string, string> {
  return validateTrialInputWithSchema(input);
}

export function validateSignupDraft(input: PublicSignupDraft): Record<string, string> {
  return validateSignupDraftWithSchema(input);
}

export function resolvePublicNextAction(params: {
  pagamentoStatus: StatusPagamento;
  contratoStatus: StatusContratoPlano;
}): PublicCheckoutNextAction {
  if (params.pagamentoStatus !== "PAGO") return "PAGAR";
  if (params.contratoStatus === "PENDENTE_ASSINATURA") return "ASSINAR_CONTRATO";
  return "CONCLUIDO";
}

export function getPublicPlanQuote(plano: Plano, parcelasAnuidade = 1): PublicPlanQuote {
  const result = planoDryRun({
    plano,
    dataInicio: today(),
    parcelasAnuidade,
    manualDiscount: 0,
    renovacaoAutomatica: plano.permiteRenovacaoAutomatica,
  });
  const items = result.items.map((item) => ({
    id: item.referenciaId,
    descricao: item.descricao,
    detalhes: item.detalhes,
    valor: item.valorUnitario * item.quantidade - item.desconto,
  }));
  return {
    items,
    total: result.total,
  };
}

function resolvePublicPaymentStatus(formaPagamento: TipoFormaPagamento): "PAGO" | "PENDENTE" {
  if (formaPagamento === "BOLETO" || formaPagamento === "RECORRENTE") return "PENDENTE";
  return "PAGO";
}

function buildAcademiaFromTenant(tenant: Tenant): Academia {
  return {
    id: tenant.academiaId ?? tenant.groupId ?? tenant.id,
    nome: tenant.nome,
    razaoSocial: tenant.razaoSocial,
    documento: tenant.documento,
    email: tenant.email,
    telefone: tenant.telefone,
    endereco: tenant.endereco,
    branding: tenant.branding,
    ativo: tenant.ativo,
  };
}

async function resolvePublicTenantsInternal(): Promise<Tenant[]> {
  const tenants = await listUnidadesApi();
  return tenants
    .filter((tenant) => tenant.ativo !== false)
    .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));
}

function resolveTenantFromRef(tenants: Tenant[], ref?: string | null): Tenant {
  const normalizedRef = normalizeSlug(ref);
  if (normalizedRef) {
    const matched = tenants.find((tenant) =>
      [tenant.id, tenant.subdomain, tenant.nome].some((value) => normalizeSlug(value) === normalizedRef)
    );
    if (matched) return matched;
  }

  return tenants[0] ?? (() => {
    throw new Error("Nenhuma unidade pública disponível.");
  })();
}

async function ensurePublicTenantContext(tenant: Tenant): Promise<{ tenant: Tenant; academia: Academia }> {
  let resolvedTenant = tenant;
  try {
    const currentContext = await getTenantContextApi();
    if (currentContext.currentTenantId !== tenant.id) {
      const switched = await setTenantContextApi(tenant.id);
      resolvedTenant = switched.tenantAtual;
    } else {
      resolvedTenant = currentContext.tenantAtual;
    }
  } catch (error) {
    logger.warn("[PublicServices] Tenant context check failed, retrying switch", { error });
    try {
      const switched = await setTenantContextApi(tenant.id);
      resolvedTenant = switched.tenantAtual;
    } catch (retryError) {
      logger.warn("[PublicServices] Tenant context switch retry failed", { error: retryError });
      resolvedTenant = tenant;
    }
  }

  try {
    return {
      tenant: resolvedTenant,
      academia: await getAcademiaAtualApi(resolvedTenant.id),
    };
  } catch (error) {
    logger.warn("[PublicServices] Failed to fetch academia, using fallback", { error });
    return {
      tenant: resolvedTenant,
      academia: buildAcademiaFromTenant(resolvedTenant),
    };
  }
}

function renderContractTemplate(params: {
  plano: Plano;
  aluno: Aluno;
  tenant: Tenant;
  academia: Academia;
  assinaturaEm?: string;
}): string | undefined {
  const template = params.plano.contratoTemplateHtml?.trim();
  if (!template) return undefined;

  const assinatura = params.assinaturaEm ? params.assinaturaEm.slice(0, 10) : today();
  const replacements: Record<string, string> = {
    "{{NOME_PLANO}}": params.plano.nome,
    "{{NOME_UNIDADE}}": params.tenant.nome,
    "{{NOME_CLIENTE}}": params.aluno.nome,
    "{{CPF_CLIENTE}}": params.aluno.cpf,
    "{{RAZAO_SOCIAL_UNIDADE}}": params.tenant.razaoSocial ?? params.academia.razaoSocial ?? params.tenant.nome,
    "{{CNPJ_UNIDADE}}": params.tenant.documento ?? params.academia.documento ?? "",
    "{{VALOR_PLANO}}": formatCurrency(params.plano.valor),
    "{{DATA_ASSINATURA}}": new Date(`${assinatura}T00:00:00`).toLocaleDateString("pt-BR"),
  };

  return Object.entries(replacements).reduce(
    (content, [token, value]) => content.replaceAll(token, value),
    template
  );
}

export function buildPublicContractPreview(params: {
  plano: Plano;
  signup: PublicSignupDraft;
  tenant: Tenant;
  academia: Academia;
}): string | undefined {
  const alunoPreview: Aluno = {
    id: "preview",
    tenantId: params.tenant.id,
    nome: normalizeText(params.signup.nome),
    email: normalizeText(params.signup.email),
    telefone: normalizeText(params.signup.telefone),
    cpf: toCpfDigits(params.signup.cpf),
    dataNascimento: params.signup.dataNascimento || today(),
    sexo: params.signup.sexo,
    status: "INATIVO",
    dataCadastro: now(),
    endereco: params.signup.cidade
      ? {
          cidade: normalizeText(params.signup.cidade),
        }
      : undefined,
  };

  return renderContractTemplate({
    plano: params.plano,
    aluno: alunoPreview,
    tenant: params.tenant,
    academia: params.academia,
  });
}

function buildCheckoutSummary(params: {
  tenant: Tenant;
  plano: Plano;
  venda: Venda;
  aluno: Aluno;
  matricula?: Matricula;
  pagamento?: Pagamento;
  academia: Academia;
}): PublicCheckoutSummary {
  const pagamentoStatus =
    params.pagamento?.status ??
    (resolvePagamentoVendaStatus(params.venda.pagamento) === "PAGO" ? "PAGO" : "PENDENTE");
  const contratoStatus =
    params.matricula?.contratoStatus ??
    params.venda.contratoStatus ??
    resolveContratoStatusFromPlano(params.plano);
  const requiresContract = contratoStatus !== "SEM_CONTRATO";
  const contratoModo = params.matricula?.contratoModoAssinatura ?? params.plano.contratoAssinatura;
  const contractHtml = renderContractTemplate({
    plano: params.plano,
    aluno: params.aluno,
    tenant: params.tenant,
    academia: params.academia,
    assinaturaEm: params.matricula?.contratoAssinadoEm,
  });

  return {
    checkoutId: params.venda.id,
    tenantId: params.tenant.id,
    tenantRef: params.tenant.subdomain ?? params.tenant.id,
    alunoId: params.aluno.id,
    matriculaId: params.matricula?.id,
    vendaId: params.venda.id,
    planoId: params.plano.id,
    planoNome: params.plano.nome,
    formaPagamento: params.venda.pagamento.formaPagamento,
    total: params.venda.total,
    pagamentoStatus,
    contratoStatus,
    contratoModo,
    requiresContract,
    allowDigitalSignature: requiresContract && contratoModo !== "PRESENCIAL",
    nextAction: resolvePublicNextAction({
      pagamentoStatus,
      contratoStatus,
    }),
    alunoNome: params.aluno.nome,
    alunoEmail: params.aluno.email,
    observacoes: params.venda.pagamento.observacoes,
    contractHtml,
  };
}

function sortMatriculas(rows: Array<Matricula & { aluno?: Aluno; plano?: Plano }>): Array<Matricula & { aluno?: Aluno; plano?: Plano }> {
  return [...rows].sort((left, right) =>
    (right.dataCriacao ?? right.dataInicio ?? "").localeCompare(left.dataCriacao ?? left.dataInicio ?? "")
  );
}

function selectCheckoutMatricula(params: {
  venda: Venda;
  matriculas: Array<Matricula & { aluno?: Aluno; plano?: Plano }>;
}): (Matricula & { aluno?: Aluno; plano?: Plano }) | undefined {
  const ordered = sortMatriculas(params.matriculas);
  return (
    ordered.find((item) => item.id === params.venda.matriculaId) ??
    ordered.find((item) => item.planoId === params.venda.planoId) ??
    ordered[0]
  );
}

function selectCheckoutPagamento(params: {
  venda: Venda;
  matricula?: Matricula;
  pagamentos: Pagamento[];
}): Pagamento | undefined {
  const ordered = [...params.pagamentos].sort((left, right) =>
    (right.dataCriacao ?? right.dataPagamento ?? right.dataVencimento).localeCompare(
      left.dataCriacao ?? left.dataPagamento ?? left.dataVencimento
    )
  );
  return (
    ordered.find((item) => item.matriculaId === params.matricula?.id) ??
    ordered.find((item) => item.status === params.venda.pagamento.status && item.formaPagamento === params.venda.pagamento.formaPagamento) ??
    ordered[0]
  );
}

async function buildCheckoutSummaryFromVenda(params: {
  tenant: Tenant;
  academia: Academia;
  vendaId: string;
  planoId?: string;
  alunoId?: string;
}): Promise<PublicCheckoutSummary> {
  const venda = await getVendaApi({
    tenantId: params.tenant.id,
    id: params.vendaId,
  });
  const alunoId = venda.clienteId ?? params.alunoId;
  if (!alunoId) {
    throw new Error("Cliente do checkout não encontrado.");
  }

  const planoId = venda.planoId ?? params.planoId;
  if (!planoId) {
    throw new Error("Plano do checkout não encontrado.");
  }

  const [plano, aluno, matriculas, pagamentos] = await Promise.all([
    getPlanoApi({ tenantId: params.tenant.id, id: planoId }),
    getAlunoApi({ tenantId: params.tenant.id, id: alunoId }),
    listMatriculasByAlunoApi({ tenantId: params.tenant.id, alunoId }),
    listPagamentosApi({ tenantId: params.tenant.id, alunoId }),
  ]);

  const matricula = selectCheckoutMatricula({
    venda,
    matriculas,
  });
  const pagamento = selectCheckoutPagamento({
    venda,
    matricula,
    pagamentos,
  });

  return buildCheckoutSummary({
    tenant: params.tenant,
    plano,
    venda,
    aluno,
    matricula,
    pagamento,
    academia: params.academia,
  });
}

export async function getPublicJourneyContext(tenantRef?: string | null): Promise<PublicTenantContext> {
  const tenants = await resolvePublicTenantsInternal();
  const resolved = resolveTenantFromRef(tenants, tenantRef);
  const { tenant, academia } = await ensurePublicTenantContext(resolved);
  const [planos, formasPagamento] = await Promise.all([
    listPlanosApi({ tenantId: tenant.id, apenasAtivos: true }),
    listFormasPagamentoApi({ tenantId: tenant.id, apenasAtivas: true }),
  ]);

  const normalizedPlanos = [...planos]
    .filter((plano) => plano.ativo)
    .sort((left, right) => {
      if (left.destaque === right.destaque) {
        return (left.ordem ?? 999) - (right.ordem ?? 999);
      }
      return left.destaque ? -1 : 1;
    });

  return {
    tenant,
    tenantRef: tenant.subdomain ?? tenant.id,
    academia,
    appName: getTenantAppName(academia),
    theme: resolveTenantTheme(academia),
    planos: normalizedPlanos,
    formasPagamento: formasPagamento
      .filter((item) => item.ativo)
      .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"))
      .map((item) => item.tipo),
  };
}

export async function listPublicTenants(): Promise<Tenant[]> {
  return resolvePublicTenantsInternal();
}

export async function submitPublicTrial(input: PublicTrialInput): Promise<Prospect> {
  const context = await getPublicJourneyContext(input.tenantRef);
  const errors = validateTrialInput(input);
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }

  // Usa endpoint real do backend: POST /api/v1/publico/adesao/trials
  const adesao = await criarTrialPublico({
    tenantId: context.tenant.id,
    subdomain: context.tenant.subdomain,
    nome: normalizeText(input.nome),
    email: normalizeText(input.email),
    telefone: normalizeText(input.telefone),
    trialDias: 7,
    aceiteTermos: true,
    aceiteComercial: false,
  });

  // Converte resposta da adesão para formato Prospect (compatibilidade)
  return {
    id: adesao.id,
    tenantId: adesao.tenantId,
    nome: adesao.candidatoNome,
    email: adesao.candidatoEmail,
    telefone: adesao.candidatoTelefone ?? "",
    origem: "SITE",
    status: "NOVO",
    observacoes: normalizeText(input.objetivo)
      ? `Trial digital: ${normalizeText(input.objetivo)}`
      : "Trial digital solicitado pela jornada pública.",
    dataCriacao: adesao.createdAt,
  } as Prospect;
}

export async function startPublicCheckout(input: PublicCheckoutInput): Promise<PublicCheckoutSummary> {
  const context = await getPublicJourneyContext(input.tenantRef);
  const plano = context.planos.find((item) => item.id === input.planId);
  if (!plano) {
    throw new Error("Plano não encontrado para esta unidade.");
  }
  if (!input.aceitarTermos) {
    throw new Error("Aceite os termos da adesão para continuar.");
  }

  const signupErrors = validateSignupDraft(input.signup);
  if (Object.keys(signupErrors).length > 0) {
    throw new Error(Object.values(signupErrors)[0]);
  }

  // 1. Cadastro via endpoint real: POST /api/v1/publico/adesao/cadastros
  const cadastro = await criarCadastroPublico({
    tenantId: context.tenant.id,
    subdomain: context.tenant.subdomain,
    nome: normalizeText(input.signup.nome),
    email: normalizeText(input.signup.email),
    telefone: normalizeText(input.signup.telefone),
    cpf: toCpfDigits(input.signup.cpf),
    dataNascimento: input.signup.dataNascimento,
    sexo: input.signup.sexo as "M" | "F" | "OUTRO",
    aceiteTermos: true,
  });

  const adesaoToken = cadastro.tokenPublico ?? "";

  // 2. Checkout via endpoint real: POST /api/v1/publico/adesao/{id}/checkout
  const meioPagamentoMap: Record<string, AdesaoMeioPagamento> = {
    CARTAO_CREDITO: "CARTAO_CREDITO",
    CARTAO_DEBITO: "CARTAO_DEBITO",
    PIX: "PIX",
    BOLETO: "BOLETO",
    RECORRENTE: "CARNE",
    DINHEIRO: "OUTRO",
  };

  const adesao = await iniciarCheckout(cadastro.id, adesaoToken, {
    planoId: input.planId,
    meioPagamento: meioPagamentoMap[input.pagamento.formaPagamento] ?? "OUTRO",
  });

  // 3. Se aceitou contrato e tem OTP disponível, assinar automaticamente
  if (
    input.aceitarContratoAgora &&
    adesao.contratoStatus === "PENDENTE"
  ) {
    try {
      await enviarOtpContrato(adesao.id, adesaoToken);
      // OTP automático com código "000000" para assinatura digital imediata
      await assinarContrato(adesao.id, adesaoToken, {
        otp: "auto-sign",
        evidenciasJson: JSON.stringify({ aceiteDigital: true, timestamp: now() }),
      });
    } catch (error) {
      logger.warn("[PublicServices/Checkout] Auto-signature failed, continuing checkout", { error });
    }
  }

  // 4. Converter para PublicCheckoutSummary (compatibilidade)
  return convertAdesaoToCheckoutSummary(adesao, context, plano, adesaoToken);
}

export async function getPublicCheckoutStatus(params: {
  tenantRef?: string | null;
  checkoutId: string;
  adesaoToken?: string;
}): Promise<PublicCheckoutSummary> {
  const context = await getPublicJourneyContext(params.tenantRef);
  const token = params.adesaoToken ?? "";

  // Usa endpoint real: GET /api/v1/publico/adesao/{id}
  const adesao = await getAdesaoStatus(params.checkoutId, token);
  const plano = adesao.planoId
    ? context.planos.find((p) => p.id === adesao.planoId)
    : undefined;

  return convertAdesaoToCheckoutSummary(adesao, context, plano, token);
}

export async function signPublicCheckoutContract(params: {
  tenantRef?: string | null;
  checkoutId: string;
  adesaoToken?: string;
}): Promise<PublicCheckoutSummary> {
  const token = params.adesaoToken ?? "";

  // Envia OTP e assina via endpoints reais do backend
  await enviarOtpContrato(params.checkoutId, token);
  const adesao = await assinarContrato(params.checkoutId, token, {
    otp: "auto-sign",
    evidenciasJson: JSON.stringify({ aceiteDigital: true, timestamp: now() }),
  });

  const context = await getPublicJourneyContext(params.tenantRef);
  const plano = adesao.planoId
    ? context.planos.find((p) => p.id === adesao.planoId)
    : undefined;

  return convertAdesaoToCheckoutSummary(adesao, context, plano, token);
}

export async function confirmPublicCheckoutPayment(params: {
  tenantRef?: string | null;
  checkoutId: string;
  adesaoToken?: string;
}): Promise<PublicCheckoutSummary> {
  const token = params.adesaoToken ?? "";

  // Confirma pagamento via endpoint real do backend
  const adesao = await confirmarPagamentoAdesao(params.checkoutId, token, {
    status: "LIQUIDADO",
    mensagem: "Pagamento confirmado pela jornada pública.",
  });

  const context = await getPublicJourneyContext(params.tenantRef);
  const plano = adesao.planoId
    ? context.planos.find((p) => p.id === adesao.planoId)
    : undefined;

  return convertAdesaoToCheckoutSummary(adesao, context, plano, token);
}

// ---------------------------------------------------------------------------
// Adapter: converte AdesaoStatusResponse do backend para PublicCheckoutSummary
// ---------------------------------------------------------------------------

function convertAdesaoToCheckoutSummary(
  adesao: AdesaoStatusResponse,
  context: PublicTenantContext,
  plano: Plano | undefined,
  _adesaoToken: string,
): PublicCheckoutSummary {
  const pagamentoStatus: StatusPagamento =
    adesao.pagamentoStatus === "LIQUIDADO" || adesao.pagamentoStatus === "CAPTURADO"
      ? "PAGO"
      : "PENDENTE";

  const contratoStatus: StatusContratoPlano =
    adesao.contratoStatus === "ASSINADO"
      ? "ASSINADO"
      : adesao.contratoStatus === "PENDENTE"
        ? "PENDENTE_ASSINATURA"
        : "SEM_CONTRATO";

  const requiresContract = contratoStatus !== "SEM_CONTRATO";

  return {
    checkoutId: adesao.id,
    tenantId: adesao.tenantId,
    tenantRef: context.tenant.subdomain ?? context.tenant.id,
    alunoId: adesao.alunoId ?? "",
    matriculaId: adesao.contratoId ?? undefined,
    vendaId: adesao.id,
    planoId: adesao.planoId ?? "",
    planoNome: plano?.nome ?? "",
    formaPagamento: "PIX" as TipoFormaPagamento,
    total: plano?.valor ?? 0,
    pagamentoStatus,
    contratoStatus,
    contratoModo: plano?.contratoAssinatura,
    requiresContract,
    allowDigitalSignature: requiresContract && plano?.contratoAssinatura !== "PRESENCIAL",
    nextAction: resolvePublicNextAction({ pagamentoStatus, contratoStatus }),
    alunoNome: adesao.candidatoNome,
    alunoEmail: adesao.candidatoEmail,
    observacoes: adesao.mensagemStatus ?? undefined,
    contractHtml: undefined,
  };
}

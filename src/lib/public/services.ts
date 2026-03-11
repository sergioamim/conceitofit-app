import {
  buildPlanoVendaItems,
  resolveContratoStatusFromPlano,
  resolvePagamentoVendaStatus,
} from "@/lib/comercial/plano-flow";
import { getStore, setStore } from "@/lib/mock/store";
import {
  createProspect,
  createVenda,
  criarAluno,
  listTenantsGlobal,
  registrarAssinaturaMatricula,
  updateProspectStatus,
} from "@/lib/mock/services";
import { getTenantAppName, resolveTenantTheme } from "@/lib/tenant-theme";
import type {
  Academia,
  Aluno,
  Matricula,
  Pagamento,
  PagamentoVenda,
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

function genId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

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

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
  const errors: Record<string, string> = {};
  if (normalizeText(input.nome).length < 3) errors.nome = "Informe o nome completo.";
  if (!normalizeText(input.email).includes("@")) errors.email = "Informe um e-mail válido.";
  if (input.telefone.replace(/\D/g, "").length < 10) errors.telefone = "Informe um telefone válido.";
  return errors;
}

export function validateSignupDraft(input: PublicSignupDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (normalizeText(input.nome).length < 3) errors.nome = "Informe o nome completo.";
  if (!normalizeText(input.email).includes("@")) errors.email = "Informe um e-mail válido.";
  if (input.telefone.replace(/\D/g, "").length < 10) errors.telefone = "Informe um telefone válido.";
  if (toCpfDigits(input.cpf).length !== 11) errors.cpf = "CPF deve conter 11 dígitos.";
  if (!input.dataNascimento) errors.dataNascimento = "Informe a data de nascimento.";
  return errors;
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
  const items = buildPlanoVendaItems(plano, parcelasAnuidade).map((item) => ({
    id: item.referenciaId,
    descricao: item.descricao,
    detalhes: item.detalhes,
    valor: item.valorUnitario * item.quantidade - item.desconto,
  }));
  return {
    items,
    total: items.reduce((sum, item) => sum + item.valor, 0),
  };
}

function resolvePublicPaymentStatus(formaPagamento: TipoFormaPagamento): "PAGO" | "PENDENTE" {
  if (formaPagamento === "BOLETO" || formaPagamento === "RECORRENTE") return "PENDENTE";
  return "PAGO";
}

function resolveTenantFromRef(ref?: string | null): Tenant {
  const store = getStore();
  const tenants = store.tenants.filter((tenant) => tenant.ativo !== false);
  const normalizedRef = normalizeSlug(ref);

  if (normalizedRef) {
    const matched = tenants.find((tenant) => {
      return [tenant.id, tenant.subdomain, tenant.nome].some((value) => normalizeSlug(value) === normalizedRef);
    });
    if (matched) return matched;
  }

  return tenants.find((tenant) => tenant.id === store.currentTenantId) ?? store.tenant ?? tenants[0];
}

function resolveAcademiaForTenant(tenant: Tenant): Academia {
  const store = getStore();
  const academiaId = tenant.academiaId ?? tenant.groupId;
  return (
    store.academias.find((academia) => academia.id === academiaId) ??
    store.academias[0] ?? {
      id: "acd-default",
      nome: "Academia",
      ativo: true,
    }
  );
}

async function withTenantScope<T>(tenantId: string, action: () => Promise<T>): Promise<T> {
  const snapshot = getStore();
  const previousTenantId = snapshot.currentTenantId || snapshot.tenant?.id || tenantId;
  const previousTenant = snapshot.tenants.find((tenant) => tenant.id === previousTenantId) ?? snapshot.tenant;
  const targetTenant = snapshot.tenants.find((tenant) => tenant.id === tenantId);
  if (!targetTenant) throw new Error("Tenant público não encontrado.");

  const shouldSwitch = previousTenantId !== tenantId || snapshot.tenant?.id !== tenantId;

  if (shouldSwitch) {
    setStore((store) => ({
      ...store,
      currentTenantId: tenantId,
      tenant: targetTenant,
    }));
  }

  try {
    return await action();
  } finally {
    if (shouldSwitch && previousTenant) {
      setStore((store) => ({
        ...store,
        currentTenantId: previousTenantId,
        tenant: store.tenants.find((tenant) => tenant.id === previousTenantId) ?? previousTenant,
      }));
    }
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
  const pagamentoStatus = params.pagamento?.status ?? (resolvePagamentoVendaStatus(params.venda.pagamento) === "PAGO" ? "PAGO" : "PENDENTE");
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

export async function getPublicJourneyContext(tenantRef?: string | null): Promise<PublicTenantContext> {
  const tenant = resolveTenantFromRef(tenantRef);
  const academia = resolveAcademiaForTenant(tenant);
  const store = getStore();
  const planos = [...store.planos]
    .filter((plano) => plano.tenantId === tenant.id && plano.ativo)
    .sort((left, right) => {
      if (left.destaque === right.destaque) {
        return (left.ordem ?? 999) - (right.ordem ?? 999);
      }
      return left.destaque ? -1 : 1;
    });
  const formasPagamento = [...store.formasPagamento]
    .filter((item) => item.tenantId === tenant.id && item.ativo)
    .sort((left, right) => left.nome.localeCompare(right.nome))
    .map((item) => item.tipo);

  return {
    tenant,
    tenantRef: tenant.subdomain ?? tenant.id,
    academia,
    appName: getTenantAppName(academia),
    theme: resolveTenantTheme(academia),
    planos,
    formasPagamento,
  };
}

export async function listPublicTenants(): Promise<Tenant[]> {
  const items = await listTenantsGlobal();
  return items.filter((tenant) => tenant.ativo !== false);
}

export async function submitPublicTrial(input: PublicTrialInput): Promise<Prospect> {
  const context = await getPublicJourneyContext(input.tenantRef);
  const errors = validateTrialInput(input);
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }

  return withTenantScope(context.tenant.id, async () => {
    return createProspect({
      nome: normalizeText(input.nome),
      email: normalizeText(input.email),
      telefone: normalizeText(input.telefone),
      origem: "SITE",
      observacoes: normalizeText(input.objetivo)
        ? `Trial digital: ${normalizeText(input.objetivo)}`
        : "Trial digital solicitado pela jornada pública.",
    });
  });
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

  return withTenantScope(context.tenant.id, async () => {
    const quote = getPublicPlanQuote(plano);
    const paymentStatus = resolvePublicPaymentStatus(input.pagamento.formaPagamento);

    const aluno = await criarAluno({
      nome: normalizeText(input.signup.nome),
      email: normalizeText(input.signup.email),
      telefone: normalizeText(input.signup.telefone),
      cpf: toCpfDigits(input.signup.cpf),
      dataNascimento: input.signup.dataNascimento,
      sexo: input.signup.sexo,
      endereco: input.signup.cidade
        ? {
            cidade: normalizeText(input.signup.cidade),
          }
        : undefined,
      observacoesMedicas: normalizeText(input.signup.objetivo) || undefined,
    });

    const venda = await createVenda({
      tipo: "PLANO",
      clienteId: aluno.id,
      itens: buildPlanoVendaItems(plano, 1),
      descontoTotal: 0,
      acrescimoTotal: 0,
      pagamento: {
        formaPagamento: input.pagamento.formaPagamento,
        parcelas: input.pagamento.parcelas,
        valorPago: paymentStatus === "PAGO" ? quote.total : 0,
        status: paymentStatus,
        observacoes: input.pagamento.observacoes,
      },
      planoContexto: {
        planoId: plano.id,
        dataInicio: today(),
        renovacaoAutomatica: input.renovacaoAutomatica && plano.permiteRenovacaoAutomatica,
      },
    });

    if (input.leadId) {
      await updateProspectStatus(input.leadId, "CONVERTIDO");
    }

    let matricula = getStore().matriculas.find((item) => item.id === venda.matriculaId);
    if (input.aceitarContratoAgora && matricula?.id && plano.contratoTemplateHtml?.trim() && plano.contratoAssinatura !== "PRESENCIAL") {
      await registrarAssinaturaMatricula(matricula.id);
      matricula = getStore().matriculas.find((item) => item.id === matricula?.id);
    }

    setStore((store) => ({
      ...store,
      alunos: store.alunos.map((item) =>
        item.id === aluno.id
          ? {
              ...item,
              prospectId: input.leadId ?? item.prospectId,
              pendenteComplementacao: false,
              status: paymentStatus === "PAGO" ? "ATIVO" : "INATIVO",
              dataAtualizacao: now(),
            }
          : item
      ),
    }));

    const currentStore = getStore();
    const persistedAluno = currentStore.alunos.find((item) => item.id === aluno.id) ?? aluno;
    const persistedVenda = currentStore.vendas.find((item) => item.id === venda.id) ?? venda;
    const persistedMatricula = persistedVenda.matriculaId
      ? currentStore.matriculas.find((item) => item.id === persistedVenda.matriculaId)
      : undefined;
    const pagamento = persistedVenda.matriculaId
      ? currentStore.pagamentos.find((item) => item.matriculaId === persistedVenda.matriculaId)
      : undefined;

    return buildCheckoutSummary({
      tenant: context.tenant,
      plano,
      venda: persistedVenda,
      aluno: persistedAluno,
      matricula: persistedMatricula,
      pagamento,
      academia: context.academia,
    });
  });
}

export async function getPublicCheckoutStatus(params: {
  tenantRef?: string | null;
  checkoutId: string;
}): Promise<PublicCheckoutSummary> {
  const context = await getPublicJourneyContext(params.tenantRef);
  const store = getStore();
  const venda = store.vendas.find((item) => item.id === params.checkoutId && item.tenantId === context.tenant.id);
  if (!venda) {
    throw new Error("Checkout público não encontrado.");
  }

  const plano = store.planos.find((item) => item.id === venda.planoId && item.tenantId === context.tenant.id);
  if (!plano) {
    throw new Error("Plano do checkout não encontrado.");
  }

  const aluno = store.alunos.find((item) => item.id === venda.clienteId && item.tenantId === context.tenant.id);
  if (!aluno) {
    throw new Error("Cliente do checkout não encontrado.");
  }

  const matricula = venda.matriculaId
    ? store.matriculas.find((item) => item.id === venda.matriculaId && item.tenantId === context.tenant.id)
    : undefined;
  const pagamento = matricula
    ? store.pagamentos.find((item) => item.matriculaId === matricula.id && item.tenantId === context.tenant.id)
    : undefined;

  return buildCheckoutSummary({
    tenant: context.tenant,
    plano,
    venda,
    aluno,
    matricula,
    pagamento,
    academia: context.academia,
  });
}

export async function signPublicCheckoutContract(params: {
  tenantRef?: string | null;
  checkoutId: string;
}): Promise<PublicCheckoutSummary> {
  const summary = await getPublicCheckoutStatus(params);
  if (!summary.matriculaId) {
    throw new Error("Contrato não disponível para assinatura.");
  }
  if (!summary.allowDigitalSignature) {
    throw new Error("Este contrato exige assinatura presencial.");
  }

  const context = await getPublicJourneyContext(params.tenantRef);
  await withTenantScope(context.tenant.id, async () => {
    await registrarAssinaturaMatricula(summary.matriculaId as string);
  });
  return getPublicCheckoutStatus(params);
}

export async function confirmPublicCheckoutPayment(params: {
  tenantRef?: string | null;
  checkoutId: string;
}): Promise<PublicCheckoutSummary> {
  const summary = await getPublicCheckoutStatus(params);
  const context = await getPublicJourneyContext(params.tenantRef);
  const paidAt = today();

  await withTenantScope(context.tenant.id, async () => {
    setStore((store) => ({
      ...store,
      vendas: store.vendas.map((item) =>
        item.id === summary.vendaId
          ? {
              ...item,
              pagamento: {
                ...item.pagamento,
                status: "PAGO",
                valorPago: item.total,
              },
            }
          : item
      ),
      pagamentos: store.pagamentos.map((item) =>
        item.matriculaId === summary.matriculaId
          ? {
              ...item,
              status: "PAGO",
              dataPagamento: paidAt,
              formaPagamento: summary.formaPagamento,
            }
          : item
      ),
      alunos: store.alunos.map((item) =>
        item.id === summary.alunoId
          ? {
              ...item,
              status: "ATIVO",
              dataAtualizacao: now(),
            }
          : item
      ),
    }));
  });

  return getPublicCheckoutStatus(params);
}

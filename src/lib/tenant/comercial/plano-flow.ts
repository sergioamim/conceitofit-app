import { formatBRL } from "@/lib/formatters";
import type {
  Contrato,
  Convenio,
  Pagamento,
  PagamentoResumo,
  PagamentoVenda,
  Plano,
  StatusContratoPlano,
  StatusFluxoComercial,
  TipoFormaPagamento,
} from "@/lib/types";

export type PlanoVendaItemDraft = {
  tipo: "PLANO";
  referenciaId: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  detalhes?: string;
};

export interface PlanoDryRunResult {
  items: PlanoVendaItemDraft[];
  subtotal: number;
  descontoConvenio: number;
  descontoCupom: number;
  descontoManual: number;
  descontoTotal: number;
  total: number;
  planoContexto: {
    planoId: string;
    dataInicio: string;
    descontoPlano: number;
    motivoDesconto?: string;
    renovacaoAutomatica: boolean;
    convenioId?: string;
  };
}

export interface PlanoDryRunParams {
  plano: Plano;
  dataInicio: string;
  parcelasAnuidade: number;
  manualDiscount: number;
  motivoDesconto?: string;
  couponPercent?: number;
  convenio?: Convenio;
  /**
   * Forma de pagamento escolhida no checkout. Quando presente, habilita a
   * filtragem por `convenio.formasPagamentoPermitidas`: se o convênio está
   * restrito a formas específicas e a forma atual não está na lista, o
   * desconto é zerado. Quando ausente (undefined), nenhum filtro é aplicado
   * — mantém retrocompat com callers antigos.
   */
  formaPagamento?: TipoFormaPagamento;
  renovacaoAutomatica: boolean;
  isentarMatricula?: boolean;
}

/**
 * Cálculo do desconto de convênio respeitando `tipoDesconto` e o filtro
 * opcional por forma de pagamento. Exportado para consumo direto no
 * checkout quando a forma ainda não está resolvida mas a eligibilidade
 * precisa ser avaliada (ex.: destacar/ocultar convênio na dropdown).
 */
export function calcularDescontoConvenio(
  plano: Plano,
  convenio: Convenio | undefined,
  formaPagamento?: TipoFormaPagamento,
): number {
  if (!convenio || !convenio.ativo) return 0;

  // Filtro de forma de pagamento quando aplicável
  if (
    formaPagamento !== undefined &&
    convenio.formasPagamentoPermitidas &&
    convenio.formasPagamentoPermitidas.length > 0 &&
    !convenio.formasPagamentoPermitidas.includes(formaPagamento)
  ) {
    return 0;
  }

  const valorPlano = Number(plano.valor ?? 0);

  if (convenio.tipoDesconto === "VALOR_FIXO") {
    const descontoFixo = Number(convenio.descontoValor ?? 0);
    return Math.min(Math.max(0, descontoFixo), valorPlano);
  }

  // PERCENTUAL (default retrocompat)
  const pct = Number(convenio.descontoPercentual ?? 0);
  return (valorPlano * pct) / 100;
}

export const STATUS_CONTRATO_LABEL: Record<StatusContratoPlano, string> = {
  SEM_CONTRATO: "Sem contrato",
  PENDENTE_ASSINATURA: "Pendente assinatura",
  ASSINADO: "Assinado",
};

export const STATUS_FLUXO_COMERCIAL_LABEL: Record<StatusFluxoComercial, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  AGUARDANDO_ASSINATURA: "Aguardando assinatura",
  ATIVO: "Ativo",
  CANCELADO: "Cancelado",
  VENCIDO: "Vencido",
};

export function buildPlanoVendaItems(plano: Plano, parcelasAnuidade: number, options?: { isentarMatricula?: boolean }): PlanoVendaItemDraft[] {
  const items: PlanoVendaItemDraft[] = [
    {
      tipo: "PLANO",
      referenciaId: plano.id,
      descricao: `Plano: ${plano.nome}`,
      quantidade: 1,
      valorUnitario: Number(plano.valor ?? 0),
      desconto: 0,
    },
  ];

  if (Number(plano.valorMatricula ?? 0) > 0 && !options?.isentarMatricula) {
    items.push({
      tipo: "PLANO",
      referenciaId: `${plano.id}:matricula`,
      descricao: `Matrícula: ${plano.nome}`,
      quantidade: 1,
      valorUnitario: Number(plano.valorMatricula ?? 0),
      desconto: 0,
      detalhes: "Cobrança única",
    });
  }

  const cobraAnuidade = Boolean(plano.cobraAnuidade);
  const valorAnuidade = Number(plano.valorAnuidade ?? 0);
  if (cobraAnuidade && valorAnuidade > 0) {
    const parcelas = Math.max(1, parcelasAnuidade || 1);
    items.push({
      tipo: "PLANO",
      referenciaId: `${plano.id}:anuidade`,
      descricao: `Anuidade: ${plano.nome}`,
      quantidade: 1,
      valorUnitario: valorAnuidade,
      desconto: 0,
      detalhes: `${parcelas}x de ${formatBRL(valorAnuidade / parcelas)}`,
    });
  }

  return items;
}

/**
 * Realiza o cálculo centralizado de uma venda de plano (Dry-Run).
 * Garante que Nova Venda, Wizard e Modal usem a mesma regra de negócio.
 */
export function planoDryRun(params: PlanoDryRunParams): PlanoDryRunResult {
  const {
    plano,
    dataInicio,
    parcelasAnuidade,
    manualDiscount,
    motivoDesconto,
    couponPercent = 0,
    convenio,
    formaPagamento,
    renovacaoAutomatica,
    isentarMatricula = false,
  } = params;

  // 1. Gerar itens base (Plano + Matrícula + Anuidade)
  const items = buildPlanoVendaItems(plano, parcelasAnuidade, { isentarMatricula });
  const subtotal = items.reduce((sum, item) => sum + item.valorUnitario * item.quantidade, 0);

  // 2. Calcular descontos
  // Desconto de convênio: respeita tipoDesconto (PERCENTUAL/VALOR_FIXO) e
  // filtro por forma de pagamento quando informada.
  const descontoConvenio = calcularDescontoConvenio(plano, convenio, formaPagamento);

  // Desconto de cupom aplica sobre o valor do plano
  const descontoCupom = (Number(plano.valor ?? 0) * couponPercent) / 100;

  // Desconto manual (valor fixo informado)
  const descontoManual = Math.max(0, manualDiscount);

  const descontoTotal = descontoConvenio + descontoCupom + descontoManual;
  const total = Math.max(0, subtotal - descontoTotal);

  return {
    items,
    subtotal,
    descontoConvenio,
    descontoCupom,
    descontoManual,
    descontoTotal,
    total,
    planoContexto: {
      planoId: plano.id,
      dataInicio,
      descontoPlano: descontoManual + descontoCupom, // Unificamos descontos no plano
      motivoDesconto,
      renovacaoAutomatica,
      convenioId: convenio?.id,
    },
  };
}

function resolvePlanoIdFromVendaItems(
  items: Array<{ tipo: string; referenciaId: string }>
): string | undefined {
  const planoItem = items.find((item) => item.tipo === "PLANO");
  if (!planoItem?.referenciaId) return undefined;
  return planoItem.referenciaId.split(":")[0];
}

export function resolvePagamentoVendaStatus(
  pagamento: Pick<PagamentoVenda, "status" | "valorPago"> | null | undefined
): "PAGO" | "PENDENTE" {
  if (pagamento?.status === "PENDENTE") return "PENDENTE";
  if (pagamento?.status === "PAGO") return "PAGO";
  return Number(pagamento?.valorPago ?? 0) > 0 ? "PAGO" : "PENDENTE";
}

export function resolveContratoStatusFromPlano(
  plano: Plano | null | undefined,
  override?: StatusContratoPlano
): StatusContratoPlano {
  if (override) return override;
  return plano?.contratoTemplateHtml?.trim() ? "PENDENTE_ASSINATURA" : "SEM_CONTRATO";
}

export function resolveFluxoComercialStatus(params: {
  matricula?: Contrato | null;
  pagamento?: Pagamento | PagamentoResumo | null;
  plano?: Plano | null;
}): StatusFluxoComercial | undefined {
  const { matricula, pagamento, plano } = params;
  if (!matricula) return undefined;
  if (matricula.status === "CANCELADA") return "CANCELADO";
  if (matricula.status === "VENCIDA") return "VENCIDO";

  const pagamentoStatus = pagamento?.status ?? "PENDENTE";
  if (pagamentoStatus !== "PAGO") return "AGUARDANDO_PAGAMENTO";

  const contratoStatus = resolveContratoStatusFromPlano(plano, matricula.contratoStatus);
  if (contratoStatus === "PENDENTE_ASSINATURA") return "AGUARDANDO_ASSINATURA";
  return "ATIVO";
}

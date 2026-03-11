import type {
  Matricula,
  Pagamento,
  PagamentoVenda,
  Plano,
  StatusContratoPlano,
  StatusFluxoComercial,
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

function formatBRL(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildPlanoVendaItems(plano: Plano, parcelasAnuidade: number): PlanoVendaItemDraft[] {
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

  if (Number(plano.valorMatricula ?? 0) > 0) {
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

export function resolvePlanoIdFromVendaItems(
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
  matricula?: Matricula | null;
  pagamento?: Pagamento | null;
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

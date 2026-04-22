import type {
  Aluno,
  Contrato,
  LocalDate,
  LocalDateTime,
  Plano,
  StatusContratoPlano,
  StatusFluxoComercial,
  TipoFormaPagamento,
  UUID,
  Venda,
} from "@/lib/types";
import { resolveFluxoComercialStatus, resolveContratoStatusFromPlano } from "./plano-flow";

/**
 * Representação unificada (view) de um contrato/assinatura de plano.
 * Normaliza dados vindos de Matricula e de Venda (tipo PLANO)
 * para que a UI trate ambas as origens de forma consistente.
 *
 * NOTA: originalmente chamada `Contrato`, renomeada para `ContratoView`
 * para permitir que `Matricula` seja renomeada para `Contrato` (conceito
 * canônico de domínio). Avaliar descontinuar esta view em iteração futura.
 */
export interface ContratoView {
  id: UUID;
  tenantId: UUID;
  alunoId: UUID;
  planoId: UUID;
  aluno?: Aluno;
  plano?: Plano;
  dataInicioContrato: LocalDate;
  dataFimContrato?: LocalDate;
  valorContratado: number;
  desconto: number;
  formaPagamento?: TipoFormaPagamento;
  contratoStatus: StatusContratoPlano;
  fluxoStatus?: StatusFluxoComercial;
  renovacaoAutomatica: boolean;
  origemVendaId?: UUID;
  matriculaId?: UUID;
  dataCriacao: LocalDateTime;
  origem: "MATRICULA" | "VENDA";
}

/**
 * Normaliza um Contrato (fka Matricula) em ContratoView.
 */
export function contratoViewFromMatricula(
  contrato: Contrato & { aluno?: Aluno; plano?: Plano }
): ContratoView {
  const contratoStatus = resolveContratoStatusFromPlano(
    contrato.plano,
    contrato.contratoStatus
  );
  const fluxoStatus = resolveFluxoComercialStatus({
    matricula: contrato,
    pagamento: contrato.pagamento,
    plano: contrato.plano,
  });

  return {
    id: contrato.id,
    tenantId: contrato.tenantId,
    alunoId: contrato.alunoId,
    planoId: contrato.planoId,
    aluno: contrato.aluno,
    plano: contrato.plano,
    dataInicioContrato: contrato.dataInicio,
    dataFimContrato: contrato.dataFim,
    valorContratado: contrato.valorPago,
    desconto: contrato.desconto,
    formaPagamento: contrato.formaPagamento,
    contratoStatus,
    fluxoStatus,
    renovacaoAutomatica: contrato.renovacaoAutomatica,
    origemVendaId: contrato.origemVendaId,
    matriculaId: contrato.id,
    dataCriacao: contrato.dataCriacao,
    origem: "MATRICULA",
  };
}

/**
 * Normaliza uma Venda de tipo PLANO em ContratoView.
 * Vendas de tipo SERVICO/PRODUTO não representam contratos.
 */
function contratoViewFromVenda(
  venda: Venda,
  aluno?: Aluno | null,
  plano?: Plano | null
): ContratoView | null {
  if (venda.tipo !== "PLANO") return null;

  const contratoStatus: StatusContratoPlano =
    venda.contratoStatus ?? resolveContratoStatusFromPlano(plano);

  let fluxoStatus: StatusFluxoComercial | undefined;
  if (venda.status === "CANCELADA") {
    fluxoStatus = "CANCELADO";
  } else if (
    venda.pagamento.status === "PENDENTE" ||
    Number(venda.pagamento.valorPago ?? 0) <= 0
  ) {
    fluxoStatus = "AGUARDANDO_PAGAMENTO";
  } else if (contratoStatus === "PENDENTE_ASSINATURA") {
    fluxoStatus = "AGUARDANDO_ASSINATURA";
  } else {
    fluxoStatus = "ATIVO";
  }

  return {
    id: venda.id,
    tenantId: venda.tenantId,
    alunoId: venda.clienteId ?? "",
    planoId: venda.planoId ?? "",
    aluno: aluno ?? undefined,
    plano: plano ?? undefined,
    dataInicioContrato: venda.dataInicioContrato ?? "",
    dataFimContrato: venda.dataFimContrato,
    valorContratado: venda.total,
    desconto: venda.descontoTotal,
    formaPagamento: venda.pagamento.formaPagamento,
    contratoStatus,
    fluxoStatus,
    renovacaoAutomatica: false,
    origemVendaId: venda.id,
    matriculaId: venda.matriculaId,
    dataCriacao: venda.dataCriacao,
    origem: "VENDA",
  };
}

/**
 * Verifica se uma venda representa um contrato de plano.
 */
function isVendaContrato(venda: Venda): boolean {
  return venda.tipo === "PLANO";
}

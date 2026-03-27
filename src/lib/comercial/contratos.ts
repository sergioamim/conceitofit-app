import type {
  Aluno,
  LocalDate,
  LocalDateTime,
  Matricula,
  Plano,
  StatusContratoPlano,
  StatusFluxoComercial,
  TipoFormaPagamento,
  UUID,
  Venda,
} from "@/lib/types";
import { resolveFluxoComercialStatus, resolveContratoStatusFromPlano } from "./plano-flow";

/**
 * Representação unificada de um contrato/assinatura de plano.
 * Normaliza dados vindos de Matricula e de Venda (tipo PLANO)
 * para que a UI trate ambas as origens de forma consistente.
 */
export interface Contrato {
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
 * Normaliza uma Matricula em Contrato.
 */
export function contratoFromMatricula(
  matricula: Matricula & { aluno?: Aluno; plano?: Plano }
): Contrato {
  const contratoStatus = resolveContratoStatusFromPlano(
    matricula.plano,
    matricula.contratoStatus
  );
  const fluxoStatus = resolveFluxoComercialStatus({
    matricula,
    pagamento: matricula.pagamento,
    plano: matricula.plano,
  });

  return {
    id: matricula.id,
    tenantId: matricula.tenantId,
    alunoId: matricula.alunoId,
    planoId: matricula.planoId,
    aluno: matricula.aluno,
    plano: matricula.plano,
    dataInicioContrato: matricula.dataInicio,
    dataFimContrato: matricula.dataFim,
    valorContratado: matricula.valorPago,
    desconto: matricula.desconto,
    formaPagamento: matricula.formaPagamento,
    contratoStatus,
    fluxoStatus,
    renovacaoAutomatica: matricula.renovacaoAutomatica,
    origemVendaId: matricula.origemVendaId,
    matriculaId: matricula.id,
    dataCriacao: matricula.dataCriacao,
    origem: "MATRICULA",
  };
}

/**
 * Normaliza uma Venda de tipo PLANO em Contrato.
 * Vendas de tipo SERVICO/PRODUTO não representam contratos.
 */
export function contratoFromVenda(
  venda: Venda,
  aluno?: Aluno | null,
  plano?: Plano | null
): Contrato | null {
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
export function isVendaContrato(venda: Venda): boolean {
  return venda.tipo === "PLANO";
}

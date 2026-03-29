"use client";

import {
  cancelarContaPagarApi,
  createContaPagarApi,
  pagarContaPagarApi,
  updateContaPagarApi,
} from "@/lib/api/financeiro-gerencial";
import { getBusinessTodayIso } from "@/lib/business-date";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { ContaPagar } from "@/lib/types";
import type { EdicaoContaFormState } from "@/components/shared/editar-conta-pagar-modal";
import type { NovaContaPagarSubmitData } from "@/components/shared/nova-conta-pagar-modal";
import type { PagamentoFormState } from "@/components/shared/pagar-conta-modal";

export function useContasPagarActions(input: {
  tenantId: string | null;
  contas: ContaPagar[];
  setError: (error: string | null) => void;
  load: () => Promise<void>;
  setOpenNovaConta: (open: boolean) => void;
  setOpenEditarConta: (open: boolean) => void;
  setOpenPagarConta: (open: boolean) => void;
  setSelectedConta: (conta: ContaPagar | null) => void;
  setContaEditandoId: (id: string | null) => void;
}) {
  const {
    tenantId, contas, setError, load,
    setOpenNovaConta, setOpenEditarConta, setOpenPagarConta,
    setSelectedConta, setContaEditandoId,
  } = input;

  async function handleCriarConta(data: NovaContaPagarSubmitData) {
    if (!tenantId) return;
    const { form: novaConta, registrarComoPaga, pagamento: pagamentoNoCadastro } = data;
    if (
      !novaConta.tipoContaId || !novaConta.fornecedor.trim() || !novaConta.descricao.trim() ||
      !novaConta.dataVencimento || !novaConta.competencia || !novaConta.valorOriginal
    ) return;

    if (novaConta.recorrente) {
      if (!novaConta.recorrenciaDataInicial) return;
      if (novaConta.recorrenciaTipo === "INTERVALO_DIAS" && Number(novaConta.recorrenciaIntervaloDias || 0) < 1) return;
      if (novaConta.recorrenciaTipo === "MENSAL" && Number(novaConta.recorrenciaDiaDoMes || 0) < 1) return;
      if (novaConta.recorrenciaTermino === "EM_DATA" && !novaConta.recorrenciaDataFim) return;
      if (novaConta.recorrenciaTermino === "APOS_OCORRENCIAS" && Number(novaConta.recorrenciaNumeroOcorrencias || 0) < 1) return;
    }

    const diaPadraoVencimento = Number(novaConta.dataVencimento.split("-")[2] || 1);
    const valorContaLiquida = Math.max(0, Number(novaConta.valorOriginal || 0) - Number(novaConta.desconto || 0) + Number(novaConta.jurosMulta || 0));

    try {
      setError(null);
      const criada = await createContaPagarApi({
        tenantId,
        data: {
          tipoContaId: novaConta.tipoContaId,
          fornecedor: novaConta.fornecedor.trim(),
          documentoFornecedor: novaConta.documentoFornecedor.trim() || undefined,
          descricao: novaConta.descricao.trim(),
          categoria: novaConta.categoria,
          grupoDre: novaConta.grupoDre,
          centroCusto: novaConta.centroCusto.trim() || undefined,
          regime: novaConta.regime,
          competencia: novaConta.competencia,
          dataEmissao: novaConta.dataEmissao || undefined,
          dataVencimento: novaConta.dataVencimento,
          valorOriginal: Number(novaConta.valorOriginal || 0),
          desconto: Number(novaConta.desconto || 0),
          jurosMulta: Number(novaConta.jurosMulta || 0),
          observacoes: novaConta.observacoes.trim() || undefined,
          recorrencia: novaConta.recorrente
            ? {
                tipo: novaConta.recorrenciaTipo,
                intervaloDias: novaConta.recorrenciaTipo === "INTERVALO_DIAS" ? Number(novaConta.recorrenciaIntervaloDias || 30) : undefined,
                diaDoMes: novaConta.recorrenciaTipo === "MENSAL" ? Number(novaConta.recorrenciaDiaDoMes || diaPadraoVencimento) : undefined,
                dataInicial: novaConta.recorrenciaDataInicial,
                termino: novaConta.recorrenciaTermino,
                dataFim: novaConta.recorrenciaTermino === "EM_DATA" ? novaConta.recorrenciaDataFim : undefined,
                numeroOcorrencias: novaConta.recorrenciaTermino === "APOS_OCORRENCIAS" ? Number(novaConta.recorrenciaNumeroOcorrencias || 1) : undefined,
                criarLancamentoInicial: novaConta.criarLancamentoInicialAgora,
              }
            : undefined,
        },
      });

      if (registrarComoPaga) {
        if (!criada) throw new Error("Não foi possível marcar como paga porque o lançamento inicial não foi criado.");
        const valorPago = Number(pagamentoNoCadastro.valorPago);
        const valorFinal = valorPago > 0 ? valorPago : valorContaLiquida;
        await pagarContaPagarApi({
          tenantId,
          id: criada.id,
          data: {
            dataPagamento: pagamentoNoCadastro.dataPagamento || getBusinessTodayIso(),
            formaPagamento: pagamentoNoCadastro.formaPagamento,
            valorPago: valorFinal,
            observacoes: pagamentoNoCadastro.observacoes.trim() || undefined,
          },
        });
      }
    } catch (submitError) {
      setError(normalizeErrorMessage(submitError));
      return;
    }

    setOpenNovaConta(false);
    await load();
  }

  async function handlePagarConta(contaId: string, pagamento: PagamentoFormState) {
    if (!tenantId || !pagamento.dataPagamento) return;
    try {
      setError(null);
      await pagarContaPagarApi({
        tenantId,
        id: contaId,
        data: {
          dataPagamento: pagamento.dataPagamento,
          formaPagamento: pagamento.formaPagamento,
          valorPago: pagamento.valorPago ? Number(pagamento.valorPago) : undefined,
          observacoes: pagamento.observacoes.trim() || undefined,
        },
      });
      setSelectedConta(null);
      setOpenPagarConta(false);
      await load();
    } catch (submitError) {
      setError(normalizeErrorMessage(submitError));
    }
  }

  async function handleSalvarEdicaoConta(id: string, edicaoConta: EdicaoContaFormState) {
    if (!tenantId) return;
    if (!edicaoConta.tipoContaId || !edicaoConta.fornecedor.trim() || !edicaoConta.descricao.trim() || !edicaoConta.competencia || !edicaoConta.dataVencimento) return;

    if (edicaoConta.recorrente) {
      if (!edicaoConta.recorrenciaDataInicial) return;
      if (edicaoConta.recorrenciaTipo === "INTERVALO_DIAS" && Number(edicaoConta.recorrenciaIntervaloDias || 0) < 1) return;
      if (edicaoConta.recorrenciaTipo === "MENSAL" && Number(edicaoConta.recorrenciaDiaDoMes || 0) < 1) return;
      if (edicaoConta.recorrenciaTermino === "EM_DATA" && !edicaoConta.recorrenciaDataFim) return;
      if (edicaoConta.recorrenciaTermino === "APOS_OCORRENCIAS" && Number(edicaoConta.recorrenciaNumeroOcorrencias || 0) < 1) return;
    }

    const contaEditando = contas.find((c) => c.id === id);
    const jaTemRegra = !!contaEditando?.regraRecorrenciaId;

    try {
      setError(null);
      await updateContaPagarApi({
        tenantId, id,
        data: {
          tipoContaId: edicaoConta.tipoContaId,
          fornecedor: edicaoConta.fornecedor.trim(),
          documentoFornecedor: edicaoConta.documentoFornecedor.trim() || undefined,
          descricao: edicaoConta.descricao.trim(),
          categoria: edicaoConta.categoria,
          grupoDre: edicaoConta.grupoDre,
          centroCusto: edicaoConta.centroCusto.trim() || undefined,
          regime: edicaoConta.recorrente ? "FIXA" : edicaoConta.regime,
          competencia: edicaoConta.competencia,
          dataEmissao: edicaoConta.dataEmissao || undefined,
          dataVencimento: edicaoConta.dataVencimento,
          valorOriginal: Number(edicaoConta.valorOriginal || 0),
          desconto: Number(edicaoConta.desconto || 0),
          jurosMulta: Number(edicaoConta.jurosMulta || 0),
          observacoes: edicaoConta.observacoes.trim() || undefined,
        },
      });

      if (edicaoConta.recorrente && !jaTemRegra) {
        const diaPadraoVencimento = Number(edicaoConta.dataVencimento.split("-")[2] || 1);
        await createContaPagarApi({
          tenantId,
          data: {
            tipoContaId: edicaoConta.tipoContaId,
            fornecedor: edicaoConta.fornecedor.trim(),
            documentoFornecedor: edicaoConta.documentoFornecedor.trim() || undefined,
            descricao: edicaoConta.descricao.trim(),
            categoria: edicaoConta.categoria,
            grupoDre: edicaoConta.grupoDre,
            centroCusto: edicaoConta.centroCusto.trim() || undefined,
            regime: "FIXA",
            competencia: edicaoConta.competencia,
            dataEmissao: edicaoConta.dataEmissao || undefined,
            dataVencimento: edicaoConta.dataVencimento,
            valorOriginal: Number(edicaoConta.valorOriginal || 0),
            desconto: Number(edicaoConta.desconto || 0),
            jurosMulta: Number(edicaoConta.jurosMulta || 0),
            observacoes: edicaoConta.observacoes.trim() || undefined,
            recorrencia: {
              tipo: edicaoConta.recorrenciaTipo,
              intervaloDias: edicaoConta.recorrenciaTipo === "INTERVALO_DIAS" ? Number(edicaoConta.recorrenciaIntervaloDias || 30) : undefined,
              diaDoMes: edicaoConta.recorrenciaTipo === "MENSAL" ? Number(edicaoConta.recorrenciaDiaDoMes || diaPadraoVencimento) : undefined,
              dataInicial: edicaoConta.recorrenciaDataInicial,
              termino: edicaoConta.recorrenciaTermino,
              dataFim: edicaoConta.recorrenciaTermino === "EM_DATA" ? edicaoConta.recorrenciaDataFim : undefined,
              numeroOcorrencias: edicaoConta.recorrenciaTermino === "APOS_OCORRENCIAS" ? Number(edicaoConta.recorrenciaNumeroOcorrencias || 1) : undefined,
              criarLancamentoInicial: false,
            },
          },
        });
      }

      setOpenEditarConta(false);
      setContaEditandoId(null);
      await load();
    } catch (submitError) {
      setError(normalizeErrorMessage(submitError));
    }
  }

  async function handleCancelarConta(contaId: string) {
    if (!tenantId) return;
    try {
      setError(null);
      await cancelarContaPagarApi({ tenantId, id: contaId, observacoes: "Cancelada via gestão financeira" });
      await load();
    } catch (submitError) {
      setError(normalizeErrorMessage(submitError));
    }
  }

  return {
    handleCriarConta,
    handlePagarConta,
    handleSalvarEdicaoConta,
    handleCancelarConta,
  };
}

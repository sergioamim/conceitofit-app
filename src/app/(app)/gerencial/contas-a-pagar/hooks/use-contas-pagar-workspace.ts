"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelarContaPagarApi,
  createContaPagarApi,
  listContasPagarApi,
  listRegrasRecorrenciaContaPagarApi,
  pagarContaPagarApi,
  updateContaPagarApi,
} from "@/lib/api/financeiro-gerencial";
import { listFormasPagamentoApi } from "@/lib/api/formas-pagamento";
import { listTiposContaPagarApi } from "@/lib/api/tipos-conta";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { getBusinessMonthRange, getBusinessTodayIso } from "@/lib/business-date";
import type {
  CategoriaContaPagar,
  ContaPagar,
  FormaPagamento,
  RegraRecorrenciaContaPagar,
  StatusContaPagar,
  TipoContaPagar,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { isContaPagarEmAberto, isContaPagarPendente } from "@/lib/domain/status-helpers";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";
import { buildEdicaoFormFromConta, type EdicaoContaFormState } from "@/components/shared/editar-conta-pagar-modal";
import { NovaContaPagarSubmitData } from "@/components/shared/nova-conta-pagar-modal";
import { PagamentoFormState } from "@/components/shared/pagar-conta-modal";

export type StatusFiltro = WithFilterAll<"EM_ABERTO" | StatusContaPagar>;
export type CategoriaFiltro = "TODAS" | CategoriaContaPagar;
export type TipoFiltro = WithFilterAll<string>;
export type OrigemFiltro = "TODAS" | "MANUAL" | "RECORRENTE";

export const GRUPO_DRE_LABEL: Record<string, string> = {
  CUSTO_VARIAVEL: "Custo variável",
  DESPESA_OPERACIONAL: "Despesa operacional",
  DESPESA_FINANCEIRA: "Despesa financeira",
  IMPOSTOS: "Impostos",
};

export const CATEGORIA_LABEL: Record<CategoriaContaPagar, string> = {
  FOLHA: "Folha",
  ALUGUEL: "Aluguel",
  UTILIDADES: "Utilidades",
  IMPOSTOS: "Impostos",
  MARKETING: "Marketing",
  MANUTENCAO: "Manutenção",
  FORNECEDORES: "Fornecedores",
  OUTROS: "Outros",
};

export function formatBRL(value: number) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export function contaTotal(conta: ContaPagar) {
  return Math.max(
    0,
    Number(conta.valorOriginal ?? 0) - Number(conta.desconto ?? 0) + Number(conta.jurosMulta ?? 0)
  );
}

export type ContasPagarWorkspace = ReturnType<typeof useContasPagarWorkspace>;

export function useContasPagarWorkspace() {
  const tenantContext = useTenantContext();
  const range = getBusinessMonthRange();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [tiposConta, setTiposConta] = useState<TipoContaPagar[]>([]);
  const [regrasRecorrencia, setRegrasRecorrencia] = useState<RegraRecorrenciaContaPagar[]>([]);

  const [status, setStatus] = useState<StatusFiltro>("EM_ABERTO");
  const [categoria, setCategoria] = useState<CategoriaFiltro>("TODAS");
  const [tipoContaFiltro, setTipoContaFiltro] = useState<TipoFiltro>(FILTER_ALL);
  const [origemFiltro, setOrigemFiltro] = useState<OrigemFiltro>("TODAS");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);

  const [openNovaConta, setOpenNovaConta] = useState(false);
  const [openEditarConta, setOpenEditarConta] = useState(false);
  const [openPagarConta, setOpenPagarConta] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [contaEditandoId, setContaEditandoId] = useState<string | null>(null);
  const [edicaoContaForm, setEdicaoContaForm] = useState<EdicaoContaFormState | null>(null);

  const tipoContaMap = useMemo(() => {
    return new Map(tiposConta.map((item) => [item.id, item]));
  }, [tiposConta]);

  const load = useCallback(async () => {
    if (!tenantContext.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [contasData, formasData, tiposData, regrasData] = await Promise.all([
        listContasPagarApi({ tenantId: tenantContext.tenantId }),
        listFormasPagamentoApi({ tenantId: tenantContext.tenantId, apenasAtivas: false }),
        listTiposContaPagarApi({ tenantId: tenantContext.tenantId, apenasAtivos: false }),
        listRegrasRecorrenciaContaPagarApi({ tenantId: tenantContext.tenantId, status: "TODAS" }),
      ]);
      setContas(contasData);
      setFormasPagamento(formasData);
      setTiposConta(tiposData);
      setRegrasRecorrencia(regrasData);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantContext.tenantId]);

  useEffect(() => {
    if (tenantContext.tenantResolved && tenantContext.tenantId) {
      void load();
    }
  }, [load, tenantContext.tenantId, tenantContext.tenantResolved]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contas.filter((conta) => {
      const inRange = conta.dataVencimento >= startDate && conta.dataVencimento <= endDate;
      if (!inRange) return false;

      if (status === "EM_ABERTO") {
        if (!isContaPagarEmAberto(conta.status)) return false;
      } else if (status !== FILTER_ALL && conta.status !== status) {
        return false;
      }

      if (categoria !== "TODAS" && conta.categoria !== categoria) return false;
      if (tipoContaFiltro !== FILTER_ALL && conta.tipoContaId !== tipoContaFiltro) return false;
      if (origemFiltro !== "TODAS" && (conta.origemLancamento ?? "MANUAL") !== origemFiltro) {
        return false;
      }

      if (!term) return true;
      const tipoNome = conta.tipoContaId ? tipoContaMap.get(conta.tipoContaId)?.nome ?? "" : "";
      return (
        conta.fornecedor.toLowerCase().includes(term) ||
        conta.descricao.toLowerCase().includes(term) ||
        (conta.centroCusto ?? "").toLowerCase().includes(term) ||
        (conta.documentoFornecedor ?? "").toLowerCase().includes(term) ||
        tipoNome.toLowerCase().includes(term)
      );
    });
  }, [
    categoria,
    contas,
    endDate,
    origemFiltro,
    search,
    startDate,
    status,
    tipoContaFiltro,
    tipoContaMap,
  ]);

  const resumo = useMemo(() => {
    const previstas = filtered
      .filter((conta) => conta.status !== "CANCELADA")
      .reduce((sum, conta) => sum + contaTotal(conta), 0);
    const pagas = filtered
      .filter((conta) => conta.status === "PAGA")
      .reduce((sum, conta) => sum + Number(conta.valorPago ?? contaTotal(conta)), 0);
    const emAberto = filtered
      .filter((conta) => isContaPagarEmAberto(conta.status))
      .reduce((sum, conta) => sum + contaTotal(conta), 0);
    const vencidas = filtered
      .filter((conta) => conta.status === "VENCIDA")
      .reduce((sum, conta) => sum + contaTotal(conta), 0);
    return { previstas, pagas, emAberto, vencidas };
  }, [filtered]);

  const resumoRecorrencia = useMemo(() => {
    const ativa = regrasRecorrencia.filter((r) => r.status === "ATIVA").length;
    const pausada = regrasRecorrencia.filter((r) => r.status === "PAUSADA").length;
    const cancelada = regrasRecorrencia.filter((r) => r.status === "CANCELADA").length;
    return {
      total: regrasRecorrencia.length,
      ativa,
      pausada,
      cancelada,
    };
  }, [regrasRecorrencia]);

  function abrirModalEdicao(conta: ContaPagar) {
    setContaEditandoId(conta.id);
    setEdicaoContaForm(buildEdicaoFormFromConta(conta, regrasRecorrencia));
    setOpenEditarConta(true);
  }

  async function handleCriarConta(data: NovaContaPagarSubmitData) {
    if (!tenantContext.tenantId) return;
    const { form: novaConta, registrarComoPaga, pagamento: pagamentoNoCadastro } = data;
    if (
      !novaConta.tipoContaId ||
      !novaConta.fornecedor.trim() ||
      !novaConta.descricao.trim() ||
      !novaConta.dataVencimento ||
      !novaConta.competencia ||
      !novaConta.valorOriginal
    ) {
      return;
    }

    if (novaConta.recorrente) {
      if (!novaConta.recorrenciaDataInicial) return;
      if (
        novaConta.recorrenciaTipo === "INTERVALO_DIAS" &&
        Number(novaConta.recorrenciaIntervaloDias || 0) < 1
      ) {
        return;
      }
      if (
        novaConta.recorrenciaTipo === "MENSAL" &&
        Number(novaConta.recorrenciaDiaDoMes || 0) < 1
      ) {
        return;
      }
      if (novaConta.recorrenciaTermino === "EM_DATA" && !novaConta.recorrenciaDataFim) return;
      if (
        novaConta.recorrenciaTermino === "APOS_OCORRENCIAS" &&
        Number(novaConta.recorrenciaNumeroOcorrencias || 0) < 1
      ) {
        return;
      }
    }

    const diaPadraoVencimento = Number(novaConta.dataVencimento.split("-")[2] || 1);
    const valorContaLiquida = Math.max(
      0,
      Number(novaConta.valorOriginal || 0) - Number(novaConta.desconto || 0) + Number(novaConta.jurosMulta || 0)
    );
    try {
      setError(null);
      const criada = await createContaPagarApi({
        tenantId: tenantContext.tenantId,
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
                intervaloDias:
                  novaConta.recorrenciaTipo === "INTERVALO_DIAS"
                    ? Number(novaConta.recorrenciaIntervaloDias || 30)
                    : undefined,
                diaDoMes:
                  novaConta.recorrenciaTipo === "MENSAL"
                    ? Number(novaConta.recorrenciaDiaDoMes || diaPadraoVencimento)
                    : undefined,
                dataInicial: novaConta.recorrenciaDataInicial,
                termino: novaConta.recorrenciaTermino,
                dataFim:
                  novaConta.recorrenciaTermino === "EM_DATA"
                    ? novaConta.recorrenciaDataFim
                    : undefined,
                numeroOcorrencias:
                  novaConta.recorrenciaTermino === "APOS_OCORRENCIAS"
                    ? Number(novaConta.recorrenciaNumeroOcorrencias || 1)
                    : undefined,
                criarLancamentoInicial: novaConta.criarLancamentoInicialAgora,
              }
            : undefined,
        },
      });

      if (registrarComoPaga) {
        if (!criada) {
          throw new Error("Não foi possível marcar como paga porque o lançamento inicial não foi criado.");
        }

        const valorPago = Number(pagamentoNoCadastro.valorPago);
        const valorFinal = valorPago > 0 ? valorPago : valorContaLiquida;
        await pagarContaPagarApi({
          tenantId: tenantContext.tenantId,
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
    if (!tenantContext.tenantId || !pagamento.dataPagamento) return;
    try {
      setError(null);
      await pagarContaPagarApi({
        tenantId: tenantContext.tenantId,
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
    if (!tenantContext.tenantId) return;
    if (
      !edicaoConta.tipoContaId ||
      !edicaoConta.fornecedor.trim() ||
      !edicaoConta.descricao.trim() ||
      !edicaoConta.competencia ||
      !edicaoConta.dataVencimento
    ) {
      return;
    }

    if (edicaoConta.recorrente) {
      if (!edicaoConta.recorrenciaDataInicial) return;
      if (
        edicaoConta.recorrenciaTipo === "INTERVALO_DIAS" &&
        Number(edicaoConta.recorrenciaIntervaloDias || 0) < 1
      ) {
        return;
      }
      if (
        edicaoConta.recorrenciaTipo === "MENSAL" &&
        Number(edicaoConta.recorrenciaDiaDoMes || 0) < 1
      ) {
        return;
      }
      if (edicaoConta.recorrenciaTermino === "EM_DATA" && !edicaoConta.recorrenciaDataFim) return;
      if (
        edicaoConta.recorrenciaTermino === "APOS_OCORRENCIAS" &&
        Number(edicaoConta.recorrenciaNumeroOcorrencias || 0) < 1
      ) {
        return;
      }
    }

    const contaEditando = contas.find((c) => c.id === id);
    const jaTemRegra = !!contaEditando?.regraRecorrenciaId;

    try {
      setError(null);
      await updateContaPagarApi({
        tenantId: tenantContext.tenantId,
        id,
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
          tenantId: tenantContext.tenantId,
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
              intervaloDias:
                edicaoConta.recorrenciaTipo === "INTERVALO_DIAS"
                  ? Number(edicaoConta.recorrenciaIntervaloDias || 30)
                  : undefined,
              diaDoMes:
                edicaoConta.recorrenciaTipo === "MENSAL"
                  ? Number(edicaoConta.recorrenciaDiaDoMes || diaPadraoVencimento)
                  : undefined,
              dataInicial: edicaoConta.recorrenciaDataInicial,
              termino: edicaoConta.recorrenciaTermino,
              dataFim:
                edicaoConta.recorrenciaTermino === "EM_DATA"
                  ? edicaoConta.recorrenciaDataFim
                  : undefined,
              numeroOcorrencias:
                edicaoConta.recorrenciaTermino === "APOS_OCORRENCIAS"
                  ? Number(edicaoConta.recorrenciaNumeroOcorrencias || 1)
                  : undefined,
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
    if (!tenantContext.tenantId) return;
    try {
      setError(null);
      await cancelarContaPagarApi({
        tenantId: tenantContext.tenantId,
        id: contaId,
        observacoes: "Cancelada via gestão financeira",
      });
      await load();
    } catch (submitError) {
      setError(normalizeErrorMessage(submitError));
    }
  }

  const tiposAtivos = useMemo(() => tiposConta.filter((tipo) => tipo.ativo), [tiposConta]);
  const formasPagamentoUnicas = useMemo(() => {
    const seen = new Set<string>();
    return formasPagamento.filter((forma) => {
      if (seen.has(forma.tipo)) return false;
      seen.add(forma.tipo);
      return true;
    });
  }, [formasPagamento]);

  return {
    tenantId: tenantContext.tenantId,
    loading,
    error,
    contas,
    formasPagamento,
    tiposConta,
    regrasRecorrencia,
    status,
    setStatus,
    categoria,
    setCategoria,
    tipoContaFiltro,
    setTipoContaFiltro,
    origemFiltro,
    setOrigemFiltro,
    search,
    setSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    openNovaConta,
    setOpenNovaConta,
    openEditarConta,
    setOpenEditarConta,
    openPagarConta,
    setOpenPagarConta,
    selectedConta,
    setSelectedConta,
    contaEditandoId,
    setContaEditandoId,
    edicaoContaForm,
    setEdicaoContaForm,
    tipoContaMap,
    filtered,
    resumo,
    resumoRecorrencia,
    tiposAtivos,
    formasPagamentoUnicas,
    range,
    load,
    abrirModalEdicao,
    handleCriarConta,
    handlePagarConta,
    handleSalvarEdicaoConta,
    handleCancelarConta,
  };
}

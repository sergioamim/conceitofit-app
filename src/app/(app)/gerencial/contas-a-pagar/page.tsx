"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { useTenantContext } from "@/hooks/use-session-context";
import { getBusinessMonthRange, getBusinessTodayIso } from "@/lib/business-date";
import type {
  CategoriaContaPagar,
  ContaPagar,
  FormaPagamento,
  GrupoDre,
  RegraRecorrenciaContaPagar,
  StatusContaPagar,
  TipoContaPagar,
  TipoFormaPagamento,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusFiltro = "TODOS" | "EM_ABERTO" | StatusContaPagar;
type CategoriaFiltro = "TODAS" | CategoriaContaPagar;
type TipoFiltro = "TODOS" | string;
type OrigemFiltro = "TODAS" | "MANUAL" | "RECORRENTE";

const CATEGORIA_LABEL: Record<CategoriaContaPagar, string> = {
  FOLHA: "Folha",
  ALUGUEL: "Aluguel",
  UTILIDADES: "Utilidades",
  IMPOSTOS: "Impostos",
  MARKETING: "Marketing",
  MANUTENCAO: "Manutenção",
  FORNECEDORES: "Fornecedores",
  OUTROS: "Outros",
};

const GRUPO_DRE_LABEL: Record<GrupoDre, string> = {
  CUSTO_VARIAVEL: "Custo variável",
  DESPESA_OPERACIONAL: "Despesa operacional",
  DESPESA_FINANCEIRA: "Despesa financeira",
  IMPOSTOS: "Impostos",
};

const FORMA_PAGAMENTO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

function formatBRL(value: number) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function monthRangeFromNow() {
  return getBusinessMonthRange();
}

function todayISO() {
  return getBusinessTodayIso();
}

function contaTotal(conta: ContaPagar) {
  return Math.max(
    0,
    Number(conta.valorOriginal ?? 0) - Number(conta.desconto ?? 0) + Number(conta.jurosMulta ?? 0)
  );
}

const NOVA_CONTA_DEFAULT = {
  tipoContaId: "",
  fornecedor: "",
  documentoFornecedor: "",
  descricao: "",
  categoria: "OUTROS" as CategoriaContaPagar,
  grupoDre: "DESPESA_OPERACIONAL" as GrupoDre,
  centroCusto: "",
  regime: "AVULSA" as ContaPagar["regime"],
  competencia: "",
  dataEmissao: "",
  dataVencimento: "",
  valorOriginal: "",
  desconto: "0",
  jurosMulta: "0",
  observacoes: "",
  recorrente: false,
  recorrenciaTipo: "MENSAL" as "MENSAL" | "INTERVALO_DIAS",
  recorrenciaIntervaloDias: "30",
  recorrenciaDiaDoMes: "",
  recorrenciaDataInicial: "",
  recorrenciaTermino: "SEM_FIM" as "SEM_FIM" | "EM_DATA" | "APOS_OCORRENCIAS",
  recorrenciaDataFim: "",
  recorrenciaNumeroOcorrencias: "12",
  criarLancamentoInicialAgora: true,
};

const NOVO_PAGAMENTO_CONTA_DEFAULT = {
  dataPagamento: todayISO(),
  formaPagamento: "PIX" as TipoFormaPagamento,
  valorPago: "",
  observacoes: "",
};

export default function ContasPagarPage() {
  const tenantContext = useTenantContext();
  const range = monthRangeFromNow();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [tiposConta, setTiposConta] = useState<TipoContaPagar[]>([]);
  const [regrasRecorrencia, setRegrasRecorrencia] = useState<RegraRecorrenciaContaPagar[]>([]);

  const [status, setStatus] = useState<StatusFiltro>("EM_ABERTO");
  const [categoria, setCategoria] = useState<CategoriaFiltro>("TODAS");
  const [tipoContaFiltro, setTipoContaFiltro] = useState<TipoFiltro>("TODOS");
  const [origemFiltro, setOrigemFiltro] = useState<OrigemFiltro>("TODAS");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);

  const [openNovaConta, setOpenNovaConta] = useState(false);
  const [openEditarConta, setOpenEditarConta] = useState(false);
  const [openPagarConta, setOpenPagarConta] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [contaEditandoId, setContaEditandoId] = useState<string | null>(null);

  const [novaConta, setNovaConta] = useState({
    ...NOVA_CONTA_DEFAULT,
    competencia: range.start,
    dataVencimento: range.end,
    recorrenciaDataInicial: range.end,
  });
  const [pagamento, setPagamento] = useState({
    dataPagamento: todayISO(),
    formaPagamento: "PIX" as TipoFormaPagamento,
    valorPago: "",
    observacoes: "",
  });
  const [registrarComoPagaNoCadastro, setRegistrarComoPagaNoCadastro] = useState(false);
  const [pagamentoNoCadastro, setPagamentoNoCadastro] = useState(NOVO_PAGAMENTO_CONTA_DEFAULT);
  const [edicaoConta, setEdicaoConta] = useState({
    tipoContaId: "",
    fornecedor: "",
    documentoFornecedor: "",
    descricao: "",
    categoria: "OUTROS" as CategoriaContaPagar,
    grupoDre: "DESPESA_OPERACIONAL" as GrupoDre,
    centroCusto: "",
    regime: "AVULSA" as ContaPagar["regime"],
    competencia: "",
    dataEmissao: "",
    dataVencimento: "",
    valorOriginal: "",
    desconto: "0",
    jurosMulta: "0",
    observacoes: "",
    recorrente: false,
    recorrenciaTipo: "MENSAL" as "MENSAL" | "INTERVALO_DIAS",
    recorrenciaIntervaloDias: "30",
    recorrenciaDiaDoMes: "",
    recorrenciaDataInicial: "",
    recorrenciaTermino: "SEM_FIM" as "SEM_FIM" | "EM_DATA" | "APOS_OCORRENCIAS",
    recorrenciaDataFim: "",
    recorrenciaNumeroOcorrencias: "12",
    criarLancamentoInicialAgora: false,
  });

  const tipoContaMap = useMemo(() => {
    return new Map(tiposConta.map((item) => [item.id, item]));
  }, [tiposConta]);

  function resetNovaConta() {
    setNovaConta({
      ...NOVA_CONTA_DEFAULT,
      competencia: range.start,
      dataVencimento: range.end,
      recorrenciaDataInicial: range.end,
    });
    setRegistrarComoPagaNoCadastro(false);
    setPagamentoNoCadastro(NOVO_PAGAMENTO_CONTA_DEFAULT);
  }

  function abrirNovaContaModal() {
    resetNovaConta();
    setOpenNovaConta(true);
  }

  function fecharNovaContaModal() {
    resetNovaConta();
    setOpenNovaConta(false);
  }

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
        if (!(conta.status === "PENDENTE" || conta.status === "VENCIDA")) return false;
      } else if (status !== "TODOS" && conta.status !== status) {
        return false;
      }

      if (categoria !== "TODAS" && conta.categoria !== categoria) return false;
      if (tipoContaFiltro !== "TODOS" && conta.tipoContaId !== tipoContaFiltro) return false;
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
      .filter((conta) => conta.status === "PENDENTE" || conta.status === "VENCIDA")
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

  function applyTipoConta(tipoId: string) {
    const tipo = tiposConta.find((item) => item.id === tipoId);
    setNovaConta((prev) => ({
      ...prev,
      tipoContaId: tipoId,
      categoria: tipo?.categoriaOperacional ?? prev.categoria,
      grupoDre: tipo?.grupoDre ?? prev.grupoDre,
      centroCusto: prev.centroCusto || tipo?.centroCustoPadrao || "",
    }));
  }

  function abrirModalEdicao(conta: ContaPagar) {
    setContaEditandoId(conta.id);
    const regra = conta.regraRecorrenciaId
      ? regrasRecorrencia.find((r) => r.id === conta.regraRecorrenciaId)
      : undefined;
    setEdicaoConta({
      tipoContaId: conta.tipoContaId ?? "",
      fornecedor: conta.fornecedor,
      documentoFornecedor: conta.documentoFornecedor ?? "",
      descricao: conta.descricao,
      categoria: conta.categoria,
      grupoDre: conta.grupoDre ?? "DESPESA_OPERACIONAL",
      centroCusto: conta.centroCusto ?? "",
      regime: conta.regime,
      competencia: conta.competencia,
      dataEmissao: conta.dataEmissao ?? "",
      dataVencimento: conta.dataVencimento,
      valorOriginal: String(conta.valorOriginal ?? 0),
      desconto: String(conta.desconto ?? 0),
      jurosMulta: String(conta.jurosMulta ?? 0),
      observacoes: conta.observacoes ?? "",
      recorrente: !!regra,
      recorrenciaTipo: regra?.recorrencia ?? "MENSAL",
      recorrenciaIntervaloDias: String(regra?.intervaloDias ?? 30),
      recorrenciaDiaDoMes: String(regra?.diaDoMes ?? conta.dataVencimento.split("-")[2] ?? ""),
      recorrenciaDataInicial: regra?.dataInicial ?? conta.dataVencimento,
      recorrenciaTermino: regra?.termino ?? "SEM_FIM",
      recorrenciaDataFim: regra?.dataFim ?? "",
      recorrenciaNumeroOcorrencias: String(regra?.numeroOcorrencias ?? 12),
      criarLancamentoInicialAgora: false,
    });
    setOpenEditarConta(true);
  }

  function applyTipoContaEdicao(tipoId: string) {
    const tipo = tiposConta.find((item) => item.id === tipoId);
    setEdicaoConta((prev) => ({
      ...prev,
      tipoContaId: tipoId,
      categoria: tipo?.categoriaOperacional ?? prev.categoria,
      grupoDre: tipo?.grupoDre ?? prev.grupoDre,
      centroCusto: prev.centroCusto || tipo?.centroCustoPadrao || "",
    }));
  }

  async function handleCriarConta() {
    if (!tenantContext.tenantId) return;
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

      if (registrarComoPagaNoCadastro) {
        if (!criada) {
          throw new Error("Não foi possível marcar como paga porque o lançamento inicial não foi criado.");
        }

        const valorPago = Number(pagamentoNoCadastro.valorPago);
        const valorFinal = valorPago > 0 ? valorPago : valorContaLiquida;
        await pagarContaPagarApi({
          tenantId: tenantContext.tenantId,
          id: criada.id,
          data: {
            dataPagamento: pagamentoNoCadastro.dataPagamento || todayISO(),
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

    fecharNovaContaModal();
    await load();
  }

  async function handlePagarConta() {
    if (!tenantContext.tenantId || !selectedConta || !pagamento.dataPagamento) return;
    try {
      setError(null);
      await pagarContaPagarApi({
        tenantId: tenantContext.tenantId,
        id: selectedConta.id,
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

  async function handleSalvarEdicaoConta() {
    if (!tenantContext.tenantId) return;
    if (
      !contaEditandoId ||
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

    const contaEditando = contas.find((c) => c.id === contaEditandoId);
    const jaTemRegra = !!contaEditando?.regraRecorrenciaId;

    try {
      setError(null);
      await updateContaPagarApi({
        tenantId: tenantContext.tenantId,
        id: contaEditandoId,
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
  const diaVencimentoSugestao = Number(novaConta.dataVencimento.split("-")[2] || 1);
  const valorContaLiquida = useMemo(() => {
    return Math.max(
      0,
      Number(novaConta.valorOriginal || 0) - Number(novaConta.desconto || 0) + Number(novaConta.jurosMulta || 0)
    );
  }, [novaConta.desconto, novaConta.jurosMulta, novaConta.valorOriginal]);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      <Dialog
        open={openNovaConta}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            fecharNovaContaModal();
            return;
          }
          setOpenNovaConta(true);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-card border-border sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Nova conta a pagar</DialogTitle>
            <DialogDescription>
              Cadastre compromissos financeiros da unidade com classificação obrigatória para DRE.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de conta
              </label>
              <Select value={novaConta.tipoContaId} onValueChange={applyTipoConta}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Selecione o tipo *" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {tiposAtivos.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fornecedor
              </label>
              <Input
                value={novaConta.fornecedor}
                onChange={(e) => setNovaConta((v) => ({ ...v, fornecedor: e.target.value }))}
                placeholder="Nome do fornecedor *"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documento do fornecedor
              </label>
              <Input
                value={novaConta.documentoFornecedor}
                onChange={(e) =>
                  setNovaConta((v) => ({ ...v, documentoFornecedor: e.target.value }))
                }
                placeholder="CPF/CNPJ"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </label>
              <Input
                value={novaConta.descricao}
                onChange={(e) => setNovaConta((v) => ({ ...v, descricao: e.target.value }))}
                placeholder="Descrição da conta *"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categoria operacional (herdada do tipo)
              </label>
              <Input
                readOnly
                value={CATEGORIA_LABEL[novaConta.categoria]}
                className="bg-secondary border-border text-muted-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Grupo DRE (somente leitura)
              </label>
              <Input
                readOnly
                value={GRUPO_DRE_LABEL[novaConta.grupoDre]}
                className="bg-secondary border-border text-muted-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Centro de custo
              </label>
              <Input
                value={novaConta.centroCusto}
                onChange={(e) => setNovaConta((v) => ({ ...v, centroCusto: e.target.value }))}
                placeholder="Opcional"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Regime
              </label>
              <Select
                value={novaConta.regime}
                onValueChange={(value) =>
                  setNovaConta((f) => ({ ...f, regime: value as ContaPagar["regime"] }))
                }
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="AVULSA">Avulsa</SelectItem>
                  <SelectItem value="FIXA">Fixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Competência
              </label>
              <Input
                type="date"
                value={novaConta.competencia}
                onChange={(e) => setNovaConta((v) => ({ ...v, competencia: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data de emissão
              </label>
              <Input
                type="date"
                value={novaConta.dataEmissao}
                onChange={(e) => setNovaConta((v) => ({ ...v, dataEmissao: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data de vencimento
              </label>
              <Input
                type="date"
                value={novaConta.dataVencimento}
                onChange={(e) =>
                  setNovaConta((v) => ({
                    ...v,
                    dataVencimento: e.target.value,
                    recorrenciaDiaDoMes: v.recorrenciaDiaDoMes || e.target.value.split("-")[2] || "",
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Valor original
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={novaConta.valorOriginal}
                onChange={(e) => setNovaConta((v) => ({ ...v, valorOriginal: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Desconto
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={novaConta.desconto}
                onChange={(e) => setNovaConta((v) => ({ ...v, desconto: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Juros / Multa
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={novaConta.jurosMulta}
                onChange={(e) => setNovaConta((v) => ({ ...v, jurosMulta: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações
              </label>
              <textarea
                value={novaConta.observacoes}
                onChange={(e) => setNovaConta((v) => ({ ...v, observacoes: e.target.value }))}
                className="h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={novaConta.recorrente}
                onChange={(e) =>
                  setNovaConta((v) => ({
                    ...v,
                    recorrente: e.target.checked,
                    regime: e.target.checked ? "FIXA" : v.regime,
                    recorrenciaDiaDoMes:
                      v.recorrenciaDiaDoMes || String(diaVencimentoSugestao),
                    recorrenciaDataInicial: v.recorrenciaDataInicial || v.dataVencimento,
                  }))
                }
              />
              Conta recorrente
            </label>

            {novaConta.recorrente && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tipo de recorrência
                  </label>
                  <Select
                    value={novaConta.recorrenciaTipo}
                    onValueChange={(value) =>
                      setNovaConta((v) => ({
                        ...v,
                        recorrenciaTipo: value as "MENSAL" | "INTERVALO_DIAS",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="MENSAL">Mensal</SelectItem>
                      <SelectItem value="INTERVALO_DIAS">A cada X dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {novaConta.recorrenciaTipo === "INTERVALO_DIAS" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      A cada X dias
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={novaConta.recorrenciaIntervaloDias}
                      onChange={(e) =>
                        setNovaConta((v) => ({
                          ...v,
                          recorrenciaIntervaloDias: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                )}

                {novaConta.recorrenciaTipo === "MENSAL" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Dia do mês
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={novaConta.recorrenciaDiaDoMes || String(diaVencimentoSugestao)}
                      onChange={(e) =>
                        setNovaConta((v) => ({
                          ...v,
                          recorrenciaDiaDoMes: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Data inicial (âncora)
                  </label>
                  <Input
                    type="date"
                    value={novaConta.recorrenciaDataInicial}
                    onChange={(e) =>
                      setNovaConta((v) => ({
                        ...v,
                        recorrenciaDataInicial: e.target.value,
                      }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Término da recorrência
                  </label>
                  <Select
                    value={novaConta.recorrenciaTermino}
                    onValueChange={(value) =>
                      setNovaConta((v) => ({
                        ...v,
                        recorrenciaTermino: value as "SEM_FIM" | "EM_DATA" | "APOS_OCORRENCIAS",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="SEM_FIM">Sem fim</SelectItem>
                      <SelectItem value="EM_DATA">Em data</SelectItem>
                      <SelectItem value="APOS_OCORRENCIAS">Após N ocorrências</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {novaConta.recorrenciaTermino === "EM_DATA" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Data fim
                    </label>
                    <Input
                      type="date"
                      value={novaConta.recorrenciaDataFim}
                      onChange={(e) =>
                        setNovaConta((v) => ({
                          ...v,
                          recorrenciaDataFim: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                )}

                {novaConta.recorrenciaTermino === "APOS_OCORRENCIAS" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Qtd. ocorrências
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={novaConta.recorrenciaNumeroOcorrencias}
                      onChange={(e) =>
                        setNovaConta((v) => ({
                          ...v,
                          recorrenciaNumeroOcorrencias: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                )}

                <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    checked={novaConta.criarLancamentoInicialAgora}
                    onChange={(e) =>
                      setNovaConta((v) => ({
                        ...v,
                        criarLancamentoInicialAgora: e.target.checked,
                      }))
                    }
                  />
                  Criar lançamento inicial agora
                </label>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={registrarComoPagaNoCadastro}
                onChange={(e) =>
                  setRegistrarComoPagaNoCadastro(e.target.checked)
                }
              />
              Registrar como paga no cadastro
            </label>

            {registrarComoPagaNoCadastro && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Data de pagamento
                  </label>
                  <Input
                    type="date"
                    value={pagamentoNoCadastro.dataPagamento}
                    onChange={(e) =>
                      setPagamentoNoCadastro((p) => ({
                        ...p,
                        dataPagamento: e.target.value,
                      }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Forma de pagamento
                  </label>
                  <Select
                    value={pagamentoNoCadastro.formaPagamento}
                    onValueChange={(value) =>
                      setPagamentoNoCadastro((p) => ({ ...p, formaPagamento: value as TipoFormaPagamento }))
                    }
                  >
                    <SelectTrigger className="w-full bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {formasPagamentoUnicas.map((forma) => (
                        <SelectItem key={forma.id} value={forma.tipo}>
                          {FORMA_PAGAMENTO_LABEL[forma.tipo] ?? forma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Valor pago
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder={`Padrão: ${formatBRL(valorContaLiquida)}`}
                    value={pagamentoNoCadastro.valorPago}
                    onChange={(e) =>
                      setPagamentoNoCadastro((p) => ({ ...p, valorPago: e.target.value }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Observações
                  </label>
                  <textarea
                    value={pagamentoNoCadastro.observacoes}
                    onChange={(e) =>
                      setPagamentoNoCadastro((p) => ({ ...p, observacoes: e.target.value }))
                    }
                    className="h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={fecharNovaContaModal}
            >
              Cancelar
            </Button>
            <Button onClick={handleCriarConta}>Salvar conta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openPagarConta} onOpenChange={setOpenPagarConta}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Baixar conta</DialogTitle>
            <DialogDescription>
              Registrar pagamento para {selectedConta?.fornecedor ?? "fornecedor"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data de pagamento
              </label>
              <Input
                type="date"
                value={pagamento.dataPagamento}
                onChange={(e) =>
                  setPagamento((v) => ({ ...v, dataPagamento: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Forma de pagamento
              </label>
              <Select
                value={pagamento.formaPagamento}
                onValueChange={(value) =>
                  setPagamento((f) => ({ ...f, formaPagamento: value as TipoFormaPagamento }))
                }
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {formasPagamento.map((forma) => (
                    <SelectItem key={forma.id} value={forma.tipo}>
                      {forma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Valor pago
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder={`Padrão: ${formatBRL(selectedConta ? contaTotal(selectedConta) : 0)}`}
                value={pagamento.valorPago}
                onChange={(e) => setPagamento((v) => ({ ...v, valorPago: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações
              </label>
              <textarea
                value={pagamento.observacoes}
                onChange={(e) =>
                  setPagamento((v) => ({ ...v, observacoes: e.target.value }))
                }
                className="h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setOpenPagarConta(false)}>
              Fechar
            </Button>
            <Button onClick={handlePagarConta}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditarConta} onOpenChange={setOpenEditarConta}>
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-card border-border sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Editar conta a pagar</DialogTitle>
            <DialogDescription>
              Atualize os dados da conta selecionada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de conta
              </label>
              <Select value={edicaoConta.tipoContaId} onValueChange={applyTipoContaEdicao}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Selecione o tipo *" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {tiposAtivos.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fornecedor
              </label>
              <Input
                value={edicaoConta.fornecedor}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, fornecedor: e.target.value }))}
                placeholder="Nome do fornecedor *"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documento do fornecedor
              </label>
              <Input
                value={edicaoConta.documentoFornecedor}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, documentoFornecedor: e.target.value }))}
                placeholder="CPF/CNPJ"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </label>
              <Input
                value={edicaoConta.descricao}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, descricao: e.target.value }))}
                placeholder="Descrição da conta *"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categoria
              </label>
              <Input value={CATEGORIA_LABEL[edicaoConta.categoria]} readOnly className="bg-secondary border-border" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Grupo DRE
              </label>
              <Input value={GRUPO_DRE_LABEL[edicaoConta.grupoDre]} readOnly className="bg-secondary border-border" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Centro de custo
              </label>
              <Input
                value={edicaoConta.centroCusto}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, centroCusto: e.target.value }))}
                placeholder="Opcional"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Regime
              </label>
              <Select value={edicaoConta.regime} onValueChange={(value) => setEdicaoConta((v) => ({ ...v, regime: value as ContaPagar["regime"] }))}>
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="FIXA">Fixa</SelectItem>
                  <SelectItem value="AVULSA">Avulsa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Competência
              </label>
              <Input
                type="date"
                value={edicaoConta.competencia}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, competencia: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data de emissão
              </label>
              <Input
                type="date"
                value={edicaoConta.dataEmissao}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, dataEmissao: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data de vencimento
              </label>
              <Input
                type="date"
                value={edicaoConta.dataVencimento}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, dataVencimento: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Valor original
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={edicaoConta.valorOriginal}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, valorOriginal: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Desconto
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={edicaoConta.desconto}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, desconto: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Juros/Multa
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={edicaoConta.jurosMulta}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, jurosMulta: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações
              </label>
              <textarea
                value={edicaoConta.observacoes}
                onChange={(e) => setEdicaoConta((v) => ({ ...v, observacoes: e.target.value }))}
                className="h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={edicaoConta.recorrente}
                onChange={(e) =>
                  setEdicaoConta((v) => ({
                    ...v,
                    recorrente: e.target.checked,
                    regime: e.target.checked ? "FIXA" : v.regime,
                    recorrenciaDiaDoMes:
                      v.recorrenciaDiaDoMes || (v.dataVencimento.split("-")[2] ?? ""),
                    recorrenciaDataInicial: v.recorrenciaDataInicial || v.dataVencimento,
                  }))
                }
              />
              Conta recorrente
            </label>

            {edicaoConta.recorrente && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tipo de recorrência
                  </label>
                  <Select
                    value={edicaoConta.recorrenciaTipo}
                    onValueChange={(value) =>
                      setEdicaoConta((v) => ({
                        ...v,
                        recorrenciaTipo: value as "MENSAL" | "INTERVALO_DIAS",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="MENSAL">Mensal</SelectItem>
                      <SelectItem value="INTERVALO_DIAS">A cada X dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {edicaoConta.recorrenciaTipo === "INTERVALO_DIAS" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      A cada X dias
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={edicaoConta.recorrenciaIntervaloDias}
                      onChange={(e) =>
                        setEdicaoConta((v) => ({
                          ...v,
                          recorrenciaIntervaloDias: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                )}

                {edicaoConta.recorrenciaTipo === "MENSAL" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Dia do mês
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={edicaoConta.recorrenciaDiaDoMes || (edicaoConta.dataVencimento.split("-")[2] ?? "")}
                      onChange={(e) =>
                        setEdicaoConta((v) => ({
                          ...v,
                          recorrenciaDiaDoMes: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Data inicial (âncora)
                  </label>
                  <Input
                    type="date"
                    value={edicaoConta.recorrenciaDataInicial}
                    onChange={(e) =>
                      setEdicaoConta((v) => ({
                        ...v,
                        recorrenciaDataInicial: e.target.value,
                      }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Término da recorrência
                  </label>
                  <Select
                    value={edicaoConta.recorrenciaTermino}
                    onValueChange={(value) =>
                      setEdicaoConta((v) => ({
                        ...v,
                        recorrenciaTermino: value as "SEM_FIM" | "EM_DATA" | "APOS_OCORRENCIAS",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="SEM_FIM">Sem fim</SelectItem>
                      <SelectItem value="EM_DATA">Em data</SelectItem>
                      <SelectItem value="APOS_OCORRENCIAS">Após N ocorrências</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {edicaoConta.recorrenciaTermino === "EM_DATA" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Data fim
                    </label>
                    <Input
                      type="date"
                      value={edicaoConta.recorrenciaDataFim}
                      onChange={(e) =>
                        setEdicaoConta((v) => ({
                          ...v,
                          recorrenciaDataFim: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                )}

                {edicaoConta.recorrenciaTermino === "APOS_OCORRENCIAS" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Qtd. ocorrências
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={edicaoConta.recorrenciaNumeroOcorrencias}
                      onChange={(e) =>
                        setEdicaoConta((v) => ({
                          ...v,
                          recorrenciaNumeroOcorrencias: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setOpenEditarConta(false)}>
              Fechar
            </Button>
            <Button onClick={handleSalvarEdicaoConta}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestão de despesas da unidade com classificação DRE e recorrência.
          </p>
        </div>
        <Button onClick={abrirNovaContaModal}>
          <Plus className="size-4" />
          Nova conta
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Previsto no período
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">
            {formatBRL(resumo.previstas)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pago</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">
            {formatBRL(resumo.pagas)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Em aberto
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">
            {formatBRL(resumo.emAberto)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Vencidas
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-danger">
            {formatBRL(resumo.vencidas)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Regras recorrentes
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Status das regras cadastradas para geração automática.
            </p>
          </div>
          <p className="font-display text-2xl font-extrabold text-gym-accent">
            {resumoRecorrencia.total}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-full bg-gym-teal/15 px-2 py-1 font-semibold text-gym-teal">
            Ativas: {resumoRecorrencia.ativa}
          </span>
          <span className="inline-flex items-center rounded-full bg-gym-warning/15 px-2 py-1 font-semibold text-gym-warning">
            Pausadas: {resumoRecorrencia.pausada}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 font-semibold text-muted-foreground">
            Canceladas: {resumoRecorrencia.cancelada}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar fornecedor, descrição, doc ou tipo..."
            className="bg-secondary border-border md:col-span-2"
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vencimento de
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vencimento até
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <Select value={status} onValueChange={(value) => setStatus(value as StatusFiltro)}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="EM_ABERTO">Em aberto</SelectItem>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="VENCIDA">Vencida</SelectItem>
                <SelectItem value="PAGA">Paga</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categoria
            </label>
            <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaFiltro)}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="TODAS">Todas</SelectItem>
                {Object.entries(CATEGORIA_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de conta
            </label>
            <Select value={tipoContaFiltro} onValueChange={(value) => setTipoContaFiltro(value)}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="TODOS">Todos</SelectItem>
                {tiposConta.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Origem
            </label>
            <Select value={origemFiltro} onValueChange={(value) => setOrigemFiltro(value as OrigemFiltro)}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="TODAS">Todas</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="RECORRENTE">Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold">Vencimento</th>
              <th className="px-4 py-3 text-left font-semibold">Tipo de conta</th>
              <th className="px-4 py-3 text-left font-semibold">Fornecedor</th>
              <th className="px-4 py-3 text-left font-semibold">Descrição</th>
              <th className="px-4 py-3 text-left font-semibold">Categoria</th>
              <th className="px-4 py-3 text-left font-semibold">Valor</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nenhuma conta encontrada no período.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((conta) => {
                const tipoConta = conta.tipoContaId ? tipoContaMap.get(conta.tipoContaId) : undefined;
                return (
                  <tr key={conta.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(conta.dataVencimento)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{tipoConta?.nome ?? "Sem tipo (legado)"}</p>
                      <p className="text-xs text-muted-foreground">
                        {GRUPO_DRE_LABEL[conta.grupoDre ?? "DESPESA_OPERACIONAL"]}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{conta.fornecedor}</p>
                      {conta.documentoFornecedor && (
                        <p className="text-xs text-muted-foreground">{conta.documentoFornecedor}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{conta.descricao}</td>
                    <td className="px-4 py-3 text-muted-foreground">{CATEGORIA_LABEL[conta.categoria]}</td>
                    <td className="px-4 py-3 font-semibold text-gym-accent">{formatBRL(contaTotal(conta))}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={conta.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(conta.status === "PENDENTE" || conta.status === "VENCIDA") && (
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              setSelectedConta(conta);
                              setPagamento((p) => ({
                                ...p,
                                valorPago: "",
                                dataPagamento: todayISO(),
                                observacoes: "",
                              }));
                              setOpenPagarConta(true);
                            }}
                          >
                            Pagar
                          </Button>
                        )}
                        {conta.status !== "CANCELADA" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-border"
                            onClick={() => abrirModalEdicao(conta)}
                          >
                            Editar
                          </Button>
                        )}
                        {conta.status === "PENDENTE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-border"
                            onClick={() => handleCancelarConta(conta.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

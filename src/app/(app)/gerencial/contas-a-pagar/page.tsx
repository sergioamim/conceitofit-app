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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExportMenu, type ExportColumn } from "@/components/shared/export-menu";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListErrorState } from "@/components/shared/list-states";
import { NovaContaPagarModal, type NovaContaPagarSubmitData } from "@/components/shared/nova-conta-pagar-modal";
import { EditarContaPagarModal, buildEdicaoFormFromConta, type EdicaoContaFormState } from "@/components/shared/editar-conta-pagar-modal";
import { PagarContaModal, type PagamentoFormState } from "@/components/shared/pagar-conta-modal";

type StatusFiltro = "TODOS" | "EM_ABERTO" | StatusContaPagar;
type CategoriaFiltro = "TODAS" | CategoriaContaPagar;
type TipoFiltro = "TODOS" | string;
type OrigemFiltro = "TODAS" | "MANUAL" | "RECORRENTE";

const GRUPO_DRE_LABEL: Record<string, string> = {
  CUSTO_VARIAVEL: "Custo variável",
  DESPESA_OPERACIONAL: "Despesa operacional",
  DESPESA_FINANCEIRA: "Despesa financeira",
  IMPOSTOS: "Impostos",
};

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

  return (
    <div className="space-y-6">
      {error ? (
        <ListErrorState error={error} onRetry={() => void load()} />
      ) : null}

      <NovaContaPagarModal
        open={openNovaConta}
        onOpenChange={setOpenNovaConta}
        tiposAtivos={tiposAtivos}
        tiposConta={tiposConta}
        formasPagamentoUnicas={formasPagamentoUnicas}
        defaultCompetencia={range.start}
        defaultDataVencimento={range.end}
        todayISO={todayISO()}
        onSubmit={handleCriarConta}
      />
      <PagarContaModal
        open={openPagarConta}
        onOpenChange={setOpenPagarConta}
        conta={selectedConta}
        formasPagamento={formasPagamento}
        todayISO={todayISO()}
        onSubmit={handlePagarConta}
      />

      {edicaoContaForm && (
        <EditarContaPagarModal
          open={openEditarConta}
          onOpenChange={setOpenEditarConta}
          tiposAtivos={tiposAtivos}
          tiposConta={tiposConta}
          contaEditandoId={contaEditandoId}
          initialForm={edicaoContaForm}
          onSubmit={handleSalvarEdicaoConta}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestão de despesas da unidade com classificação DRE e recorrência.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            data={filtered}
            columns={[
              { label: "Vencimento", accessor: (r) => formatDate(r.dataVencimento) },
              { label: "Fornecedor", accessor: (r) => r.fornecedor ?? "" },
              { label: "Descrição", accessor: (r) => r.descricao ?? "" },
              { label: "Categoria", accessor: (r) => r.categoria ?? "" },
              { label: "Valor", accessor: (r) => formatBRL(contaTotal(r)) },
              { label: "Status", accessor: "status" },
            ] satisfies ExportColumn<(typeof filtered)[number]>[]}
            filename="contas-a-pagar"
            title="Contas a Pagar"
          />
          <Button onClick={() => setOpenNovaConta(true)}>
            <Plus className="size-4" />
            Nova conta
          </Button>
        </div>
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

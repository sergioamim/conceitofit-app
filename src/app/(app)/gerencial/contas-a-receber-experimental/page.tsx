"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Beaker, CalendarClock, CheckCircle2, Plus, RefreshCcw, Siren, TrendingUp } from "lucide-react";
import { SuggestionInput, type SuggestionOption } from "@/components/shared/suggestion-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isRealApiEnabled } from "@/lib/api/http";
import {
  listContasReceberExperimental,
  listFormasPagamento,
  receberContaReceberExperimental,
} from "@/lib/mock/services";
import type { Aluno, FormaPagamento, Pagamento, TipoFormaPagamento } from "@/lib/types";

type PagamentoComAluno = Pagamento & {
  aluno?: Aluno;
  clienteNome?: string;
  documentoCliente?: string;
};
type FiltroRapido = "ABERTOS" | "TODOS" | "VENCIDOS" | "VENCE_HOJE" | "PROX_7" | "PAGOS";

const PAGE_SIZE = 12;

const FORMA_PAGAMENTO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

const QUICK_FILTERS: Array<{ value: FiltroRapido; label: string }> = [
  { value: "ABERTOS", label: "Em aberto" },
  { value: "VENCIDOS", label: "Vencidos" },
  { value: "VENCE_HOJE", label: "Vencem hoje" },
  { value: "PROX_7", label: "Próx. 7 dias" },
  { value: "PAGOS", label: "Recebidos" },
  { value: "TODOS", label: "Todos" },
];

function formatBRL(value: number) {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatPct(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function monthRangeFromNow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
    end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
  };
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function getClienteNome(item: PagamentoComAluno): string {
  return item.aluno?.nome ?? item.clienteNome ?? "Cliente sem identificação";
}

function getClienteDocumento(item: PagamentoComAluno): string {
  return item.aluno?.cpf ?? item.documentoCliente ?? "";
}

function getClienteFiltroId(item: PagamentoComAluno): string {
  const alunoId = item.aluno?.id?.trim();
  if (alunoId) return `aluno:${alunoId}`;

  const documento = getClienteDocumento(item).replace(/\D/g, "");
  if (documento) return `doc:${documento}`;

  const nome = getClienteNome(item).trim().toLowerCase();
  return `nome:${nome}`;
}

function isPagamentoAberto(item: PagamentoComAluno) {
  return item.status === "PENDENTE" || item.status === "VENCIDO";
}

function daysUntil(date: string) {
  const target = new Date(`${date}T00:00:00`).getTime();
  const today = new Date(`${todayISO()}T00:00:00`).getTime();
  return Math.floor((target - today) / 86400000);
}

function agingLabel(item: PagamentoComAluno) {
  const delta = daysUntil(item.dataVencimento);
  if (item.status === "VENCIDO" || delta < 0) {
    const abs = Math.abs(delta);
    return { label: `${abs} dia${abs > 1 ? "s" : ""} em atraso`, className: "text-gym-danger" };
  }
  if (delta === 0) return { label: "Vence hoje", className: "text-gym-warning" };
  if (delta <= 3) return { label: `Vence em ${delta} dia${delta > 1 ? "s" : ""}`, className: "text-gym-warning" };
  return { label: `Vence em ${delta} dias`, className: "text-muted-foreground" };
}

function sortRecebimentos(a: PagamentoComAluno, b: PagamentoComAluno) {
  const openA = isPagamentoAberto(a) ? 0 : 1;
  const openB = isPagamentoAberto(b) ? 0 : 1;
  if (openA !== openB) return openA - openB;
  if (openA === 0) {
    const deltaA = daysUntil(a.dataVencimento);
    const deltaB = daysUntil(b.dataVencimento);
    if (deltaA !== deltaB) return deltaA - deltaB;
    return b.valorFinal - a.valorFinal;
  }
  return b.dataVencimento.localeCompare(a.dataVencimento);
}

export default function ContasReceberExperimentalPage() {
  const initialRange = monthRangeFromNow();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagamentos, setPagamentos] = useState<PagamentoComAluno[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>("ABERTOS");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<PagamentoComAluno | null>(null);
  const [recebimento, setRecebimento] = useState<{
    dataPagamento: string;
    formaPagamento: TipoFormaPagamento;
    observacoes: string;
  }>({
    dataPagamento: todayISO(),
    formaPagamento: "PIX",
    observacoes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pagamentosData, formasData] = await Promise.all([
        listContasReceberExperimental(),
        listFormasPagamento({ apenasAtivas: true }),
      ]);
      setPagamentos(pagamentosData);
      setFormasPagamento(formasData);
    } catch (loadError) {
      console.error("[contas-a-receber-experimental] erro ao carregar", loadError);
      setError("Não foi possível carregar as contas a receber agora.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (isRealApiEnabled()) return;
    function handleUpdate() {
      void load();
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [load]);

  const formasDisponiveis = useMemo(() => {
    const seen = new Set<TipoFormaPagamento>();
    return formasPagamento
      .filter((forma) => forma.ativo)
      .filter((forma) => {
        if (seen.has(forma.tipo)) return false;
        seen.add(forma.tipo);
        return true;
      });
  }, [formasPagamento]);

  useEffect(() => {
    if (formasDisponiveis.length === 0) return;
    const hasSelected = formasDisponiveis.some((item) => item.tipo === recebimento.formaPagamento);
    if (!hasSelected) {
      setRecebimento((prev) => ({ ...prev, formaPagamento: formasDisponiveis[0].tipo }));
    }
  }, [formasDisponiveis, recebimento.formaPagamento]);

  const clienteOptions = useMemo<SuggestionOption[]>(() => {
    const unique = new Map<string, SuggestionOption>();
    for (const item of pagamentos) {
      const id = getClienteFiltroId(item);
      if (unique.has(id)) continue;
      const nome = getClienteNome(item);
      const documento = getClienteDocumento(item);
      unique.set(id, {
        id,
        label: documento ? `${nome} · CPF ${documento}` : nome,
        searchText: `${nome} ${documento}`,
      });
    }
    return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [pagamentos]);

  useEffect(() => {
    if (!clienteSelecionadoId) return;
    const selected = clienteOptions.find((item) => item.id === clienteSelecionadoId);
    if (selected && selected.label !== clienteQuery) {
      setClienteQuery(selected.label);
    }
  }, [clienteOptions, clienteQuery, clienteSelecionadoId]);

  const baseFiltered = useMemo(() => {
    const term = clienteQuery.trim().toLowerCase();
    const termDigits = clienteQuery.replace(/\D/g, "");

    return pagamentos.filter((item) => {
      const inRange = item.dataVencimento >= startDate && item.dataVencimento <= endDate;
      if (!inRange) return false;

      if (clienteSelecionadoId) {
        return getClienteFiltroId(item) === clienteSelecionadoId;
      }

      if (!term) return true;
      const nome = getClienteNome(item).toLowerCase();
      const cpf = getClienteDocumento(item).replace(/\D/g, "");
      return nome.includes(term) || (termDigits.length > 0 && cpf.includes(termDigits));
    });
  }, [clienteQuery, clienteSelecionadoId, endDate, pagamentos, startDate]);

  const filtered = useMemo(() => {
    const filteredByStatus = baseFiltered.filter((item) => {
      if (filtroRapido === "TODOS") return true;
      if (filtroRapido === "ABERTOS") return isPagamentoAberto(item);
      if (filtroRapido === "PAGOS") return item.status === "PAGO";
      if (filtroRapido === "VENCIDOS") return item.status === "VENCIDO";
      if (filtroRapido === "VENCE_HOJE") return isPagamentoAberto(item) && daysUntil(item.dataVencimento) === 0;
      if (filtroRapido === "PROX_7") {
        const delta = daysUntil(item.dataVencimento);
        return isPagamentoAberto(item) && delta > 0 && delta <= 7;
      }
      return true;
    });
    return [...filteredByStatus].sort(sortRecebimentos);
  }, [baseFiltered, filtroRapido]);

  useEffect(() => {
    setPage(0);
  }, [clienteSelecionadoId, clienteQuery, filtroRapido, startDate, endDate]);

  const totalFiltrado = filtered.length;
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / PAGE_SIZE));

  useEffect(() => {
    if (page < totalPaginas) return;
    setPage(Math.max(0, totalPaginas - 1));
  }, [page, totalPaginas]);

  const paginaAtual = useMemo(() => {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filtered.slice(start, end);
  }, [filtered, page]);

  const rangeStart = totalFiltrado === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = totalFiltrado === 0 ? 0 : Math.min((page + 1) * PAGE_SIZE, totalFiltrado);

  const quickCounts = useMemo(() => {
    const emAberto = baseFiltered.filter(isPagamentoAberto);
    return {
      TODOS: baseFiltered.length,
      ABERTOS: emAberto.length,
      PAGOS: baseFiltered.filter((item) => item.status === "PAGO").length,
      VENCIDOS: baseFiltered.filter((item) => item.status === "VENCIDO").length,
      VENCE_HOJE: emAberto.filter((item) => daysUntil(item.dataVencimento) === 0).length,
      PROX_7: emAberto.filter((item) => {
        const delta = daysUntil(item.dataVencimento);
        return delta > 0 && delta <= 7;
      }).length,
    };
  }, [baseFiltered]);

  const resumo = useMemo(() => {
    const previsto = baseFiltered.reduce((sum, item) => sum + Number(item.valorFinal ?? 0), 0);
    const recebidoTotal = baseFiltered
      .filter((item) => item.status === "PAGO")
      .reduce((sum, item) => sum + Number(item.valorFinal ?? 0), 0);
    const emAberto = baseFiltered
      .filter((item) => isPagamentoAberto(item))
      .reduce((sum, item) => sum + Number(item.valorFinal ?? 0), 0);
    const vencidoTotal = baseFiltered
      .filter((item) => item.status === "VENCIDO")
      .reduce((sum, item) => sum + Number(item.valorFinal ?? 0), 0);
    const inadimplenciaPct = previsto > 0 ? (vencidoTotal / previsto) * 100 : 0;
    return { previsto, recebidoTotal, emAberto, vencidoTotal, inadimplenciaPct };
  }, [baseFiltered]);

  const aging = useMemo(() => {
    const openItems = filtered.filter(isPagamentoAberto);
    const result = {
      aVencer: { count: 0, valor: 0 },
      atraso1a7: { count: 0, valor: 0 },
      atraso8a30: { count: 0, valor: 0 },
      atrasoMais30: { count: 0, valor: 0 },
    };

    for (const item of openItems) {
      const delta = daysUntil(item.dataVencimento);
      const value = Number(item.valorFinal ?? 0);
      if (delta >= 0) {
        result.aVencer.count += 1;
        result.aVencer.valor += value;
        continue;
      }
      const atraso = Math.abs(delta);
      if (atraso <= 7) {
        result.atraso1a7.count += 1;
        result.atraso1a7.valor += value;
      } else if (atraso <= 30) {
        result.atraso8a30.count += 1;
        result.atraso8a30.valor += value;
      } else {
        result.atrasoMais30.count += 1;
        result.atrasoMais30.valor += value;
      }
    }
    return result;
  }, [filtered]);

  const cobrancaPrioritaria = useMemo(() => {
    return filtered
      .filter(isPagamentoAberto)
      .filter((item) => item.status === "VENCIDO" || daysUntil(item.dataVencimento) <= 2)
      .slice(0, 5);
  }, [filtered]);

  const insights = useMemo(() => {
    const itens: string[] = [];
    if (aging.atrasoMais30.count > 0) {
      itens.push(`Acione cobrança pessoal em ${aging.atrasoMais30.count} títulos com atraso acima de 30 dias.`);
    }
    if (aging.atraso8a30.count > 0) {
      itens.push(`Dispare lembrete com proposta de negociação para ${aging.atraso8a30.count} títulos de 8 a 30 dias.`);
    }
    if (resumo.inadimplenciaPct >= 10) {
      itens.push("Inadimplência acima de 10%: revise política de vencimento e régua de cobrança.");
    }
    if (itens.length === 0) {
      itens.push("Cenário estável: mantenha lembrete automático 3 dias antes do vencimento.");
    }
    return itens.slice(0, 3);
  }, [aging.atraso8a30.count, aging.atrasoMais30.count, resumo.inadimplenciaPct]);

  const abrirDialogRecebimento = useCallback((item: PagamentoComAluno) => {
    setPagamentoSelecionado(item);
    setRecebimento((prev) => ({
      ...prev,
      dataPagamento: todayISO(),
      observacoes: "",
    }));
    setDialogOpen(true);
  }, []);

  const confirmarRecebimento = useCallback(async () => {
    if (!pagamentoSelecionado) return;
    setSaving(true);
    setError(null);
    try {
      await receberContaReceberExperimental(pagamentoSelecionado.id, {
        dataPagamento: recebimento.dataPagamento,
        formaPagamento: recebimento.formaPagamento,
        observacoes: recebimento.observacoes.trim() || undefined,
      });
      setDialogOpen(false);
      setPagamentoSelecionado(null);
      await load();
    } catch (saveError) {
      console.error("[contas-a-receber-experimental] erro ao receber", saveError);
      setError("Não foi possível confirmar o recebimento agora.");
    } finally {
      setSaving(false);
    }
  }, [load, pagamentoSelecionado, recebimento.dataPagamento, recebimento.formaPagamento, recebimento.observacoes]);

  const semDados = !loading && totalFiltrado === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="border-gym-accent/40 text-gym-accent">
            <Beaker className="size-3.5" />
            Protótipo experimental
          </Badge>
          <h1 className="font-display text-2xl font-bold tracking-tight">Contas a Receber amigável e avançado</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Visão de cobrança por prioridade, com aging de atrasos e confirmação rápida de recebimento sem sair da
            lista.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="/gerencial/contas-a-receber-experimental/novo">
              <Plus className="size-4" />
              Novo recebimento
            </Link>
          </Button>
          <Button variant="outline" className="border-border" onClick={() => void load()} disabled={loading}>
            <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filtros rápidos</CardTitle>
          <CardDescription>Combine busca, período e atalho operacional para focar na cobrança certa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px_170px]">
            <SuggestionInput
              value={clienteQuery}
              onValueChange={(value) => {
                setClienteQuery(value);
                setClienteSelecionadoId(null);
              }}
              onSelect={(option) => {
                setClienteSelecionadoId(option.id);
                setClienteQuery(option.label);
              }}
              options={clienteOptions}
              placeholder="Cliente (nome ou CPF)"
              emptyText="Nenhum cliente encontrado"
              minCharsToSearch={3}
            />
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="border-border bg-secondary"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="border-border bg-secondary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={filtroRapido === item.value ? "default" : "outline"}
                className={filtroRapido === item.value ? "" : "border-border"}
                onClick={() => setFiltroRapido(item.value)}
              >
                {item.label} ({quickCounts[item.value]})
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setClienteQuery("");
                setClienteSelecionadoId(null);
              }}
            >
              Todos os clientes
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const month = monthRangeFromNow();
                setStartDate(month.start);
                setEndDate(month.end);
                setClienteQuery("");
                setClienteSelecionadoId(null);
                setFiltroRapido("ABERTOS");
              }}
            >
              Resetar mês atual
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>Previsto no período</CardDescription>
            <CardTitle className="font-display text-2xl">{formatBRL(resumo.previsto)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>Recebido</CardDescription>
            <CardTitle className="font-display text-2xl text-gym-teal">{formatBRL(resumo.recebidoTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>Em aberto</CardDescription>
            <CardTitle className="font-display text-2xl text-gym-warning">{formatBRL(resumo.emAberto)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>Inadimplência</CardDescription>
            <CardTitle className="font-display text-2xl text-gym-danger">{formatPct(resumo.inadimplenciaPct)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {error && (
        <Card className="gap-3 border-gym-danger/40 bg-gym-danger/5 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-base text-gym-danger">
              <AlertTriangle className="size-4" />
              Falha na operação
            </CardTitle>
            <CardDescription className="text-gym-danger/90">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Aging de recebimentos
          </CardTitle>
          <CardDescription>Distribuição dos títulos abertos por faixa de atraso.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-xs text-muted-foreground">A vencer</p>
            <p className="text-lg font-semibold">{aging.aVencer.count} título(s)</p>
            <p className="text-sm text-muted-foreground">{formatBRL(aging.aVencer.valor)}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-xs text-muted-foreground">Atraso 1-7 dias</p>
            <p className="text-lg font-semibold text-gym-warning">{aging.atraso1a7.count} título(s)</p>
            <p className="text-sm text-muted-foreground">{formatBRL(aging.atraso1a7.valor)}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-xs text-muted-foreground">Atraso 8-30 dias</p>
            <p className="text-lg font-semibold text-gym-warning">{aging.atraso8a30.count} título(s)</p>
            <p className="text-sm text-muted-foreground">{formatBRL(aging.atraso8a30.valor)}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-xs text-muted-foreground">Atraso &gt; 30 dias</p>
            <p className="text-lg font-semibold text-gym-danger">{aging.atrasoMais30.count} título(s)</p>
            <p className="text-sm text-muted-foreground">{formatBRL(aging.atrasoMais30.valor)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Siren className="size-4" />
              Fila de cobrança prioritária
            </CardTitle>
            <CardDescription>Primeiros itens para abordar agora e recuperar caixa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {cobrancaPrioritaria.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem títulos críticos no momento.</p>
            )}
            {cobrancaPrioritaria.map((item) => {
              const hint = agingLabel(item);
              return (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 p-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {item.aluno?.nome ?? item.clienteNome ?? "Cliente sem identificação"}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.descricao}</p>
                    <p className={`mt-1 text-xs font-semibold ${hint.className}`}>{hint.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{formatBRL(item.valorFinal)}</p>
                    <Button size="sm" onClick={() => abrirDialogRecebimento(item)}>
                      <CheckCircle2 className="size-4" />
                      Receber
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximas ações recomendadas</CardTitle>
            <CardDescription>Sequência simples para time comercial/financeiro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {insights.map((item) => (
              <div key={item} className="rounded-md border border-border bg-secondary/20 p-2.5 text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista operacional</CardTitle>
          <CardDescription>
            {loading ? "Carregando contas..." : `${totalFiltrado} registro(s) no filtro de clientes.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Carregando contas...
                  </TableCell>
                </TableRow>
              )}
              {semDados && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhum recebimento encontrado para este recorte.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                paginaAtual.map((item) => {
                  const hint = agingLabel(item);
                  const rowWarning = isPagamentoAberto(item) && (item.status === "VENCIDO" || daysUntil(item.dataVencimento) <= 0);
                  return (
                    <TableRow key={item.id} className={rowWarning ? "bg-gym-danger/5" : ""}>
                      <TableCell>
                        <p>{formatDate(item.dataVencimento)}</p>
                        <p className={`text-xs ${hint.className}`}>{isPagamentoAberto(item) ? hint.label : "Recebido"}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{item.aluno?.nome ?? item.clienteNome ?? "Não identificado"}</p>
                        {(item.aluno?.cpf ?? item.documentoCliente) && (
                          <p className="text-xs text-muted-foreground">{item.aluno?.cpf ?? item.documentoCliente}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p>{item.descricao}</p>
                        <p className="text-xs text-muted-foreground">{item.tipo}</p>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gym-accent">{formatBRL(item.valorFinal)}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {isPagamentoAberto(item) ? (
                            <Button size="sm" variant="outline" className="border-border" onClick={() => abrirDialogRecebimento(item)}>
                              Receber
                            </Button>
                          ) : (
                            <span className="self-center text-xs text-muted-foreground">Concluído</span>
                          )}
                          <Button asChild size="sm" variant="ghost" className="text-gym-accent">
                            <Link href={`/gerencial/contas-a-receber-experimental/novo?modo=AJUSTE&pagamentoId=${encodeURIComponent(item.id)}`}>
                              Ajustar
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          {!loading && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">{rangeStart}</span> até{" "}
                <span className="font-semibold text-foreground">{rangeEnd}</span> de{" "}
                <span className="font-semibold text-foreground">{totalFiltrado}</span> registro(s) · página{" "}
                <span className="font-semibold text-foreground">{Math.min(page + 1, totalPaginas)}</span> de{" "}
                <span className="font-semibold text-foreground">{totalPaginas}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="border-border" disabled={page <= 0} onClick={() => setPage((prev) => Math.max(0, prev - 1))}>
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border"
                  disabled={page + 1 >= totalPaginas}
                  onClick={() => setPage((prev) => Math.min(totalPaginas - 1, prev + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Confirmar recebimento</DialogTitle>
            <DialogDescription>
              {pagamentoSelecionado
                ? `Confirmar recebimento de ${pagamentoSelecionado.aluno?.nome ?? pagamentoSelecionado.clienteNome ?? "cliente"} no valor de ${formatBRL(pagamentoSelecionado.valorFinal)}.`
                : "Selecione um lançamento para continuar."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
              <p className="text-muted-foreground">Valor do título</p>
              <p className="font-display text-xl font-bold">{formatBRL(pagamentoSelecionado?.valorFinal ?? 0)}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data do recebimento</label>
                <Input
                  type="date"
                  value={recebimento.dataPagamento}
                  onChange={(event) => setRecebimento((prev) => ({ ...prev, dataPagamento: event.target.value }))}
                  className="border-border bg-secondary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de recebimento</label>
                <Select
                  value={recebimento.formaPagamento}
                  onValueChange={(value) => setRecebimento((prev) => ({ ...prev, formaPagamento: value as TipoFormaPagamento }))}
                >
                  <SelectTrigger className="w-full border-border bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    {(formasDisponiveis.length > 0
                      ? formasDisponiveis.map((item) => item.tipo)
                      : (Object.keys(FORMA_PAGAMENTO_LABEL) as TipoFormaPagamento[])
                    ).map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {FORMA_PAGAMENTO_LABEL[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
              <Input
                value={recebimento.observacoes}
                onChange={(event) => setRecebimento((prev) => ({ ...prev, observacoes: event.target.value }))}
                placeholder="Opcional"
                className="border-border bg-secondary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-border" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void confirmarRecebimento()} disabled={saving || !pagamentoSelecionado}>
              {saving ? "Salvando..." : "Confirmar recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="gap-3 border-gym-accent/25 bg-gym-accent/5 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-gym-accent" />
            Rotina operacional sugerida
          </CardTitle>
          <CardDescription>
            Comece por Vencidos, depois Vencem hoje e finalize com Prox. 7 dias para manter cobrança previsível.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Beaker, CalendarClock, CheckCircle2, Clock3, Plus, RefreshCcw } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isRealApiEnabled } from "@/lib/api/http";
import { listContasPagar, listFormasPagamento, pagarContaPagar } from "@/lib/mock/services";
import type { CategoriaContaPagar, ContaPagar, FormaPagamento, TipoFormaPagamento } from "@/lib/types";

type FiltroRapido = "ABERTAS" | "TODAS" | "VENCIDAS" | "VENCE_HOJE" | "PROX_7" | "PAGAS";

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

const FORMA_PAGAMENTO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

const QUICK_FILTERS: Array<{ value: FiltroRapido; label: string }> = [
  { value: "ABERTAS", label: "Em aberto" },
  { value: "VENCIDAS", label: "Atrasadas" },
  { value: "VENCE_HOJE", label: "Vencem hoje" },
  { value: "PROX_7", label: "Próx. 7 dias" },
  { value: "PAGAS", label: "Pagas" },
  { value: "TODAS", label: "Todas" },
];

function formatBRL(value: number) {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
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

function contaTotal(conta: ContaPagar) {
  return Math.max(0, Number(conta.valorOriginal ?? 0) - Number(conta.desconto ?? 0) + Number(conta.jurosMulta ?? 0));
}

function isContaAberta(conta: ContaPagar) {
  return conta.status === "PENDENTE" || conta.status === "VENCIDA";
}

function daysUntil(date: string) {
  const target = new Date(`${date}T00:00:00`).getTime();
  const today = new Date(`${todayISO()}T00:00:00`).getTime();
  return Math.floor((target - today) / 86400000);
}

function urgencyHint(conta: ContaPagar) {
  const delta = daysUntil(conta.dataVencimento);
  if (conta.status === "VENCIDA" || delta < 0) {
    const days = Math.abs(delta);
    return {
      label: days === 0 ? "Vence hoje" : `${days} dia${days > 1 ? "s" : ""} em atraso`,
      className: "text-gym-danger",
    };
  }
  if (delta === 0) {
    return { label: "Vence hoje", className: "text-gym-warning" };
  }
  if (delta <= 3) {
    return { label: `Vence em ${delta} dia${delta > 1 ? "s" : ""}`, className: "text-gym-warning" };
  }
  return { label: `Vence em ${delta} dias`, className: "text-muted-foreground" };
}

function sortByPriority(a: ContaPagar, b: ContaPagar) {
  const openA = isContaAberta(a) ? 0 : 1;
  const openB = isContaAberta(b) ? 0 : 1;
  if (openA !== openB) return openA - openB;
  if (openA === 0) {
    const deltaA = daysUntil(a.dataVencimento);
    const deltaB = daysUntil(b.dataVencimento);
    if (deltaA !== deltaB) return deltaA - deltaB;
    return contaTotal(b) - contaTotal(a);
  }
  return b.dataVencimento.localeCompare(a.dataVencimento);
}

export default function ContasPagarExperimentalPage() {
  const initialRange = monthRangeFromNow();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>("ABERTAS");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<ContaPagar | null>(null);
  const [pagamento, setPagamento] = useState<{
    dataPagamento: string;
    formaPagamento: TipoFormaPagamento;
    valorPago: string;
    observacoes: string;
  }>({
    dataPagamento: todayISO(),
    formaPagamento: "PIX",
    valorPago: "",
    observacoes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [contasData, formasData] = await Promise.all([
        listContasPagar(),
        listFormasPagamento({ apenasAtivas: true }),
      ]);
      setContas(contasData);
      setFormasPagamento(formasData);
    } catch (loadError) {
      console.error("[contas-a-pagar-experimental] erro ao carregar", loadError);
      setError("Não foi possível carregar as contas a pagar agora.");
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
    const hasSelected = formasDisponiveis.some((item) => item.tipo === pagamento.formaPagamento);
    if (!hasSelected) {
      setPagamento((prev) => ({ ...prev, formaPagamento: formasDisponiveis[0].tipo }));
    }
  }, [formasDisponiveis, pagamento.formaPagamento]);

  const baseFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contas.filter((conta) => {
      const inRange = conta.dataVencimento >= startDate && conta.dataVencimento <= endDate;
      if (!inRange) return false;

      if (!term) return true;
      return (
        conta.fornecedor.toLowerCase().includes(term) ||
        conta.descricao.toLowerCase().includes(term) ||
        (conta.documentoFornecedor ?? "").toLowerCase().includes(term) ||
        (conta.centroCusto ?? "").toLowerCase().includes(term)
      );
    });
  }, [contas, endDate, search, startDate]);

  const filtered = useMemo(() => {
    const filteredByStatus = baseFiltered.filter((conta) => {
      if (filtroRapido === "TODAS") return true;
      if (filtroRapido === "ABERTAS") return isContaAberta(conta);
      if (filtroRapido === "PAGAS") return conta.status === "PAGA";
      if (filtroRapido === "VENCIDAS") return conta.status === "VENCIDA";
      if (filtroRapido === "VENCE_HOJE") return isContaAberta(conta) && daysUntil(conta.dataVencimento) === 0;
      if (filtroRapido === "PROX_7") {
        const delta = daysUntil(conta.dataVencimento);
        return isContaAberta(conta) && delta > 0 && delta <= 7;
      }
      return true;
    });
    return [...filteredByStatus].sort(sortByPriority);
  }, [baseFiltered, filtroRapido]);

  const quickCounts = useMemo(() => {
    const abertas = baseFiltered.filter(isContaAberta);
    return {
      TODAS: baseFiltered.length,
      ABERTAS: abertas.length,
      PAGAS: baseFiltered.filter((item) => item.status === "PAGA").length,
      VENCIDAS: baseFiltered.filter((item) => item.status === "VENCIDA").length,
      VENCE_HOJE: abertas.filter((item) => daysUntil(item.dataVencimento) === 0).length,
      PROX_7: abertas.filter((item) => {
        const delta = daysUntil(item.dataVencimento);
        return delta > 0 && delta <= 7;
      }).length,
    };
  }, [baseFiltered]);

  const resumo = useMemo(() => {
    const totalAberto = baseFiltered.filter(isContaAberta).reduce((sum, item) => sum + contaTotal(item), 0);
    const totalVencido = baseFiltered.filter((item) => item.status === "VENCIDA").reduce((sum, item) => sum + contaTotal(item), 0);
    const totalProxSete = baseFiltered
      .filter((item) => {
        if (!isContaAberta(item)) return false;
        const delta = daysUntil(item.dataVencimento);
        return delta >= 0 && delta <= 7;
      })
      .reduce((sum, item) => sum + contaTotal(item), 0);
    const totalPago = baseFiltered
      .filter((item) => item.status === "PAGA")
      .reduce((sum, item) => sum + Number(item.valorPago ?? contaTotal(item)), 0);
    return { totalAberto, totalVencido, totalProxSete, totalPago };
  }, [baseFiltered]);

  const filaPrioritaria = useMemo(() => {
    return filtered.filter(isContaAberta).slice(0, 5);
  }, [filtered]);

  const abrirDialogBaixa = useCallback((conta: ContaPagar) => {
    setContaSelecionada(conta);
    setPagamento((prev) => ({
      ...prev,
      dataPagamento: todayISO(),
      valorPago: contaTotal(conta).toFixed(2),
      observacoes: "",
    }));
    setDialogOpen(true);
  }, []);

  const confirmarBaixa = useCallback(async () => {
    if (!contaSelecionada) return;
    setSaving(true);
    setError(null);
    try {
      await pagarContaPagar(contaSelecionada.id, {
        dataPagamento: pagamento.dataPagamento,
        formaPagamento: pagamento.formaPagamento,
        valorPago: pagamento.valorPago ? Number(pagamento.valorPago.replace(",", ".")) : undefined,
        observacoes: pagamento.observacoes.trim() || undefined,
      });
      setDialogOpen(false);
      setContaSelecionada(null);
      await load();
    } catch (saveError) {
      console.error("[contas-a-pagar-experimental] erro ao baixar conta", saveError);
      setError("Não foi possível baixar essa conta agora.");
    } finally {
      setSaving(false);
    }
  }, [contaSelecionada, load, pagamento.dataPagamento, pagamento.formaPagamento, pagamento.observacoes, pagamento.valorPago]);

  const semDados = !loading && filtered.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="border-gym-accent/40 text-gym-accent">
            <Beaker className="size-3.5" />
            Protótipo experimental
          </Badge>
          <h1 className="font-display text-2xl font-bold tracking-tight">Contas a Pagar amigável e avançado</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Estrutura inspirada em fluxos simples de contas: prioridade de vencimento, ação rápida de baixa e leitura
            imediata do impacto no caixa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="/gerencial/contas-a-pagar-experimental/nova">
              <Plus className="size-4" />
              Nova conta
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
          <CardDescription>Use busca + período e depois escolha um atalho de prioridade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px_170px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por fornecedor, descrição, centro de custo..."
              className="border-border bg-secondary"
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
                const month = monthRangeFromNow();
                setStartDate(month.start);
                setEndDate(month.end);
                setSearch("");
                setFiltroRapido("ABERTAS");
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
            <CardDescription>Total em aberto</CardDescription>
            <CardTitle className="font-display text-2xl text-gym-warning">{formatBRL(resumo.totalAberto)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>Total em atraso</CardDescription>
            <CardTitle className="font-display text-2xl text-gym-danger">{formatBRL(resumo.totalVencido)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>Vence em até 7 dias</CardDescription>
            <CardTitle className="font-display text-2xl">{formatBRL(resumo.totalProxSete)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>Já pago no filtro</CardDescription>
            <CardTitle className="font-display text-2xl text-gym-teal">{formatBRL(resumo.totalPago)}</CardTitle>
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
            <Clock3 className="size-4" />
            Fila prioritária de pagamento
          </CardTitle>
          <CardDescription>Ordem recomendada para reduzir risco de atraso e multa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {filaPrioritaria.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem contas abertas nessa seleção.</p>
          )}
          {filaPrioritaria.map((item) => {
            const hint = urgencyHint(item);
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 p-3">
                <div>
                  <p className="text-sm font-semibold">{item.fornecedor}</p>
                  <p className="text-xs text-muted-foreground">{item.descricao}</p>
                  <p className={`mt-1 text-xs font-semibold ${hint.className}`}>{hint.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{formatBRL(contaTotal(item))}</p>
                  <Button size="sm" onClick={() => abrirDialogBaixa(item)}>
                    <CheckCircle2 className="size-4" />
                    Baixar
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista operacional</CardTitle>
          <CardDescription>
            {loading ? "Carregando contas..." : `${filtered.length} registro(s) no filtro.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Classificação</TableHead>
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
                    Nenhuma conta encontrada para este recorte.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                filtered.map((item) => {
                  const hint = urgencyHint(item);
                  const rowWarning = isContaAberta(item) && (item.status === "VENCIDA" || daysUntil(item.dataVencimento) <= 0);
                  return (
                    <TableRow key={item.id} className={rowWarning ? "bg-gym-danger/5" : ""}>
                      <TableCell>
                        <p>{formatDate(item.dataVencimento)}</p>
                        <p className={`text-xs ${hint.className}`}>{isContaAberta(item) ? hint.label : "Liquidada"}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{item.fornecedor}</p>
                        <p className="text-xs text-muted-foreground">{item.descricao}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{CATEGORIA_LABEL[item.categoria]}</p>
                        <p className="text-xs text-muted-foreground">{item.centroCusto ?? "Sem centro de custo"}</p>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatBRL(contaTotal(item))}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {isContaAberta(item) ? (
                          <Button size="sm" variant="outline" className="border-border" onClick={() => abrirDialogBaixa(item)}>
                            Baixar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Concluído</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Baixar conta</DialogTitle>
            <DialogDescription>
              {contaSelecionada
                ? `Confirme pagamento de ${contaSelecionada.fornecedor} com vencimento em ${formatDate(contaSelecionada.dataVencimento)}.`
                : "Selecione uma conta para continuar."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
              <p className="text-muted-foreground">Valor de referência</p>
              <p className="font-display text-xl font-bold">{formatBRL(contaSelecionada ? contaTotal(contaSelecionada) : 0)}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data do pagamento</label>
                <Input
                  type="date"
                  value={pagamento.dataPagamento}
                  onChange={(event) => setPagamento((prev) => ({ ...prev, dataPagamento: event.target.value }))}
                  className="border-border bg-secondary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento</label>
                <Select
                  value={pagamento.formaPagamento}
                  onValueChange={(value) => setPagamento((prev) => ({ ...prev, formaPagamento: value as TipoFormaPagamento }))}
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
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor pago</label>
              <Input
                value={pagamento.valorPago}
                onChange={(event) => setPagamento((prev) => ({ ...prev, valorPago: event.target.value }))}
                placeholder="0,00"
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
              <Input
                value={pagamento.observacoes}
                onChange={(event) => setPagamento((prev) => ({ ...prev, observacoes: event.target.value }))}
                placeholder="Opcional"
                className="border-border bg-secondary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-border" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void confirmarBaixa()} disabled={saving || !contaSelecionada}>
              {saving ? "Salvando..." : "Confirmar baixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="gap-3 border-gym-accent/25 bg-gym-accent/5 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-gym-accent" />
            Leitura simplificada para operação diária
          </CardTitle>
          <CardDescription>
            Priorize o bloco Atrasadas, depois Vencem hoje e por fim Prox. 7 dias para manter caixa previsível.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

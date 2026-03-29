"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ListErrorState } from "@/components/shared/list-states";
import { ExportMenu } from "@/components/shared/export-menu";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { getBusinessMonthRange } from "@/lib/business-date";
import {
  listFinancialTransactionsApi,
  createFinancialTransactionApi,
  confirmTransactionApi,
  reverseTransactionApi,
  cancelTransactionApi,
} from "@/lib/api/financial";
import type { FinancialTransaction, FinancialTransactionType, FinancialTransactionStatus } from "@/lib/types";

function formatBRL(v: number) {
  return Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(v?: string) {
  if (!v) return "—";
  return new Date(`${v}T00:00:00`).toLocaleDateString("pt-BR");
}

const TIPO_LABEL: Record<FinancialTransactionType, string> = {
  RECEITA: "Receita",
  DESPESA: "Despesa",
  TRANSFERENCIA: "Transferencia",
  AJUSTE: "Ajuste",
};

const STATUS_BADGE: Record<FinancialTransactionStatus, { class: string; label: string }> = {
  PENDENTE: { class: "bg-gym-warning/15 text-gym-warning", label: "Pendente" },
  CONFIRMADA: { class: "bg-gym-teal/15 text-gym-teal", label: "Confirmada" },
  REVERTIDA: { class: "bg-muted text-muted-foreground", label: "Revertida" },
  CANCELADA: { class: "bg-gym-danger/15 text-gym-danger", label: "Cancelada" },
};

type NovaTransacaoForm = {
  tipo: FinancialTransactionType;
  descricao: string;
  valor: string;
  data: string;
  referencia: string;
  observacoes: string;
};

const INITIAL_FORM: NovaTransacaoForm = {
  tipo: "RECEITA",
  descricao: "",
  valor: "",
  data: "",
  referencia: "",
  observacoes: "",
};

export default function TransacoesPage() {
  const tenantContext = useTenantContext();
  const range = getBusinessMonthRange();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transacoes, setTransacoes] = useState<FinancialTransaction[]>([]);
  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);
  const [openNova, setOpenNova] = useState(false);
  const [form, setForm] = useState<NovaTransacaoForm>(INITIAL_FORM);

  const load = useCallback(async () => {
    if (!tenantContext.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      setTransacoes(
        await listFinancialTransactionsApi({
          tenantId: tenantContext.tenantId,
          startDate,
          endDate,
        }),
      );
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenantContext.tenantId, startDate, endDate]);

  useEffect(() => {
    if (tenantContext.tenantResolved && tenantContext.tenantId) void load();
  }, [load, tenantContext.tenantId, tenantContext.tenantResolved]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transacoes.filter((t) => {
      if (statusFiltro !== "TODOS" && t.status !== statusFiltro) return false;
      if (tipoFiltro !== "TODOS" && t.tipo !== tipoFiltro) return false;
      if (!term) return true;
      return (
        t.descricao.toLowerCase().includes(term) ||
        (t.referencia ?? "").toLowerCase().includes(term) ||
        (t.contaOrigemNome ?? "").toLowerCase().includes(term) ||
        (t.contaDestinoNome ?? "").toLowerCase().includes(term)
      );
    });
  }, [transacoes, statusFiltro, tipoFiltro, search]);

  const resumo = useMemo(() => {
    const receitas = filtered.filter((t) => t.tipo === "RECEITA" && t.status !== "CANCELADA" && t.status !== "REVERTIDA").reduce((s, t) => s + t.valor, 0);
    const despesas = filtered.filter((t) => t.tipo === "DESPESA" && t.status !== "CANCELADA" && t.status !== "REVERTIDA").reduce((s, t) => s + t.valor, 0);
    const pendentes = filtered.filter((t) => t.status === "PENDENTE").length;
    return { receitas, despesas, saldoLiquido: receitas - despesas, pendentes, total: filtered.length };
  }, [filtered]);

  async function handleCriar() {
    if (!form.descricao.trim() || !form.valor || !form.data) return;
    try {
      setError(null);
      await createFinancialTransactionApi({
        tenantId: tenantContext.tenantId,
        tipo: form.tipo,
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        data: form.data,
        referencia: form.referencia.trim() || undefined,
        observacoes: form.observacoes.trim() || undefined,
      });
      setOpenNova(false);
      setForm(INITIAL_FORM);
      await load();
    } catch (err) {
      setError(normalizeErrorMessage(err));
    }
  }

  async function handleAction(id: string, action: "confirm" | "reverse" | "cancel") {
    try {
      setError(null);
      if (action === "confirm") await confirmTransactionApi(id);
      else if (action === "reverse") await reverseTransactionApi(id);
      else await cancelTransactionApi(id);
      await load();
    } catch (err) {
      setError(normalizeErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contabilidade</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Transacoes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registro e controle de transacoes financeiras.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            data={filtered}
            columns={[
              { label: "Data", accessor: (r) => formatDate(r.data) },
              { label: "Tipo", accessor: (r) => TIPO_LABEL[r.tipo] ?? r.tipo },
              { label: "Descricao", accessor: "descricao" },
              { label: "Valor", accessor: (r) => formatBRL(r.valor) },
              { label: "Status", accessor: "status" },
              { label: "Referencia", accessor: (r) => r.referencia ?? "" },
            ]}
            filename="transacoes-contabeis"
            title="Transacoes Contabeis"
          />
          <Button onClick={() => { setForm(INITIAL_FORM); setOpenNova(true); }}>
            <Plus className="size-4" />
            Nova transacao
          </Button>
        </div>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void load()} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Receitas</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">{formatBRL(resumo.receitas)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Despesas</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-danger">{formatBRL(resumo.despesas)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo Liquido</p>
          <p className={`mt-2 font-display text-2xl font-extrabold ${resumo.saldoLiquido >= 0 ? "text-gym-teal" : "text-gym-danger"}`}>
            {formatBRL(resumo.saldoLiquido)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pendentes</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">{resumo.pendentes}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-border bg-secondary pl-9" />
          </div>
          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value="TODOS">Todos os tipos</SelectItem>
              {Object.entries(TIPO_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value="TODOS">Todos os status</SelectItem>
              {Object.entries(STATUS_BADGE).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-border bg-secondary" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border-border bg-secondary" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-card/60" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-semibold">Data</th>
                <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                <th className="px-3 py-2 text-left font-semibold">Descricao</th>
                <th className="px-3 py-2 text-right font-semibold">Valor</th>
                <th className="px-3 py-2 text-center font-semibold">Status</th>
                <th className="px-3 py-2 text-right font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Nenhuma transacao encontrada.</td></tr>
              ) : (
                filtered.map((t) => {
                  const badge = STATUS_BADGE[t.status] ?? STATUS_BADGE.PENDENTE;
                  return (
                    <tr key={t.id} className="transition-colors hover:bg-secondary/30">
                      <td className="px-3 py-2">{formatDate(t.data)}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">{TIPO_LABEL[t.tipo] ?? t.tipo}</span>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{t.descricao}</p>
                        {t.referencia ? <p className="text-xs text-muted-foreground">{t.referencia}</p> : null}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{formatBRL(t.valor)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.class}`}>{badge.label}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {t.status === "PENDENTE" ? (
                            <>
                              <Button variant="ghost" size="sm" className="text-xs text-gym-teal" onClick={() => handleAction(t.id, "confirm")}>Confirmar</Button>
                              <Button variant="ghost" size="sm" className="text-xs text-gym-danger" onClick={() => handleAction(t.id, "cancel")}>Cancelar</Button>
                            </>
                          ) : null}
                          {t.status === "CONFIRMADA" ? (
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleAction(t.id, "reverse")}>
                              <RotateCcw className="mr-1 size-3" />Reverter
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={openNova} onOpenChange={setOpenNova}>
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Nova Transacao</DialogTitle>
            <DialogDescription>Registre uma nova transacao financeira.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as FinancialTransactionType })}>
                  <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    {Object.entries(TIPO_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</label>
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="border-border bg-secondary" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descricao</label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="border-border bg-secondary" placeholder="Descricao da transacao" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor (R$)</label>
                <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="border-border bg-secondary" placeholder="0,00" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referencia</label>
                <Input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} className="border-border bg-secondary" placeholder="Opcional" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observacoes</label>
              <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="border-border bg-secondary" placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNova(false)} className="border-border">Cancelar</Button>
            <Button onClick={handleCriar} disabled={!form.descricao.trim() || !form.valor || !form.data}>Criar transacao</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

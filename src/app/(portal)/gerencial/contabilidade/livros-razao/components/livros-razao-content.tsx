"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ListErrorState } from "@/components/shared/list-states";
import { ExportMenu } from "@/components/shared/export-menu";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useAdminCrud } from "@/lib/query/use-admin-crud";
import { listLedgersApi, createLedgerApi, closeLedgerApi, listLedgerEntriesApi } from "@/lib/api/financial";
import { getBusinessMonthRange } from "@/lib/business-date";
import type { Ledger, LedgerEntry } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/formatters";

type NovoLedgerForm = { nome: string; descricao: string; referencia: string; dataInicio: string; dataFim: string };

const INITIAL_FORM: NovoLedgerForm = { nome: "", descricao: "", referencia: "", dataInicio: "", dataFim: "" };

export type LivrosRazaoContentProps = {
  initialData: Ledger[];
};

export function LivrosRazaoContent({ initialData }: LivrosRazaoContentProps) {
  const tenantContext = useTenantContext();
  const range = getBusinessMonthRange();
  const queryClient = useQueryClient();
  const [statusFiltro, setStatusFiltro] = useState<string>(FILTER_ALL);
  const [search, setSearch] = useState("");
  const [openNovo, setOpenNovo] = useState(false);
  const [form, setForm] = useState<NovoLedgerForm>({ ...INITIAL_FORM, dataInicio: range.start, dataFim: range.end });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { items: ledgersFromQuery, isLoading: loading, error: loadError, refetch, create } = useAdminCrud<Ledger, Parameters<typeof createLedgerApi>[0]>({
    domain: "contabilidade-ledgers",
    tenantId: tenantContext.tenantId,
    enabled: tenantContext.tenantResolved,
    listFn: (tid) => listLedgersApi({ tenantId: tid }),
    createFn: (tid, data) => createLedgerApi({ ...data, tenantId: tid }),
  });

  const ledgers = ledgersFromQuery.length > 0 ? ledgersFromQuery : initialData;

  const closeMutation = useMutation({
    mutationFn: (id: string) => closeLedgerApi(id),
    onSuccess: () => void refetch(),
  });

  const entriesQuery = useQuery<LedgerEntry[]>({
    queryKey: ["admin", "contabilidade-ledger-entries", expandedId],
    queryFn: () => listLedgerEntriesApi(expandedId!),
    enabled: Boolean(expandedId),
    staleTime: 2 * 60_000,
  });

  const error = loadError?.message ?? closeMutation.error?.message ?? null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ledgers.filter((l) => {
      if (statusFiltro !== FILTER_ALL && l.status !== statusFiltro) return false;
      if (!term) return true;
      return l.nome.toLowerCase().includes(term) || l.referencia.toLowerCase().includes(term);
    });
  }, [ledgers, statusFiltro, search]);

  async function handleCriar() {
    if (!form.nome.trim() || !form.referencia.trim() || !form.dataInicio || !form.dataFim) return;
    try {
      await create!.mutateAsync(form);
      setOpenNovo(false);
    } catch {
      // error is surfaced via create.error
    }
  }

  async function handleFechar(id: string) {
    try {
      await closeMutation.mutateAsync(id);
    } catch {
      // error is surfaced via closeMutation.error
    }
  }

  function handleToggleEntries(ledgerId: string) {
    if (expandedId === ledgerId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(ledgerId);
    // Invalidate so it refetches if stale
    queryClient.invalidateQueries({ queryKey: ["admin", "contabilidade-ledger-entries", ledgerId] });
  }

  const entries = entriesQuery.data ?? [];
  const loadingEntries = entriesQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contabilidade</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Livros Razao</h1>
          <p className="mt-1 text-sm text-muted-foreground">Livros contabeis com lancamentos de debito e credito.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            data={filtered}
            columns={[
              { label: "Nome", accessor: "nome" },
              { label: "Referencia", accessor: "referencia" },
              { label: "Inicio", accessor: (r) => formatDate(r.dataInicio) },
              { label: "Fim", accessor: (r) => formatDate(r.dataFim) },
              { label: "Debitos", accessor: (r) => formatBRL(r.totalDebitos) },
              { label: "Creditos", accessor: (r) => formatBRL(r.totalCreditos) },
              { label: "Status", accessor: "status" },
            ]}
            filename="livros-razao"
            title="Livros Razao"
          />
          <Button onClick={() => { setForm({ ...INITIAL_FORM, dataInicio: range.start, dataFim: range.end }); setOpenNovo(true); }}>
            <Plus className="size-4" />
            Novo livro
          </Button>
        </div>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void refetch()} /> : null}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-border bg-secondary pl-9" />
          </div>
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value={FILTER_ALL}>Todos</SelectItem>
              <SelectItem value="ABERTO">Aberto</SelectItem>
              <SelectItem value="FECHADO">Fechado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum livro razao encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ledger) => (
            <div key={ledger.id} className="rounded-xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="size-5 text-gym-teal" />
                  <div>
                    <p className="font-medium">{ledger.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {ledger.referencia} — {formatDate(ledger.dataInicio)} a {formatDate(ledger.dataFim)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <p>Debitos: <span className="font-semibold text-gym-danger">{formatBRL(ledger.totalDebitos)}</span></p>
                    <p>Creditos: <span className="font-semibold text-gym-teal">{formatBRL(ledger.totalCreditos)}</span></p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    ledger.status === "ABERTO" ? "bg-gym-teal/15 text-gym-teal" : "bg-muted text-muted-foreground"
                  }`}>
                    {ledger.status}
                  </span>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleToggleEntries(ledger.id)}>
                    {expandedId === ledger.id ? "Ocultar" : "Lancamentos"}
                  </Button>
                  {ledger.status === "ABERTO" ? (
                    <Button variant="outline" size="sm" className="border-border text-xs" onClick={() => handleFechar(ledger.id)}>
                      Fechar
                    </Button>
                  ) : null}
                </div>
              </div>

              {expandedId === ledger.id ? (
                <div className="border-t border-border px-4 py-3">
                  {loadingEntries ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">Carregando lancamentos...</div>
                  ) : entries.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">Nenhum lancamento registrado.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          <th scope="col" className="px-2 py-1 text-left font-semibold">Data</th>
                          <th scope="col" className="px-2 py-1 text-left font-semibold">Conta</th>
                          <th scope="col" className="px-2 py-1 text-left font-semibold">Tipo</th>
                          <th scope="col" className="px-2 py-1 text-right font-semibold">Valor</th>
                          <th scope="col" className="px-2 py-1 text-left font-semibold">Descricao</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {entries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-secondary/20">
                            <td className="px-2 py-1">{formatDate(entry.dataLancamento)}</td>
                            <td className="px-2 py-1">{entry.contaCodigo ?? "—"} {entry.contaNome ?? ""}</td>
                            <td className="px-2 py-1">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                entry.tipo === "DEBITO" ? "bg-gym-danger/15 text-gym-danger" : "bg-gym-teal/15 text-gym-teal"
                              }`}>
                                {entry.tipo}
                              </span>
                            </td>
                            <td className="px-2 py-1 text-right font-mono">{formatBRL(entry.valor)}</td>
                            <td className="px-2 py-1 text-muted-foreground">{entry.descricao ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Novo Livro Razao</DialogTitle>
            <DialogDescription>Crie um novo livro contabil para o periodo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="border-border bg-secondary" placeholder="Livro Razao Mar/2026" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referencia</label>
              <Input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} className="border-border bg-secondary" placeholder="2026-03" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inicio</label>
                <Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fim</label>
                <Input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} className="border-border bg-secondary" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descricao</label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="border-border bg-secondary" placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)} className="border-border">Cancelar</Button>
            <Button onClick={handleCriar} disabled={!form.nome.trim() || !form.referencia.trim()}>Criar livro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

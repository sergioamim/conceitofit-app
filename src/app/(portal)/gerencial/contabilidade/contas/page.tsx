"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ListErrorState } from "@/components/shared/list-states";
import { ExportMenu } from "@/components/shared/export-menu";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import type { FinancialAccountType } from "@/lib/types";
import { formatBRL } from "@/lib/formatters";
import {
  useContasContabeisWorkspace,
  TIPO_LABEL,
  type NovaContaForm,
} from "./hooks/use-contas-contabeis-workspace";

const INITIAL_FORM: NovaContaForm = {
  codigo: "",
  nome: "",
  tipo: "ATIVO",
  descricao: "",
  contaPaiId: "",
};

const TIPO_OPTIONS: Array<{ value: string; label: string }> = [
  { value: FILTER_ALL, label: "Todos os tipos" },
  ...Object.entries(TIPO_LABEL).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: FILTER_ALL, label: "Todos" },
  { value: "ATIVA", label: "Ativa" },
  { value: "INATIVA", label: "Inativa" },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-card/60" />
      ))}
    </div>
  );
}

export default function ContasContabeisPage() {
  const workspace = useContasContabeisWorkspace();
  const {
    loading, error, filtered, resumo, search, setSearch,
    tipoFiltro, setTipoFiltro, statusFiltro, setStatusFiltro,
    openNovaConta, setOpenNovaConta, handleCriarConta, handleToggleStatus, load,
  } = workspace;

  const [form, setForm] = useState<NovaContaForm>(INITIAL_FORM);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contabilidade</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contas contabeis organizadas por tipo e nivel hierarquico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            data={filtered}
            columns={[
              { label: "Codigo", accessor: "codigo" },
              { label: "Nome", accessor: "nome" },
              { label: "Tipo", accessor: (r) => TIPO_LABEL[r.tipo] ?? r.tipo },
              { label: "Saldo", accessor: (r) => formatBRL(r.saldoAtual) },
              { label: "Status", accessor: "status" },
            ]}
            filename="plano-de-contas"
            title="Plano de Contas"
          />
          <Button onClick={() => { setForm(INITIAL_FORM); setOpenNovaConta(true); }}>
            <Plus className="size-4" />
            Nova conta
          </Button>
        </div>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void load()} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total contas</p>
          <p className="mt-2 text-2xl font-extrabold text-gym-accent">{resumo.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo Ativos</p>
          <p className="mt-2 text-2xl font-extrabold text-gym-teal">{formatBRL(resumo.totalAtivo)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo Passivos</p>
          <p className="mt-2 text-2xl font-extrabold text-gym-warning">{formatBRL(resumo.totalPassivo)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Patrimonio Liquido</p>
          <p className="mt-2 text-2xl font-extrabold text-gym-accent">
            {formatBRL(resumo.totalAtivo - resumo.totalPassivo)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por codigo, nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border bg-secondary pl-9"
            />
          </div>
          <Select value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as any)}>
            <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent className="border-border bg-card">
              {TIPO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as any)}>
            <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent className="border-border bg-card">
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-3 py-2 text-left font-semibold">Codigo</th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Nome</th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Tipo</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Saldo</th>
                <th scope="col" className="px-3 py-2 text-center font-semibold">Status</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((conta) => (
                  <tr key={conta.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-3 py-2 font-mono text-xs">{conta.codigo}</td>
                    <td className="px-3 py-2 font-medium">{conta.nome}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                        {TIPO_LABEL[conta.tipo] ?? conta.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{formatBRL(conta.saldoAtual)}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          conta.status === "ATIVA"
                            ? "bg-gym-teal/15 text-gym-teal"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {conta.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(conta)}
                        className="text-xs"
                      >
                        {conta.status === "ATIVA" ? "Inativar" : "Ativar"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={openNovaConta} onOpenChange={setOpenNovaConta}>
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="">Nova Conta Contabil</DialogTitle>
            <DialogDescription>Preencha os dados da nova conta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Codigo</label>
                <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="border-border bg-secondary" placeholder="1.1.01" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as FinancialAccountType })}>
                  <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    {Object.entries(TIPO_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="border-border bg-secondary" placeholder="Caixa Geral" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descricao</label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="border-border bg-secondary" placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovaConta(false)} className="border-border">Cancelar</Button>
            <Button onClick={() => handleCriarConta(form)} disabled={!form.codigo.trim() || !form.nome.trim()}>Criar conta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

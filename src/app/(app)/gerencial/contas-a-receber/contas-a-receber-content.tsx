"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getBusinessMonthRange } from "@/lib/business-date";
import { listContasReceberOperacionais, type PagamentoComAluno } from "@/lib/tenant/financeiro/recebimentos";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { Aluno } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExportMenu, type ExportColumn } from "@/components/shared/export-menu";
import { isPagamentoEmAberto } from "@/lib/domain/status-helpers";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";

type PagamentoWithAluno = PagamentoComAluno & { aluno?: Aluno };
type StatusFiltro = WithFilterAll<"PENDENTE" | "VENCIDO" | "PAGO" | "CANCELADO" | "EM_ABERTO">;

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function monthRangeFromNow() {
  return getBusinessMonthRange();
}

export function ContasAReceberContent() {
  const { tenantId } = useTenantContext();
  const initialRange = monthRangeFromNow();
  const [loading, setLoading] = useState(true);
  const [pagamentos, setPagamentos] = useState<PagamentoWithAluno[]>([]);
  const [status, setStatus] = useState<StatusFiltro>("EM_ABERTO");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listContasReceberOperacionais({
        tenantId,
        startDate,
        endDate,
      });
      setPagamentos(data);
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const termDigits = search.replace(/\D/g, "");
    return pagamentos.filter((p) => {
      const inRange = p.dataVencimento >= startDate && p.dataVencimento <= endDate;
      if (!inRange) return false;

      if (status === "EM_ABERTO") {
        if (!isPagamentoEmAberto(p.status)) return false;
      } else if (status !== FILTER_ALL && p.status !== status) {
        return false;
      }

      if (!term) return true;
      const nome = p.aluno?.nome?.toLowerCase() ?? "";
      const cpf = p.aluno?.cpf?.replace(/\D/g, "") ?? "";
      const descricao = p.descricao.toLowerCase();
      return (
        nome.includes(term) ||
        descricao.includes(term) ||
        (termDigits.length > 0 && cpf.includes(termDigits))
      );
    });
  }, [pagamentos, startDate, endDate, search, status]);

  const resumo = useMemo(() => {
    const planejado = filtered.reduce((sum, p) => sum + p.valorFinal, 0);
    const recebido = filtered.filter((p) => p.status === "PAGO").reduce((sum, p) => sum + p.valorFinal, 0);
    const aberto = filtered
      .filter((p) => isPagamentoEmAberto(p.status))
      .reduce((sum, p) => sum + p.valorFinal, 0);
    return { planejado, recebido, aberto };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Contas a Receber</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projeção e acompanhamento dos valores planejados para recebimento no período.
          </p>
        </div>
        <ExportMenu
          data={filtered}
          columns={[
            { label: "Vencimento", accessor: (r) => formatDate(r.dataVencimento ?? "") },
            { label: "Cliente", accessor: (r) => r.aluno?.nome ?? "—" },
            { label: "Descrição", accessor: (r) => r.descricao ?? "" },
            { label: "Tipo", accessor: (r) => r.tipo ?? "" },
            { label: "Valor", accessor: (r) => formatBRL(Number(r.valor ?? 0)) },
            { label: "Status", accessor: "status" },
          ] satisfies ExportColumn<(typeof filtered)[number]>[]}
          filename="contas-a-receber"
          title="Contas a Receber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Planejado no filtro</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">{formatBRL(resumo.planejado)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recebido</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">{formatBRL(resumo.recebido)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Em aberto</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">{formatBRL(resumo.aberto)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px_170px_180px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente (nome/CPF) ou descrição..."
            className="bg-secondary border-border"
          />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-secondary border-border"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-secondary border-border"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFiltro)}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="EM_ABERTO">Em aberto</SelectItem>
              <SelectItem value={FILTER_ALL}>Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="VENCIDO">Vencido</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3">
          <Button
            variant="outline"
            className="border-border"
            onClick={() => {
              const range = monthRangeFromNow();
              setStartDate(range.start);
              setEndDate(range.end);
              setStatus("EM_ABERTO");
              setSearch("");
            }}
          >
            Resetar para mês corrente
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Vencimento</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Descrição</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Tipo</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Valor</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum lançamento encontrado para o filtro.
                </td>
              </tr>
            )}
            {!loading && filtered.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-secondary/30">
                <td className="px-4 py-3 text-muted-foreground">{formatDate(item.dataVencimento)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.aluno?.nome ?? "Não identificado"}</p>
                  {item.aluno?.cpf && <p className="text-xs text-muted-foreground">{item.aluno.cpf}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.descricao}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.tipo}</td>
                <td className="px-4 py-3 font-semibold text-gym-accent">{formatBRL(item.valorFinal)}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { getDreGerencial } from "@/lib/mock/services";
import { isRealApiEnabled } from "@/lib/api/http";
import type { CategoriaContaPagar, DREGerencial, GrupoDre } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { Button } from "@/components/ui/button";

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

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percentLabel(value: number) {
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

export default function DrePage() {
  const [loading, setLoading] = useState(true);
  const [dre, setDre] = useState<DREGerencial | null>(null);
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const [customRange, setCustomRange] = useState(false);
  const defaultRange = monthRangeFromNow();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  async function load() {
    setLoading(true);
    try {
      const data = await getDreGerencial(
        customRange
          ? { startDate, endDate }
          : { month: mes, year: ano }
      );
      setDre(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, ano, customRange, startDate, endDate]);

  useEffect(() => {
    if (isRealApiEnabled()) return;
    function handleUpdate() {
      load();
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, ano, customRange, startDate, endDate]);

  const margins = useMemo(() => {
    if (!dre || dre.receitaLiquida <= 0) return { margem: 0, ebitda: 0, resultado: 0 };
    return {
      margem: (dre.margemContribuicao / dre.receitaLiquida) * 100,
      ebitda: (dre.ebitda / dre.receitaLiquida) * 100,
      resultado: (dre.resultadoLiquido / dre.receitaLiquida) * 100,
    };
  }, [dre]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">DRE Gerencial</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demonstrativo de resultado com visão de receita, custos, despesas e performance da unidade.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={customRange}
              onChange={(e) => setCustomRange(e.target.checked)}
            />
            Período personalizado
          </label>
          {!customRange ? (
            <MonthYearPicker month={mes} year={ano} onChange={(next) => { setMes(next.month); setAno(next.year); }} />
          ) : (
            <div className="flex items-center gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px] bg-secondary border-border" />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px] bg-secondary border-border" />
              <Button
                variant="outline"
                className="border-border"
                onClick={() => {
                  const range = monthRangeFromNow();
                  setStartDate(range.start);
                  setEndDate(range.end);
                }}
              >
                Mês atual
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Receita líquida</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-gym-teal">{formatBRL(dre?.receitaLiquida ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Margem de contribuição</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-gym-accent">{formatBRL(dre?.margemContribuicao ?? 0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{percentLabel(margins.margem)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">EBITDA</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-foreground">{formatBRL(dre?.ebitda ?? 0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{percentLabel(margins.ebitda)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resultado líquido</p>
          <p className={`mt-2 font-display text-3xl font-extrabold ${(dre?.resultadoLiquido ?? 0) >= 0 ? "text-gym-teal" : "text-gym-danger"}`}>
            {formatBRL(dre?.resultadoLiquido ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{percentLabel(margins.resultado)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-display text-base font-semibold text-foreground">Estrutura DRE</h2>
            <p className="text-xs text-muted-foreground">
              Período: {dre ? `${new Date(`${dre.periodoInicio}T00:00:00`).toLocaleDateString("pt-BR")} até ${new Date(`${dre.periodoFim}T00:00:00`).toLocaleDateString("pt-BR")}` : "—"}
            </p>
          </div>
          <div className="p-2 md:p-4">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-2 py-2 font-medium text-muted-foreground">Receita bruta</td>
                  <td className="px-2 py-2 text-right font-semibold">{formatBRL(dre?.receitaBruta ?? 0)}</td>
                </tr>
                <tr>
                  <td className="px-2 py-2 text-gym-danger">(-) Deduções da receita</td>
                  <td className="px-2 py-2 text-right font-semibold text-gym-danger">{formatBRL(dre?.deducoesReceita ?? 0)}</td>
                </tr>
                <tr className="bg-secondary/40">
                  <td className="px-2 py-2 font-semibold">= Receita líquida</td>
                  <td className="px-2 py-2 text-right font-bold text-gym-teal">{formatBRL(dre?.receitaLiquida ?? 0)}</td>
                </tr>
                <tr>
                  <td className="px-2 py-2 text-gym-danger">(-) Custos variáveis</td>
                  <td className="px-2 py-2 text-right font-semibold text-gym-danger">{formatBRL(dre?.custosVariaveis ?? 0)}</td>
                </tr>
                <tr className="bg-secondary/40">
                  <td className="px-2 py-2 font-semibold">= Margem de contribuição</td>
                  <td className="px-2 py-2 text-right font-bold">{formatBRL(dre?.margemContribuicao ?? 0)}</td>
                </tr>
                <tr>
                  <td className="px-2 py-2 text-gym-danger">(-) Despesas operacionais</td>
                  <td className="px-2 py-2 text-right font-semibold text-gym-danger">{formatBRL(dre?.despesasOperacionais ?? 0)}</td>
                </tr>
                <tr className="bg-secondary/40">
                  <td className="px-2 py-2 font-semibold">= EBITDA</td>
                  <td className="px-2 py-2 text-right font-bold">{formatBRL(dre?.ebitda ?? 0)}</td>
                </tr>
                <tr className="bg-secondary/40">
                  <td className="px-2 py-2 font-semibold">= Resultado líquido</td>
                  <td className={`px-2 py-2 text-right font-bold ${(dre?.resultadoLiquido ?? 0) >= 0 ? "text-gym-teal" : "text-gym-danger"}`}>
                    {formatBRL(dre?.resultadoLiquido ?? 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Indicadores financeiros</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ticket médio recebido</span>
                <span className="font-semibold">{formatBRL(dre?.ticketMedio ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Inadimplência</span>
                <span className="font-semibold text-gym-danger">{formatBRL(dre?.inadimplencia ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contas a receber (aberto)</span>
                <span className="font-semibold text-gym-warning">{formatBRL(dre?.contasReceberEmAberto ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contas a pagar (aberto)</span>
                <span className="font-semibold text-gym-warning">{formatBRL(dre?.contasPagarEmAberto ?? 0)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Despesas pagas por grupo DRE</h3>
            <div className="mt-3 space-y-2">
              {(dre?.despesasPorGrupo ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">{loading ? "Carregando..." : "Sem despesas pagas no período."}</p>
              )}
              {(dre?.despesasPorGrupo ?? []).map((item) => (
                <div key={item.grupo} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{GRUPO_DRE_LABEL[item.grupo]}</span>
                  <span className="font-semibold">{formatBRL(item.valor)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Despesas pagas por categoria</h3>
            <div className="mt-3 space-y-2">
              {(dre?.despesasPorCategoria ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">{loading ? "Carregando..." : "Sem despesas pagas no período."}</p>
              )}
              {(dre?.despesasPorCategoria ?? []).map((item) => (
                <div key={item.categoria} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{CATEGORIA_LABEL[item.categoria]}</span>
                  <span className="font-semibold">{formatBRL(item.valor)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Saneamento de classificação</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Despesas sem tipo</span>
                <span className="font-semibold">{dre?.despesasSemTipoCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valor sem tipo</span>
                <span className="font-semibold text-gym-warning">
                  {formatBRL(dre?.despesasSemTipoValor ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

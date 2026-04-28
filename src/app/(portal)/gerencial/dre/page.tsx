"use client";

import { useMemo, useState } from "react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { getBusinessCurrentMonthYear, getBusinessMonthRange } from "@/lib/business-date";
import { useDreGerencial, useDreProjecao } from "@/lib/query/use-dre";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { CategoriaContaPagar, DreProjectionScenario, GrupoDre } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExportMenu, type ExportColumn } from "@/components/shared/export-menu";
import { ListErrorState } from "@/components/shared/list-states";
import { formatBRL, formatDate } from "@/lib/formatters";

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

function percentLabel(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function monthRangeFromNow() {
  return getBusinessMonthRange();
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const CENARIO_LABEL: Record<DreProjectionScenario, string> = {
  BASE: "Base",
  OTIMISTA: "Otimista",
  CONSERVADOR: "Conservador",
};

export default function DrePage() {
  const tenantContext = useTenantContext();
  const [mes, setMes] = useState(() => getBusinessCurrentMonthYear().month);
  const [ano, setAno] = useState(() => getBusinessCurrentMonthYear().year);
  const [customRange, setCustomRange] = useState(false);
  const defaultRange = monthRangeFromNow();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [cenarioProjecao, setCenarioProjecao] = useState<DreProjectionScenario>("BASE");
  const [projecaoStartDate, setProjecaoStartDate] = useState(() => {
    const { month, year } = getBusinessCurrentMonthYear();
    return toISODate(new Date(year, month, 1));
  });
  const [projecaoEndDate, setProjecaoEndDate] = useState(() => {
    const { month, year } = getBusinessCurrentMonthYear();
    return toISODate(addMonths(new Date(year, month + 1, 0), 3));
  });

  const {
    data: dre,
    isLoading: loading,
    error: dreError,
    refetch: refetchDre,
  } = useDreGerencial({
    tenantId: tenantContext.tenantId,
    tenantResolved: tenantContext.tenantResolved,
    month: mes,
    year: ano,
    startDate,
    endDate,
    customRange,
  });

  const error = dreError ? normalizeErrorMessage(dreError) : null;

  const {
    data: projecao,
    isLoading: loadingProjecao,
    error: projecaoQueryError,
  } = useDreProjecao({
    tenantId: tenantContext.tenantId,
    tenantResolved: tenantContext.tenantResolved,
    startDate: projecaoStartDate,
    endDate: projecaoEndDate,
    cenario: cenarioProjecao,
  });

  const projecaoError = projecaoQueryError ? normalizeErrorMessage(projecaoQueryError) : null;

  const margins = useMemo(() => {
    if (!dre || dre.receitaLiquida <= 0) return { margem: 0, ebitda: 0, resultado: 0 };
    return {
      margem: (dre.margemContribuicao / dre.receitaLiquida) * 100,
      ebitda: (dre.ebitda / dre.receitaLiquida) * 100,
      resultado: (dre.resultadoLiquido / dre.receitaLiquida) * 100,
    };
  }, [dre]);

  const dreExportData = useMemo(() => {
    if (!dre) return [];
    return [
      { etapa: "Receita bruta", valor: formatBRL(dre.receitaBruta) },
      { etapa: "(-) Deduções da receita", valor: formatBRL(dre.deducoesReceita) },
      { etapa: "= Receita líquida", valor: formatBRL(dre.receitaLiquida) },
      { etapa: "(-) Custos variáveis", valor: formatBRL(dre.custosVariaveis) },
      { etapa: "= Margem de contribuição", valor: formatBRL(dre.margemContribuicao) },
      { etapa: "(-) Despesas operacionais", valor: formatBRL(dre.despesasOperacionais) },
      { etapa: "= EBITDA", valor: formatBRL(dre.ebitda) },
      { etapa: "= Resultado líquido", valor: formatBRL(dre.resultadoLiquido) },
    ];
  }, [dre]);

  const dreExportColumns: ExportColumn<(typeof dreExportData)[number]>[] = [
    { label: "Etapa", accessor: "etapa" },
    { label: "Valor", accessor: "valor" },
  ];

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
          <ExportMenu data={dreExportData} columns={dreExportColumns} filename="dre-gerencial" title="DRE Gerencial" disabled={!dre} />
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
          <p className="mt-2 text-3xl font-extrabold text-gym-teal">{formatBRL(dre?.receitaLiquida ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Margem de contribuição</p>
          <p className="mt-2 text-3xl font-extrabold text-gym-accent">{formatBRL(dre?.margemContribuicao ?? 0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{percentLabel(margins.margem)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">EBITDA</p>
          <p className="mt-2 text-3xl font-extrabold text-foreground">{formatBRL(dre?.ebitda ?? 0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{percentLabel(margins.ebitda)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resultado líquido</p>
          <p className={`mt-2 text-3xl font-extrabold ${(dre?.resultadoLiquido ?? 0) >= 0 ? "text-gym-teal" : "text-gym-danger"}`}>
            {formatBRL(dre?.resultadoLiquido ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{percentLabel(margins.resultado)}</p>
        </div>
      </div>

      {error ? (
        <ListErrorState error={error} onRetry={() => void refetchDre()} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">Estrutura DRE</h2>
            <p className="text-xs text-muted-foreground">
              Período: {dre ? `${formatDate(dre.periodoInicio)} até ${formatDate(dre.periodoFim)}` : "—"}
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
            <h3 className="text-sm font-semibold text-foreground">Indicadores financeiros</h3>
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
            <h3 className="text-sm font-semibold text-foreground">Despesas pagas por grupo DRE</h3>
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
            <h3 className="text-sm font-semibold text-foreground">Despesas pagas por categoria</h3>
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
            <h3 className="text-sm font-semibold text-foreground">Saneamento de classificação</h3>
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

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Projeção DRE por competência</h2>
              <p className="text-xs text-muted-foreground">
                Visão futuro: realizado, projetado e consolidado no período selecionado.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={cenarioProjecao}
                onValueChange={(value) => setCenarioProjecao(value as DreProjectionScenario)}
              >
                <SelectTrigger className="w-[150px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(CENARIO_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={projecaoStartDate}
                onChange={(e) => setProjecaoStartDate(e.target.value)}
                className="w-[160px] bg-secondary border-border"
              />
              <Input
                type="date"
                value={projecaoEndDate}
                onChange={(e) => setProjecaoEndDate(e.target.value)}
                className="w-[160px] bg-secondary border-border"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Realizado</p>
            <p className="mt-2 text-sm text-muted-foreground">Receitas</p>
            <p className="font-display text-xl font-extrabold text-gym-teal">{formatBRL(projecao?.realizado.receitas ?? 0)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Despesas</p>
            <p className="font-display text-xl font-bold text-gym-danger">{formatBRL(projecao?.realizado.despesas ?? 0)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Resultado</p>
            <p className={`font-display text-xl font-bold ${(projecao?.realizado.resultado ?? 0) >= 0 ? "text-gym-teal" : "text-gym-danger"}`}>
              {formatBRL(projecao?.realizado.resultado ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Projetado</p>
            <p className="mt-2 text-sm text-muted-foreground">Receitas</p>
            <p className="font-display text-xl font-extrabold text-gym-accent">{formatBRL(projecao?.projetado.receitas ?? 0)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Despesas</p>
            <p className="font-display text-xl font-bold text-gym-warning">{formatBRL(projecao?.projetado.despesas ?? 0)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Resultado</p>
            <p className={`font-display text-xl font-bold ${(projecao?.projetado.resultado ?? 0) >= 0 ? "text-gym-teal" : "text-gym-danger"}`}>
              {formatBRL(projecao?.projetado.resultado ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Consolidado</p>
            <p className="mt-2 text-sm text-muted-foreground">Receitas</p>
            <p className="font-display text-xl font-extrabold text-foreground">{formatBRL(projecao?.consolidado.receitas ?? 0)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Despesas</p>
            <p className="font-display text-xl font-bold text-foreground">{formatBRL(projecao?.consolidado.despesas ?? 0)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Resultado</p>
            <p className={`font-display text-xl font-bold ${(projecao?.consolidado.resultado ?? 0) >= 0 ? "text-gym-teal" : "text-gym-danger"}`}>
              {formatBRL(projecao?.consolidado.resultado ?? 0)}
            </p>
          </div>
        </div>
        <div className="border-t border-border p-4">
          <h3 className="mb-2 text-sm font-semibold">Linhas da projeção</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="px-3 py-2 text-left font-semibold">Grupo</th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">Natureza</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Realizado</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Projetado</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Consolidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingProjecao && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Carregando projeção...
                    </td>
                  </tr>
                )}
                {!loadingProjecao && (projecao?.linhas ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Sem dados de projeção para o período.
                    </td>
                  </tr>
                )}
                {!loadingProjecao &&
                  (projecao?.linhas ?? []).map((linha) => (
                    <tr key={`${linha.grupo}-${linha.natureza}`}>
                      <td className="px-3 py-2">{linha.grupo}</td>
                      <td className="px-3 py-2 text-muted-foreground">{linha.natureza}</td>
                      <td className="px-3 py-2 text-right">{formatBRL(linha.realizado)}</td>
                      <td className="px-3 py-2 text-right">{formatBRL(linha.projetado)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatBRL(linha.consolidado)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {projecaoError ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {projecaoError}
        </div>
      ) : null}
    </div>
  );
}

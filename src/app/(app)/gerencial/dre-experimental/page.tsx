"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Beaker, CalendarClock, Gauge, RefreshCcw } from "lucide-react";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isRealApiEnabled } from "@/lib/api/http";
import { getDreGerencial, getDreProjecao } from "@/lib/mock/services";
import type { DREProjecao, DREGerencial, DreProjectionScenario, GrupoDre } from "@/lib/types";

const CENARIO_LABEL: Record<DreProjectionScenario, string> = {
  BASE: "Base",
  OTIMISTA: "Otimista",
  CONSERVADOR: "Conservador",
};

const CENARIO_AJUDA: Record<DreProjectionScenario, string> = {
  BASE: "Crescimento linear com o ritmo operacional atual.",
  OTIMISTA: "Considera aumento de receita e boa previsibilidade de recebimento.",
  CONSERVADOR: "Assume cenário de cautela com menor conversão e maior pressão de custos.",
};

const GRUPO_LABEL: Record<GrupoDre, string> = {
  CUSTO_VARIAVEL: "Custos variáveis",
  DESPESA_OPERACIONAL: "Despesas operacionais",
  DESPESA_FINANCEIRA: "Despesas financeiras",
  IMPOSTOS: "Impostos",
};

const HORIZONTE_OPTIONS = [
  { value: "3", label: "Próximos 3 meses" },
  { value: "6", label: "Próximos 6 meses" },
  { value: "12", label: "Próximos 12 meses" },
] as const;

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPct(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthRange(month: number, year: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    startDate: toISODate(start),
    endDate: toISODate(end),
  };
}

function projectionRange(month: number, year: number, horizonMonths: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + horizonMonths, 0);
  return {
    startDate: toISODate(start),
    endDate: toISODate(end),
  };
}

function ratioPercent(part: number, total: number) {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

function toDatePtBr(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function clampWidth(value: number) {
  return Math.min(100, Math.max(0, value));
}

export default function DreExperimentalPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth());
  const [ano, setAno] = useState(now.getFullYear());
  const [horizonte, setHorizonte] = useState<(typeof HORIZONTE_OPTIONS)[number]["value"]>("6");
  const [cenario, setCenario] = useState<DreProjectionScenario>("BASE");
  const [dre, setDre] = useState<DREGerencial | null>(null);
  const [projecao, setProjecao] = useState<DREProjecao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const horizonMonths = Number(horizonte);
      const projRange = projectionRange(mes, ano, horizonMonths);
      const [dreData, projectionData] = await Promise.all([
        getDreGerencial({ month: mes, year: ano }),
        getDreProjecao({
          startDate: projRange.startDate,
          endDate: projRange.endDate,
          cenario,
        }),
      ]);
      setDre(dreData);
      setProjecao(projectionData);
    } catch (loadError) {
      console.error("[dre-experimental] erro ao carregar dados", loadError);
      setError("Não foi possível carregar o DRE experimental agora.");
    } finally {
      setLoading(false);
    }
  }, [ano, cenario, horizonte, mes]);

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

  const resumo = useMemo(() => {
    const receitaLiquida = Number(dre?.receitaLiquida ?? 0);
    const gastoTotal = Number(dre?.custosVariaveis ?? 0) + Number(dre?.despesasOperacionais ?? 0);
    const resultadoLiquido = Number(dre?.resultadoLiquido ?? 0);
    const margemLiquida = ratioPercent(resultadoLiquido, receitaLiquida);
    const custoVariavelPercentual = ratioPercent(Number(dre?.custosVariaveis ?? 0), receitaLiquida);
    const fatorContribuicao = 1 - custoVariavelPercentual / 100;
    const pontoEquilibrio =
      receitaLiquida > 0 ? Number(dre?.despesasOperacionais ?? 0) / Math.max(0.05, fatorContribuicao) : 0;
    const coberturaAbertos =
      Number(dre?.contasPagarEmAberto ?? 0) > 0
        ? Number(dre?.contasReceberEmAberto ?? 0) / Number(dre?.contasPagarEmAberto ?? 0)
        : 999;
    return {
      receitaLiquida,
      gastoTotal,
      resultadoLiquido,
      margemLiquida,
      custoVariavelPercentual,
      pontoEquilibrio,
      coberturaAbertos,
    };
  }, [dre]);

  const semDados = useMemo(() => {
    if (!dre) return false;
    const principal = Number(dre.receitaLiquida) + Number(dre.custosVariaveis) + Number(dre.despesasOperacionais);
    return principal === 0 && dre.despesasPorGrupo.length === 0 && dre.despesasPorCategoria.length === 0;
  }, [dre]);

  const faixaSaude = useMemo(() => {
    if (!dre || !projecao) {
      return {
        label: "Sem leitura",
        detalhe: "Carregando dados para classificar.",
        badgeClass: "border-border text-muted-foreground",
      };
    }

    const resultadoConsolidado = Number(projecao.consolidado.resultado ?? 0);
    const inadimplenciaPct = ratioPercent(Number(dre.inadimplencia ?? 0), Math.max(1, Number(dre.receitaLiquida ?? 0)));

    if (resultadoConsolidado < 0 || resumo.coberturaAbertos < 0.9) {
      return {
        label: "Atenção alta",
        detalhe: "Risco de pressão de caixa. Priorize cobrança e revisão de despesas.",
        badgeClass: "border-gym-danger/40 bg-gym-danger/10 text-gym-danger",
      };
    }

    if (inadimplenciaPct > 10 || resumo.margemLiquida < 8) {
      return {
        label: "Atenção moderada",
        detalhe: "Resultado positivo, mas sensível a variações de receita.",
        badgeClass: "border-gym-warning/40 bg-gym-warning/10 text-gym-warning",
      };
    }

    return {
      label: "Saudável",
      detalhe: "Resultado equilibrado com boa previsibilidade financeira.",
      badgeClass: "border-gym-teal/40 bg-gym-teal/10 text-gym-teal",
    };
  }, [dre, projecao, resumo.coberturaAbertos, resumo.margemLiquida]);

  const acoes = useMemo(() => {
    if (!dre || !projecao) return [];
    const itens: string[] = [];
    if (Number(dre.inadimplencia ?? 0) > Number(dre.receitaLiquida ?? 0) * 0.08) {
      itens.push("Ative uma régua de cobrança semanal para reduzir inadimplência.");
    }
    if (Number(dre.custosVariaveis ?? 0) > Number(dre.receitaLiquida ?? 0) * 0.45) {
      itens.push("Renegocie custos variáveis para proteger margem de contribuição.");
    }
    if (dre.despesasSemTipoCount > 0) {
      itens.push(`Classifique ${dre.despesasSemTipoCount} despesas sem tipo para melhorar a leitura da DRE.`);
    }
    if (Number(projecao.projetado.resultado ?? 0) < 0) {
      itens.push("Segure gastos não essenciais no próximo ciclo para estabilizar o cenário futuro.");
    }
    if (itens.length === 0) {
      itens.push("Mantenha o ritmo atual e faça revisão quinzenal dos indicadores.");
    }
    return itens.slice(0, 4);
  }, [dre, projecao]);

  const escadaDre = useMemo(() => {
    return [
      {
        etapa: "Receita bruta",
        descricao: "Total faturado antes de descontos.",
        valor: Number(dre?.receitaBruta ?? 0),
        destaque: false,
        corValor: "text-foreground",
      },
      {
        etapa: "(-) Deduções",
        descricao: "Descontos e abatimentos aplicados.",
        valor: Number(dre?.deducoesReceita ?? 0),
        destaque: false,
        corValor: "text-gym-danger",
      },
      {
        etapa: "(=) Receita líquida",
        descricao: "Dinheiro efetivo da operação.",
        valor: Number(dre?.receitaLiquida ?? 0),
        destaque: true,
        corValor: "text-gym-teal",
      },
      {
        etapa: "(-) Custos variáveis",
        descricao: "Custos que aumentam junto com as vendas.",
        valor: Number(dre?.custosVariaveis ?? 0),
        destaque: false,
        corValor: "text-gym-danger",
      },
      {
        etapa: "(=) Margem de contribuição",
        descricao: "Valor que sobra para cobrir despesas fixas.",
        valor: Number(dre?.margemContribuicao ?? 0),
        destaque: true,
        corValor: "text-foreground",
      },
      {
        etapa: "(-) Despesas operacionais",
        descricao: "Estrutura, equipe e operação administrativa.",
        valor: Number(dre?.despesasOperacionais ?? 0),
        destaque: false,
        corValor: "text-gym-danger",
      },
      {
        etapa: "(=) Resultado líquido",
        descricao: "O que efetivamente sobrou no período.",
        valor: Number(dre?.resultadoLiquido ?? 0),
        destaque: true,
        corValor: Number(dre?.resultadoLiquido ?? 0) >= 0 ? "text-gym-teal" : "text-gym-danger",
      },
    ];
  }, [dre]);

  const loadingInicial = loading && !dre && !projecao;
  const periodoMensal = monthRange(mes, ano);
  const periodoProjecao = projectionRange(mes, ano, Number(horizonte));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="border-gym-accent/40 text-gym-accent">
            <Beaker className="size-3.5" />
            Protótipo experimental
          </Badge>
          <h1 className="font-display text-2xl font-bold tracking-tight">DRE avançado, simples para leigos</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Painel didático para entender receita, gastos e lucro em poucos segundos, com visão futura integrada no
            mesmo fluxo.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mês base</label>
            <MonthYearPicker
              month={mes}
              year={ano}
              onChange={(next) => {
                setMes(next.month);
                setAno(next.year);
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Horizonte futuro
            </label>
            <Select value={horizonte} onValueChange={(value) => setHorizonte(value as (typeof HORIZONTE_OPTIONS)[number]["value"])}>
              <SelectTrigger className="h-9 w-[180px] border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {HORIZONTE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cenário</label>
            <Select value={cenario} onValueChange={(value) => setCenario(value as DreProjectionScenario)}>
              <SelectTrigger className="h-9 w-[150px] border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {Object.entries(CENARIO_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="h-9 border-border" onClick={() => void load()} disabled={loading}>
            <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="gap-3 border-gym-danger/40 bg-gym-danger/5 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-base text-gym-danger">
              <AlertTriangle className="size-4" />
              Falha ao carregar dados
            </CardTitle>
            <CardDescription className="text-gym-danger/90">{error}</CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <Button variant="outline" className="border-gym-danger/40" onClick={() => void load()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {loadingInicial && (
        <Card>
          <CardHeader>
            <CardTitle>Carregando DRE experimental...</CardTitle>
            <CardDescription>Buscando dados financeiros e projeções para montar o painel.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!loadingInicial && semDados && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum dado no período selecionado</CardTitle>
            <CardDescription>
              Ainda não há lançamentos suficientes para a leitura da DRE. Registre receitas e despesas para ativar os
              insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
              Sugestão: comece registrando contas pagas e recebimentos do mês para liberar o comparativo com projeção
              futura.
            </div>
          </CardContent>
        </Card>
      )}

      {!loadingInicial && !semDados && dre && projecao && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="gap-3 py-4">
              <CardHeader className="px-4 pb-0">
                <CardDescription>Dinheiro que entrou</CardDescription>
                <CardTitle className="font-display text-2xl text-gym-teal">{formatBRL(resumo.receitaLiquida)}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-0 text-xs text-muted-foreground">
                Ticket médio: {formatBRL(Number(dre.ticketMedio ?? 0))}
              </CardContent>
            </Card>

            <Card className="gap-3 py-4">
              <CardHeader className="px-4 pb-0">
                <CardDescription>Dinheiro que saiu</CardDescription>
                <CardTitle className="font-display text-2xl text-gym-danger">{formatBRL(resumo.gastoTotal)}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-0 text-xs text-muted-foreground">
                {formatPct(resumo.custoVariavelPercentual)} da receita está em custos variáveis.
              </CardContent>
            </Card>

            <Card className="gap-3 py-4">
              <CardHeader className="px-4 pb-0">
                <CardDescription>Lucro líquido</CardDescription>
                <CardTitle
                  className={`font-display text-2xl ${resumo.resultadoLiquido >= 0 ? "text-gym-teal" : "text-gym-danger"}`}
                >
                  {formatBRL(resumo.resultadoLiquido)}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-0 text-xs text-muted-foreground">
                Margem líquida: {formatPct(resumo.margemLiquida)}
              </CardContent>
            </Card>

            <Card className="gap-3 py-4">
              <CardHeader className="px-4 pb-0">
                <CardDescription>Ponto de equilíbrio</CardDescription>
                <CardTitle className="font-display text-2xl">{formatBRL(resumo.pontoEquilibrio)}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-0 text-xs text-muted-foreground">
                Receita mínima estimada para cobrir despesas operacionais.
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Como ler esse painel em 30 segundos</CardTitle>
              <CardDescription>Resumo guiado para quem não é da área contábil.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                <p className="font-semibold">1. Veja o que entrou</p>
                <p className="mt-1 text-muted-foreground">
                  Use o card de receita líquida para entender quanto dinheiro realmente ficou disponível.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                <p className="font-semibold">2. Compare com o que saiu</p>
                <p className="mt-1 text-muted-foreground">
                  Se os gastos crescem mais rápido que a receita, a margem cai e o risco aumenta.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                <p className="font-semibold">3. Valide o futuro</p>
                <p className="mt-1 text-muted-foreground">
                  A projeção mostra se o cenário mantém lucro ou se precisa de ajustes imediatos.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Escada da DRE (didática)</CardTitle>
                <CardDescription>
                  Período mensal: {toDatePtBr(periodoMensal.startDate)} até {toDatePtBr(periodoMensal.endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Etapa</TableHead>
                      <TableHead>O que significa</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escadaDre.map((linha) => (
                      <TableRow key={linha.etapa} className={linha.destaque ? "bg-secondary/30" : ""}>
                        <TableCell className="font-medium">{linha.etapa}</TableCell>
                        <TableCell className="text-muted-foreground">{linha.descricao}</TableCell>
                        <TableCell className={`text-right font-semibold ${linha.corValor}`}>{formatBRL(linha.valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="size-4" />
                    Semáforo financeiro
                  </CardTitle>
                  <CardDescription>Leitura automática da saúde atual + futuro.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant="outline" className={faixaSaude.badgeClass}>
                    {faixaSaude.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{faixaSaude.detalhe}</p>

                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Inadimplência</span>
                        <span>{formatPct(ratioPercent(Number(dre.inadimplencia ?? 0), Math.max(1, Number(dre.receitaLiquida ?? 0))))}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-gym-warning"
                          style={{
                            width: `${clampWidth(ratioPercent(Number(dre.inadimplencia ?? 0), Math.max(1, Number(dre.receitaLiquida ?? 0))))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Cobertura de abertos</span>
                        <span>{resumo.coberturaAbertos >= 999 ? "Sem contas a pagar abertas" : `${resumo.coberturaAbertos.toFixed(2)}x`}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-gym-teal"
                          style={{ width: `${clampWidth(Math.min(100, resumo.coberturaAbertos * 50))}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Margem líquida</span>
                        <span>{formatPct(resumo.margemLiquida)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className={`h-2 rounded-full ${resumo.margemLiquida >= 0 ? "bg-gym-accent" : "bg-gym-danger"}`}
                          style={{ width: `${clampWidth(Math.abs(resumo.margemLiquida))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Próximas ações recomendadas</CardTitle>
                  <CardDescription>Prioridades objetivas para preservar o resultado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {acoes.map((item) => (
                    <div key={item} className="rounded-md border border-border bg-secondary/20 p-2.5 text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-4" />
                Projeção futura simplificada
              </CardTitle>
              <CardDescription>
                Janela: {toDatePtBr(periodoProjecao.startDate)} até {toDatePtBr(periodoProjecao.endDate)} | Cenário{" "}
                {CENARIO_LABEL[cenario]}: {CENARIO_AJUDA[cenario]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-secondary/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Realizado</p>
                  <p className="mt-2 text-xs text-muted-foreground">Resultado acumulado</p>
                  <p
                    className={`font-display text-xl font-bold ${
                      Number(projecao.realizado.resultado ?? 0) >= 0 ? "text-gym-teal" : "text-gym-danger"
                    }`}
                  >
                    {formatBRL(Number(projecao.realizado.resultado ?? 0))}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projetado</p>
                  <p className="mt-2 text-xs text-muted-foreground">Receitas e despesas futuras</p>
                  <p
                    className={`font-display text-xl font-bold ${
                      Number(projecao.projetado.resultado ?? 0) >= 0 ? "text-gym-accent" : "text-gym-warning"
                    }`}
                  >
                    {formatBRL(Number(projecao.projetado.resultado ?? 0))}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consolidado</p>
                  <p className="mt-2 text-xs text-muted-foreground">Como fecha o período completo</p>
                  <p
                    className={`font-display text-xl font-bold ${
                      Number(projecao.consolidado.resultado ?? 0) >= 0 ? "text-gym-teal" : "text-gym-danger"
                    }`}
                  >
                    {formatBRL(Number(projecao.consolidado.resultado ?? 0))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receitas previstas</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowUpRight className="size-4 text-gym-teal" />
                    <span>Consolidado de receitas:</span>
                    <span className="font-semibold text-foreground">{formatBRL(Number(projecao.consolidado.receitas ?? 0))}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Despesas previstas</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowDownRight className="size-4 text-gym-danger" />
                    <span>Consolidado de despesas:</span>
                    <span className="font-semibold text-foreground">{formatBRL(Number(projecao.consolidado.despesas ?? 0))}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Despesas por grupo DRE</CardTitle>
                <CardDescription>Quais blocos de gastos mais impactam o resultado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dre.despesasPorGrupo.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem despesas classificadas no período.</p>
                )}
                {dre.despesasPorGrupo.map((item) => {
                  const pct = ratioPercent(item.valor, Math.max(1, resumo.gastoTotal));
                  return (
                    <div key={item.grupo} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{GRUPO_LABEL[item.grupo]}</span>
                        <span className="font-semibold">{formatBRL(item.valor)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div className="h-2 rounded-full bg-gym-accent" style={{ width: `${clampWidth(pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas por categoria</CardTitle>
                <CardDescription>Detalhamento para direcionar cortes e otimizações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dre.despesasPorCategoria.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem despesas por categoria no período.</p>
                )}
                {dre.despesasPorCategoria.slice(0, 6).map((item) => {
                  const pct = ratioPercent(item.valor, Math.max(1, resumo.gastoTotal));
                  return (
                    <div key={item.categoria} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.categoria}</span>
                        <span className="font-semibold">{formatBRL(item.valor)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div className="h-2 rounded-full bg-gym-warning" style={{ width: `${clampWidth(pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

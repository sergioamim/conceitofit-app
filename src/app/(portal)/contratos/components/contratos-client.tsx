"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildMonthKeyFromDate } from "@/lib/tenant/comercial/matriculas-insights";
import { useContratosOrigemAlunos, useContratosSinaisRetencao } from "@/lib/query/use-contratos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContratosList } from "./contratos-list";
import { ContratosOverview } from "./contratos-overview";
import { ContratosCarteiraSerieMensal } from "./contratos-carteira-serie-mensal";
import { ContratosAgregadoresView } from "./contratos-agregadores-view";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { cn } from "@/lib/utils";

type ContratosNavTab = "contratos" | "agregadores" | "carteira-serie" | "listagem";

const DEFAULT_NAV: ContratosNavTab = "contratos";

/** Resolve navegação: `painel=agregadores` legado só quando não há `aba`. */
function resolveNavTab(query: URLSearchParams): ContratosNavTab {
  const abaRaw = query.get("aba")?.trim() ?? "";

  const legacyPainelOnly = query.get("painel") === "agregadores" && !abaRaw;
  if (legacyPainelOnly) return "agregadores";

  if (abaRaw === "contratos") return "contratos";
  if (abaRaw === "agregadores") return "agregadores";
  if (abaRaw === "carteira-serie") return "carteira-serie";
  if (abaRaw === "listagem") return "listagem";
  if (abaRaw === "overview") return "contratos";

  return DEFAULT_NAV;
}

function syncNavTabToSearchParams(existing: URLSearchParams, nav: ContratosNavTab): URLSearchParams {
  const next = new URLSearchParams(existing.toString());
  next.delete("painel");

  if (nav === DEFAULT_NAV) {
    next.delete("aba");
  } else {
    next.set("aba", nav);
  }
  return next;
}

function fmtInt(n: number) {
  return n.toLocaleString("pt-BR");
}

const MONTH_OPTIONS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Marco" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const LONG_MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return null;
  }
  return { year, month };
}

function buildMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(monthKey: string, amount: number) {
  const parsed = parseMonthKey(monthKey) ?? parseMonthKey(buildMonthKeyFromDate(new Date()));
  if (!parsed) return monthKey;
  const nextDate = new Date(parsed.year, parsed.month - 1 + amount, 1);
  return buildMonthKey(nextDate.getFullYear(), nextDate.getMonth() + 1);
}

function formatMonthLongLabel(monthKey: string) {
  const p = parseMonthKey(monthKey);
  if (!p) return "";
  return `${LONG_MONTHS[p.month - 1] ?? "Mês"} ${p.year}`;
}

export function ContratosClient() {
  const { tenantId, tenantResolved } = useTenantContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedMonthKey, setSelectedMonthKey] = useState("");
  const [currentMonthKey, setCurrentMonthKey] = useState("");

  const navTab = resolveNavTab(searchParams);
  const baseQueryString = useMemo(() => searchParams.toString(), [searchParams]);

  function handleNavTabChange(nextNav: ContratosNavTab) {
    const nextParams = syncNavTabToSearchParams(new URLSearchParams(baseQueryString), nextNav);
    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const todayMonthKey = buildMonthKeyFromDate(new Date());
      setSelectedMonthKey(todayMonthKey);
      setCurrentMonthKey(todayMonthKey);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const selectedMonthParts = parseMonthKey(selectedMonthKey);
  const currentMonthParts = parseMonthKey(currentMonthKey);
  const canGoForward = Boolean(selectedMonthKey && currentMonthKey && selectedMonthKey < currentMonthKey);
  const selectedYear = selectedMonthParts?.year ?? currentMonthParts?.year ?? 2000;
  const selectedMonth = selectedMonthParts?.month ?? currentMonthParts?.month ?? 1;

  function selectMonth(year: number, month: number) {
    const nextMonthKey = buildMonthKey(year, month);
    if (currentMonthKey && nextMonthKey > currentMonthKey) {
      setSelectedMonthKey(currentMonthKey);
      return;
    }
    setSelectedMonthKey(nextMonthKey);
  }

  const sinaisHeader = useContratosSinaisRetencao({
    tenantId,
    tenantResolved,
    monthKey: selectedMonthKey,
  });
  const origemHeader = useContratosOrigemAlunos({
    tenantId,
    tenantResolved,
    monthKey: selectedMonthKey,
  });

  const planosKinds = useMemo(
    () => (origemHeader.data?.canais ?? []).filter((c) => c.tipo === "PLANO").length,
    [origemHeader.data?.canais],
  );
  const agregCanalKinds = useMemo(
    () => (origemHeader.data?.canais ?? []).filter((c) => c.tipo === "AGREGADOR").length,
    [origemHeader.data?.canais],
  );

  const monthReadyForTabCounts =
    Boolean(tenantId) && tenantResolved && selectedMonthKey.length > 0;
  const awaitingTabCounts =
    !monthReadyForTabCounts || origemHeader.isPending || sinaisHeader.isPending;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight">Contratos e Agregadores</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Planos diretos, agregadores, série diária da carteira e listagem conforme o mês selecionado nas abas ao lado.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 px-3 py-3 sm:px-4">
          <div className="-mb-px flex min-w-0 flex-1 gap-0 overflow-x-auto pb-px" role="tablist" aria-label="Contratos mensais">
            {(
              [
                {
                  id: "contratos" as ContratosNavTab,
                  label: "Contratos",
                  sub: awaitingTabCounts
                    ? "…"
                    : `${fmtInt(origemHeader.data?.totalSomentePlanos ?? sinaisHeader.data?.alunosPlano ?? 0)} alunos · ${planosKinds} ${planosKinds === 1 ? "tipo de plano" : "tipos de plano"}`,
                },
                {
                  id: "agregadores" as ContratosNavTab,
                  label: "Agregadores",
                  sub: awaitingTabCounts
                    ? "…"
                    : `${fmtInt(sinaisHeader.data?.alunosAgregadores ?? 0)} alunos · ${agregCanalKinds} ${agregCanalKinds === 1 ? "canal" : "canais"}`,
                },
                {
                  id: "carteira-serie" as ContratosNavTab,
                  label: "Movimento no mês",
                  sub: "Série diária da carteira",
                },
                {
                  id: "listagem" as ContratosNavTab,
                  label: "Listagem",
                  sub: "Contratos do período",
                },
              ] as const
            ).map((t) => {
              const active = navTab === t.id;
              const tabTitle =
                t.id === "contratos"
                  ? "Alunos com matrícula (não diária) no mês apenas em canal PLANO direto · números alinhados à visão carteira financeira deste período."
                  : t.id === "agregadores"
                    ? "Alunos únicos cuja matrícula do mês é roteada a canal AGREGADOR (vínculo B2B ativo ou plano tipo Wellhub/GymPass/TotalPass). Ver 0 mesmo com vínculo na lista de Clientes quando não há matrícula válida cobrindo o mês ou o roteamento cai só em plano direto."
                    : t.label;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={tabTitle}
                  onClick={() => handleNavTabChange(t.id)}
                  className={cn(
                    "flex min-w-[min(8.5rem,calc(50vw-2rem))] shrink-0 flex-col gap-0.5 border-b-2 px-2.5 pb-3 pt-0.5 text-left transition-colors sm:min-w-[132px] sm:px-3",
                    active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="text-[13px] font-semibold leading-tight">{t.label}</span>
                  <span className="line-clamp-2 text-[10.5px] leading-snug">{t.sub}</span>
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="sr-only">
              Período de referência atual:{" "}
              {selectedMonthKey ? formatMonthLongLabel(selectedMonthKey) : "não definido"}
            </span>
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-1 py-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                aria-label="Mês anterior"
                onClick={() => setSelectedMonthKey((current) => shiftMonth(current, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <select
                value={selectedMonth}
                onChange={(event) => selectMonth(selectedYear, Number(event.target.value))}
                className="h-9 max-w-[9.5rem] min-w-[6.75rem] rounded-md border border-border bg-muted/40 px-2 text-sm font-medium outline-none sm:min-w-[8.5rem]"
                aria-label="Mês de referência"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option
                    key={month.value}
                    value={month.value}
                    disabled={currentMonthParts?.year === selectedYear && month.value > currentMonthParts.month}
                  >
                    {month.label}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                inputMode="numeric"
                min={2000}
                max={currentMonthParts?.year}
                value={selectedYear}
                onChange={(event) => {
                  const nextYear = Number(event.target.value);
                  if (!Number.isInteger(nextYear)) return;
                  selectMonth(nextYear, selectedMonth);
                }}
                className="h-9 w-[4rem] shrink-0 border-border bg-muted/40 px-2 text-center text-sm font-medium tabular-nums sm:w-[4.25rem]"
                aria-label="Ano de referência"
              />
              {canGoForward ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                  aria-label="Próximo mês"
                  onClick={() => setSelectedMonthKey((current) => shiftMonth(current, 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="border-t border-border/60 px-3 py-2 sm:px-4">
          <p className="text-[10.5px] leading-snug text-muted-foreground sm:text-end">
            Mês fechado no último dia; mês atual até hoje.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] space-y-4">
        {navTab === "contratos" ? (
          <ContratosOverview key={`${tenantId ?? "tenant"}-${selectedMonthKey || "month"}-overview`} monthKey={selectedMonthKey} />
        ) : null}
        {navTab === "agregadores" ? (
          <ContratosAgregadoresView key={`${tenantId ?? "tenant"}-${selectedMonthKey || "month"}-agreg`} monthKey={selectedMonthKey} />
        ) : null}
        {navTab === "carteira-serie" ? (
          <ContratosCarteiraSerieMensal key={`${tenantId ?? "tenant"}-${selectedMonthKey || "month"}-serie`} monthKey={selectedMonthKey} />
        ) : null}
        {navTab === "listagem" ? (
          <ContratosList key={`${tenantId ?? "tenant"}-${selectedMonthKey || "month"}-list`} monthKey={selectedMonthKey} />
        ) : null}
      </div>
    </div>
  );
}

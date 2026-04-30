"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildMonthKeyFromDate } from "@/lib/tenant/comercial/matriculas-insights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContratosList } from "./contratos-list";
import { ContratosOverview } from "./contratos-overview";
import { ContratosCarteiraSerieMensal } from "./contratos-carteira-serie-mensal";
import { ContratosCarteiraSnapshot } from "./contratos-carteira-snapshot";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";

type ContratosTab = "overview" | "carteira-data" | "carteira-serie" | "listagem";

const DEFAULT_TAB: ContratosTab = "overview";
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

function resolveTab(value: string | null): ContratosTab {
  if (value === "listagem") return "listagem";
  if (value === "carteira-data") return "carteira-data";
  if (value === "carteira-serie") return "carteira-serie";
  return DEFAULT_TAB;
}

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

export function ContratosClient() {
  const { tenantId } = useTenantContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedMonthKey, setSelectedMonthKey] = useState("");
  const [currentMonthKey, setCurrentMonthKey] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const todayMonthKey = buildMonthKeyFromDate(new Date());
      setSelectedMonthKey(todayMonthKey);
      setCurrentMonthKey(todayMonthKey);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeTab = resolveTab(searchParams.get("aba"));
  const baseQueryString = useMemo(() => searchParams.toString(), [searchParams]);
  const selectedMonthParts = parseMonthKey(selectedMonthKey);
  const currentMonthParts = parseMonthKey(currentMonthKey);
  const canGoForward = Boolean(selectedMonthKey && currentMonthKey && selectedMonthKey < currentMonthKey);
  const selectedYear = selectedMonthParts?.year ?? currentMonthParts?.year ?? 2000;
  const selectedMonth = selectedMonthParts?.month ?? currentMonthParts?.month ?? 1;

  function handleTabChange(nextValue: string) {
    const nextTab = resolveTab(nextValue);
    const nextParams = new URLSearchParams(baseQueryString);

    nextParams.set("aba", nextTab);

    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  function selectMonth(year: number, month: number) {
    const nextMonthKey = buildMonthKey(year, month);
    if (currentMonthKey && nextMonthKey > currentMonthKey) {
      setSelectedMonthKey(currentMonthKey);
      return;
    }
    setSelectedMonthKey(nextMonthKey);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Contratos e assinaturas</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Leitura operacional da carteira, contratos vigentes e proximos pontos de atencao.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label
              htmlFor="contratos-month-filter"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
            >
              Mes de referencia
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                aria-label="Mes anterior"
                onClick={() => setSelectedMonthKey((current) => shiftMonth(current, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <select
                id="contratos-month-filter"
                value={selectedMonth}
                onChange={(event) => selectMonth(selectedYear, Number(event.target.value))}
                className="h-9 min-w-[128px] rounded-md border border-border bg-background px-3 text-sm font-medium outline-none"
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
                className="h-9 w-24 border-border bg-background text-sm font-medium"
                aria-label="Ano de referencia"
              />
              {canGoForward ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                  aria-label="Proximo mes"
                  onClick={() => setSelectedMonthKey((current) => shiftMonth(current, 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              ) : null}
            </div>
            <p className="mt-1 max-w-sm text-[11px] text-muted-foreground">
              Visão geral e sinais de retenção: mês passado fecha no último dia; no mês em curso a referência vai até hoje.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-5">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl bg-secondary/50 p-1 sm:w-fit">
          <TabsTrigger value="overview" className="rounded-xl px-4 py-2">
            Visao geral
          </TabsTrigger>
          <TabsTrigger value="carteira-data" className="rounded-xl px-4 py-2">
            Carteira na data
          </TabsTrigger>
          <TabsTrigger value="carteira-serie" className="rounded-xl px-4 py-2">
            Movimento no mes
          </TabsTrigger>
          <TabsTrigger value="listagem" className="rounded-xl px-4 py-2">
            Listagem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <ContratosOverview
            key={`${tenantId ?? "tenant"}-${selectedMonthKey || "month"}`}
            monthKey={selectedMonthKey}
          />
        </TabsContent>
        <TabsContent value="carteira-data" className="mt-0">
          <ContratosCarteiraSnapshot />
        </TabsContent>
        <TabsContent value="carteira-serie" className="mt-0">
          <ContratosCarteiraSerieMensal monthKey={selectedMonthKey} />
        </TabsContent>
        <TabsContent value="listagem" className="mt-0">
          <ContratosList monthKey={selectedMonthKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

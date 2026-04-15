"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ListErrorState } from "@/components/shared/list-states";
import { hasGerenteAccess } from "@/lib/access-control";
import { getRolesFromSession } from "@/lib/api/session";
import { getDashboard, listarCaixas } from "@/lib/api/caixa";
import { isCaixaApiError, mapCaixaError } from "@/lib/api/caixa-error-handler";
import { ApiRequestError } from "@/lib/api/http";
import type { CaixaResponse, DashboardDiarioResponse } from "@/lib/api/caixa.types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { DashboardCard } from "./dashboard-card";
import {
  ListaCaixasTable,
  type CaixasFilterValues,
} from "./lista-caixas-table";
import { DiferencasTab } from "./diferencas-tab";

const TAB_DASHBOARD = "dashboard";
const TAB_CAIXAS = "caixas";
const TAB_DIFERENCAS = "diferencas";

const DEFAULT_LISTA_FILTERS: CaixasFilterValues = {
  status: FILTER_ALL,
  operadorId: "",
  from: "",
  to: "",
};

function todayIso(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/**
 * Tela do gerente de operação para acompanhar caixas, diferenças e o
 * resumo do dia. RBAC em duas camadas:
 *  1. middleware bloqueia CLIENTE de entrar em /admin
 *  2. esta tela bloqueia OPERADOR comum (sem GERENTE/ADMIN) com mensagem
 */
export function CaixasContent() {
  const { toast } = useToast();

  const [tab, setTab] = useState<string>(TAB_DASHBOARD);
  const [dataDashboard, setDataDashboard] = useState<string>("");
  const [dashboard, setDashboard] = useState<DashboardDiarioResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [caixas, setCaixas] = useState<CaixaResponse[]>([]);
  const [caixasLoading, setCaixasLoading] = useState(false);
  const [caixasError, setCaixasError] = useState<string | null>(null);
  const [listaFilters, setListaFilters] =
    useState<CaixasFilterValues>(DEFAULT_LISTA_FILTERS);

  const [hydrated, setHydrated] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Hidratação client-only — evita render SSR de roles/data
  useEffect(() => {
    setHydrated(true);
    setDataDashboard(todayIso());
    const roles = getRolesFromSession();
    setHasAccess(hasGerenteAccess(roles));
  }, []);

  const fetchDashboard = useCallback(
    async (data: string) => {
      if (!data) return;
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const response = await getDashboard(data);
        setDashboard(response);
      } catch (err) {
        if (isCaixaApiError(err)) {
          const presentation = mapCaixaError(err);
          setDashboardError(presentation.mensagem);
          toast({
            title: presentation.titulo,
            description: presentation.mensagem,
            variant: "destructive",
          });
        } else if (err instanceof ApiRequestError && err.status === 403) {
          setDashboardError(
            "Sem permissão para visualizar o dashboard de caixas (requer perfil gerente).",
          );
        } else {
          const message =
            err instanceof Error ? err.message : "Falha ao carregar dashboard.";
          setDashboardError(message);
        }
      } finally {
        setDashboardLoading(false);
      }
    },
    [toast],
  );

  const fetchCaixas = useCallback(
    async (filters: CaixasFilterValues) => {
      setCaixasLoading(true);
      setCaixasError(null);
      try {
        const data = await listarCaixas({
          status: filters.status === FILTER_ALL ? undefined : filters.status,
          operadorId: filters.operadorId || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
        });
        setCaixas(data);
      } catch (err) {
        if (isCaixaApiError(err)) {
          const presentation = mapCaixaError(err);
          setCaixasError(presentation.mensagem);
          toast({
            title: presentation.titulo,
            description: presentation.mensagem,
            variant: "destructive",
          });
        } else if (err instanceof ApiRequestError && err.status === 403) {
          setCaixasError("Sem permissão para listar caixas.");
        } else {
          const message =
            err instanceof Error ? err.message : "Falha ao carregar caixas.";
          setCaixasError(message);
        }
      } finally {
        setCaixasLoading(false);
      }
    },
    [toast],
  );

  // Após hidratar e validar acesso, carrega dashboard inicial
  useEffect(() => {
    if (!hydrated || !hasAccess || !dataDashboard) return;
    void fetchDashboard(dataDashboard);
  }, [dataDashboard, fetchDashboard, hasAccess, hydrated]);

  // Quando entra na tab "caixas", carrega listagem com filtros atuais
  useEffect(() => {
    if (!hydrated || !hasAccess) return;
    if (tab !== TAB_CAIXAS) return;
    void fetchCaixas(listaFilters);
  }, [fetchCaixas, hasAccess, hydrated, listaFilters, tab]);

  const handleListaFilters = useCallback((values: CaixasFilterValues) => {
    setListaFilters(values);
  }, []);

  const handleVerDiferencas = useCallback(() => {
    setTab(TAB_DIFERENCAS);
  }, []);

  const diferencasCount = useMemo(
    () => dashboard?.alertasDiferencaCount ?? 0,
    [dashboard],
  );

  // Render placeholder estável até hidratar (evita Radix tabs mismatch)
  if (!hydrated) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-gym-accent">Operação financeira</p>
          <h1 className="text-3xl font-display font-bold leading-tight">
            Caixas operacionais
          </h1>
        </header>
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Carregando...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-gym-accent">Operação financeira</p>
          <h1 className="text-3xl font-display font-bold leading-tight">
            Caixas operacionais
          </h1>
        </header>
        <Card className="border-gym-danger/30 bg-gym-danger/10">
          <CardContent className="flex flex-col items-start gap-3 py-6">
            <div className="flex items-center gap-2 text-gym-danger">
              <ShieldAlert className="size-5" />
              <p className="text-sm font-semibold">
                Acesso restrito a perfis gerente ou administrativo.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Solicite ao administrador da sua academia o perfil GERENTE para
              acessar a supervisão de caixas. Operadores podem usar o terminal
              de caixa em <Link href="/caixa" className="underline">/caixa</Link>.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/admin">
                <ArrowLeft className="size-3.5" />
                Voltar ao backoffice
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gym-accent">Operação financeira</p>
          <h1 className="text-3xl font-display font-bold leading-tight">
            Caixas operacionais
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe abertura, fechamento e diferenças de caixas no período.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 self-start"
          onClick={() => {
            if (tab === TAB_CAIXAS) {
              void fetchCaixas(listaFilters);
            } else if (tab === TAB_DASHBOARD && dataDashboard) {
              void fetchDashboard(dataDashboard);
            }
          }}
        >
          <RefreshCw className="size-3.5" />
          Atualizar
        </Button>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value={TAB_DASHBOARD}>Dashboard</TabsTrigger>
          <TabsTrigger value={TAB_CAIXAS}>Caixas</TabsTrigger>
          <TabsTrigger value={TAB_DIFERENCAS}>
            Diferenças
            {diferencasCount > 0 ? (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gym-danger/20 px-1.5 text-[10px] font-bold text-gym-danger">
                {diferencasCount}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={TAB_DASHBOARD} className="space-y-4">
          {dashboardError ? (
            <ListErrorState
              error={dashboardError}
              onRetry={() => void fetchDashboard(dataDashboard)}
            />
          ) : (
            <DashboardCard
              dashboard={dashboard}
              loading={dashboardLoading}
              onVerDiferencas={handleVerDiferencas}
            />
          )}
        </TabsContent>

        <TabsContent value={TAB_CAIXAS} className="space-y-4">
          {caixasError ? (
            <ListErrorState
              error={caixasError}
              onRetry={() => void fetchCaixas(listaFilters)}
            />
          ) : (
            <ListaCaixasTable
              caixas={caixas}
              loading={caixasLoading}
              initialFilters={listaFilters}
              onFiltersChange={handleListaFilters}
            />
          )}
        </TabsContent>

        <TabsContent value={TAB_DIFERENCAS} className="space-y-4">
          <DiferencasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

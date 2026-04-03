"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getUnidadeOnboardingStatusLabel,
  getUnidadeOnboardingStrategyLabel,
} from "@/backoffice/lib/onboarding";
import { EvoAcompanhamentoTab } from "./EvoAcompanhamentoTab";
import { EvoPacoteTab } from "./EvoPacoteTab";
import { EvoUploadTab } from "./EvoUploadTab";
import { useEvoImportPage } from "../hooks/useEvoImportPage";

export function ImportacaoEvoP0Client() {
  const state = useEvoImportPage();
  const { activeTab, setActiveTab, tenantFoco, onboardingFoco, resolveTenantLabel } = state;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Integrações &gt; EVO</p>
        <h1 className="text-3xl font-display font-bold leading-tight">
          Acompanhamento de Importação EVO
        </h1>
        <p className="text-sm text-muted-foreground">
          Dispare e acompanhe jobs de importação EVO. O último job fica salvo para retomar depois.
        </p>
      </div>

      {tenantFoco && onboardingFoco ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <Badge variant="secondary">
            {getUnidadeOnboardingStrategyLabel(onboardingFoco.estrategia)}
          </Badge>
          <Badge variant="outline">
            {getUnidadeOnboardingStatusLabel(onboardingFoco.status)}
          </Badge>
          <span className="text-muted-foreground">
            Unidade foco: {resolveTenantLabel(tenantFoco).unidadeNome} · EVO{" "}
            {onboardingFoco.evoFilialId || "não vinculado"}
          </span>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="nova">Nova Importação</TabsTrigger>
          <TabsTrigger value="pacote">Importar por Pacote (ZIP/CSV)</TabsTrigger>
          <TabsTrigger value="acompanhamento">Acompanhar Job</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="mt-4 space-y-6">
          <EvoUploadTab state={state} />
        </TabsContent>

        <TabsContent value="pacote" className="mt-4 space-y-6">
          <EvoPacoteTab state={state} />
        </TabsContent>

        <TabsContent value="acompanhamento" className="mt-4 space-y-6">
          <EvoAcompanhamentoTab state={state} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

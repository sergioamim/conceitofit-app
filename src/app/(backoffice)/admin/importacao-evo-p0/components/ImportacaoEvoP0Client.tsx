"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MapeamentoAcademiaUnidadeSelector } from "@/backoffice/components/admin/importacao-academia-unidade-selector";
import {
  getUnidadeOnboardingStatusLabel,
  getUnidadeOnboardingStrategyLabel,
} from "@/backoffice/lib/onboarding";
import { EvoAcompanhamentoTab } from "./EvoAcompanhamentoTab";
import { EvoDestinoFotosCard } from "./EvoDestinoFotosCard";
import { EvoPacoteTab } from "./EvoPacoteTab";
import { useEvoImportPage } from "../hooks/useEvoImportPage";
import { cn } from "@/lib/utils";
import { formatDateTime } from "../date-time-format";

export function ImportacaoEvoP0Client() {
  const state = useEvoImportPage();
  const { 
    activeTab, setActiveTab, tenantFoco, onboardingFoco, resolveTenantLabel,
    jobsRecentes, jobId, selecionarJobDoHistorico, resolveJobAlias, statusVariant,
    pacoteMapeamento, academiaOptions, getUnidadesOptions, loadingMapeamento,
    handlePacoteAcademiaNomeChange, handlePacoteUnidadeNomeChange,
    handlePacoteSelecionarAcademia, handlePacoteSelecionarUnidade,
    carregarMapeamentoData,
  } = state;
  const destinoSelecionado = Boolean(pacoteMapeamento.academiaId && pacoteMapeamento.tenantId);
  const tenantLabel = resolveTenantLabel(tenantFoco);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 md:flex-row p-6">
      {/* Esquerda: Ações e Wizard */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gym-accent">Integrações &gt; Automação EVO</p>
          <h1 className="text-3xl font-display font-bold leading-tight">
            Gestor de Importação
          </h1>
          <p className="text-sm text-muted-foreground">
            Inicie novas migrações de dados ou pacotes compactados do sistema EVO para a Conceito Fit.
          </p>
        </div>

        <section className="space-y-4 rounded-xl border border-gym-accent/25 bg-card px-4 py-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Unidade de referência</p>
              <p className="text-sm text-muted-foreground">
                A academia e a unidade escolhidas aqui passam a valer para reaproveitamento de lote, análise do pacote, importação e fotos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={destinoSelecionado ? "secondary" : "outline"}>
                {destinoSelecionado ? "Unidade selecionada" : "Selecione a unidade"}
              </Badge>
              {tenantFoco && onboardingFoco ? (
                <>
                  <Badge variant="secondary">
                    {getUnidadeOnboardingStrategyLabel(onboardingFoco.estrategia)}
                  </Badge>
                  <Badge variant="outline">
                    {getUnidadeOnboardingStatusLabel(onboardingFoco.status)}
                  </Badge>
                </>
              ) : null}
            </div>
          </div>

          <MapeamentoAcademiaUnidadeSelector
            academiaNome={pacoteMapeamento.academiaNome}
            unidadeNome={pacoteMapeamento.unidadeNome}
            academiaId={pacoteMapeamento.academiaId}
            academiaOptions={academiaOptions}
            unidadesOptions={getUnidadesOptions(pacoteMapeamento.academiaId)}
            loadingAcademias={loadingMapeamento}
            onAcademiaNomeChange={handlePacoteAcademiaNomeChange}
            onUnidadeNomeChange={handlePacoteUnidadeNomeChange}
            onAcademiaSelect={handlePacoteSelecionarAcademia}
            onUnidadeSelect={handlePacoteSelecionarUnidade}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium">Destino atual</p>
              <p className="text-muted-foreground">
                {destinoSelecionado
                  ? `${pacoteMapeamento.academiaNome || tenantLabel.academiaNome} · ${pacoteMapeamento.unidadeNome || tenantLabel.unidadeNome}`
                  : "Nenhuma unidade selecionada"}
              </p>
              {tenantFoco && onboardingFoco ? (
                <p className="text-xs text-muted-foreground">
                  EVO {onboardingFoco.evoFilialId || "não vinculado"}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void carregarMapeamentoData()}
              disabled={loadingMapeamento}
            >
              {loadingMapeamento ? "Atualizando unidades..." : "Atualizar unidades"}
            </Button>
          </div>
        </section>

        <div className="space-y-6">
          <EvoDestinoFotosCard state={state} />
          <EvoPacoteTab state={state} />
        </div>
      </div>

      {/* Direita: Sidebar Histórico de Lotes */}
      <div className="w-full shrink-0 flex flex-col gap-4 border-l-0 border-t border-border pt-6 md:w-80 lg:w-96 md:border-l md:border-t-0 md:pl-8 md:pt-0">
        <div>
          <h3 className="font-display text-lg font-bold">Lotes Recentes</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Gatilhos despachados neste navegador
          </p>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-10" style={{ maxHeight: "calc(100vh - 12rem)" }}>
          {jobsRecentes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Nenhuma importação recente salva.</p>
          ) : (
            jobsRecentes.map((job) => {
              const alias = resolveJobAlias(job);
              const status = statusVariant(job.status);
              
              return (
                <button
                  key={`${job.tenantId}-${job.jobId}`}
                  type="button"
                  onClick={() => {
                    selecionarJobDoHistorico(job);
                    setActiveTab("acompanhamento");
                  }}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-gym-accent/50 hover:bg-muted/30 focus-ring-brand",
                    job.jobId === jobId && activeTab === "acompanhamento" ? "border-gym-accent shadow-md bg-gym-accent/5 ring-1 ring-gym-accent" : ""
                  )}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <p className="font-semibold text-sm line-clamp-1">{alias}</p>
                    <Badge variant={status.variant} className={cn("text-[10px] shrink-0", status.className)}>
                      {job.status ?? "SALVO"}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-1 w-full text-xs text-muted-foreground">
                     <p className="line-clamp-1">{job.academiaNome} · {job.unidadeNome}</p>
                     <div className="flex justify-between items-center w-full mt-1">
                       <span className="font-mono text-[10px] bg-muted/60 px-1 rounded">{job.jobId.slice(0, 8)}...</span>
                       <span>{formatDateTime(job.criadoEm)?.split(' ')[0]}</span>
                     </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Sheet Modal para acompanhamento (Detalhes do job sem perder a aba de cadastro rodando de fundo) */}
      <Sheet open={activeTab === "acompanhamento"} onOpenChange={(v) => !v && setActiveTab("pacote")}>
        <SheetContent className="w-full sm:max-w-3xl lg:max-w-4xl overflow-y-auto border-border">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-2xl font-bold">Diagnóstico do Lote</SheetTitle>
          </SheetHeader>
          <EvoAcompanhamentoTab state={state} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

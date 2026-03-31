/** @jsxImportSource react */
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, X } from "lucide-react";
import { getOnboardingStatus } from "@/lib/api/onboarding-api";
import type { OnboardingChecklistStep, OnboardingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type OnboardingChecklistProps = {
  onDismiss?: () => void;
  hideWhenComplete?: boolean;
};

function ChecklistStatusIcon({ step }: { step: OnboardingChecklistStep }) {
  if (step.status === "CONCLUIDA") {
    return <CheckCircle2 className="size-5 text-gym-teal" aria-hidden="true" />;
  }
  if (step.status === "EM_ANDAMENTO") {
    return <Loader2 className="size-5 animate-spin text-gym-accent" aria-hidden="true" />;
  }
  return <Circle className="size-5 text-muted-foreground" aria-hidden="true" />;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary" aria-hidden="true">
      <div
        className="h-full rounded-full bg-gym-accent transition-[width] duration-300 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function OnboardingChecklistSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5" data-testid="onboarding-checklist-loading">
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-secondary" />
        <div className="h-2 w-full animate-pulse rounded bg-secondary" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-secondary/60" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChecklistBody({
  status,
  onDismiss,
}: {
  status: OnboardingStatus;
  onDismiss?: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      data-testid="onboarding-checklist"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gym-accent">
            Onboarding inicial
          </p>
          <h2 className="font-display text-xl font-bold text-foreground">
            {status.concluido ? "Academia pronta para operar" : "Checklist de configuração da academia"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {status.etapasConcluidas} de {status.totalEtapas} etapa(s) concluídas.
          </p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            aria-label="Fechar checklist de onboarding"
            onClick={onDismiss}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Progresso</span>
          <span className="text-muted-foreground">{status.percentualConclusao}%</span>
        </div>
        <ProgressBar value={status.percentualConclusao} />
      </div>

      <div className="mt-5 space-y-3">
        {status.etapas.map((step) => (
          <div
            key={step.id}
            className="flex flex-col gap-3 rounded-xl border border-border/80 bg-secondary/20 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-start gap-3">
              <ChecklistStatusIcon step={step} />
              <div className="space-y-1">
                <p className="font-medium text-foreground">{step.titulo}</p>
                {step.descricao ? (
                  <p className="text-sm text-muted-foreground">{step.descricao}</p>
                ) : null}
              </div>
            </div>

            {step.status !== "CONCLUIDA" && step.rotaConfiguracao ? (
              <a
                href={step.rotaConfiguracao}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Configurar agora
              </a>
            ) : (
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {step.status === "CONCLUIDA" ? "Concluída" : "Aguardando"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OnboardingChecklist({
  onDismiss,
  hideWhenComplete = false,
}: OnboardingChecklistProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        setError(null);
        const response = await getOnboardingStatus();
        if (!active) return;
        setStatus(response);
      } catch (loadError) {
        if (!active) return;
        setError(normalizeErrorMessage(loadError));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <OnboardingChecklistSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 p-5 text-sm text-gym-danger">
        Não foi possível carregar o checklist de onboarding. {error}
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (hideWhenComplete && status.concluido) {
    return null;
  }

  return <ChecklistBody status={status} onDismiss={onDismiss} />;
}

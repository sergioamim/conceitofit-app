/** @jsxImportSource react */
"use client";

import { memo, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOnboardingStatus } from "@/lib/api/onboarding-api";
import type { OnboardingStatus } from "@/lib/shared/types/tenant";
import { cn } from "@/lib/utils";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

function OnboardingChecklistContent({ status }: { status: OnboardingStatus }) {
  const pendingCount = status.totalEtapas - status.etapasConcluidas;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">{status.percentualConclusao}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gym-teal transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, status.percentualConclusao))}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {status.etapas.map((step) => (
          <div
            key={step.id}
            className="flex items-start gap-3 rounded-lg border border-border/80 bg-secondary/20 p-3"
          >
            {step.status === "CONCLUIDA" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-gym-teal" />
            ) : (
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-gym-accent" />
            )}
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-foreground">{step.titulo}</p>
              {step.descricao && (
                <p className="text-xs text-muted-foreground">{step.descricao}</p>
              )}
              {step.status !== "CONCLUIDA" && step.rotaConfiguracao && (
                <a
                  href={step.rotaConfiguracao}
                  className="mt-2 inline-flex items-center text-xs font-medium text-gym-teal hover:underline"
                >
                  Configurar agora →
                </a>
              )}
              {step.status === "CONCLUIDA" && (
                <span className="mt-2 inline-block text-xs font-medium text-muted-foreground">
                  Concluída
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {status.concluido && (
        <div className="rounded-lg border border-gym-teal/30 bg-gym-teal/10 p-4 text-center">
          <CheckCircle2 className="mx-auto mb-2 size-6 text-gym-teal" />
          <p className="text-sm font-medium text-gym-teal">
            Academia configurada e pronta para operar!
          </p>
        </div>
      )}

      {!status.concluido && (
        <p className="text-center text-xs text-muted-foreground">
          {pendingCount} {pendingCount === 1 ? "etapa pendente" : "etapas pendentes"}
        </p>
      )}
    </div>
  );
}

function OnboardingStatusBadgeComponent() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await getOnboardingStatus();
        if (!active) return;
        setStatus(response);
      } catch {
        // Silently fail - badge won't show if endpoint is unavailable
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

  if (loading || !status || status.concluido) {
    return null;
  }

  const pendingCount = status.totalEtapas - status.etapasConcluidas;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-10"
          aria-label={`${pendingCount} pendências de configuração`}
        >
          <AlertCircle className="size-5 text-gym-accent" />
          <Badge
            variant="destructive"
            className={cn(
              "absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]",
              "min-w-5"
            )}
          >
            {pendingCount}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-gym-accent" />
            Checklist de configuração
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {status.etapasConcluidas} de {status.totalEtapas} etapas concluídas
          </p>
        </SheetHeader>
        <div className="mt-6">
          <OnboardingChecklistContent status={status} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const OnboardingStatusBadge = memo(OnboardingStatusBadgeComponent);

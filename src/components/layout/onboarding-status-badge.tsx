/** @jsxImportSource react */
"use client";

import { memo, useEffect, useState, useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOnboardingStatus } from "@/lib/api/onboarding-api";
import type { OnboardingStatus } from "@/lib/shared/types/tenant";
import { cn } from "@/lib/utils";

const ONBOARDING_HELPER_STORAGE_KEY = "academia-onboarding-flow-helper";
const ONBOARDING_HELPER_UPDATED_EVENT = "academia-onboarding-flow-helper-updated";
const ONBOARDING_HELPER_SNOOZE_MS = 24 * 60 * 60 * 1000;
const ONBOARDING_HELPER_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

type OnboardingHelperState = Record<
  string,
  {
    understood?: boolean;
    snoozedUntil?: number;
  }
>;

function readOnboardingHelperState(): OnboardingHelperState {
  if (typeof window === "undefined") return {};

  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${ONBOARDING_HELPER_STORAGE_KEY}=([^;]*)`),
    );
    const raw = match?.[1] ? decodeURIComponent(match[1]) : undefined;
    if (!raw) return {};
    const parsed = JSON.parse(raw) as OnboardingHelperState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOnboardingHelperState(next: OnboardingHelperState) {
  if (typeof window === "undefined") return;

  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ONBOARDING_HELPER_STORAGE_KEY}=${encodeURIComponent(JSON.stringify(next))}; Path=/; Max-Age=${ONBOARDING_HELPER_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
    window.dispatchEvent(new Event(ONBOARDING_HELPER_UPDATED_EVENT));
  } catch {
    // noop
  }
}

function shouldShowOnboardingHelper(stepId: string) {
  const current = readOnboardingHelperState()[stepId];
  if (!current) return true;
  if (current.understood) return false;
  if (typeof current.snoozedUntil === "number" && current.snoozedUntil > Date.now()) {
    return false;
  }
  return true;
}

function markOnboardingHelperUnderstood(stepId: string) {
  const current = readOnboardingHelperState();
  writeOnboardingHelperState({
    ...current,
    [stepId]: {
      understood: true,
    },
  });
}

function snoozeOnboardingHelper(stepId: string) {
  const current = readOnboardingHelperState();
  writeOnboardingHelperState({
    ...current,
    [stepId]: {
      understood: false,
      snoozedUntil: Date.now() + ONBOARDING_HELPER_SNOOZE_MS,
    },
  });
}

function subscribeOnboardingHelper(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const notify = () => listener();

  window.addEventListener(ONBOARDING_HELPER_UPDATED_EVENT, notify);
  window.addEventListener("focus", notify);
  document.addEventListener("visibilitychange", notify);

  return () => {
    window.removeEventListener(ONBOARDING_HELPER_UPDATED_EVENT, notify);
    window.removeEventListener("focus", notify);
    document.removeEventListener("visibilitychange", notify);
  };
}

function useOnboardingHelperVisibility(stepId?: string) {
  return useSyncExternalStore(
    subscribeOnboardingHelper,
    () => (stepId ? shouldShowOnboardingHelper(stepId) : false),
    () => false,
  );
}

function OnboardingFlowHelper({
  stepId,
  stepTitle,
  visible,
  onAcknowledge,
}: {
  stepId: string;
  stepTitle: string;
  visible: boolean;
  onAcknowledge: () => void;
}) {

  if (!visible) {
    return null;
  }

  return (
    // Flutuante: absoluto relativo ao container do badge (posicionado em
    // relative no OnboardingStatusBadgeComponent). Abre abaixo do badge,
    // ancorado à direita — sobrepõe conteúdo sem empurrar a topbar.
    // Shadow + ring pro card destacar do conteúdo embaixo.
    <div className="absolute right-0 top-full z-50 mt-2 hidden w-[22rem] max-w-[calc(100vw-2rem)] rounded-lg border border-gym-accent/40 bg-card/95 p-4 text-left shadow-xl shadow-black/30 backdrop-blur-sm lg:block xl:w-[26rem]">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gym-accent">
          Guia de configuração
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {stepTitle}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Clique no alerta ao lado para abrir o checklist.
        </p>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 rounded-md text-muted-foreground hover:text-foreground"
          onClick={() => {
            snoozeOnboardingHelper(stepId);
            onAcknowledge();
          }}
        >
          Lembrar depois
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-md"
          onClick={() => {
            markOnboardingHelperUnderstood(stepId);
            onAcknowledge();
          }}
        >
          Entendi
        </Button>
      </div>
    </div>
  );
}

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
                <div className="mt-2">
                  <a
                    href={step.rotaConfiguracao}
                    className="inline-flex items-center text-xs font-medium text-gym-teal hover:underline"
                  >
                    Configurar agora →
                  </a>
                </div>
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
  const firstPendingStep = status?.etapas.find(
    (step) => step.status !== "CONCLUIDA" && step.rotaConfiguracao,
  );
  const helperVisible = useOnboardingHelperVisibility(firstPendingStep?.id);

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
      {/* relative: ancora o OnboardingFlowHelper flutuante logo abaixo do badge */}
      <div className="relative flex items-center gap-2">
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative size-10",
              helperVisible ? "ring-2 ring-gym-accent/30 ring-offset-2 ring-offset-background" : undefined,
            )}
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
        {firstPendingStep ? (
          <OnboardingFlowHelper
            stepId={firstPendingStep.id}
            stepTitle={firstPendingStep.titulo}
            visible={helperVisible}
            onAcknowledge={() => undefined}
          />
        ) : null}
      </div>
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

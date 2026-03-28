"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOTION_CLASSNAMES } from "@/lib/ui-motion";
import { describeErrorForUi } from "@/lib/utils/api-error";
import { logger } from "@/lib/shared/logger";

interface ErrorStateProps {
  error: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  className?: string;
}

export function ErrorState({ error, reset, title = "Ocorreu um erro inesperado", className }: ErrorStateProps) {
  useEffect(() => {
    const presentation = describeErrorForUi(error, { fallbackTitle: title, digest: error.digest });
    logger.error("Erro capturado pelo error boundary", {
      module: "error-boundary",
      name: error.name,
      message: error.message,
      details: presentation.details,
      error,
    });
  }, [error, title]);

  const presentation = describeErrorForUi(error, { fallbackTitle: title, digest: error.digest });

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${MOTION_CLASSNAMES.fadeInSubtle} ${className || ""}`}>
      <div className="mb-5 flex size-14 items-center justify-center rounded-3xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <AlertTriangle className="size-6" />
      </div>
      <h3 className="mb-2 text-lg font-bold tracking-tight">{presentation.title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{presentation.message}</p>

      {presentation.details.length > 0 ? (
        <div className="mb-6 flex max-w-xl flex-wrap items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/80">
          {presentation.details.map((detail) => (
            <span
              key={`${detail.label}-${detail.value}`}
              className="rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono"
            >
              {detail.label}: {detail.value}
            </span>
          ))}
        </div>
      ) : null}

      {reset && (
        <Button onClick={reset} variant="outline" size="sm" className="gap-2 shadow-xs">
          <RefreshCcw className="size-3.5" />
          Tentar Novamente
        </Button>
      )}
    </div>
  );
}

"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOTION_CLASSNAMES } from "@/lib/ui-motion";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

interface PageErrorProps {
  error: string | unknown;
  onRetry?: () => void;
}

export function PageError({ error, onRetry }: PageErrorProps) {
  if (!error) return null;

  const message =
    typeof error === "string" ? error : normalizeErrorMessage(error);

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center ${MOTION_CLASSNAMES.fadeInSubtle}`}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <AlertTriangle className="size-5" />
      </div>
      <p className="mb-1 text-sm font-semibold text-destructive">
        Falha ao carregar dados
      </p>
      <p className="mb-5 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="gap-2 shadow-xs"
        >
          <RefreshCcw className="size-3.5" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

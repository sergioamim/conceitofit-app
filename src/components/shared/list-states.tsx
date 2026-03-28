"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCcw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MOTION_CLASSNAMES } from "@/lib/ui-motion";

/* ---------- EmptyState ---------- */

export interface EmptyStateProps {
  /** "search" = filtered result is empty; "list" = no data at all */
  variant?: "search" | "list";
  message?: string;
  /** Optional call-to-action */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  variant = "list",
  message,
  action,
  className,
}: EmptyStateProps) {
  const Icon = variant === "search" ? SearchX : Inbox;
  const defaultMessage =
    variant === "search"
      ? "Nenhum resultado encontrado para os filtros aplicados."
      : "Nenhum registro encontrado.";

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 p-10 text-center ${MOTION_CLASSNAMES.fadeInSubtle} ${className ?? ""}`}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-sm text-muted-foreground">{message ?? defaultMessage}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ---------- ListErrorState ---------- */

export interface ListErrorStateProps {
  error: string | unknown;
  onRetry?: () => void;
  className?: string;
}

export function ListErrorState({ error, onRetry, className }: ListErrorStateProps) {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "Falha ao carregar dados. Verifique sua conexão e tente novamente.";

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center ${MOTION_CLASSNAMES.fadeInSubtle} ${className ?? ""}`}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <AlertTriangle className="size-5" />
      </div>
      <p className="mb-1 text-sm font-semibold text-destructive">Falha ao carregar dados</p>
      <p className="mb-5 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2 shadow-xs">
          <RefreshCcw className="size-3.5" />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

/* ---------- ListLoadingSkeleton ---------- */

export interface ListLoadingSkeletonProps {
  /** Number of skeleton rows */
  rows?: number;
  /** Number of columns per row */
  columns?: number;
  className?: string;
}

export function ListLoadingSkeleton({
  rows = 5,
  columns = 4,
  className,
}: ListLoadingSkeletonProps) {
  return (
    <div role="status" aria-live="polite" className={`space-y-3 ${className ?? ""}`}>
      <span className="sr-only">Carregando dados…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

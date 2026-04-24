"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "destructive" | "secondary" | "outline";

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastReturn {
  toast: (options: ToastOptions) => void;
}

function renderToast({ title, description, variant = "default", duration }: ToastOptions): void {
  const fallbackMessage = title ?? description ?? "";
  const hasTitle = title !== undefined && title !== null && title !== "";
  const message = hasTitle ? title : fallbackMessage;
  const opts = {
    description: hasTitle ? description : undefined,
    duration,
  };

  if (variant === "destructive") {
    sonnerToast.error(message, opts);
    return;
  }
  sonnerToast(message, opts);
}

export function useToast(): ToastReturn {
  const toast = useCallback((options: ToastOptions) => {
    renderToast(options);
  }, []);
  return { toast };
}

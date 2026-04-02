"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";

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

const globalToast = (options: ToastOptions): void => {
  if (typeof window === "undefined") return;
  const { title, description, variant = "default" } = options;

  const toText = (value: ReactNode): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
      return String(value);
    }
    if (typeof value === "symbol") return String(value);
    try {
      return typeof value === "string" ? value : JSON.stringify(value) || String(value);
    } catch {
      try {
        return String(value);
      } catch {
        return "";
      }
    }
  };

  const text = [toText(title), toText(description)].filter(Boolean).join(" — ");
  if (!text) return;

  const safeConsoleMethod = (methodName: "log" | "warn", value: string): void => {
    if (typeof globalThis !== "object") {
      return;
    }

    try {
      const consoleRef: unknown = (globalThis as { console?: unknown }).console;
      if (!consoleRef || typeof consoleRef !== "object") {
        return;
      }

      const method = (consoleRef as { log?: unknown; warn?: unknown })[methodName];
      if (typeof method !== "function") {
        return;
      }

      method.call(consoleRef, value);
    } catch {
      // Keep toast operation non-blocking if console is unavailable or not fully functional.
    }
  };

  if (variant === "destructive") {
    // `console.error` aciona o overlay do Next em dev até para validações de UX.
    // Para toast destrutivo, manter o sinal no console sem promover a mensagem a erro de runtime.
    safeConsoleMethod("warn", text);
    return;
  }

  safeConsoleMethod("log", text);
};

export function useToast(): ToastReturn {
  const toast = useCallback((options: ToastOptions) => {
    globalToast(options);
  }, []);

  return { toast };
}

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

  const globalConsole =
    typeof globalThis === "object" ? (globalThis as { console?: Console }).console : undefined;
  const logMethod = typeof globalConsole?.error === "function" ? globalConsole.error : null;
  const infoMethod = typeof globalConsole?.log === "function" ? globalConsole.log : null;

  if (variant === "destructive" && logMethod) {
    try {
      logMethod.call(globalConsole, text);
    } catch {
      // Keep toast operation non-blocking if console is unavailable or not fully functional.
    }
    return;
  }

  if (infoMethod) {
    try {
      infoMethod.call(globalConsole, text);
    } catch {
      // Keep toast operation non-blocking if console is unavailable or not fully functional.
    }
  }
};

export function useToast(): ToastReturn {
  const toast = useCallback((options: ToastOptions) => {
    globalToast(options);
  }, []);

  return { toast };
}

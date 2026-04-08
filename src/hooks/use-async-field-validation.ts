import { useCallback, useRef, useState } from "react";
import type { FieldAsyncFeedbackStatus } from "@/components/shared/field-async-feedback";
import { logger } from "@/lib/shared/logger";

export type AsyncFieldValidationResult = {
  valid: boolean;
  message?: string;
};

export type UseAsyncFieldValidationOptions = {
  debounceMs?: number;
  validate: (value: string) => Promise<AsyncFieldValidationResult>;
};

export function useAsyncFieldValidation({
  debounceMs = 600,
  validate,
}: UseAsyncFieldValidationOptions) {
  const [status, setStatus] = useState<FieldAsyncFeedbackStatus>("idle");
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const trigger = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (!value.trim()) {
        setStatus("idle");
        setMessage("");
        return;
      }

      setStatus("loading");
      setMessage("Checando disponibilidade...");

      timerRef.current = setTimeout(async () => {
        const currentRequestId = ++requestIdRef.current;
        try {
          const result = await validate(value);
          if (currentRequestId !== requestIdRef.current) return;
          if (result.valid) {
            setStatus("success");
            setMessage(result.message ?? "Disponível");
          } else {
            setStatus("error");
            setMessage(result.message ?? "Já cadastrado");
          }
        } catch (error) {
          logger.warn("[useAsyncFieldValidation] Validation request failed", { error });
          if (currentRequestId !== requestIdRef.current) return;
          setStatus("error");
          setMessage("Erro ao verificar. Tente novamente.");
        }
      }, debounceMs);
    },
    [debounceMs, validate]
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    requestIdRef.current++;
    setStatus("idle");
    setMessage("");
  }, []);

  return { status, message, trigger, reset };
}

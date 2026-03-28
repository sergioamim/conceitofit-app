"use client";

import { useState, useEffect, useRef } from "react";
import { logger } from "@/lib/shared/logger";
import type { UseFormReturn, FieldValues } from "react-hook-form";

export interface FormDraftOptions<T extends FieldValues> {
  key: string;
  form: UseFormReturn<T>;
  expirationHours?: number;
}

export function useFormDraft<T extends FieldValues>({ key, form, expirationHours = 24 }: FormDraftOptions<T>) {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastModified, setLastModified] = useState<Date | null>(null);
  const restoringRef = useRef(false);

  useEffect(() => {
    try {
      const draftStr = localStorage.getItem(`form_draft_${key}`);
      if (!draftStr) return;
      
      const parsed = JSON.parse(draftStr);
      if (!parsed || !parsed.timestamp || !parsed.data) {
        localStorage.removeItem(`form_draft_${key}`);
        return;
      }

      const timestamp = new Date(parsed.timestamp);
      const now = new Date();
      if ((now.getTime() - timestamp.getTime()) > expirationHours * 60 * 60 * 1000) {
        localStorage.removeItem(`form_draft_${key}`);
        return;
      }
      
      setHasDraft(true);
      setLastModified(timestamp);
    } catch {
      localStorage.removeItem(`form_draft_${key}`);
    }
  }, [key, expirationHours]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (restoringRef.current) return;
      
      try {
        const payload = {
          data: form.getValues(),
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`form_draft_${key}`, JSON.stringify(payload));
        setLastModified(new Date());
      } catch (e) {
        logger.warn("Could not save form draft", { module: "form-draft", error: e });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, key]);

  function restoreDraft() {
    try {
      restoringRef.current = true;
      const draftStr = localStorage.getItem(`form_draft_${key}`);
      if (draftStr) {
        const parsed = JSON.parse(draftStr);
        form.reset(parsed.data as T, { keepDefaultValues: false });
        setHasDraft(false);
      }
    } catch {
      setHasDraft(false);
    } finally {
      setTimeout(() => { restoringRef.current = false; }, 100);
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(`form_draft_${key}`);
      setHasDraft(false);
      setLastModified(null);
    } catch {}
  }

  function discardDraft() {
    clearDraft();
  }

  return { hasDraft, restoreDraft, clearDraft, discardDraft, lastModified };
}

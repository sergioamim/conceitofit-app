"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type CrudOptions<T> = {
  listFn: () => Promise<T[]>;
  createFn?: (data: never) => Promise<unknown>;
  updateFn?: (id: string, data: never) => Promise<unknown>;
  toggleFn?: (id: string) => Promise<unknown>;
  deleteFn?: (id: string) => Promise<unknown>;
  initialData?: T[];
};

type CrudResult<T> = {
  items: T[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  handleSave: (data: never, id?: string) => Promise<void>;
  handleToggle: (id: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
};

export function useCrudOperations<T extends { id: string }>(
  options: CrudOptions<T>
): CrudResult<T> {
  const hasInitialData = options.initialData != null && options.initialData.length > 0;
  const [items, setItems] = useState<T[]>(options.initialData ?? []);
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState("");
  const loadingRef = useRef(false);
  const didSkipInitialRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const reload = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setError("");
    setLoading(true);
    try {
      const data = await optionsRef.current.listFn();
      setItems(data);
    } catch (err) {
      setError(normalizeErrorMessage(err));
      setItems([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (hasInitialData && !didSkipInitialRef.current) {
      didSkipInitialRef.current = true;
      return;
    }
    void reload();
  }, [reload, hasInitialData]);

  const handleSave = useCallback(
    async (data: never, id?: string) => {
      setError("");
      try {
        if (id) {
          if (!optionsRef.current.updateFn) {
            setError("Operação de atualização não configurada.");
            return;
          }
          await optionsRef.current.updateFn(id, data);
        } else {
          if (!optionsRef.current.createFn) {
            setError("Operação de criação não configurada.");
            return;
          }
          await optionsRef.current.createFn(data);
        }
        await reload();
      } catch (err) {
        setError(normalizeErrorMessage(err));
      }
    },
    [reload]
  );

  const handleToggle = useCallback(
    async (id: string) => {
      if (!optionsRef.current.toggleFn) {
        setError("Operação de toggle não configurada.");
        return;
      }
      setError("");
      try {
        await optionsRef.current.toggleFn(id);
        await reload();
      } catch (err) {
        setError(normalizeErrorMessage(err));
      }
    },
    [reload]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!optionsRef.current.deleteFn) {
        setError("Operação de remoção não configurada.");
        return;
      }
      setError("");
      try {
        await optionsRef.current.deleteFn(id);
        await reload();
      } catch (err) {
        setError(normalizeErrorMessage(err));
      }
    },
    [reload]
  );

  return { items, loading, error, reload, handleSave, handleToggle, handleDelete };
}

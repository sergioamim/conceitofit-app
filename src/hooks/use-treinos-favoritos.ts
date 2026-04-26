"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "treinos:favoritos:v1";

function read(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((v) => typeof v === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function write(set: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage indisponível (modo privado, quota) — fallback silencioso.
  }
}

export function useTreinosFavoritos() {
  const [favoritos, setFavoritos] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavoritos(read());
    setHydrated(true);
  }, []);

  const toggle = useCallback((id: string) => {
    setFavoritos((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      write(next);
      return next;
    });
  }, []);

  const isFavorito = useCallback(
    (id: string) => (hydrated ? favoritos.has(id) : false),
    [favoritos, hydrated],
  );

  return { favoritos, toggle, isFavorito, hydrated };
}

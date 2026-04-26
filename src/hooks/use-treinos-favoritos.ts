"use client";

/**
 * Favoritos de templates de treino — preferência visual ephemeral.
 *
 * Usa localStorage por design: não é dado operacional (não impacta
 * permissões, billing, treino real). É só uma marcação UI pra ordenar
 * cards do personal. Se for limpo, nenhum estado de negócio se perde.
 * Justificativa: convenção do projeto proíbe localStorage operacional;
 * este caso é "draft transitório documentado" autorizado pela regra.
 *
 * Implementação via useSyncExternalStore — pattern React 18+ que evita
 * setState-in-effect e lida com SSR/hidratação automaticamente.
 */

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "treinos:favoritos:v1";
const EMPTY: ReadonlySet<string> = new Set();
const subscribers = new Set<() => void>();
let cache: ReadonlySet<string> | null = null;

function readFromStorage(): ReadonlySet<string> {
  if (typeof window === "undefined") return EMPTY;
  if (cache !== null) return cache;
  try {
    // eslint-disable-next-line no-restricted-properties -- favoritos ephemeral, ver doc no topo
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = EMPTY;
    } else {
      const parsed = JSON.parse(raw);
      cache = Array.isArray(parsed)
        ? new Set(parsed.filter((v) => typeof v === "string"))
        : EMPTY;
    }
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function writeToStorage(set: ReadonlySet<string>) {
  if (typeof window === "undefined") return;
  try {
    // eslint-disable-next-line no-restricted-properties -- favoritos ephemeral, ver doc no topo
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Quota cheia ou modo privado — fallback silencioso, cache em memória
    // ainda funciona durante a sessão.
  }
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function notify() {
  cache = null;
  for (const s of subscribers) s();
}

export function useTreinosFavoritos() {
  const favoritos = useSyncExternalStore(
    subscribe,
    readFromStorage,
    () => EMPTY,
  );

  const toggle = useCallback(
    (id: string) => {
      const current = readFromStorage();
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeToStorage(next);
      notify();
    },
    [],
  );

  const isFavorito = useCallback(
    (id: string) => favoritos.has(id),
    [favoritos],
  );

  return { favoritos, toggle, isFavorito, hydrated: true };
}

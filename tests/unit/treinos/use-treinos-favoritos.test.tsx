import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const STORAGE_KEY = "treinos:favoritos:v1";

// O hook tem cache em escopo de módulo (let cache + subscribers via
// useSyncExternalStore). Pra isolar cada teste, resetamos o módulo
// antes de cada execução e importamos via dynamic import.
let useTreinosFavoritos: typeof import("@/hooks/use-treinos-favoritos").useTreinosFavoritos;

beforeEach(async () => {
  window.localStorage.clear();
  vi.resetModules();
  ({ useTreinosFavoritos } = await import("@/hooks/use-treinos-favoritos"));
});

afterEach(() => {
  window.localStorage.clear();
});

describe("useTreinosFavoritos", () => {
  it("começa com Set vazio quando localStorage está limpo", () => {
    const { result } = renderHook(() => useTreinosFavoritos());
    expect(result.current.favoritos.size).toBe(0);
    expect(result.current.isFavorito("tpl-1")).toBe(false);
  });

  it("toggle adiciona id quando ausente", () => {
    const { result } = renderHook(() => useTreinosFavoritos());
    act(() => result.current.toggle("tpl-1"));
    expect(result.current.isFavorito("tpl-1")).toBe(true);
    expect(result.current.favoritos.size).toBe(1);
  });

  it("toggle remove id quando já presente", () => {
    const { result } = renderHook(() => useTreinosFavoritos());
    act(() => result.current.toggle("tpl-1"));
    act(() => result.current.toggle("tpl-1"));
    expect(result.current.isFavorito("tpl-1")).toBe(false);
    expect(result.current.favoritos.size).toBe(0);
  });

  it("persiste no localStorage com chave canônica", () => {
    const { result } = renderHook(() => useTreinosFavoritos());
    act(() => result.current.toggle("tpl-A"));
    act(() => result.current.toggle("tpl-B"));

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as string[];
    expect(parsed.sort()).toEqual(["tpl-A", "tpl-B"]);
  });

  it("hidrata estado a partir do localStorage existente", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(["tpl-existing-1", "tpl-existing-2"]),
    );
    const { result } = renderHook(() => useTreinosFavoritos());
    expect(result.current.isFavorito("tpl-existing-1")).toBe(true);
    expect(result.current.isFavorito("tpl-existing-2")).toBe(true);
    expect(result.current.favoritos.size).toBe(2);
  });

  it("ignora entradas malformadas no storage (não-array, não-string)", () => {
    window.localStorage.setItem(STORAGE_KEY, "{}not json");
    const { result } = renderHook(() => useTreinosFavoritos());
    expect(result.current.favoritos.size).toBe(0);
  });

  it("filtra entradas não-string em arrays mistos", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(["tpl-valid", 42, null, "tpl-other"]),
    );
    const { result } = renderHook(() => useTreinosFavoritos());
    expect(result.current.favoritos.size).toBe(2);
    expect(result.current.isFavorito("tpl-valid")).toBe(true);
    expect(result.current.isFavorito("tpl-other")).toBe(true);
  });

  it("dispara re-render em todas as instâncias após toggle (subscribers)", () => {
    const { result: a } = renderHook(() => useTreinosFavoritos());
    const { result: b } = renderHook(() => useTreinosFavoritos());

    expect(a.current.isFavorito("tpl-shared")).toBe(false);
    expect(b.current.isFavorito("tpl-shared")).toBe(false);

    act(() => a.current.toggle("tpl-shared"));

    // Ambas as instâncias enxergam a mudança (pubsub via notify)
    expect(a.current.isFavorito("tpl-shared")).toBe(true);
    expect(b.current.isFavorito("tpl-shared")).toBe(true);
  });
});

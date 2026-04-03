import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

const mockUnidades = [
  {
    id: "uni-1",
    nome: "Unidade Centro",
    academiaId: "acad-1",
    groupId: "acad-1",
    documento: "11.111.111/0001-01",
    subdomain: "centro",
    endereco: { cidade: "São Paulo" },
    ativo: true,
  },
  {
    id: "uni-2",
    nome: "Unidade Norte",
    academiaId: "acad-1",
    groupId: "acad-1",
    documento: "22.222.222/0001-02",
    subdomain: "norte",
    ativo: true,
  },
  {
    id: "uni-3",
    nome: "Unidade Zona Sul",
    academiaId: "acad-2",
    groupId: "acad-2",
    subdomain: "zonasul",
    endereco: { cidade: "Rio de Janeiro" },
    ativo: true,
  },
];

vi.mock("@/lib/backoffice/admin", () => ({
  listGlobalUnidades: vi.fn(() => Promise.resolve(mockUnidades)),
}));

vi.mock("@/lib/query/keys", () => ({
  queryKeys: {
    admin: {
      unidades: {
        list: () => ["admin", "unidades", "list"] as const,
      },
    },
  },
}));

import { useUnidadeSuggestion } from "@/app/(backoffice)/lib/use-unidade-suggestion";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useUnidadeSuggestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna todas as unidades quando academiaId não é fornecido", async () => {
    const { result } = renderHook(() => useUnidadeSuggestion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.options).toHaveLength(3);
    expect(result.current.options[0]).toEqual({
      id: "uni-1",
      label: "Unidade Centro",
      searchText: "11.111.111/0001-01 centro São Paulo",
    });
  });

  it("filtra unidades por academiaId", async () => {
    const { result } = renderHook(() => useUnidadeSuggestion("acad-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.options).toHaveLength(2);
    expect(result.current.options.every((o) => o.id === "uni-1" || o.id === "uni-2")).toBe(true);
  });

  it("filtra unidades por groupId quando academiaId não bate", async () => {
    const { result } = renderHook(() => useUnidadeSuggestion("acad-2"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.options).toHaveLength(1);
    expect(result.current.options[0].id).toBe("uni-3");
  });

  it("retorna lista vazia enquanto carrega", () => {
    const { result } = renderHook(() => useUnidadeSuggestion("acad-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.options).toHaveLength(0);
  });

  it("limita resultados a 50 opções", async () => {
    const { listGlobalUnidades } = await import("@/lib/backoffice/admin");
    const manyUnidades = Array.from({ length: 80 }, (_, i) => ({
      id: `uni-${i}`,
      nome: `Unidade ${i}`,
      academiaId: "acad-1",
      groupId: "acad-1",
      ativo: true,
    }));
    vi.mocked(listGlobalUnidades).mockResolvedValueOnce(manyUnidades);

    const { result } = renderHook(() => useUnidadeSuggestion("acad-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.options).toHaveLength(50);
  });

  it("expõe onFocusOpen como função", () => {
    const { result } = renderHook(() => useUnidadeSuggestion(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.onFocusOpen).toBe("function");
  });
});

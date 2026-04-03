import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

const mockAcademias = [
  {
    id: "acad-1",
    nome: "Academia Força Total",
    documento: "12.345.678/0001-90",
    endereco: { cidade: "São Paulo", estado: "SP" },
    ativo: true,
  },
  {
    id: "acad-2",
    nome: "Studio Fit",
    documento: "98.765.432/0001-10",
    endereco: { cidade: "Rio de Janeiro" },
    ativo: true,
  },
  {
    id: "acad-3",
    nome: "CrossBox Arena",
    ativo: true,
  },
];

vi.mock("@/backoffice/lib/admin", () => ({
  listGlobalAcademias: vi.fn(() => Promise.resolve(mockAcademias)),
}));

vi.mock("@/lib/query/keys", () => ({
  queryKeys: {
    admin: {
      academias: {
        list: () => ["admin", "academias", "list"] as const,
      },
    },
  },
}));

import { useAcademiaSuggestion } from "@/app/(backoffice)/lib/use-academia-suggestion";

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

describe("useAcademiaSuggestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna options mapeadas a partir das academias", async () => {
    const { result } = renderHook(() => useAcademiaSuggestion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.options).toHaveLength(3);
    expect(result.current.options[0]).toEqual({
      id: "acad-1",
      label: "Academia Força Total",
      searchText: "12.345.678/0001-90 São Paulo",
    });
    expect(result.current.options[1]).toEqual({
      id: "acad-2",
      label: "Studio Fit",
      searchText: "98.765.432/0001-10 Rio de Janeiro",
    });
    expect(result.current.options[2]).toEqual({
      id: "acad-3",
      label: "CrossBox Arena",
      searchText: "",
    });
  });

  it("retorna isLoading true enquanto carrega", () => {
    const { result } = renderHook(() => useAcademiaSuggestion(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.options).toHaveLength(0);
  });

  it("limita resultados a 50 opções", async () => {
    const { listGlobalAcademias } = await import("@/backoffice/lib/admin");
    const manyAcademias = Array.from({ length: 80 }, (_, i) => ({
      id: `acad-${i}`,
      nome: `Academia ${i}`,
      ativo: true,
    }));
    vi.mocked(listGlobalAcademias).mockResolvedValueOnce(manyAcademias);

    const { result } = renderHook(() => useAcademiaSuggestion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.options).toHaveLength(50);
  });

  it("expõe onFocusOpen como função", () => {
    const { result } = renderHook(() => useAcademiaSuggestion(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.onFocusOpen).toBe("function");
  });
});

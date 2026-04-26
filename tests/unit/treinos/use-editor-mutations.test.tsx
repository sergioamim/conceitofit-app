import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { useEditorMutations } from "@/components/treinos/editor-v3/use-editor-mutations";
import { createTreinoV2MetricField } from "@/lib/tenant/treinos/v2-domain";
import type { TreinoV2EditorSeed } from "@/lib/tenant/treinos/v2-runtime";

/**
 * Lógica de mutations do editor V3 (Wave J.5 + J.4):
 * - addItensFromBiblioteca insere com defaults sensatos
 * - moveItemBetweenSessoes (Wave J.4) move e reordena
 * - reorderItens dentro da mesma sessão
 */

function makeItem(
  id: string,
  exId: string,
): TreinoV2EditorSeed["sessoes"][number]["itens"][number] {
  return {
    id,
    exerciseId: exId,
    exerciseNome: `Exercício ${exId}`,
    ordem: 1,
    series: createTreinoV2MetricField("3"),
    repeticoes: createTreinoV2MetricField("10"),
    tecnicas: [],
  };
}

function makeSeed(): TreinoV2EditorSeed {
  return {
    id: "tpl-1",
    nome: "Test",
    sessoes: [
      {
        id: "sessao-A",
        nome: "A",
        ordem: 1,
        itens: [makeItem("item-1", "ex-1"), makeItem("item-2", "ex-2")],
      },
      {
        id: "sessao-B",
        nome: "B",
        ordem: 2,
        itens: [makeItem("item-3", "ex-3")],
      },
    ],
  } as unknown as TreinoV2EditorSeed;
}

function useTestHarness() {
  const [editor, setEditor] = useState<TreinoV2EditorSeed>(makeSeed());
  const [activeSessaoId, setActiveSessaoId] = useState("sessao-A");
  const mutations = useEditorMutations({
    editor,
    setEditor,
    activeSessaoId,
    setActiveSessaoId,
    exercicios: [
      {
        id: "ex-novo",
        tenantId: "tn-1",
        nome: "Exercício novo",
        grupoMuscularNome: "Peito",
        ativo: true,
      },
    ],
  });
  return { editor, mutations };
}

describe("useEditorMutations", () => {
  it("addItensFromBiblioteca insere itens na sessão ativa com defaults", () => {
    const { result } = renderHook(() => useTestHarness());

    expect(result.current.editor.sessoes[0]!.itens).toHaveLength(2);

    act(() => result.current.mutations.addItensFromBiblioteca(["ex-novo"]));

    const sessaoA = result.current.editor.sessoes[0]!;
    expect(sessaoA.itens).toHaveLength(3);
    const novo = sessaoA.itens[2]!;
    expect(novo.exerciseId).toBe("ex-novo");
    expect(novo.exerciseNome).toBe("Exercício novo");
    expect(novo.series?.raw).toBe("3");
    expect(novo.repeticoes?.raw).toBe("10-12");
    expect(novo.intervalo?.raw).toBe("60");
    expect(novo.rir).toBe(2);
  });

  it("moveItemBetweenSessoes remove de A e adiciona em B (Wave J.4)", () => {
    const { result } = renderHook(() => useTestHarness());

    act(() =>
      result.current.mutations.moveItemBetweenSessoes(
        "item-1",
        "sessao-A",
        "sessao-B",
      ),
    );

    const sessaoA = result.current.editor.sessoes[0]!;
    const sessaoB = result.current.editor.sessoes[1]!;
    expect(sessaoA.itens).toHaveLength(1);
    expect(sessaoA.itens[0]!.id).toBe("item-2");
    expect(sessaoA.itens[0]!.ordem).toBe(1); // reordenado
    expect(sessaoB.itens).toHaveLength(2);
    expect(sessaoB.itens[1]!.id).toBe("item-1");
    expect(sessaoB.itens[1]!.ordem).toBe(2); // appended
  });

  it("moveItemBetweenSessoes ignora quando from=to", () => {
    const { result } = renderHook(() => useTestHarness());

    act(() =>
      result.current.mutations.moveItemBetweenSessoes(
        "item-1",
        "sessao-A",
        "sessao-A",
      ),
    );

    expect(result.current.editor.sessoes[0]!.itens).toHaveLength(2);
  });

  it("moveItemBetweenSessoes ignora item inexistente", () => {
    const { result } = renderHook(() => useTestHarness());

    act(() =>
      result.current.mutations.moveItemBetweenSessoes(
        "item-fantasma",
        "sessao-A",
        "sessao-B",
      ),
    );

    expect(result.current.editor.sessoes[0]!.itens).toHaveLength(2);
    expect(result.current.editor.sessoes[1]!.itens).toHaveLength(1);
  });

  it("removeItem mantém ordem das outras posições", () => {
    const { result } = renderHook(() => useTestHarness());

    act(() => result.current.mutations.removeItem("sessao-A", "item-1"));

    const sessaoA = result.current.editor.sessoes[0]!;
    expect(sessaoA.itens).toHaveLength(1);
    expect(sessaoA.itens[0]!.id).toBe("item-2");
  });

  it("duplicateItem insere cópia logo após o original", () => {
    const { result } = renderHook(() => useTestHarness());

    act(() => result.current.mutations.duplicateItem("sessao-A", "item-1"));

    const sessaoA = result.current.editor.sessoes[0]!;
    expect(sessaoA.itens).toHaveLength(3);
    expect(sessaoA.itens[0]!.id).toBe("item-1");
    // Cópia tem novo id mas mesma referência de exerciseId
    expect(sessaoA.itens[1]!.exerciseId).toBe("ex-1");
    expect(sessaoA.itens[1]!.id).not.toBe("item-1");
    expect(sessaoA.itens[2]!.id).toBe("item-2");
  });

  it("addSessao cria sessão nova e seleciona como ativa", () => {
    const { result } = renderHook(() => useTestHarness());

    act(() => result.current.mutations.addSessao());

    expect(result.current.editor.sessoes).toHaveLength(3);
  });

  it("removeSessao impede deletar a última sessão", () => {
    const { result } = renderHook(() => useTestHarness());

    act(() => result.current.mutations.removeSessao("sessao-A"));
    act(() => result.current.mutations.removeSessao("sessao-B"));

    expect(result.current.editor.sessoes.length).toBeGreaterThanOrEqual(1);
  });
});

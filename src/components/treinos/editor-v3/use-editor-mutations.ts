"use client";

/**
 * useEditorMutations — hook que centraliza as mutations de sessão e
 * item do editor V3 (Wave J.5).
 *
 * Extraído de treino-v3-editor.tsx pra reduzir o arquivo principal
 * abaixo de 500 linhas. Mantém o setEditor + setActiveSessaoId no
 * componente pai, expondo callbacks já memoizados.
 */

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  createEmptyTreinoV2Sessao,
  type TreinoV2EditorSeed,
} from "@/lib/tenant/treinos/v2-runtime";
import { createTreinoV2MetricField } from "@/lib/tenant/treinos/v2-domain";
import type { Exercicio } from "@/lib/shared/types/aluno";

type SessaoItem = TreinoV2EditorSeed["sessoes"][number]["itens"][number];

export interface UseEditorMutationsArgs {
  editor: TreinoV2EditorSeed;
  setEditor: Dispatch<SetStateAction<TreinoV2EditorSeed>>;
  activeSessaoId: string;
  setActiveSessaoId: Dispatch<SetStateAction<string>>;
  exercicios: Exercicio[];
}

export function useEditorMutations({
  editor,
  setEditor,
  activeSessaoId,
  setActiveSessaoId,
  exercicios,
}: UseEditorMutationsArgs) {
  const updateSessoes = useCallback(
    (
      updater: (
        sessoes: TreinoV2EditorSeed["sessoes"],
      ) => TreinoV2EditorSeed["sessoes"],
    ) => {
      setEditor((prev) => ({ ...prev, sessoes: updater(prev.sessoes) }));
    },
    [setEditor],
  );

  const addSessao = useCallback(() => {
    const nova = createEmptyTreinoV2Sessao(editor.sessoes.length);
    updateSessoes((sessoes) => [...sessoes, nova]);
    setActiveSessaoId(nova.id);
  }, [editor.sessoes.length, updateSessoes, setActiveSessaoId]);

  const duplicateSessao = useCallback(
    (sId: string) => {
      updateSessoes((sessoes) => {
        const orig = sessoes.find((s) => s.id === sId);
        if (!orig) return sessoes;
        const copia = {
          ...(JSON.parse(JSON.stringify(orig)) as typeof orig),
          id: `sessao-${Date.now()}`,
          nome: `${orig.nome}'`,
          ordem: sessoes.length + 1,
        };
        return [...sessoes, copia];
      });
    },
    [updateSessoes],
  );

  const removeSessao = useCallback(
    (sId: string) => {
      updateSessoes((sessoes) => {
        if (sessoes.length === 1) return sessoes;
        return sessoes.filter((s) => s.id !== sId);
      });
      if (activeSessaoId === sId) {
        const fallback = editor.sessoes.find((s) => s.id !== sId);
        if (fallback) setActiveSessaoId(fallback.id);
      }
    },
    [updateSessoes, activeSessaoId, editor.sessoes, setActiveSessaoId],
  );

  const updateItem = useCallback(
    (sId: string, itemId: string, patch: Partial<SessaoItem>) => {
      updateSessoes((sessoes) =>
        sessoes.map((s) =>
          s.id !== sId
            ? s
            : {
                ...s,
                itens: s.itens.map((i) => (i.id !== itemId ? i : { ...i, ...patch })),
              },
        ),
      );
    },
    [updateSessoes],
  );

  const removeItem = useCallback(
    (sId: string, itemId: string) => {
      updateSessoes((sessoes) =>
        sessoes.map((s) =>
          s.id !== sId ? s : { ...s, itens: s.itens.filter((i) => i.id !== itemId) },
        ),
      );
    },
    [updateSessoes],
  );

  const duplicateItem = useCallback(
    (sId: string, itemId: string) => {
      updateSessoes((sessoes) =>
        sessoes.map((s) => {
          if (s.id !== sId) return s;
          const idx = s.itens.findIndex((i) => i.id === itemId);
          if (idx < 0) return s;
          const orig = s.itens[idx];
          const copy: SessaoItem = { ...orig!, id: `item-${Date.now()}` };
          const novos = [...s.itens.slice(0, idx + 1), copy, ...s.itens.slice(idx + 1)];
          return { ...s, itens: novos };
        }),
      );
    },
    [updateSessoes],
  );

  const reorderItens = useCallback(
    (sId: string, fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx) return;
      updateSessoes((sessoes) =>
        sessoes.map((s) =>
          s.id !== sId ? s : { ...s, itens: arrayMove(s.itens, fromIdx, toIdx) },
        ),
      );
    },
    [updateSessoes],
  );

  // Adiciona N exercícios na sessão ativa com defaults sensatos.
  const addItensFromBiblioteca = useCallback(
    (exIds: string[]) => {
      if (exIds.length === 0) return;
      const baseTs = Date.now();
      const novosItens = exIds.map<SessaoItem>((exId, idx) => {
        const ex = exercicios.find((e) => e.id === exId);
        return {
          id: `item-${baseTs}-${idx}`,
          exerciseId: exId,
          exerciseNome: ex?.nome,
          ordem: 0,
          objetivo: ex?.grupoMuscularNome ?? ex?.grupoMuscular,
          series: createTreinoV2MetricField("3"),
          repeticoes: createTreinoV2MetricField("10-12"),
          intervalo: createTreinoV2MetricField("60"),
          cadencia: undefined,
          rir: 2,
          carga: undefined,
          observacoes: undefined,
          tecnicas: [],
        };
      });
      updateSessoes((sessoes) =>
        sessoes.map((s) => {
          if (s.id !== activeSessaoId) return s;
          const merged = [...s.itens, ...novosItens];
          return {
            ...s,
            itens: merged.map((it, i) => ({ ...it, ordem: i + 1 })),
          };
        }),
      );
    },
    [activeSessaoId, exercicios, updateSessoes],
  );

  return {
    updateSessoes,
    addSessao,
    duplicateSessao,
    removeSessao,
    updateItem,
    removeItem,
    duplicateItem,
    reorderItens,
    addItensFromBiblioteca,
  };
}

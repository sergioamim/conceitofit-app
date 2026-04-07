"use client";

import { startTransition, useState, useCallback, useMemo } from "react";
import {
  buildTreinoV2EditorSeed,
  createEmptyTreinoV2Block,
  type TreinoV2EditorSeed,
} from "@/lib/tenant/treinos/v2-runtime";
import { cloneEditor, moveItem, buildNewExerciseItem } from "./types";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";
import type { TreinoV2TechniqueType } from "@/lib/tenant/treinos/v2-domain";

export function useBlockManager(initialEditor: TreinoV2EditorSeed) {
  const [editor, setEditor] = useState<TreinoV2EditorSeed>(initialEditor);
  const [activeBlockId, setActiveBlockId] = useState(() => initialEditor.blocos[0]?.id ?? "");

  const activeBlock = useMemo(
    () => editor.blocos.find((block) => block.id === activeBlockId) ?? editor.blocos[0] ?? null,
    [activeBlockId, editor.blocos],
  );

  function updateEditor(updater: (current: TreinoV2EditorSeed) => TreinoV2EditorSeed) {
    startTransition(() => {
      setEditor((current) => updater(cloneEditor(current)));
    });
  }

  function upsertBlocks(updater: (blocks: TreinoV2EditorSeed["blocos"]) => TreinoV2EditorSeed["blocos"]) {
    updateEditor((current) => {
      const nextBlocks = updater(current.blocos).map((block, blockIndex) => ({
        ...block,
        nome: block.nome.trim() || String.fromCharCode(65 + blockIndex),
        ordem: blockIndex + 1,
        itens: block.itens.map((item, itemIndex) => ({
          ...item,
          ordem: itemIndex + 1,
        })),
      }));
      return { ...current, blocos: nextBlocks };
    });
  }

  const addBlock = useCallback(() => {
    const newBlock = createEmptyTreinoV2Block(editor.blocos.length);
    upsertBlocks((blocks) => [...blocks, newBlock]);
    setActiveBlockId(newBlock.id);
  }, [editor.blocos.length]);

  const duplicateBlock = useCallback((blockId: string) => {
    upsertBlocks((blocks) => {
      const block = blocks.find((item) => item.id === blockId);
      if (!block) return blocks;
      return [
        ...blocks,
        {
          ...JSON.parse(JSON.stringify(block)),
          id: `${block.id}-copy-${Date.now()}`,
          nome: `${block.nome} copia`,
        },
      ];
    });
  }, []);

  const moveBlock = useCallback((blockId: string, direction: -1 | 1) => {
    upsertBlocks((blocks) => {
      const index = blocks.findIndex((item) => item.id === blockId);
      if (index === -1) return blocks;
      return moveItem(blocks, index, direction);
    });
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    upsertBlocks((blocks) => {
      if (blocks.length === 1) return blocks;
      return blocks.filter((item) => item.id !== blockId);
    });
    setActiveBlockId((currentId) => {
      if (currentId === blockId) {
        const next = editor.blocos.find((item) => item.id !== blockId);
        return next?.id ?? "";
      }
      return currentId;
    });
  }, [editor.blocos]);

  const updateBlockName = useCallback((blockId: string, name: string) => {
    upsertBlocks((blocks) =>
      blocks.map((item) =>
        item.id === blockId ? { ...item, nome: name } : item,
      ),
    );
  }, []);

  const updateBlockItem = useCallback(
    (
      blockId: string,
      itemId: string,
      updater: (item: TreinoV2EditorSeed["blocos"][number]["itens"][number]) => TreinoV2EditorSeed["blocos"][number]["itens"][number],
    ) => {
      upsertBlocks((blocks) =>
        blocks.map((block) =>
          block.id !== blockId
            ? block
            : {
                ...block,
                itens: block.itens.map((item) => (item.id === itemId ? updater(item) : item)),
              },
        ),
      );
    },
    [],
  );

  const addExerciseToBlock = useCallback(
    (blockId: string, exercicio?: TreinoV2CatalogExercise) => {
      const block = editor.blocos.find((b) => b.id === blockId);
      if (!block) return;
      upsertBlocks((blocks) =>
        blocks.map((b) =>
          b.id !== blockId
            ? b
            : {
                ...b,
                itens: [...b.itens, buildNewExerciseItem(exercicio, b.itens.length + 1)],
              },
        ),
      );
    },
    [editor.blocos],
  );

  const duplicateItem = useCallback(
    (itemId: string) => {
      if (!activeBlock) return;
      upsertBlocks((blocks) =>
        blocks.map((block) => {
          if (block.id !== activeBlock.id) return block;
          const index = block.itens.findIndex((item) => item.id === itemId);
          if (index === -1) return block;
          const source = block.itens[index];
          const copy = {
            ...JSON.parse(JSON.stringify(source)),
            id: `${source.id}-copy-${Date.now()}`,
            tecnicas: source.tecnicas?.filter((tech) => tech.type !== "REPLICAR_SERIE") ?? [],
          };
          const nextItems = [...block.itens];
          nextItems.splice(index + 1, 0, copy);
          return { ...block, itens: nextItems };
        }),
      );
    },
    [activeBlock],
  );

  const moveItemInActiveBlock = useCallback(
    (itemId: string, direction: -1 | 1) => {
      if (!activeBlock) return;
      upsertBlocks((blocks) =>
        blocks.map((block) => {
          if (block.id !== activeBlock.id) return block;
          const index = block.itens.findIndex((item) => item.id === itemId);
          if (index === -1) return block;
          return { ...block, itens: moveItem(block.itens, index, direction) };
        }),
      );
    },
    [activeBlock],
  );

  const removeItemFromActiveBlock = useCallback(
    (itemId: string) => {
      if (!activeBlock) return;
      upsertBlocks((blocks) =>
        blocks.map((block) =>
          block.id !== activeBlock.id
            ? block
            : {
                ...block,
                itens: block.itens.filter((item) => item.id !== itemId),
              },
        ),
      );
    },
    [activeBlock],
  );

  const toggleTechnique = useCallback(
    (itemId: string, type: TreinoV2TechniqueType) => {
      if (!activeBlock) return;
      updateBlockItem(activeBlock.id, itemId, (item) => {
        const current = item.tecnicas ?? [];
        const exists = current.some((tech) => tech.type === type);
        return {
          ...item,
          tecnicas: exists ? current.filter((tech) => tech.type !== type) : [...current, { type }],
        };
      });

      if (type === "REPLICAR_SERIE") {
        duplicateItem(itemId);
      }
    },
    [activeBlock, updateBlockItem, duplicateItem],
  );

  return {
    editor,
    setEditor,
    updateEditor,
    activeBlockId,
    setActiveBlockId,
    activeBlock,
    addBlock,
    duplicateBlock,
    moveBlock,
    removeBlock,
    updateBlockName,
    updateBlockItem,
    addExerciseToBlock,
    duplicateItem,
    moveItemInActiveBlock,
    removeItemFromActiveBlock,
    toggleTechnique,
  };
}

"use client";

/**
 * TreinoV3Editor — editor inline tipo planilha (Wave 3 do PRD V3).
 *
 * Coração do redesign: substitui o form-based V2 por uma tabela inline com
 * 7 colunas editáveis cell-by-cell + drag&drop pra reordenar exercícios
 * dentro da sessão + sidebar de sessões A/B/C + stats por sessão.
 *
 * Feature flag: NEXT_PUBLIC_TREINO_EDITOR_V3_ENABLED. Coexiste com V2 até
 * a Wave 7 (cutover).
 *
 * Atualmente NÃO suporta modo instance (overlay por aluno) — Wave 4.
 */

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Copy,
  GripVertical,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  buildTreinoV2EditorSeed,
  createEmptyTreinoV2Sessao,
  type TreinoV2EditorSeed,
} from "@/lib/tenant/treinos/v2-runtime";
import { createTreinoV2MetricField } from "@/lib/tenant/treinos/v2-domain";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";
import type { EditorProps } from "./editor/types";

type SessaoItem = TreinoV2EditorSeed["sessoes"][number]["itens"][number];

export function TreinoV3Editor({ treino, exercicios, onTreinoChange }: EditorProps) {
  const { toast } = useToast();
  const [editor, setEditor] = useState<TreinoV2EditorSeed>(() => buildTreinoV2EditorSeed(treino));
  const [activeSessaoId, setActiveSessaoId] = useState(() => editor.sessoes[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  const activeSessao = useMemo(
    () => editor.sessoes.find((s) => s.id === activeSessaoId) ?? editor.sessoes[0] ?? null,
    [editor.sessoes, activeSessaoId],
  );

  const catalogById = useMemo(() => {
    const map = new Map<string, TreinoV2CatalogExercise>();
    for (const ex of exercicios) map.set(ex.id, ex as unknown as TreinoV2CatalogExercise);
    return map;
  }, [exercicios]);

  // ─── Mutations ───
  const updateSessoes = useCallback(
    (updater: (sessoes: TreinoV2EditorSeed["sessoes"]) => TreinoV2EditorSeed["sessoes"]) => {
      setEditor((prev) => ({ ...prev, sessoes: updater(prev.sessoes) }));
    },
    [],
  );

  const addSessao = useCallback(() => {
    const nova = createEmptyTreinoV2Sessao(editor.sessoes.length);
    updateSessoes((sessoes) => [...sessoes, nova]);
    setActiveSessaoId(nova.id);
  }, [editor.sessoes.length, updateSessoes]);

  const duplicateSessao = useCallback(
    (sId: string) => {
      updateSessoes((sessoes) => {
        const orig = sessoes.find((s) => s.id === sId);
        if (!orig) return sessoes;
        const copia = {
          ...JSON.parse(JSON.stringify(orig)) as typeof orig,
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
    [updateSessoes, activeSessaoId, editor.sessoes],
  );

  const updateItem = useCallback(
    (sId: string, itemId: string, patch: Partial<SessaoItem>) => {
      updateSessoes((sessoes) =>
        sessoes.map((s) =>
          s.id !== sId
            ? s
            : { ...s, itens: s.itens.map((i) => (i.id !== itemId ? i : { ...i, ...patch })) },
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
          const copy: SessaoItem = { ...orig, id: `item-${Date.now()}` };
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

  // ─── Stats da sessão ativa ───
  const stats = useMemo(() => {
    if (!activeSessao) return { totalItens: 0, totalSeries: 0 };
    const totalSeries = activeSessao.itens.reduce(
      (sum, it) => sum + (Number(it.series?.numericValue) || 0),
      0,
    );
    return { totalItens: activeSessao.itens.length, totalSeries };
  }, [activeSessao]);

  // ─── Save (placeholder — Wave 3 entrega só UI; persist depois) ───
  const handleSave = useCallback(() => {
    setSaving(true);
    try {
      // TODO Wave 4: integrar com saveTreinoWorkspace passando o editor mutado.
      toast({
        title: "Salvamento em revisão",
        description:
          "Editor V3 ainda não persiste no backend. Wave 4 conecta o save ao endpoint de sessões.",
      });
      onTreinoChange?.(treino);
    } finally {
      setSaving(false);
    }
  }, [toast, onTreinoChange, treino]);

  // ─── DnD setup ───
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !activeSessao) return;
      const fromIdx = activeSessao.itens.findIndex((i) => i.id === active.id);
      const toIdx = activeSessao.itens.findIndex((i) => i.id === over.id);
      if (fromIdx >= 0 && toIdx >= 0) reorderItens(activeSessao.id, fromIdx, toIdx);
    },
    [activeSessao, reorderItens],
  );

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-1 items-center gap-3">
          <Button asChild variant="outline" size="sm" className="border-border">
            <Link href="/treinos">
              <ArrowLeft className="mr-1 size-4" />
              Templates
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <Input
              value={editor.nome ?? ""}
              onChange={(e) => setEditor((p) => ({ ...p, nome: e.target.value }))}
              className="border-0 bg-transparent px-0 font-display text-xl font-bold focus-visible:ring-0"
              placeholder="Nome do template"
            />
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{editor.categoria ?? "Sem objetivo"}</span>
              <span>·</span>
              <span>{editor.frequenciaSemanal ?? 0}x/sem</span>
              <span>·</span>
              <span>{editor.sessoes.length} sessões</span>
              <Badge variant="outline" className="ml-2 border-gym-accent/30 text-gym-accent">
                Editor V3 (preview)
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="border-border">
            <Send className="mr-2 size-4" />
            Pré-visualizar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 size-4" />
            {saving ? "Salvando..." : "Salvar template"}
          </Button>
        </div>
      </div>

      {/* ─── Grid: sessões sidebar + main table ─── */}
      <div className="grid grid-cols-[220px_1fr] gap-4">
        {/* Sidebar de sessões */}
        <aside className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sessões
            </span>
            <Button variant="ghost" size="icon" className="size-7" onClick={addSessao}>
              <Plus className="size-4" />
            </Button>
          </div>
          {editor.sessoes.map((s, idx) => {
            const ativa = s.id === activeSessaoId;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSessaoId(s.id)}
                className={cn(
                  "group flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                  ativa
                    ? "border-gym-accent bg-gym-accent/10"
                    : "border-border bg-secondary/40 hover:bg-secondary",
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md font-bold",
                    ativa ? "bg-gym-accent text-black" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {s.nome || String.fromCharCode(65 + idx)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{s.nome || `Sessão ${idx + 1}`}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {s.itens.length} ex
                  </div>
                </div>
                {ativa && editor.sessoes.length > 1 ? (
                  <span
                    role="button"
                    tabIndex={0}
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateSessao(s.id);
                    }}
                    title="Duplicar sessão"
                  >
                    <Copy className="size-3.5 text-muted-foreground" />
                  </span>
                ) : null}
              </button>
            );
          })}
          {editor.sessoes.length > 1 && activeSessao ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-xs text-gym-danger hover:text-gym-danger"
              onClick={() => removeSessao(activeSessao.id)}
            >
              <Trash2 className="mr-1 size-3.5" />
              Remover sessão
            </Button>
          ) : null}
        </aside>

        {/* Main: tabela inline */}
        <section className="rounded-xl border border-border bg-card p-4">
          {activeSessao ? (
            <>
              <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Input
                    value={activeSessao.nome}
                    onChange={(e) =>
                      updateSessoes((sessoes) =>
                        sessoes.map((s) =>
                          s.id === activeSessao.id ? { ...s, nome: e.target.value } : s,
                        ),
                      )
                    }
                    className="border-0 bg-transparent px-0 font-display text-base font-bold focus-visible:ring-0"
                  />
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>
                      <b className="text-foreground">{stats.totalItens}</b> exercícios
                    </span>
                    <span>
                      <b className="text-foreground">{stats.totalSeries}</b> séries totais
                    </span>
                  </div>
                </div>
                <Button size="sm" disabled title="Modal de biblioteca em Wave 3.5">
                  <Plus className="mr-2 size-4" />
                  Adicionar exercício
                </Button>
              </header>

              {activeSessao.itens.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum exercício nesta sessão. Use o botão "Adicionar exercício" acima.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="w-8 px-2 py-2"></th>
                        <th className="w-10 px-2 py-2 text-left">#</th>
                        <th className="px-2 py-2 text-left">Exercício</th>
                        <th className="w-32 px-2 py-2 text-left">Séries × Reps</th>
                        <th className="w-24 px-2 py-2 text-left">Carga</th>
                        <th className="w-24 px-2 py-2 text-left">Descanso</th>
                        <th className="w-24 px-2 py-2 text-left">Cadência</th>
                        <th className="w-20 px-2 py-2 text-left">RIR</th>
                        <th className="w-16 px-2 py-2"></th>
                      </tr>
                    </thead>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext
                        items={activeSessao.itens.map((i) => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <tbody>
                          {activeSessao.itens.map((item, idx) => (
                            <SortableExerciseRow
                              key={item.id}
                              item={item}
                              index={idx}
                              catalog={catalogById}
                              onUpdate={(patch) => updateItem(activeSessao.id, item.id, patch)}
                              onDuplicate={() => duplicateItem(activeSessao.id, item.id)}
                              onRemove={() => removeItem(activeSessao.id, item.id)}
                            />
                          ))}
                        </tbody>
                      </SortableContext>
                    </DndContext>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Adicione uma sessão pra começar a montagem.
            </div>
          )}

          {/* Observações da sessão (collapsable simple) */}
          {activeSessao ? (
            <div className="mt-6 space-y-1">
              <Label htmlFor="sessao-obs" className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Observações da sessão
              </Label>
              <Textarea
                id="sessao-obs"
                value={activeSessao.observacoes ?? ""}
                onChange={(e) =>
                  updateSessoes((sessoes) =>
                    sessoes.map((s) =>
                      s.id === activeSessao.id ? { ...s, observacoes: e.target.value } : s,
                    ),
                  )
                }
                placeholder="Notas para o personal ou aluno (opcional)"
                className="min-h-[60px] border-border bg-secondary"
              />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

// ─── Linha sortable da tabela ───
function SortableExerciseRow({
  item,
  index,
  catalog,
  onUpdate,
  onDuplicate,
  onRemove,
}: {
  item: SessaoItem;
  index: number;
  catalog: Map<string, TreinoV2CatalogExercise>;
  onUpdate: (patch: Partial<SessaoItem>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const exercicio = item.exerciseId ? catalog.get(item.exerciseId) : undefined;
  const exNome = item.exerciseNome ?? exercicio?.nome ?? "—";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-border/40 hover:bg-secondary/40"
    >
      <td className="px-2 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="size-4" />
        </button>
      </td>
      <td className="px-2 py-2 text-xs font-mono text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </td>
      <td className="px-2 py-2">
        <div className="font-medium">{exNome}</div>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            value={item.series?.raw ?? ""}
            onChange={(e) => onUpdate({ series: createTreinoV2MetricField(e.target.value) })}
            className="h-8 w-12 border-border bg-secondary px-2 text-center"
          />
          <span className="text-muted-foreground">×</span>
          <Input
            value={item.repeticoes?.raw ?? ""}
            onChange={(e) => onUpdate({ repeticoes: createTreinoV2MetricField(e.target.value) })}
            placeholder="10-12"
            className="h-8 w-16 border-border bg-secondary px-2"
          />
        </div>
      </td>
      <td className="px-2 py-2">
        <Input
          value={item.carga?.raw ?? ""}
          onChange={(e) =>
            onUpdate({
              carga: e.target.value ? createTreinoV2MetricField(e.target.value) : undefined,
            })
          }
          placeholder="—"
          className="h-8 w-20 border-border bg-secondary px-2"
        />
      </td>
      <td className="px-2 py-2">
        <Input
          value={item.intervalo?.raw ?? ""}
          onChange={(e) =>
            onUpdate({
              intervalo: e.target.value ? createTreinoV2MetricField(e.target.value.replace(/\D/g, "")) : undefined,
            })
          }
          placeholder="60"
          className="h-8 w-20 border-border bg-secondary px-2"
        />
      </td>
      <td className="px-2 py-2">
        <Input
          value={item.cadencia ?? ""}
          onChange={(e) => onUpdate({ cadencia: e.target.value || undefined })}
          placeholder="2-0-1"
          className="h-8 w-20 border-border bg-secondary px-2"
          title="Cadência: excêntrica-pausa-concêntrica"
        />
      </td>
      <td className="px-2 py-2">
        <select
          value={item.rir ?? ""}
          onChange={(e) => onUpdate({ rir: e.target.value === "" ? undefined : Number(e.target.value) })}
          className="h-8 w-16 rounded-md border border-border bg-secondary px-2 text-sm"
        >
          <option value="">—</option>
          {[0, 1, 2, 3, 4].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={onDuplicate}
            title="Duplicar exercício"
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-gym-danger"
            onClick={onRemove}
            title="Remover exercício"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

"use client";

/**
 * TreinoV3Editor — editor inline tipo planilha (Waves 3 + 4 do PRD V3).
 *
 * Coração do redesign: substitui o form-based V2 por tabela inline com
 * 7 colunas + drag&drop + sidebar de sessões A/B/C + stats.
 *
 * **Wave 4** acrescenta modo `instance`: customização do template para
 * um aluno específico. Overrides ficam no backend (treino_instancia_customizada);
 * FE compara baseline vs current para diff visual amarelo nas células
 * divergentes do template.
 *
 * Feature flag: NEXT_PUBLIC_TREINO_EDITOR_V3_ENABLED.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  aplicarOverrides as aplicarOverridesApi,
  criarInstancia,
  removerInstancia,
  type InstanciaOverride,
} from "@/lib/api/treino-instancia";
import { BibliotecaExerciciosModal } from "./biblioteca-exercicios-modal";
import { grupoColorByName } from "@/lib/treinos/grupo-colors";
import type { EditorProps } from "./editor/types";

type SessaoItem = TreinoV2EditorSeed["sessoes"][number]["itens"][number];

// ─── Helpers de override ───
const COMPARABLE_FIELDS = [
  "series",
  "repeticoes",
  "carga",
  "intervalo",
  "cadencia",
  "rir",
  "observacoes",
] as const;

/**
 * Gera o array de overrides comparando current vs baseline.
 * Cada campo divergente vira um override MODIFY; itens só no current
 * viram ADD; itens só no baseline viram REMOVE.
 */
function computeOverrides(
  base: TreinoV2EditorSeed,
  cur: TreinoV2EditorSeed,
): InstanciaOverride[] {
  const out: InstanciaOverride[] = [];
  for (const sCur of cur.sessoes) {
    const sBase = base.sessoes.find((b) => b.id === sCur.id);
    if (!sBase) continue;
    const baseItensById = new Map(sBase.itens.map((i) => [i.id, i]));
    const curItensById = new Map(sCur.itens.map((i) => [i.id, i]));
    for (const itCur of sCur.itens) {
      const itBase = baseItensById.get(itCur.id);
      if (!itBase) {
        out.push({
          tipo: "ADD",
          sessaoId: sCur.id,
          afterItemId: null,
          exercicio: itCur.exerciseId
            ? {
                exercicioCatalogoId: itCur.exerciseId,
                series: itCur.series?.numericValue,
                reps: itCur.repeticoes?.raw,
                carga: itCur.carga?.raw,
                intervalo: itCur.intervalo?.raw,
                cadencia: itCur.cadencia,
                rir: itCur.rir,
              }
            : undefined,
        });
        continue;
      }
      for (const f of COMPARABLE_FIELDS) {
        if (JSON.stringify(itCur[f] ?? null) !== JSON.stringify(itBase[f] ?? null)) {
          out.push({
            tipo: "MODIFY",
            sessaoId: sCur.id,
            exercicioItemId: itCur.id,
            campo: f,
            valor: serializeValor(itCur[f]),
          });
        }
      }
    }
    for (const itBase of sBase.itens) {
      if (!curItensById.has(itBase.id)) {
        out.push({ tipo: "REMOVE", sessaoId: sCur.id, exercicioItemId: itBase.id });
      }
    }
  }
  return out;
}

function serializeValor(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object" && value && "raw" in value) {
    return (value as { raw: string }).raw;
  }
  return JSON.stringify(value);
}

export interface TreinoV3EditorProps extends EditorProps {
  /** "template" edita o template-mestre; "instance" edita overlay por aluno. */
  mode?: "template" | "instance";
  /** Quando mode=instance, identifica o aluno alvo. */
  alunoId?: string;
  /** Nome do aluno pra exibir no header (modo instance). */
  alunoNome?: string;
  /** Atribuição vinculada (opcional). */
  atribuicaoId?: string;
}

export function TreinoV3Editor({
  treino,
  exercicios,
  onTreinoChange,
  mode = "template",
  alunoId,
  alunoNome,
  atribuicaoId,
}: TreinoV3EditorProps) {
  const { toast } = useToast();
  const isInstance = mode === "instance" && Boolean(alunoId);
  const [editor, setEditor] = useState<TreinoV2EditorSeed>(() => buildTreinoV2EditorSeed(treino));
  const [baseline] = useState<TreinoV2EditorSeed>(() => buildTreinoV2EditorSeed(treino));
  const [activeSessaoId, setActiveSessaoId] = useState(() => editor.sessoes[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [instanciaId, setInstanciaId] = useState<string | undefined>();
  const [bibliotecaOpen, setBibliotecaOpen] = useState(false);

  // Em modo instance, garante que existe uma instância no backend (idempotente).
  useEffect(() => {
    if (!isInstance || !alunoId || instanciaId) return;
    let cancelled = false;
    void (async () => {
      try {
        const inst = await criarInstancia({ templateId: treino.id, alunoId, atribuicaoId });
        if (!cancelled) {
          setInstanciaId(inst.id);
          // TODO: aplicar overrides existentes ao editor para hidratar a UI.
          // Por enquanto baseline = template = current. Wave 4.5 hidrata.
        }
      } catch (err) {
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Erro ao iniciar instância",
            description: err instanceof Error ? err.message : "Tente novamente.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isInstance, alunoId, instanciaId, treino.id, atribuicaoId, toast]);

  // Diff helper: compara campo do item current vs baseline.
  const isCustom = useCallback(
    (sId: string, itemId: string, field: keyof SessaoItem): boolean => {
      if (!isInstance) return false;
      const baseS = baseline.sessoes.find((s) => s.id === sId);
      const baseItem = baseS?.itens.find((i) => i.id === itemId);
      const curS = editor.sessoes.find((s) => s.id === sId);
      const curItem = curS?.itens.find((i) => i.id === itemId);
      if (!baseItem) return true; // exercício adicionado nesta instância
      if (!curItem) return false;
      const baseVal = JSON.stringify(baseItem[field] ?? null);
      const curVal = JSON.stringify(curItem[field] ?? null);
      return baseVal !== curVal;
    },
    [isInstance, baseline, editor],
  );

  // Conta total de customizações (campos divergentes + exercícios add/remove).
  const customCount = useMemo(() => {
    if (!isInstance) return 0;
    let n = 0;
    for (const sCur of editor.sessoes) {
      const sBase = baseline.sessoes.find((b) => b.id === sCur.id);
      for (const itCur of sCur.itens) {
        const itBase = sBase?.itens.find((b) => b.id === itCur.id);
        if (!itBase) {
          n++;
          continue;
        }
        for (const f of ["series", "repeticoes", "carga", "intervalo", "cadencia", "rir", "observacoes"] as const) {
          if (JSON.stringify(itCur[f] ?? null) !== JSON.stringify(itBase[f] ?? null)) n++;
        }
      }
      const removed = (sBase?.itens.length ?? 0) - sCur.itens.length;
      if (removed > 0) n += removed;
    }
    return n;
  }, [isInstance, editor, baseline]);

  // Reset = remove a instância (aluno volta a ver template puro).
  const handleReset = useCallback(async () => {
    if (!instanciaId) return;
    if (!confirm("Reverter todas as customizações e voltar ao template original?")) return;
    try {
      await removerInstancia(instanciaId);
      toast({ title: "Customizações revertidas", description: "Aluno volta a ver o template padrão." });
      setEditor(buildTreinoV2EditorSeed(treino));
      setInstanciaId(undefined);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao resetar",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    }
  }, [instanciaId, treino, toast]);

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

  // Adiciona N exercícios na sessão ativa, com defaults sensatos
  // (3 séries × 10-12, 60s descanso). O personal ajusta carga/cadência
  // depois — fluxo design: marca tudo na biblioteca, ajusta inline.
  const addItensFromBiblioteca = useCallback(
    (exIds: string[]) => {
      if (exIds.length === 0 || !activeSessao) return;
      const baseTs = Date.now();
      const novosItens = exIds.map((exId, idx) => {
        const ex = exercicios.find((e) => e.id === exId);
        const item: SessaoItem = {
          id: `item-${baseTs}-${idx}`,
          exerciseId: exId,
          exerciseNome: ex?.nome,
          ordem: 0, // recalculado abaixo
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
        return item;
      });
      updateSessoes((sessoes) =>
        sessoes.map((s) => {
          if (s.id !== activeSessao.id) return s;
          const merged = [...s.itens, ...novosItens];
          // Reordena ordem incremental
          return {
            ...s,
            itens: merged.map((it, i) => ({ ...it, ordem: i + 1 })),
          };
        }),
      );
    },
    [activeSessao, exercicios, updateSessoes],
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

  // ─── Save ───
  // Modo template: ainda usa toast (Wave 4 foca em instance; persist do
  // template aproveita endpoints V2 existentes via Wave 5).
  // Modo instance: gera overrides comparando current vs baseline e
  // chama PATCH /instancias/{id}/overrides.
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (isInstance && instanciaId) {
        const overrides = computeOverrides(baseline, editor);
        await aplicarOverridesApi(instanciaId, overrides);
        toast({
          title: `Salvo para ${alunoNome ?? "aluno"}`,
          description: `${overrides.length} customizações persistidas como overlay do template.`,
        });
      } else {
        toast({
          title: "Salvamento em revisão",
          description:
            "Persist do template no V3 fica para Wave 5 (reusa endpoint V2). No modo instance funciona normal.",
        });
      }
      onTreinoChange?.(treino);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  }, [isInstance, instanciaId, baseline, editor, alunoNome, toast, onTreinoChange, treino]);

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

  // Ids já presentes na sessão ativa (mostra badge no modal)
  const idsJaPresentes = useMemo(() => {
    const set = new Set<string>();
    if (activeSessao) {
      for (const it of activeSessao.itens) {
        if (it.exerciseId) set.add(it.exerciseId);
      }
    }
    return set;
  }, [activeSessao]);

  return (
    <div className="space-y-4">
      <BibliotecaExerciciosModal
        open={bibliotecaOpen}
        onClose={() => setBibliotecaOpen(false)}
        exercicios={exercicios}
        excludeIds={idsJaPresentes}
        onAdd={addItensFromBiblioteca}
      />

      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-1 items-center gap-3">
          <Button asChild variant="outline" size="sm" className="border-border">
            <Link href={isInstance ? "/treinos/atribuidos" : "/treinos"}>
              <ArrowLeft className="mr-1 size-4" />
              {isInstance ? "Atribuições" : "Templates"}
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            {isInstance && alunoNome ? (
              <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-secondary px-2 py-0.5 font-medium">
                  {alunoNome}
                </span>
                {customCount > 0 ? (
                  <Badge className="bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/20">
                    {customCount} {customCount === 1 ? "custom" : "customs"}
                  </Badge>
                ) : null}
              </div>
            ) : null}
            <Input
              value={editor.nome ?? ""}
              onChange={(e) => setEditor((p) => ({ ...p, nome: e.target.value }))}
              className="border-0 bg-transparent px-0 font-display text-xl font-bold focus-visible:ring-0"
              placeholder="Nome do template"
              disabled={isInstance}
            />
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {isInstance ? (
                <span className="text-gym-accent">↳ baseado em "{treino.nome ?? "template"}"</span>
              ) : (
                <span>{editor.categoria ?? "Sem objetivo"}</span>
              )}
              <span>·</span>
              <span>{editor.frequenciaSemanal ?? 0}x/sem</span>
              <span>·</span>
              <span>{editor.sessoes.length} sessões</span>
              <Badge variant="outline" className="ml-2 border-gym-accent/30 text-gym-accent">
                Editor V3 {isInstance ? "(instância)" : "(preview)"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isInstance && customCount > 0 ? (
            <Button variant="outline" size="sm" className="border-border" onClick={handleReset}>
              <Trash2 className="mr-2 size-4" />
              Resetar
            </Button>
          ) : null}
          <Button variant="outline" size="sm" className="border-border">
            <Send className="mr-2 size-4" />
            Pré-visualizar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 size-4" />
            {saving
              ? "Salvando..."
              : isInstance
                ? `Salvar para ${alunoNome?.split(" ")[0] ?? "aluno"}`
                : "Salvar template"}
          </Button>
        </div>
      </div>

      {/* ─── Grid: sessões sidebar + main table ─── */}
      <div className="grid grid-cols-[280px_1fr] gap-4">
        {/* Sidebar de sessões */}
        <aside className="space-y-1 rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between border-b border-border px-1 pb-2.5">
            <span className="font-display text-[13px] font-bold">Sessões</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={addSessao}
              title="Nova sessão"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {editor.sessoes.map((s, idx) => {
            const ativa = s.id === activeSessaoId;
            const letter = (s.nome || String.fromCharCode(65 + idx))
              .charAt(0)
              .toUpperCase();
            return (
              <button
                key={s.id}
                onClick={() => setActiveSessaoId(s.id)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-md border px-2.5 py-2 text-left transition-colors",
                  ativa
                    ? "border-gym-accent/40 bg-gym-accent/[0.08]"
                    : "border-transparent hover:bg-secondary/60",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border font-display text-sm font-bold",
                    ativa
                      ? "border-gym-accent bg-gym-accent text-black"
                      : "border-border bg-secondary text-foreground",
                  )}
                >
                  {letter}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">
                    {s.nome || `Sessão ${idx + 1}`}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
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
                <Button size="sm" onClick={() => setBibliotecaOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Adicionar exercício
                </Button>
              </header>

              {activeSessao.itens.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum exercício nesta sessão.{" "}
                    <button
                      type="button"
                      className="font-medium text-gym-accent hover:underline"
                      onClick={() => setBibliotecaOpen(true)}
                    >
                      Adicionar da biblioteca →
                    </button>
                  </p>
                </div>
              ) : (
                // DndContext precisa ficar FORA da <table> porque renderiza
                // wrappers <div> internos (Accessibility hidden) — HTML
                // inválido como filho direto de <table>. SortableContext
                // é só Provider, sem wrapper DOM, então pode envolver
                // <tbody> sem problema.
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                              isCustom={(field) => isCustom(activeSessao.id, item.id, field)}
                              onUpdate={(patch) => updateItem(activeSessao.id, item.id, patch)}
                              onDuplicate={() => duplicateItem(activeSessao.id, item.id)}
                              onRemove={() => removeItem(activeSessao.id, item.id)}
                            />
                          ))}
                        </tbody>
                      </SortableContext>
                    </table>
                  </div>
                </DndContext>
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
  isCustom,
  onUpdate,
  onDuplicate,
  onRemove,
}: {
  item: SessaoItem;
  index: number;
  catalog: Map<string, TreinoV2CatalogExercise>;
  isCustom: (field: keyof SessaoItem) => boolean;
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
  const grupoNome = exercicio?.grupoMuscularNome ?? item.objetivo ?? "";
  const grupoCor = grupoColorByName(grupoNome);

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
      <td className="px-2 py-2 font-display text-xs font-bold text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-2.5">
          <span
            className="block h-6 w-1 shrink-0 rounded-sm"
            style={{ background: grupoCor }}
            title={grupoNome || undefined}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{exNome}</div>
            {grupoNome ? (
              <div className="truncate text-[11px] text-muted-foreground">
                {grupoNome}
              </div>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            value={item.series?.raw ?? ""}
            onChange={(e) => onUpdate({ series: createTreinoV2MetricField(e.target.value) })}
            className={cn(
              "h-8 w-12 border-border bg-secondary px-2 text-center",
              isCustom("series") && "border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold",
            )}
          />
          <span className="text-muted-foreground">×</span>
          <Input
            value={item.repeticoes?.raw ?? ""}
            onChange={(e) => onUpdate({ repeticoes: createTreinoV2MetricField(e.target.value) })}
            placeholder="10-12"
            className={cn(
              "h-8 w-16 border-border bg-secondary px-2",
              isCustom("repeticoes") && "border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold",
            )}
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
          className={cn(
            "h-8 w-20 border-border bg-secondary px-2",
            isCustom("carga") && "border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold",
          )}
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
          className={cn(
            "h-8 w-20 border-border bg-secondary px-2",
            isCustom("intervalo") && "border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold",
          )}
        />
      </td>
      <td className="px-2 py-2">
        <Input
          value={item.cadencia ?? ""}
          onChange={(e) => onUpdate({ cadencia: e.target.value || undefined })}
          placeholder="2-0-1"
          className={cn(
            "h-8 w-20 border-border bg-secondary px-2",
            isCustom("cadencia") && "border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold",
          )}
          title="Cadência: excêntrica-pausa-concêntrica"
        />
      </td>
      <td className="px-2 py-2">
        <select
          value={item.rir ?? ""}
          onChange={(e) => onUpdate({ rir: e.target.value === "" ? undefined : Number(e.target.value) })}
          className={cn(
            "h-8 w-16 rounded-md border border-border bg-secondary px-2 text-sm",
            isCustom("rir") && "border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold",
          )}
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

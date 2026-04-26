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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowLeft,
  Copy,
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
  buildTreinoV2SaveInput,
  createEmptyTreinoV2Sessao,
  type TreinoV2EditorSeed,
} from "@/lib/tenant/treinos/v2-runtime";
import { createTreinoV2MetricField } from "@/lib/tenant/treinos/v2-domain";
import { saveTreinoWorkspace } from "@/lib/tenant/treinos/workspace";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";
import {
  aplicarOverrides as aplicarOverridesApi,
  criarInstancia,
  removerInstancia,
} from "@/lib/api/treino-instancia";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { BibliotecaExerciciosModal } from "./biblioteca-exercicios-modal";
import { computeOverrides } from "./editor-v3/instance-overrides";
import { PreviewModal } from "./editor-v3/preview-modal";
import { SortableExerciseRow } from "./editor-v3/sortable-exercise-row";
import type { EditorProps } from "./editor/types";

type SessaoItem = TreinoV2EditorSeed["sessoes"][number]["itens"][number];

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
  tenantId,
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
  const [previewOpen, setPreviewOpen] = useState(false);

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
  // - Modo template: persiste mudanças no treino via saveTreinoWorkspace
  //   (mesmo pipeline do V2 — buildTreinoV2SaveInput → updateTreinoApi).
  //   Reusa todos os mappings V2 que já estão validados em produção.
  // - Modo instance: gera overrides comparando current vs baseline e
  //   chama PATCH /instancias/{id}/overrides.
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
        onTreinoChange?.(treino);
      } else {
        // Modo template — persist real via endpoint V2 (compartilhado).
        const payload = buildTreinoV2SaveInput({ treino, editor });
        const updated = await saveTreinoWorkspace({
          tenantId,
          id: treino.id,
          alunoId: treino.alunoId,
          alunoNome: treino.alunoNome,
          funcionarioId: treino.funcionarioId,
          funcionarioNome: treino.funcionarioNome,
          tipoTreino: treino.tipoTreino,
          treinoBaseId: treino.treinoBaseId,
          nome: payload.nome,
          templateNome: payload.templateNome,
          objetivo: payload.objetivo,
          metaSessoesSemana: payload.metaSessoesSemana,
          frequenciaPlanejada: payload.frequenciaPlanejada,
          quantidadePrevista: payload.quantidadePrevista,
          dataInicio: payload.dataInicio,
          dataFim: payload.dataFim,
          observacoes: payload.observacoes,
          ativo: payload.ativo,
          status: payload.status,
          itens: payload.itens.map((item) => ({
            id: "",
            treinoId: treino.id,
            exercicioId: item.exercicioId,
            ordem: item.ordem,
            series: item.series,
            repeticoes: item.repeticoes,
            repeticoesMin: item.repeticoesMin,
            repeticoesMax: item.repeticoesMax,
            carga: item.carga,
            cargaSugerida: item.cargaSugerida,
            intervaloSegundos: item.intervaloSegundos,
            observacao: item.observacao,
          })),
        });
        // Reidrata o editor com o que voltou do backend
        setEditor(buildTreinoV2EditorSeed(updated));
        toast({
          title: "Template salvo",
          description: `${payload.itens.length} exercícios persistidos.`,
        });
        onTreinoChange?.(updated);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: normalizeErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  }, [
    isInstance,
    instanciaId,
    baseline,
    editor,
    alunoNome,
    toast,
    onTreinoChange,
    treino,
    tenantId,
  ]);

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
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        editor={editor}
        catalog={catalogById}
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
                  <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/20">
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
                <span className="text-gym-accent">↳ baseado em &ldquo;{treino.nome ?? "template"}&rdquo;</span>
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
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => setPreviewOpen(true)}
          >
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


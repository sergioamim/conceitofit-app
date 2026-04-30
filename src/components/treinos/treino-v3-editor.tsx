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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp, Plus, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  buildTreinoV2EditorSeed,
  buildTreinoV2SaveInput,
  type TreinoV2EditorSeed,
} from "@/lib/tenant/treinos/v2-runtime";
import { getTreinoApi, updateTreinoApi, type TreinoApiResponse } from "@/lib/api/treinos";
import { saveTreinoWorkspace } from "@/lib/tenant/treinos/workspace";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";
import {
  aplicarOverrides as aplicarOverridesApi,
  criarInstancia,
  removerInstancia,
} from "@/lib/api/treino-instancia";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { BibliotecaExerciciosModal } from "./biblioteca-exercicios-modal";
import { EditorHeader } from "./editor-v3/editor-header";
import { computeOverrides } from "./editor-v3/instance-overrides";
import { PreviewModal } from "./editor-v3/preview-modal";
import { SESSAO_DROP_PREFIX, SessaoSidebar } from "./editor-v3/sessao-sidebar";
import { SortableExerciseRow } from "./editor-v3/sortable-exercise-row";
import { useEditorMutations } from "./editor-v3/use-editor-mutations";
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
  const [advancedMode, setAdvancedMode] = useState(false);

  // Wave C.2 (Item 1): personalização do aluno (treino atribuído).
  // Hidratado de getTreinoApi(atribuicaoId) quando isInstance && atribuicaoId.
  // Guarda o response inteiro para preservar campos no PUT (backend zera o
  // que não vier no payload, então remontamos com todos os valores atuais).
  const [personalizacaoOpen, setPersonalizacaoOpen] = useState(true);
  const [personalizacaoLoading, setPersonalizacaoLoading] = useState(false);
  const [atribuicaoTreino, setAtribuicaoTreino] = useState<TreinoApiResponse | null>(null);
  const [personalizacao, setPersonalizacao] = useState<{
    objetivoIndividual: string;
    restricoes: string;
    notasProfessor: string;
  }>({ objetivoIndividual: "", restricoes: "", notasProfessor: "" });
  const showPersonalizacao = isInstance && Boolean(atribuicaoId);

  // Wave C.2 (Item 1): carrega personalização do treino atribuído quando disponível.
  useEffect(() => {
    if (!showPersonalizacao || !atribuicaoId) return;
    let cancelled = false;
    setPersonalizacaoLoading(true);
    void (async () => {
      try {
        const atribuicao = await getTreinoApi({ tenantId, id: atribuicaoId });
        if (cancelled) return;
        setAtribuicaoTreino(atribuicao);
        setPersonalizacao({
          objetivoIndividual: atribuicao.objetivoIndividual ?? "",
          restricoes: atribuicao.restricoes ?? "",
          notasProfessor: atribuicao.notasProfessor ?? "",
        });
      } catch (err) {
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Não foi possível carregar a personalização",
            description: err instanceof Error ? err.message : "Tente novamente.",
          });
        }
      } finally {
        if (!cancelled) setPersonalizacaoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showPersonalizacao, atribuicaoId, tenantId, toast]);

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
        for (const f of ["series", "repeticoes", "carga", "intervalo", "cadencia", "rir", "tecnicas", "observacoes"] as const) {
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

  const gruposMuscularesPorSessao = useMemo(() => {
    const gruposPorSessao: Record<string, string[]> = {};
    for (const sessao of editor.sessoes) {
      const grupos = new Set<string>();
      for (const item of sessao.itens) {
        const exercicio = item.exerciseId ? catalogById.get(item.exerciseId) : undefined;
        const grupoNome = exercicio?.grupoMuscularNome ?? item.objetivo;
        if (grupoNome?.trim()) grupos.add(grupoNome.trim());
      }
      gruposPorSessao[sessao.id] = Array.from(grupos);
    }
    return gruposPorSessao;
  }, [editor.sessoes, catalogById]);

  // ─── Mutations (extraídas em editor-v3/use-editor-mutations.ts) ───
  const {
    updateSessoes,
    addSessao,
    duplicateSessao,
    removeSessao,
    updateItem,
    removeItem,
    duplicateItem,
    reorderItens,
    moveItemBetweenSessoes,
    addItensFromBiblioteca,
  } = useEditorMutations({
    editor,
    setEditor,
    activeSessaoId,
    setActiveSessaoId,
    exercicios,
  });

  // ─── Stats da sessão ativa ───
  const stats = useMemo(() => {
    if (!activeSessao) return { totalItens: 0, totalSeries: 0 };
    const totalSeries = activeSessao.itens.reduce(
      (sum, it) => sum + (Number(it.series?.numericValue) || 0),
      0,
    );
    return { totalItens: activeSessao.itens.length, totalSeries };
  }, [activeSessao]);

  const activeSessaoLabel = useMemo(() => {
    if (!activeSessao) return "Sessão";
    const index = editor.sessoes.findIndex((s) => s.id === activeSessao.id);
    return `Sessão ${String.fromCharCode(65 + Math.max(0, index))}`;
  }, [activeSessao, editor.sessoes]);

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
        // Wave C.2 (Item 1): em paralelo, atualiza personalização no treino
        // atribuído quando temos o ID — UI só mostra o card nesse caso.
        await Promise.all([
          aplicarOverridesApi(instanciaId, overrides),
          // Wave C.2 (Item 1): atualiza personalização preservando demais
          // campos do treino atribuído (backend zera o que não vier no PUT).
          atribuicaoId && atribuicaoTreino
            ? updateTreinoApi({
                tenantId,
                id: atribuicaoId,
                data: {
                  clienteId: atribuicaoTreino.clienteId,
                  professorId: atribuicaoTreino.professorId,
                  nome: atribuicaoTreino.nome,
                  objetivo: atribuicaoTreino.objetivo,
                  observacoes: atribuicaoTreino.observacoes,
                  divisao: atribuicaoTreino.divisao,
                  metaSessoesSemana: atribuicaoTreino.metaSessoesSemana,
                  frequenciaSemanal: atribuicaoTreino.frequenciaPlanejada,
                  totalSemanas:
                    atribuicaoTreino.frequenciaPlanejada && atribuicaoTreino.quantidadePrevista
                      ? Math.max(
                          1,
                          Math.ceil(
                            atribuicaoTreino.quantidadePrevista /
                              atribuicaoTreino.frequenciaPlanejada,
                          ),
                        )
                      : undefined,
                  dataInicio: atribuicaoTreino.dataInicio,
                  dataFim: atribuicaoTreino.dataFim,
                  status: atribuicaoTreino.status,
                  tipoTreino: atribuicaoTreino.tipoTreino,
                  treinoBaseId: atribuicaoTreino.treinoBaseId,
                  ativo: atribuicaoTreino.ativo,
                  objetivoIndividual: personalizacao.objetivoIndividual.trim() || null,
                  restricoes: personalizacao.restricoes.trim() || null,
                  notasProfessor: personalizacao.notasProfessor.trim() || null,
                },
              })
            : Promise.resolve(),
        ]);
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
    atribuicaoId,
    atribuicaoTreino,
    personalizacao,
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

      // Drop em outra sessão (sidebar) — move o item entre sessões
      if (typeof over.id === "string" && over.id.startsWith(SESSAO_DROP_PREFIX)) {
        const targetSessaoId = over.id.replace(SESSAO_DROP_PREFIX, "");
        if (targetSessaoId !== activeSessao.id) {
          moveItemBetweenSessoes(
            String(active.id),
            activeSessao.id,
            targetSessaoId,
          );
        }
        return;
      }

      // Drop em outro item da mesma sessão — reorder atual
      const fromIdx = activeSessao.itens.findIndex((i) => i.id === active.id);
      const toIdx = activeSessao.itens.findIndex((i) => i.id === over.id);
      if (fromIdx >= 0 && toIdx >= 0) reorderItens(activeSessao.id, fromIdx, toIdx);
    },
    [activeSessao, reorderItens, moveItemBetweenSessoes],
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

      {/* ─── Header (extraído em editor-v3/editor-header.tsx) ─── */}
      <EditorHeader
        editor={editor}
        treino={treino}
        onNomeChange={(nome) => setEditor((p) => ({ ...p, nome }))}
        isInstance={isInstance}
        alunoNome={alunoNome}
        customCount={customCount}
        saving={saving}
        onReset={handleReset}
        onPreview={() => setPreviewOpen(true)}
        onSave={handleSave}
      />

      {/* Wave C.2 (Item 1): Card "Personalização do aluno" — só em modo
          instance com atribuicaoId conhecido. Edita 3 campos do treino
          atribuído (objetivo individual, restrições, notas do professor),
          persistidos via PUT em paralelo aos overrides JSONB. */}
      {showPersonalizacao ? (
        <section className="rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setPersonalizacaoOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-secondary/40"
            aria-expanded={personalizacaoOpen}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <UserCog className="size-4 text-gym-accent" />
              Personalização do aluno
              {personalizacaoLoading ? (
                <span className="text-[11px] text-muted-foreground">carregando…</span>
              ) : null}
            </span>
            {personalizacaoOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>
          {personalizacaoOpen ? (
            <div className="grid gap-4 border-t border-border p-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="personalizacao-objetivo">Objetivo individual</Label>
                <Textarea
                  id="personalizacao-objetivo"
                  value={personalizacao.objetivoIndividual}
                  onChange={(e) =>
                    setPersonalizacao((p) => ({ ...p, objetivoIndividual: e.target.value }))
                  }
                  className="min-h-16"
                  placeholder="Meta específica deste aluno (ex.: perder 5kg em 8 semanas)"
                  disabled={personalizacaoLoading}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="personalizacao-restricoes">Restrições / Lesões</Label>
                <Textarea
                  id="personalizacao-restricoes"
                  value={personalizacao.restricoes}
                  onChange={(e) =>
                    setPersonalizacao((p) => ({ ...p, restricoes: e.target.value }))
                  }
                  className="min-h-16"
                  placeholder="Lesões a respeitar, exercícios a evitar"
                  disabled={personalizacaoLoading}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="personalizacao-notas">Notas do professor</Label>
                <Textarea
                  id="personalizacao-notas"
                  value={personalizacao.notasProfessor}
                  onChange={(e) =>
                    setPersonalizacao((p) => ({ ...p, notasProfessor: e.target.value }))
                  }
                  className="min-h-20"
                  placeholder="Orientações livres (cargas iniciais, evolução, observações)"
                  disabled={personalizacaoLoading}
                />
              </div>
              <p className="text-[11px] text-muted-foreground md:col-span-2">
                Salvo junto com as customizações ao clicar em &ldquo;Salvar&rdquo; no topo.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ─── Grid: sessões sidebar + main table ───
        DndContext envolve ambos para suportar drag de itens entre as
        sessões A/B/C (Wave J.4). Os ids dos droppables da sidebar
        usam prefix SESSAO_DROP_PREFIX para não conflitar com items.
      */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-[280px_1fr] gap-4">
        {/* Sidebar de sessões (extraído em editor-v3/sessao-sidebar.tsx) */}
        <SessaoSidebar
          sessoes={editor.sessoes}
          activeSessaoId={activeSessaoId}
          activeSessao={activeSessao ?? null}
          gruposMuscularesPorSessao={gruposMuscularesPorSessao}
          onSelectSessao={setActiveSessaoId}
          onAddSessao={addSessao}
          onDuplicateSessao={duplicateSessao}
          onRemoveSessao={removeSessao}
        />

        {/* Main: tabela inline */}
        <section className="rounded-xl border border-border bg-card p-4">
          {activeSessao ? (
            <>
              <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">{activeSessaoLabel}</h2>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>
                      <b className="text-foreground">{stats.totalItens}</b>{" "}
                      {stats.totalItens === 1 ? "exercício" : "exercícios"}
                    </span>
                    <span>
                      <b className="text-foreground">{stats.totalSeries}</b> séries totais
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-md border border-border bg-secondary p-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={!advancedMode ? "default" : "ghost"}
                      className="h-7 px-3 text-xs"
                      onClick={() => setAdvancedMode(false)}
                      aria-pressed={!advancedMode}
                    >
                      Simples
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={advancedMode ? "default" : "ghost"}
                      className="h-7 px-3 text-xs"
                      onClick={() => setAdvancedMode(true)}
                      aria-pressed={advancedMode}
                    >
                      Avançado
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => setBibliotecaOpen(true)}>
                    <Plus className="mr-2 size-4" />
                    Adicionar exercício
                  </Button>
                </div>
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
                // SortableContext é só Provider (sem wrapper DOM) — pode
                // ficar dentro da <table>. O DndContext está no nível do
                // grid (envolvendo sidebar + main) pra suportar drag entre
                // sessões A/B/C.
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
                        {advancedMode ? (
                          <>
                            <th className="w-32 px-2 py-2 text-left">Técnica</th>
                            <th className="w-24 px-2 py-2 text-left">Cadência</th>
                            <th className="w-20 px-2 py-2 text-left">RIR</th>
                          </>
                        ) : null}
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
                            advancedMode={advancedMode}
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
      </DndContext>
    </div>
  );
}


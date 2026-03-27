"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  FileDown,
  Printer,
  Save,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  buildTreinoV2SaveInput,
  buildTreinoV2Template,
  buildTreinoV2TemplateSnapshot,
  buildTreinoV2AssignmentJob,
  buildTreinoV2EditorSeed,
  createEmptyTreinoV2Block,
  toTreinoV2CatalogExercise,
  serializeExercicioV2Descricao,
  appendTreinoV2AssignmentHistory,
  type TreinoV2EditorSeed,
  type TreinoV2ExerciseCatalogMetadata,
} from "@/lib/treinos/v2-runtime";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";
import {
  evaluateTreinoV2TemplateTransition,
  resolveTreinoV2AssignmentConflict,
  resolveTreinoV2Permissions,
  validateTreinoV2Template,
  type TreinoV2AssignmentResultItem,
  type TreinoV2DefaultObjective,
  type TreinoV2ExerciseType,
  type TreinoV2TechniqueType,
} from "@/lib/treinos/v2-domain";
import {
  assignTreinoTemplate,
  encerrarTreinoWorkspace,
  listTreinosWorkspace,
  saveTreinoExercicio,
  saveTreinoWorkspace,
} from "@/lib/treinos/workspace";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { TreinoForm } from "./editor/treino-form";
import { ExercicioSelector, ExerciseDrawerDialog } from "./editor/exercicio-selector";
import { SerieConfig } from "./editor/serie-config";
import {
  ValidationCard,
  GovernanceCard,
  AssignmentHistoryCard,
  SnapshotCard,
  AssignmentDialog,
} from "./editor/treino-preview";
import {
  type EditorProps,
  type ExerciseDrawerState,
  cloneEditor,
  todayIso,
  buildExerciseDrawerState,
  buildAssignmentDialogState,
  getTemplateStatusBadgeVariant,
  getAssignedStatusBadgeVariant,
  moveItem,
  buildNewExerciseItem,
  downloadEditorSnapshot,
} from "./editor/types";

export { type EditorProps };

export function TreinoV2Editor({
  tenantId,
  treino,
  alunos,
  exercicios,
  role,
  finePermissions,
  autoOpenAssignment = false,
  onTreinoChange,
  onCatalogChange,
}: EditorProps) {
  const { toast } = useToast();
  const permissions = useMemo(
    () => resolveTreinoV2Permissions({ role, finePermissions }),
    [finePermissions, role],
  );
  const [editor, setEditor] = useState<TreinoV2EditorSeed>(() => buildTreinoV2EditorSeed(treino));
  const [catalog, setCatalog] = useState<TreinoV2CatalogExercise[]>(() => exercicios.map(toTreinoV2CatalogExercise));
  const [activeBlockId, setActiveBlockId] = useState(() => buildTreinoV2EditorSeed(treino).blocos[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [drawer, setDrawer] = useState<ExerciseDrawerState>(() => buildExerciseDrawerState());
  const [assignment, setAssignment] = useState(() => buildAssignmentDialogState(treino));
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogTipo, setCatalogTipo] = useState<"" | TreinoV2ExerciseType>("");
  const [catalogObjetivo, setCatalogObjetivo] = useState<"" | TreinoV2DefaultObjective>("");
  const [catalogGrupoMuscularId, setCatalogGrupoMuscularId] = useState("");
  const [historyExpandedJobId, setHistoryExpandedJobId] = useState<string | null>(null);
  const deferredCatalogSearch = useDeferredValue(catalogSearch);

  useEffect(() => {
    const nextEditor = buildTreinoV2EditorSeed(treino);
    setEditor(nextEditor);
    setActiveBlockId(nextEditor.blocos[0]?.id ?? "");
    setAssignment(buildAssignmentDialogState(treino));
  }, [treino]);

  useEffect(() => {
    setCatalog(exercicios.map(toTreinoV2CatalogExercise));
  }, [exercicios]);

  useEffect(() => {
    if (!autoOpenAssignment || editor.mode !== "TEMPLATE") return;
    setAssignment((current) => ({ ...current, open: true }));
  }, [autoOpenAssignment, editor.mode]);

  const template = useMemo(
    () =>
      buildTreinoV2Template({
        treino,
        editor: {
          nome: editor.nome,
          frequenciaSemanal: editor.frequenciaSemanal,
          totalSemanas: editor.totalSemanas,
          categoria: editor.categoria,
          templateStatus: editor.templateStatus,
          versao: editor.versao,
          versaoSimplificadaHabilitada: editor.versaoSimplificadaHabilitada,
          blocos: editor.blocos,
        },
      }),
    [editor.blocos, editor.categoria, editor.frequenciaSemanal, editor.nome, editor.templateStatus, editor.totalSemanas, editor.versao, editor.versaoSimplificadaHabilitada, treino],
  );

  const validationIssues = useMemo(() => validateTreinoV2Template(template), [template]);
  const activeBlock = useMemo(
    () => editor.blocos.find((block) => block.id === activeBlockId) ?? editor.blocos[0] ?? null,
    [activeBlockId, editor.blocos],
  );
  const grupoMuscularOptions = useMemo(
    () =>
      Array.from(
        new Map(
          catalog
            .filter((item) => item.grupoMuscularId || item.grupoMuscularNome)
            .map((item) => [
              item.grupoMuscularId ?? item.grupoMuscularNome ?? item.id,
              {
                id: item.grupoMuscularId ?? item.grupoMuscularNome ?? item.id,
                nome: item.grupoMuscularNome ?? "Grupo muscular",
              },
            ]),
        ).values(),
      ).sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR")),
    [catalog],
  );

  const filteredCatalog = useMemo(() => {
    const search = deferredCatalogSearch.trim().toLowerCase();
    return catalog.filter((item) => {
      const matchesSearch =
        !search ||
        [item.nome, item.codigo, item.grupoExercicioNome, item.grupoMuscularNome]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesTipo = !catalogTipo || item.tipo === catalogTipo;
      const matchesObjetivo = !catalogObjetivo || item.objetivoPadrao === catalogObjetivo;
      const matchesGrupo = !catalogGrupoMuscularId || item.grupoMuscularId === catalogGrupoMuscularId;
      return matchesSearch && matchesTipo && matchesObjetivo && matchesGrupo;
    });
  }, [catalog, catalogGrupoMuscularId, catalogObjetivo, catalogTipo, deferredCatalogSearch]);

  const assignmentCandidates = useMemo(() => {
    const query = assignment.selectionSearch.trim().toLowerCase();
    return alunos.filter((aluno) =>
      !query
        ? true
        : [aluno.nome, aluno.email, aluno.cpf]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query),
    );
  }, [alunos, assignment.selectionSearch]);

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

  function addBlock() {
    upsertBlocks((blocks) => [...blocks, createEmptyTreinoV2Block(blocks.length)]);
    setActiveBlockId(createEmptyTreinoV2Block(editor.blocos.length).id);
  }

  function duplicateBlock(blockId: string) {
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
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    upsertBlocks((blocks) => {
      const index = blocks.findIndex((item) => item.id === blockId);
      if (index === -1) return blocks;
      return moveItem(blocks, index, direction);
    });
  }

  function removeBlock(blockId: string) {
    upsertBlocks((blocks) => {
      if (blocks.length === 1) return blocks;
      return blocks.filter((item) => item.id !== blockId);
    });
    if (activeBlockId === blockId) {
      const next = editor.blocos.find((item) => item.id !== blockId);
      setActiveBlockId(next?.id ?? "");
    }
  }

  function updateBlockName(blockId: string, name: string) {
    upsertBlocks((blocks) =>
      blocks.map((item) =>
        item.id === blockId ? { ...item, nome: name } : item,
      ),
    );
  }

  function updateBlockItem(
    blockId: string,
    itemId: string,
    updater: (item: TreinoV2EditorSeed["blocos"][number]["itens"][number]) => TreinoV2EditorSeed["blocos"][number]["itens"][number],
  ) {
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
  }

  function addExerciseToBlock(blockId: string, exercicio?: TreinoV2CatalogExercise) {
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
  }

  function duplicateItem(itemId: string) {
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
  }

  function moveItemInActiveBlock(itemId: string, direction: -1 | 1) {
    if (!activeBlock) return;
    upsertBlocks((blocks) =>
      blocks.map((block) => {
        if (block.id !== activeBlock.id) return block;
        const index = block.itens.findIndex((item) => item.id === itemId);
        if (index === -1) return block;
        return { ...block, itens: moveItem(block.itens, index, direction) };
      }),
    );
  }

  function removeItemFromActiveBlock(itemId: string) {
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
  }

  function toggleTechnique(itemId: string, type: TreinoV2TechniqueType) {
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
  }

  async function persistEditor(nextEditor: TreinoV2EditorSeed, successTitle: string, successDescription: string) {
    setSaving(true);
    try {
      const payload = buildTreinoV2SaveInput({ treino, editor: nextEditor });
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
      setEditor(buildTreinoV2EditorSeed(updated));
      onTreinoChange(updated);
      toast({ title: successTitle, description: successDescription });
      return updated;
    } catch (error) {
      toast({
        title: "Não foi possível salvar o editor",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    const next = cloneEditor(editor);
    if (next.mode === "TEMPLATE") {
      next.templateStatus = "RASCUNHO";
    } else {
      next.customizadoLocalmente = true;
    }
    await persistEditor(next, "Rascunho salvo", next.nome);
  }

  async function handleSubmitForReview() {
    const transition = evaluateTreinoV2TemplateTransition({
      from: editor.templateStatus,
      to: "EM_REVISAO",
      template,
      permissionSet: permissions,
    });
    if (!transition.allowed) {
      toast({
        title: "Template não pode seguir para revisão",
        description: transition.reason ?? "Revise os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    const next = cloneEditor(editor);
    next.templateStatus = "EM_REVISAO";
    await persistEditor(next, "Template enviado para revisão", next.nome);
  }

  async function handlePublish() {
    const next = cloneEditor(editor);
    next.templateStatus = "PUBLICADO";
    next.versao += 1;
    const transition = evaluateTreinoV2TemplateTransition({
      from: editor.templateStatus,
      to: "PUBLICADO",
      template: buildTreinoV2Template({
        treino,
        editor: {
          nome: next.nome,
          frequenciaSemanal: next.frequenciaSemanal,
          totalSemanas: next.totalSemanas,
          categoria: next.categoria,
          templateStatus: next.templateStatus,
          versao: next.versao,
          versaoSimplificadaHabilitada: next.versaoSimplificadaHabilitada,
          blocos: next.blocos,
        },
      }),
      permissionSet: permissions,
    });
    if (!transition.allowed) {
      toast({
        title: "Template não pode ser publicado",
        description:
          transition.blockingCodes.length > 0
            ? `Corrija ${transition.blockingCodes.length} bloqueio(s) técnicos antes da publicação.`
            : transition.reason ?? "Revise os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    await persistEditor(next, "Template publicado", `Versão ${next.versao} pronta para atribuição.`);
  }

  async function handleArchive() {
    const next = cloneEditor(editor);
    next.templateStatus = "ARQUIVADO";
    await persistEditor(next, "Template arquivado", next.nome);
  }

  async function handleSaveExercise() {
    if (!tenantId || !drawer.nome.trim()) {
      toast({ title: "Preencha o nome do exercício", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const metadata: TreinoV2ExerciseCatalogMetadata = {
        codigo: drawer.codigo.trim() || undefined,
        grupoExercicioNome: drawer.grupoExercicioNome.trim() || undefined,
        tipo: drawer.tipo,
        objetivoPadrao: drawer.objetivoPadrao || undefined,
        midiaTipo: drawer.midiaTipo || undefined,
        midiaUrl: drawer.midiaUrl.trim() || undefined,
        disponivelNoApp: drawer.disponivelNoApp,
        similarExerciseIds: drawer.similarExerciseIds,
      };

      const saved = await saveTreinoExercicio({
        tenantId,
        id: drawer.editingId,
        nome: drawer.nome.trim(),
        grupoMuscularId: drawer.grupoMuscularId || undefined,
        unidade: drawer.unidadeCarga.trim() || undefined,
        videoUrl: drawer.midiaUrl.trim() || undefined,
        equipamento: drawer.grupoExercicioNome.trim() || undefined,
        descricao: serializeExercicioV2Descricao({ descricao: drawer.descricao, metadata }),
      });

      const updatedCatalog = drawer.editingId
        ? catalog.map((item) => (item.id === saved.id ? toTreinoV2CatalogExercise(saved) : item))
        : [toTreinoV2CatalogExercise(saved), ...catalog];
      setCatalog(updatedCatalog);
      onCatalogChange?.(
        updatedCatalog.map((item) => ({
          id: item.id,
          tenantId: item.tenantId,
          nome: item.nome,
          grupoMuscularId: item.grupoMuscularId,
          grupoMuscularNome: item.grupoMuscularNome,
          grupoMuscular: item.grupoMuscularNome,
          equipamento: item.grupoExercicioNome,
          descricao: serializeExercicioV2Descricao({
            descricao: item.descricao,
            metadata: {
              codigo: item.codigo,
              grupoExercicioNome: item.grupoExercicioNome,
              tipo: item.tipo,
              objetivoPadrao: item.objetivoPadrao,
              midiaTipo: item.midiaTipo,
              midiaUrl: item.midiaUrl,
              disponivelNoApp: item.disponivelNoApp,
              similarExerciseIds: item.similarExerciseIds,
            },
          }),
          videoUrl: item.midiaUrl,
          unidade: item.unidadeCarga,
          ativo: item.ativo,
          criadoEm: item.createdAt,
          atualizadoEm: item.updatedAt,
        })),
      );
      setDrawer(buildExerciseDrawerState());
      toast({
        title: drawer.editingId ? "Exercício atualizado" : "Exercício criado",
        description: saved.nome,
      });
    } catch (error) {
      toast({
        title: "Não foi possível salvar o exercício",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function finalizeAssignmentJob(jobResults: TreinoV2AssignmentResultItem[], mode: "INDIVIDUAL" | "MASSA") {
    const next = cloneEditor(editor);
    const job = buildTreinoV2AssignmentJob({
      tenantId,
      templateId: treino.id,
      templateVersion: next.versao,
      mode,
      conflictPolicy: assignment.conflictPolicy,
      dataInicio: assignment.dataInicio,
      dataFim: assignment.dataFim || undefined,
      requestedById: treino.funcionarioId ?? "web",
      requestedByName: assignment.professorResponsavel || treino.funcionarioNome || "Operação web",
      targets:
        mode === "INDIVIDUAL"
          ? alunos
              .filter((aluno) => aluno.id === assignment.alunoId)
              .map((aluno) => ({ alunoId: aluno.id, alunoNome: aluno.nome }))
          : alunos
              .filter((aluno) => assignment.selectedAlunoIds.includes(aluno.id))
              .map((aluno) => ({ alunoId: aluno.id, alunoNome: aluno.nome })),
      resultItems: jobResults,
    });
    next.assignmentHistory = appendTreinoV2AssignmentHistory(next.assignmentHistory, job);
    const persisted = await persistEditor(next, "Atribuição concluída", `${job.resultado?.totalAtribuido ?? 0} treino(s) gerado(s).`);
    setAssignment((current) => ({
      ...current,
      open: false,
      processing: false,
      progressLabel: undefined,
      alunoId: "",
      selectedAlunoIds: [],
    }));
    if (persisted) {
      setHistoryExpandedJobId(job.id);
    }
  }

  async function processAssignments(mode: "INDIVIDUAL" | "MASSA") {
    const targets =
      mode === "INDIVIDUAL"
        ? alunos.filter((aluno) => aluno.id === assignment.alunoId)
        : alunos.filter((aluno) => assignment.selectedAlunoIds.includes(aluno.id));

    if (targets.length === 0) {
      toast({ title: "Selecione pelo menos um aluno", variant: "destructive" });
      return;
    }

    const snapshot = buildTreinoV2TemplateSnapshot({
      treino,
      editor: {
        nome: editor.nome,
        frequenciaSemanal: editor.frequenciaSemanal,
        totalSemanas: editor.totalSemanas,
        categoria: editor.categoria,
        versao: editor.versao,
        blocos: editor.blocos,
      },
      publishedAt: new Date().toISOString(),
    });

    setAssignment((current) => ({
      ...current,
      processing: true,
      progressLabel: `0/${targets.length} processado(s)`,
    }));

    const resultItems: TreinoV2AssignmentResultItem[] = [];

    for (const [index, alvo] of targets.entries()) {
      setAssignment((current) => ({
        ...current,
        progressLabel: `${index}/${targets.length} processado(s)`,
      }));

      try {
        const activeWorkouts = await listTreinosWorkspace({
          tenantId,
          tipoTreino: "CUSTOMIZADO",
          alunoId: alvo.id,
          page: 0,
          size: 30,
          apenasAtivos: true,
        });
        const existingStatus = activeWorkouts.items.some((item) => item.ativo !== false) ? "ATIVO" : null;
        const resolution = resolveTreinoV2AssignmentConflict({
          existingStatus,
          policy: assignment.conflictPolicy,
        });

        if (resolution === "IGNORAR") {
          resultItems.push({
            alunoId: alvo.id,
            alunoNome: alvo.nome,
            resolution,
            motivo: "Aluno já possui treino ativo e a política selecionada preserva o treino atual.",
          });
          continue;
        }

        if (resolution === "SUBSTITUIR") {
          for (const current of activeWorkouts.items.filter((item) => item.ativo !== false)) {
            await encerrarTreinoWorkspace({
              tenantId,
              id: current.id,
              observacao: `Substituído pela atribuição do template ${editor.nome}.`,
            });
          }
        }

        const assigned = await assignTreinoTemplate({
          tenantId,
          templateId: treino.id,
          templateName: editor.nome,
          templateSnapshot: treino,
          alunoId: alvo.id,
          alunoNome: alvo.nome,
          dataInicio: assignment.dataInicio,
          dataFim: assignment.dataFim || undefined,
          observacoes: assignment.observacao || undefined,
          metaSessoesSemana: editor.frequenciaSemanal,
          frequenciaPlanejada: editor.frequenciaSemanal,
          quantidadePrevista: editor.frequenciaSemanal * editor.totalSemanas,
          frequenciaSemanal: editor.frequenciaSemanal,
          totalSemanas: editor.totalSemanas,
        });

        const assignedEditor = buildTreinoV2EditorSeed(assigned);
        assignedEditor.nome = editor.nome;
        assignedEditor.categoria = editor.categoria;
        assignedEditor.frequenciaSemanal = editor.frequenciaSemanal;
        assignedEditor.totalSemanas = editor.totalSemanas;
        assignedEditor.assignedStatus = assignment.dataInicio > todayIso() ? "AGENDADO" : "ATIVO";
        assignedEditor.snapshot = snapshot;
        assignedEditor.customizadoLocalmente = false;
        assignedEditor.origem = mode === "MASSA" ? "MASSA" : "TEMPLATE";
        assignedEditor.observacoes = assignment.observacao || assignedEditor.observacoes;

        const assignedPayload = buildTreinoV2SaveInput({ treino: assigned, editor: assignedEditor });

        const persistedAssigned = await saveTreinoWorkspace({
          tenantId,
          id: assigned.id,
          alunoId: alvo.id,
          alunoNome: alvo.nome,
          funcionarioId: assigned.funcionarioId,
          funcionarioNome: assignment.professorResponsavel || assigned.funcionarioNome,
          tipoTreino: assigned.tipoTreino,
          treinoBaseId: treino.id,
          nome: assignedPayload.nome,
          templateNome: assignedPayload.templateNome,
          objetivo: assignedPayload.objetivo,
          metaSessoesSemana: assignedPayload.metaSessoesSemana,
          frequenciaPlanejada: assignedPayload.frequenciaPlanejada,
          quantidadePrevista: assignedPayload.quantidadePrevista,
          dataInicio: assignment.dataInicio,
          dataFim: assignment.dataFim,
          observacoes: assignedPayload.observacoes,
          ativo: assignedPayload.ativo,
          status: assignedPayload.status,
          itens: assignedPayload.itens.map((item) => ({
            id: "",
            treinoId: assigned.id,
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

        resultItems.push({
          alunoId: alvo.id,
          alunoNome: alvo.nome,
          resolution,
          assignedWorkoutId: persistedAssigned.id,
        });
      } catch (error) {
        resultItems.push({
          alunoId: alvo.id,
          alunoNome: alvo.nome,
          resolution: "IGNORAR",
          motivo: normalizeErrorMessage(error),
        });
      }
    }

    setAssignment((current) => ({
      ...current,
      progressLabel: `${targets.length}/${targets.length} processado(s)`,
    }));
    await finalizeAssignmentJob(resultItems, mode);
  }

  const publishGuard = evaluateTreinoV2TemplateTransition({
    from: editor.templateStatus,
    to: "PUBLICADO",
    template,
    permissionSet: permissions,
  });

  const canEditAssignedCargaOnly = permissions.assignedEditScope === "LOAD_ONLY";
  const canOpenAssignment = editor.mode === "TEMPLATE" && permissions.canAssignIndividual;
  const templateImpactedClients = useMemo(
    () => new Set(editor.assignmentHistory.flatMap((job) => job.resultado?.itens.map((item) => item.alunoId) ?? [])).size,
    [editor.assignmentHistory],
  );
  const technicalBlockingIssues = useMemo(
    () => validationIssues.filter((issue) => issue.severity === "ERROR"),
    [validationIssues],
  );
  const templateReviewLabel =
    editor.templateStatus === "EM_REVISAO"
      ? "Em revisão"
      : editor.templateStatus === "RASCUNHO"
        ? "Rascunho"
        : technicalBlockingIssues.length > 0
          ? "Pendência técnica"
          : "Publicado";
  const assignedTraceability = useMemo(
    () => ({
      templateOrigemId: treino.treinoBaseId ?? editor.snapshot?.templateId ?? "-",
      snapshotId: editor.snapshot?.id ?? "-",
      templateVersion: editor.snapshot?.templateVersion ? `v${editor.snapshot.templateVersion}` : "-",
      origem: editor.origem,
      customizadoLocalmente: editor.customizadoLocalmente ? "Sim" : "Não",
    }),
    [editor.customizadoLocalmente, editor.origem, editor.snapshot, treino.treinoBaseId],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{editor.mode === "TEMPLATE" ? "Treino padrão" : "Treino atribuído"}</Badge>
            {editor.mode === "TEMPLATE" ? (
              <Badge variant={getTemplateStatusBadgeVariant(editor.templateStatus)}>{editor.templateStatus}</Badge>
            ) : (
              <Badge variant={getAssignedStatusBadgeVariant(editor.assignedStatus)}>{editor.assignedStatus}</Badge>
            )}
            <Badge variant="outline">v{editor.versao}</Badge>
            {editor.mode === "ASSIGNED" && editor.snapshot ? (
              <Badge variant="outline">Snapshot v{editor.snapshot.templateVersion}</Badge>
            ) : null}
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{editor.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {editor.mode === "TEMPLATE"
              ? "Editor unificado de montagem com blocos, biblioteca lateral e governança do template."
              : `Editor do treino atribuído para ${treino.alunoNome ?? "aluno"} com snapshot preservado.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/treinos">
              <ArrowLeft className="mr-2 size-4" />
              Fechar
            </Link>
          </Button>
          <Button variant="outline" onClick={() => downloadEditorSnapshot(treino.id, editor)}>
            <FileDown className="mr-2 size-4" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 size-4" />
            Imprimir
          </Button>
          {editor.mode === "TEMPLATE" ? (
            <>
              <Button variant="outline" onClick={() => void handleSaveDraft()} disabled={saving}>
                <Save className="mr-2 size-4" />
                Salvar rascunho
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleSubmitForReview()}
                disabled={saving || !permissions.canSubmitForReview}
              >
                <Send className="mr-2 size-4" />
                Enviar revisão
              </Button>
              <Button onClick={() => void handlePublish()} disabled={saving || !permissions.canPublishTemplate}>
                <Sparkles className="mr-2 size-4" />
                Publicar
              </Button>
              <Button variant="outline" onClick={() => void handleArchive()} disabled={saving || !permissions.canArchiveTemplate}>
                <Trash2 className="mr-2 size-4" />
                Arquivar
              </Button>
              {canOpenAssignment ? (
                <Button onClick={() => setAssignment((current) => ({ ...current, open: true }))} disabled={saving}>
                  <UserPlus className="mr-2 size-4" />
                  Atribuir treino
                </Button>
              ) : null}
            </>
          ) : (
            <Button onClick={() => void handleSaveDraft()} disabled={saving || !permissions.canAdjustAssignedWorkout}>
              <Save className="mr-2 size-4" />
              Salvar ajustes
            </Button>
          )}
        </div>
      </div>

      {!publishGuard.allowed && editor.mode === "TEMPLATE" ? (
        <div className="rounded-xl border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
          {publishGuard.blockingCodes.length > 0
            ? `Publicação bloqueada por ${publishGuard.blockingCodes.length} pendência(s) técnica(s).`
            : publishGuard.reason ?? "Publicação indisponível no momento."}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),320px]">
        <div className="space-y-4">
          <TreinoForm editor={editor} treino={treino} onUpdateEditor={updateEditor} />

          <SerieConfig
            editor={editor}
            activeBlockId={activeBlockId}
            canEditCargaOnly={canEditAssignedCargaOnly}
            canManageCatalog={permissions.canManageExerciseCatalog}
            catalog={catalog}
            onActiveBlockChange={setActiveBlockId}
            onAddBlock={addBlock}
            onDuplicateBlock={duplicateBlock}
            onMoveBlock={moveBlock}
            onRemoveBlock={removeBlock}
            onUpdateBlockName={updateBlockName}
            onUpdateItem={updateBlockItem}
            onAddEmptyItem={(blockId) => addExerciseToBlock(blockId)}
            onDuplicateItem={duplicateItem}
            onMoveItem={moveItemInActiveBlock}
            onRemoveItem={removeItemFromActiveBlock}
            onToggleTechnique={toggleTechnique}
          />

          <ValidationCard validationIssues={validationIssues} />

          {editor.mode === "TEMPLATE" ? (
            <>
              <GovernanceCard
                templateReviewLabel={templateReviewLabel}
                versao={editor.versao}
                templateImpactedClients={templateImpactedClients}
                assignmentHistoryLength={editor.assignmentHistory.length}
                technicalBlockingIssuesCount={technicalBlockingIssues.length}
              />
              <AssignmentHistoryCard
                editor={editor}
                assignment={assignment}
                historyExpandedJobId={historyExpandedJobId}
                onToggleJobExpand={(jobId) => setHistoryExpandedJobId((current) => (current === jobId ? null : jobId))}
              />
            </>
          ) : (
            <SnapshotCard editor={editor} assignedTraceability={assignedTraceability} />
          )}
        </div>

        <div className="space-y-4">
          <ExercicioSelector
            catalog={catalog}
            filteredCatalog={filteredCatalog}
            grupoMuscularOptions={grupoMuscularOptions}
            catalogSearch={catalogSearch}
            catalogTipo={catalogTipo}
            catalogObjetivo={catalogObjetivo}
            catalogGrupoMuscularId={catalogGrupoMuscularId}
            canManageCatalog={permissions.canManageExerciseCatalog}
            hasActiveBlock={Boolean(activeBlock)}
            onCatalogSearchChange={setCatalogSearch}
            onCatalogTipoChange={setCatalogTipo}
            onCatalogObjetivoChange={setCatalogObjetivo}
            onCatalogGrupoMuscularIdChange={setCatalogGrupoMuscularId}
            onAddExercise={(exercicio) => {
              if (activeBlock) addExerciseToBlock(activeBlock.id, exercicio);
            }}
            onEditExercise={(exercicio) => setDrawer(buildExerciseDrawerState(exercicio))}
            onNewExercise={() => setDrawer({ ...buildExerciseDrawerState(), open: true })}
          />
        </div>
      </div>

      <ExerciseDrawerDialog
        drawer={drawer}
        catalog={catalog}
        grupoMuscularOptions={grupoMuscularOptions}
        saving={saving}
        onDrawerChange={setDrawer}
        onClose={() => setDrawer(buildExerciseDrawerState())}
        onSave={() => void handleSaveExercise()}
      />

      <AssignmentDialog
        assignment={assignment}
        alunos={alunos}
        assignmentCandidates={assignmentCandidates}
        canAssignMassively={permissions.canAssignMassively}
        onAssignmentChange={setAssignment}
        onProcessIndividual={() => void processAssignments("INDIVIDUAL")}
        onProcessMassa={() => void processAssignments("MASSA")}
      />
    </div>
  );
}

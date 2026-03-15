"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileDown,
  GripVertical,
  Loader2,
  Plus,
  Printer,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  type TreinoV2AssignmentConflictPolicy,
  type TreinoV2AssignmentResultItem,
  type TreinoV2DefaultObjective,
  type TreinoV2ExerciseType,
  type TreinoV2TechniqueType,
  type TreinoV2TemplateStatus,
} from "@/lib/treinos/v2-domain";
import {
  assignTreinoTemplate,
  encerrarTreinoWorkspace,
  listTreinosWorkspace,
  saveTreinoExercicio,
  saveTreinoWorkspace,
} from "@/lib/treinos/workspace";
import type { Aluno, Exercicio, Treino } from "@/lib/types";
import { cn } from "@/lib/utils";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const OBJECTIVE_OPTIONS: TreinoV2DefaultObjective[] = [
  "HIPERTROFIA",
  "FORCA",
  "RESISTENCIA",
  "MOBILIDADE",
  "EMAGRECIMENTO",
  "REABILITACAO",
  "CONDICIONAMENTO",
  "OUTRO",
];

const EXERCISE_TYPE_OPTIONS: TreinoV2ExerciseType[] = [
  "MUSCULACAO",
  "CARDIO",
  "MOBILIDADE",
  "ALONGAMENTO",
  "FUNCIONAL",
  "OUTRO",
];

const TECHNIQUE_OPTIONS: Array<{ label: string; value: TreinoV2TechniqueType }> = [
  { label: "Conjugado", value: "CONJUGADO" },
  { label: "Progressivo", value: "PROGRESSIVO" },
  { label: "Drop-set", value: "DROP_SET" },
  { label: "Replicar série", value: "REPLICAR_SERIE" },
];

type EditorProps = {
  tenantId: string;
  treino: Treino;
  alunos: Aluno[];
  exercicios: Exercicio[];
  role: "PROFESSOR" | "COORDENADOR_TECNICO" | "ADMINISTRADOR" | "OPERACAO";
  finePermissions?: Array<
    | "EXERCICIOS"
    | "TREINO_PADRAO"
    | "TREINO_PADRAO_PRESCREVER"
    | "TREINOS_PRESCREVER"
    | "TREINOS_PRESCREVER_OUTRAS_CARTEIRAS"
    | "TREINOS_PERSONALIZAR_EXERCICIO"
    | "TREINOS_SOMENTE_EDITAR_CARGA"
    | "TREINOS_CONSULTAR_OUTRAS_CARTEIRAS"
    | "TREINO_EXIBIR_QTD_RESULTADOS"
  >;
  autoOpenAssignment?: boolean;
  onTreinoChange: (treino: Treino) => void;
  onCatalogChange?: (exercicios: Exercicio[]) => void;
};

type ExerciseDrawerState = {
  open: boolean;
  editingId?: string;
  nome: string;
  codigo: string;
  grupoExercicioNome: string;
  grupoMuscularId: string;
  tipo: TreinoV2ExerciseType;
  objetivoPadrao: TreinoV2DefaultObjective | "";
  unidadeCarga: string;
  descricao: string;
  midiaTipo: "IMAGEM" | "GIF" | "VIDEO" | "";
  midiaUrl: string;
  disponivelNoApp: boolean;
  similarExerciseIds: string[];
};

type AssignmentDialogState = {
  open: boolean;
  tab: "INDIVIDUAL" | "MASSA" | "SEGMENTO";
  alunoId: string;
  selectedAlunoIds: string[];
  dataInicio: string;
  dataFim: string;
  professorResponsavel: string;
  observacao: string;
  conflictPolicy: TreinoV2AssignmentConflictPolicy;
  selectionSearch: string;
  processing: boolean;
  progressLabel?: string;
};

function cloneEditor(editor: TreinoV2EditorSeed): TreinoV2EditorSeed {
  return JSON.parse(JSON.stringify(editor)) as TreinoV2EditorSeed;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(base: string, days: number): string {
  const date = new Date(`${base}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return "-";
  if (!end) return formatDateTime(start);
  return `${formatDateTime(start)} até ${formatDateTime(end)}`;
}

function buildExerciseDrawerState(exercicio?: TreinoV2CatalogExercise): ExerciseDrawerState {
  return {
    open: Boolean(exercicio),
    editingId: exercicio?.id,
    nome: exercicio?.nome ?? "",
    codigo: exercicio?.codigo ?? "",
    grupoExercicioNome: exercicio?.grupoExercicioNome ?? "",
    grupoMuscularId: exercicio?.grupoMuscularId ?? "",
    tipo: exercicio?.tipo ?? "MUSCULACAO",
    objetivoPadrao: exercicio?.objetivoPadrao ?? "",
    unidadeCarga: exercicio?.unidadeCarga ?? "",
    descricao: exercicio?.descricao ?? "",
    midiaTipo: exercicio?.midiaTipo ?? "",
    midiaUrl: exercicio?.midiaUrl ?? "",
    disponivelNoApp: exercicio?.disponivelNoApp ?? true,
    similarExerciseIds: exercicio?.similarExerciseIds ?? [],
  };
}

function buildAssignmentDialogState(treino: Treino): AssignmentDialogState {
  const start = treino.dataInicio ?? todayIso();
  return {
    open: false,
    tab: "INDIVIDUAL",
    alunoId: "",
    selectedAlunoIds: [],
    dataInicio: start,
    dataFim: treino.dataFim ?? addDays(start, 28),
    professorResponsavel: treino.funcionarioNome ?? "",
    observacao: "",
    conflictPolicy: "MANTER_ATUAL",
    selectionSearch: "",
    processing: false,
  };
}

function getTemplateStatusBadgeVariant(status: TreinoV2TemplateStatus) {
  if (status === "ARQUIVADO") return "destructive" as const;
  if (status === "EM_REVISAO") return "outline" as const;
  if (status === "RASCUNHO") return "outline" as const;
  return "secondary" as const;
}

function getAssignedStatusBadgeVariant(status: TreinoV2EditorSeed["assignedStatus"]) {
  if (status === "ENCERRADO" || status === "SUBSTITUIDO") return "destructive" as const;
  if (status === "AGENDADO") return "outline" as const;
  return "secondary" as const;
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const clone = [...items];
  const [item] = clone.splice(index, 1);
  clone.splice(nextIndex, 0, item);
  return clone;
}

function buildNewExerciseItem(exercicio?: TreinoV2CatalogExercise, ordem = 1) {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exerciseId: exercicio?.id,
    exerciseNome: exercicio?.nome ?? "",
    ordem,
    objetivo: exercicio?.objetivoPadrao ?? "",
    unidadeCarga: exercicio?.unidadeCarga ?? "",
    regulagem: "",
    observacoes: "",
    series: { raw: "3", numericValue: 3, status: "VALIDO" as const },
    repeticoes: { raw: "10", numericValue: 10, status: "VALIDO" as const },
    carga: undefined,
    intervalo: { raw: "45", numericValue: 45, status: "VALIDO" as const },
    tecnicas: [],
  };
}

function downloadEditorSnapshot(treinoId: string, editor: TreinoV2EditorSeed) {
  const blob = new Blob([JSON.stringify(editor, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${treinoId}-editor-v2.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

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
  const [assignment, setAssignment] = useState<AssignmentDialogState>(() => buildAssignmentDialogState(treino));
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
      return {
        ...current,
        blocos: nextBlocks,
      };
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

  function updateActiveBlockItem(
    itemId: string,
    updater: (item: TreinoV2EditorSeed["blocos"][number]["itens"][number]) => TreinoV2EditorSeed["blocos"][number]["itens"][number],
  ) {
    if (!activeBlock) return;
    upsertBlocks((blocks) =>
      blocks.map((block) =>
        block.id !== activeBlock.id
          ? block
          : {
              ...block,
              itens: block.itens.map((item) => (item.id === itemId ? updater(item) : item)),
            },
      ),
    );
  }

  function addExerciseToActiveBlock(exercicio?: TreinoV2CatalogExercise) {
    if (!activeBlock) return;
    upsertBlocks((blocks) =>
      blocks.map((block) =>
        block.id !== activeBlock.id
          ? block
          : {
              ...block,
              itens: [...block.itens, buildNewExerciseItem(exercicio, block.itens.length + 1)],
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
    updateActiveBlockItem(itemId, (item) => {
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
      const payload = buildTreinoV2SaveInput({
        treino,
        editor: nextEditor,
      });
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
      toast({
        title: successTitle,
        description: successDescription,
      });
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
      toast({
        title: "Preencha o nome do exercício",
        variant: "destructive",
      });
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
        descricao: serializeExercicioV2Descricao({
          descricao: drawer.descricao,
          metadata,
        }),
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
      toast({
        title: "Selecione pelo menos um aluno",
        variant: "destructive",
      });
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

        const assignedPayload = buildTreinoV2SaveInput({
          treino: assigned,
          editor: assignedEditor,
        });

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
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">Shell do editor</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-1.5 xl:col-span-2">
                <Label htmlFor="treino-v2-nome">Nome *</Label>
                <Input
                  id="treino-v2-nome"
                  value={editor.nome}
                  onChange={(event) => updateEditor((current) => ({ ...current, nome: event.target.value }))}
                />
              </div>
              <NumberField
                label="Frequência semanal *"
                value={editor.frequenciaSemanal}
                onChange={(value) =>
                  updateEditor((current) => ({
                    ...current,
                    frequenciaSemanal: value,
                  }))
                }
              />
              <NumberField
                label="Total semanas *"
                value={editor.totalSemanas}
                onChange={(value) =>
                  updateEditor((current) => ({
                    ...current,
                    totalSemanas: value,
                  }))
                }
              />
              <div className="space-y-1.5">
                <Label htmlFor="treino-v2-categoria">Categoria</Label>
                <Input
                  id="treino-v2-categoria"
                  value={editor.categoria}
                  onChange={(event) => updateEditor((current) => ({ ...current, categoria: event.target.value }))}
                  placeholder="Hipertrofia, condicionamento, reabilitação..."
                />
              </div>
              <label className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={editor.versaoSimplificadaHabilitada}
                  onChange={(event) =>
                    updateEditor((current) => ({
                      ...current,
                      versaoSimplificadaHabilitada: event.target.checked,
                    }))
                  }
                />
                Versão simplificada
              </label>

              {editor.mode === "ASSIGNED" ? (
                <>
                  <div className="space-y-1.5 xl:col-span-2">
                    <Label>Aluno</Label>
                    <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                      {treino.alunoNome ?? "Aluno não informado"}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Origem</Label>
                    <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                      {editor.origem}
                    </div>
                  </div>
                  <div className="space-y-1.5 xl:col-span-3">
                    <Label htmlFor="treino-v2-observacoes">Observações do editor</Label>
                    <Textarea
                      id="treino-v2-observacoes"
                      value={editor.observacoes}
                      onChange={(event) => updateEditor((current) => ({ ...current, observacoes: event.target.value }))}
                      className="min-h-24"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 xl:col-span-6">
                  <Label htmlFor="treino-v2-observacoes">Descrição e observações</Label>
                  <Textarea
                    id="treino-v2-observacoes"
                    value={editor.observacoes}
                    onChange={(event) => updateEditor((current) => ({ ...current, observacoes: event.target.value }))}
                    className="min-h-24"
                    placeholder="Contexto técnico, critérios de revisão, notas de publicação, etc."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-lg">Blocos e séries</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Abas horizontais para organizar a montagem em blocos nomeados.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={addBlock}>
                  <Plus className="mr-2 size-4" />
                  Novo bloco
                </Button>
              </div>

              <Tabs value={activeBlock?.id} onValueChange={setActiveBlockId}>
                <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                  {editor.blocos.map((block) => (
                    <TabsTrigger
                      key={block.id}
                      value={block.id}
                      className="gap-2 border border-border bg-secondary/40 px-3 py-2 data-[state=active]:border-gym-accent data-[state=active]:bg-gym-accent/10"
                    >
                      <GripVertical className="size-3.5 text-muted-foreground" />
                      {block.nome}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {editor.blocos.map((block, index) => (
                  <TabsContent key={block.id} value={block.id} className="space-y-4 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-secondary/30 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label htmlFor={`bloco-nome-${block.id}`}>Nome do bloco</Label>
                        <Input
                          id={`bloco-nome-${block.id}`}
                          value={block.nome}
                          onChange={(event) =>
                            upsertBlocks((blocks) =>
                              blocks.map((item) =>
                                item.id === block.id ? { ...item, nome: event.target.value } : item,
                              ),
                            )
                          }
                          className="w-32"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => moveBlock(block.id, -1)} disabled={index === 0}>
                          <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveBlock(block.id, 1)}
                          disabled={index === editor.blocos.length - 1}
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => duplicateBlock(block.id)}>
                          <Copy className="mr-2 size-4" />
                          Duplicar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBlock(block.id)}
                          disabled={editor.blocos.length === 1}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Remover
                        </Button>
                      </div>
                    </div>

                    <ExerciseGrid
                      block={block}
                      catalog={catalog}
                      canEditCargaOnly={canEditAssignedCargaOnly}
                      canManageCatalog={permissions.canManageExerciseCatalog}
                      onUpdateItem={(itemId, updater) => {
                        if (block.id !== activeBlock?.id) {
                          setActiveBlockId(block.id);
                        }
                        updateActiveBlockItem(itemId, updater);
                      }}
                      onAddEmptyItem={() => {
                        if (block.id !== activeBlock?.id) {
                          setActiveBlockId(block.id);
                        }
                        addExerciseToActiveBlock();
                      }}
                      onDuplicateItem={duplicateItem}
                      onMoveItem={moveItemInActiveBlock}
                      onRemoveItem={removeItemFromActiveBlock}
                      onToggleTechnique={toggleTechnique}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardHeader>
          </Card>

          {validationIssues.length > 0 ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">Validação técnica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {validationIssues.map((issue) => (
                  <div
                    key={`${issue.code}-${issue.fieldPath}`}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      issue.severity === "ERROR"
                        ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
                        : "border-gym-warning/30 bg-gym-warning/10 text-gym-warning",
                    )}
                  >
                    <strong>{issue.code}</strong>: {issue.message}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {editor.mode === "TEMPLATE" ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">Governança operacional</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatLabel label="Status atual" value={templateReviewLabel} />
                <StatLabel label="Versão operacional" value={`v${editor.versao}`} />
                <StatLabel label="Clientes impactados" value={String(templateImpactedClients)} />
                <StatLabel label="Jobs registrados" value={String(editor.assignmentHistory.length)} />
                <StatLabel
                  label="Bloqueios técnicos"
                  value={technicalBlockingIssues.length > 0 ? String(technicalBlockingIssues.length) : "Nenhum"}
                />
              </CardContent>
            </Card>
          ) : null}

          {editor.mode === "TEMPLATE" ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">Histórico de atribuições</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignment.processing ? (
                  <div className="rounded-xl border border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>{assignment.progressLabel ?? "Processando atribuição..."}</span>
                    </div>
                    <p className="mt-2">
                      O job está sendo executado em lote com política <strong>{assignment.conflictPolicy}</strong>.
                    </p>
                  </div>
                ) : null}

                {editor.assignmentHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum job de atribuição registrado para este template.
                  </p>
                ) : (
                  editor.assignmentHistory.map((job) => (
                    <div key={job.id} className="rounded-xl border border-border/70 bg-secondary/30 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{job.mode}</Badge>
                          <Badge variant={job.status === "CONCLUIDO" ? "secondary" : job.status === "CONCLUIDO_PARCIAL" ? "outline" : "destructive"}>
                            {job.status}
                          </Badge>
                          <Badge variant="outline">v{job.templateVersion}</Badge>
                          <span className="text-sm font-semibold text-foreground">Job {job.id}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(job.requestedAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {job.resultado?.totalSelecionado ?? 0} selecionado(s) · {job.resultado?.totalAtribuido ?? 0} atribuído(s) ·{" "}
                        {job.resultado?.totalIgnorado ?? 0} ignorado(s)
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Solicitado por {job.requestedByName ?? job.requestedById} · política {job.conflictPolicy} · vigência{" "}
                        {formatDateRange(job.dataInicio, job.dataFim)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryExpandedJobId((current) => (current === job.id ? null : job.id))}
                        >
                          {historyExpandedJobId === job.id ? "Ocultar resumo" : "Ver resumo"}
                        </Button>
                      </div>
                      {historyExpandedJobId === job.id ? (
                        <div className="mt-3 space-y-2">
                          {job.resultado?.itens.map((item) => (
                            <div key={`${job.id}-${item.alunoId}`} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-medium text-foreground">{item.alunoNome ?? item.alunoId}</span>
                                <Badge variant="outline">{item.resolution}</Badge>
                              </div>
                              {item.motivo ? (
                                <p className="mt-1 text-muted-foreground">{item.motivo}</p>
                              ) : item.assignedWorkoutId ? (
                                <p className="mt-1 text-muted-foreground">
                                  Treino gerado: <Link className="font-medium text-gym-accent hover:underline" href={`/treinos/${item.assignedWorkoutId}`}>{item.assignedWorkoutId}</Link>
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : editor.snapshot ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">Snapshot e rastreabilidade</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <StatLabel label="Template origem" value={editor.snapshot.templateNome} />
                <StatLabel label="Template origem ID" value={assignedTraceability.templateOrigemId} />
                <StatLabel label="Versão do template" value={assignedTraceability.templateVersion} />
                <StatLabel label="Snapshot vinculado" value={assignedTraceability.snapshotId} />
                <StatLabel label="Origem operacional" value={assignedTraceability.origem} />
                <StatLabel label="Customizado localmente" value={assignedTraceability.customizadoLocalmente} />
                <StatLabel label="Categoria" value={editor.snapshot.categoria ?? "-"} />
                <StatLabel label="Publicado em" value={editor.snapshot.publishedAt ? formatDateTime(editor.snapshot.publishedAt) : "-"} />
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-lg">Biblioteca lateral</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Busca, filtros e inserção rápida no bloco ativo.
                  </p>
                </div>
                {permissions.canManageExerciseCatalog ? (
                  <Button variant="outline" size="sm" onClick={() => setDrawer({ ...buildExerciseDrawerState(), open: true })}>
                    <Plus className="mr-2 size-4" />
                    Novo exercício
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Buscar por nome, código ou grupo"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <SelectField
                  label="Tipo"
                  value={catalogTipo}
                  onChange={(value: string) => setCatalogTipo(value as "" | TreinoV2ExerciseType)}
                  options={[{ value: "", label: "Todos" }, ...EXERCISE_TYPE_OPTIONS.map((item) => ({ value: item, label: item }))]}
                />
                <SelectField
                  label="Objetivo"
                  value={catalogObjetivo}
                  onChange={(value: string) => setCatalogObjetivo(value as "" | TreinoV2DefaultObjective)}
                  options={[{ value: "", label: "Todos" }, ...OBJECTIVE_OPTIONS.map((item) => ({ value: item, label: item }))]}
                />
                <SelectField
                  label="Grupo muscular"
                  value={catalogGrupoMuscularId}
                  onChange={setCatalogGrupoMuscularId}
                  options={[{ value: "", label: "Todos" }, ...grupoMuscularOptions.map((item) => ({ value: item.id, label: item.nome }))]}
                />
              </div>

              <div className="space-y-2">
                {filteredCatalog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum exercício encontrado com os filtros atuais.</p>
                ) : (
                  filteredCatalog.slice(0, 12).map((item) => (
                    <div key={item.id} className="rounded-xl border border-border/70 bg-secondary/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{item.nome}</p>
                            {item.codigo ? <Badge variant="outline">{item.codigo}</Badge> : null}
                            <Badge variant="outline">{item.tipo}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.grupoMuscularNome ?? "Sem grupo muscular"} · {item.grupoExercicioNome ?? "Sem grupo"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.objetivoPadrao ?? "Sem objetivo"} · {item.unidadeCarga ?? "Sem unidade"}
                          </p>
                          {item.similarExerciseIds.length > 0 ? (
                            <p className="text-xs text-muted-foreground">Similares: {item.similarExerciseIds.length}</p>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => addExerciseToActiveBlock(item)} disabled={!activeBlock}>
                            <Plus className="mr-1 size-4" />
                            +
                          </Button>
                          {permissions.canManageExerciseCatalog ? (
                            <Button variant="outline" size="sm" onClick={() => setDrawer(buildExerciseDrawerState(item))}>
                              Editar
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={drawer.open} onOpenChange={(open) => setDrawer((current) => ({ ...current, open }))}>
        <DialogContent className="border-border bg-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              {drawer.editingId ? "Editar exercício" : "Novo exercício"}
            </DialogTitle>
            <DialogDescription>
              Cadastro rico de catálogo com mídia, descrição e disponibilidade no app.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="drawer-exercicio-nome">Nome *</Label>
              <Input
                id="drawer-exercicio-nome"
                value={drawer.nome}
                onChange={(event) => setDrawer((current) => ({ ...current, nome: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drawer-exercicio-codigo">Código</Label>
              <Input
                id="drawer-exercicio-codigo"
                value={drawer.codigo}
                onChange={(event) => setDrawer((current) => ({ ...current, codigo: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drawer-exercicio-grupo">Grupo de exercícios</Label>
              <Input
                id="drawer-exercicio-grupo"
                value={drawer.grupoExercicioNome}
                onChange={(event) => setDrawer((current) => ({ ...current, grupoExercicioNome: event.target.value }))}
              />
            </div>
            <SelectField
              label="Grupo muscular"
              value={drawer.grupoMuscularId}
              onChange={(value: string) => setDrawer((current) => ({ ...current, grupoMuscularId: value }))}
              options={[{ value: "", label: "Selecione" }, ...grupoMuscularOptions.map((item) => ({ value: item.id, label: item.nome }))]}
            />
            <SelectField
              label="Tipo"
              value={drawer.tipo}
              onChange={(value: string) => setDrawer((current) => ({ ...current, tipo: value as TreinoV2ExerciseType }))}
              options={EXERCISE_TYPE_OPTIONS.map((item) => ({ value: item, label: item }))}
            />
            <SelectField
              label="Objetivo padrão"
              value={drawer.objetivoPadrao}
              onChange={(value: string) => setDrawer((current) => ({ ...current, objetivoPadrao: value as TreinoV2DefaultObjective | "" }))}
              options={[{ value: "", label: "Selecione" }, ...OBJECTIVE_OPTIONS.map((item) => ({ value: item, label: item }))]}
            />
            <div className="space-y-1.5">
              <Label htmlFor="drawer-exercicio-unidade">Unidade de carga</Label>
              <Input
                id="drawer-exercicio-unidade"
                value={drawer.unidadeCarga}
                onChange={(event) => setDrawer((current) => ({ ...current, unidadeCarga: event.target.value }))}
              />
            </div>
            <SelectField
              label="Mídia"
              value={drawer.midiaTipo}
              onChange={(value: string) => setDrawer((current) => ({ ...current, midiaTipo: value as ExerciseDrawerState["midiaTipo"] }))}
              options={[
                { value: "", label: "Sem mídia" },
                { value: "IMAGEM", label: "Imagem" },
                { value: "GIF", label: "GIF" },
                { value: "VIDEO", label: "Vídeo" },
              ]}
            />
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="drawer-exercicio-midia-url">URL da mídia</Label>
              <Input
                id="drawer-exercicio-midia-url"
                value={drawer.midiaUrl}
                onChange={(event) => setDrawer((current) => ({ ...current, midiaUrl: event.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="drawer-exercicio-descricao">Descrição</Label>
              <Textarea
                id="drawer-exercicio-descricao"
                value={drawer.descricao}
                onChange={(event) => setDrawer((current) => ({ ...current, descricao: event.target.value }))}
                className="min-h-28"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Exercícios similares</Label>
              <div className="grid max-h-40 gap-2 overflow-y-auto rounded-md border border-border bg-secondary/30 p-3 md:grid-cols-2">
                {catalog
                  .filter((item) => item.id !== drawer.editingId)
                  .map((item) => {
                    const checked = drawer.similarExerciseIds.includes(item.id);
                    return (
                      <label key={item.id} className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setDrawer((current) => ({
                              ...current,
                              similarExerciseIds: event.target.checked
                                ? [...current.similarExerciseIds, item.id]
                                : current.similarExerciseIds.filter((value) => value !== item.id),
                            }))
                          }
                        />
                        {item.nome}
                      </label>
                    );
                  })}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
              <input
                type="checkbox"
                checked={drawer.disponivelNoApp}
                onChange={(event) => setDrawer((current) => ({ ...current, disponivelNoApp: event.target.checked }))}
              />
              Exibir no app do cliente
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDrawer(buildExerciseDrawerState())}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSaveExercise()} disabled={saving}>
              {saving ? "Salvando..." : drawer.editingId ? "Salvar exercício" : "Criar exercício"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={assignment.open}
        onOpenChange={(open) => setAssignment((current) => ({ ...current, open }))}
      >
        <DialogContent className="border-border bg-card sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Atribuir treino padrão</DialogTitle>
            <DialogDescription>
              Selecione um cliente ou um lote, defina vigência e aplique o snapshot da versão atual do template.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={assignment.tab} onValueChange={(value) => setAssignment((current) => ({ ...current, tab: value as AssignmentDialogState["tab"] }))}>
            <TabsList className="grid h-auto grid-cols-3 gap-1 bg-secondary/40">
              <TabsTrigger value="INDIVIDUAL">Cliente</TabsTrigger>
              <TabsTrigger value="MASSA" disabled={!permissions.canAssignMassively}>
                Lote
              </TabsTrigger>
              <TabsTrigger value="SEGMENTO">Segmento</TabsTrigger>
            </TabsList>

            <TabsContent value="INDIVIDUAL" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="assignment-aluno">Cliente</Label>
                <select
                  id="assignment-aluno"
                  value={assignment.alunoId}
                  onChange={(event) => setAssignment((current) => ({ ...current, alunoId: event.target.value }))}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                >
                  <option value="">Selecione um aluno</option>
                  {alunos.map((aluno) => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.nome}
                    </option>
                  ))}
                </select>
              </div>
            </TabsContent>

            <TabsContent value="MASSA" className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                <Input
                  value={assignment.selectionSearch}
                  onChange={(event) => setAssignment((current) => ({ ...current, selectionSearch: event.target.value }))}
                  placeholder="Filtrar clientes por nome, CPF ou e-mail"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    setAssignment((current) => ({
                      ...current,
                      selectedAlunoIds: Array.from(new Set([...current.selectedAlunoIds, ...assignmentCandidates.map((item) => item.id)])),
                    }))
                  }
                >
                  Selecionar filtrados
                </Button>
              </div>
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-secondary/30 p-3">
                {assignmentCandidates.map((aluno) => {
                  const checked = assignment.selectedAlunoIds.includes(aluno.id);
                  return (
                    <label key={aluno.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          setAssignment((current) => ({
                            ...current,
                            selectedAlunoIds: event.target.checked
                              ? [...current.selectedAlunoIds, aluno.id]
                              : current.selectedAlunoIds.filter((value) => value !== aluno.id),
                          }))
                        }
                      />
                      <span className="font-medium text-foreground">{aluno.nome}</span>
                      <span className="text-muted-foreground">{aluno.email}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Lista final selecionada: {assignment.selectedAlunoIds.length} cliente(s).
              </p>
            </TabsContent>

            <TabsContent value="SEGMENTO" className="pt-4">
              <div className="rounded-xl border border-border/70 bg-secondary/30 p-4 text-sm text-muted-foreground">
                A aba <strong>Segmento</strong> ficou preparada para evolução futura, mas ainda não executa filtro funcional no P0.
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assignment-inicio">Início da vigência</Label>
              <Input
                id="assignment-inicio"
                type="date"
                value={assignment.dataInicio}
                onChange={(event) => setAssignment((current) => ({ ...current, dataInicio: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assignment-fim">Fim da vigência</Label>
              <Input
                id="assignment-fim"
                type="date"
                value={assignment.dataFim}
                onChange={(event) => setAssignment((current) => ({ ...current, dataFim: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assignment-professor">Professor responsável</Label>
              <Input
                id="assignment-professor"
                value={assignment.professorResponsavel}
                onChange={(event) => setAssignment((current) => ({ ...current, professorResponsavel: event.target.value }))}
              />
            </div>
            <SelectField
              label="Política de conflito"
              value={assignment.conflictPolicy}
              onChange={(value: string) =>
                setAssignment((current) => ({
                  ...current,
                  conflictPolicy: value as TreinoV2AssignmentConflictPolicy,
                }))
              }
              options={[
                { value: "MANTER_ATUAL", label: "Manter treino atual" },
                { value: "SUBSTITUIR_ATUAL", label: "Substituir treino atual" },
                { value: "AGENDAR_NOVO", label: "Agendar novo" },
              ]}
            />
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="assignment-observacao">Observação</Label>
              <Textarea
                id="assignment-observacao"
                value={assignment.observacao}
                onChange={(event) => setAssignment((current) => ({ ...current, observacao: event.target.value }))}
                className="min-h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignment((current) => ({ ...current, open: false }))}>
              Cancelar
            </Button>
            {assignment.tab === "INDIVIDUAL" ? (
              <Button onClick={() => void processAssignments("INDIVIDUAL")} disabled={assignment.processing}>
                {assignment.processing ? "Processando..." : "Atribuir cliente"}
              </Button>
            ) : (
              <Button onClick={() => void processAssignments("MASSA")} disabled={assignment.processing || !permissions.canAssignMassively}>
                {assignment.processing ? "Processando..." : "Executar lote"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExerciseGrid({
  block,
  catalog,
  canEditCargaOnly,
  canManageCatalog,
  onUpdateItem,
  onAddEmptyItem,
  onDuplicateItem,
  onMoveItem,
  onRemoveItem,
  onToggleTechnique,
}: {
  block: TreinoV2EditorSeed["blocos"][number];
  catalog: TreinoV2CatalogExercise[];
  canEditCargaOnly: boolean;
  canManageCatalog: boolean;
  onUpdateItem: (
    itemId: string,
    updater: (item: TreinoV2EditorSeed["blocos"][number]["itens"][number]) => TreinoV2EditorSeed["blocos"][number]["itens"][number],
  ) => void;
  onAddEmptyItem: () => void;
  onDuplicateItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: -1 | 1) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleTechnique: (itemId: string, type: TreinoV2TechniqueType) => void;
}) {
  const isEmpty = block.itens.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Grade central</p>
          <p className="text-xs text-muted-foreground">Edição inline de séries, carga, intervalo, regulagem e técnicas especiais.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onAddEmptyItem}>
          <Plus className="mr-2 size-4" />
          Linha manual
        </Button>
      </div>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Bloco vazio. Use a biblioteca lateral ou crie uma linha manual.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-[1120px] divide-y divide-border text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Ordem</th>
                <th className="px-3 py-2 text-left">Exercício</th>
                <th className="px-3 py-2 text-left">Séries</th>
                <th className="px-3 py-2 text-left">Repetições</th>
                <th className="px-3 py-2 text-left">Objetivo</th>
                <th className="px-3 py-2 text-left">Carga</th>
                <th className="px-3 py-2 text-left">Unid.</th>
                <th className="px-3 py-2 text-left">Intervalo</th>
                <th className="px-3 py-2 text-left">Regulagem</th>
                <th className="px-3 py-2 text-left">Observações</th>
                <th className="px-3 py-2 text-left">Técnicas</th>
                <th className="px-3 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {block.itens.map((item, index) => {
                const selectedExercise = catalog.find((exercise) => exercise.id === item.exerciseId);
                return (
                  <tr key={item.id}>
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center gap-1">
                        <GripVertical className="size-4 text-muted-foreground" />
                        <Button variant="ghost" size="icon" onClick={() => onMoveItem(item.id, -1)} disabled={index === 0}>
                          <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onMoveItem(item.id, 1)}
                          disabled={index === block.itens.length - 1}
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <select
                        aria-label={`Exercício ${index + 1}`}
                        value={item.exerciseId ?? ""}
                        onChange={(event) =>
                          onUpdateItem(item.id, (current) => {
                            const exercise = catalog.find((entry) => entry.id === event.target.value);
                            return {
                              ...current,
                              exerciseId: event.target.value,
                              exerciseNome: exercise?.nome,
                              unidadeCarga: exercise?.unidadeCarga ?? current.unidadeCarga,
                              objetivo: exercise?.objetivoPadrao ?? current.objetivo,
                            };
                          })
                        }
                        className="w-52 rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                      >
                        <option value="">Selecione um exercício</option>
                        {catalog.map((exercise) => (
                          <option key={exercise.id} value={exercise.id}>
                            {exercise.nome}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <MetricCell
                        ariaLabel={`Séries ${index + 1}`}
                        value={item.series.raw}
                        status={item.series.status}
                        onChange={(value) =>
                          onUpdateItem(item.id, (current) => ({
                            ...current,
                            series: {
                              raw: value,
                              numericValue: Number(value),
                              status: value && Number.isFinite(Number(value)) ? "VALIDO" : value ? "INVALIDO" : "VAZIO",
                            },
                          }))
                        }
                        disabled={canEditCargaOnly}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <MetricCell
                        ariaLabel={`Repetições ${index + 1}`}
                        value={item.repeticoes.raw}
                        status={item.repeticoes.status}
                        onChange={(value) =>
                          onUpdateItem(item.id, (current) => ({
                            ...current,
                            repeticoes: {
                              raw: value,
                              numericValue: Number(value),
                              status: value && Number.isFinite(Number(value)) ? "VALIDO" : value ? "INVALIDO" : "VAZIO",
                            },
                          }))
                        }
                        disabled={canEditCargaOnly}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        aria-label={`Objetivo ${index + 1}`}
                        value={item.objetivo ?? ""}
                        onChange={(event) =>
                          onUpdateItem(item.id, (current) => ({
                            ...current,
                            objetivo: event.target.value,
                          }))
                        }
                        disabled={canEditCargaOnly}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <MetricCell
                        ariaLabel={`Carga ${index + 1}`}
                        value={item.carga?.raw ?? ""}
                        status={item.carga?.status ?? "VAZIO"}
                        onChange={(value) =>
                          onUpdateItem(item.id, (current) => ({
                            ...current,
                            carga: {
                              raw: value,
                              numericValue: Number(value),
                              status: value && Number.isFinite(Number(value)) ? "VALIDO" : value ? "INVALIDO" : "VAZIO",
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        aria-label={`Unidade ${index + 1}`}
                        value={item.unidadeCarga ?? selectedExercise?.unidadeCarga ?? ""}
                        onChange={(event) =>
                          onUpdateItem(item.id, (current) => ({
                            ...current,
                            unidadeCarga: event.target.value,
                          }))
                        }
                        disabled={canEditCargaOnly}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <MetricCell
                        ariaLabel={`Intervalo ${index + 1}`}
                        value={item.intervalo?.raw ?? ""}
                        status={item.intervalo?.status ?? "VAZIO"}
                        onChange={(value) =>
                          onUpdateItem(item.id, (current) => ({
                            ...current,
                            intervalo: {
                              raw: value,
                              numericValue: Number(value),
                              status: value && Number.isFinite(Number(value)) ? "VALIDO" : value ? "INVALIDO" : "VAZIO",
                            },
                          }))
                        }
                        disabled={canEditCargaOnly}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        aria-label={`Regulagem ${index + 1}`}
                        value={item.regulagem ?? ""}
                        onChange={(event) =>
                          onUpdateItem(item.id, (current) => ({
                            ...current,
                            regulagem: event.target.value,
                          }))
                        }
                        disabled={canEditCargaOnly}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Textarea
                        aria-label={`Observações ${index + 1}`}
                        value={item.observacoes ?? ""}
                        onChange={(event) =>
                          onUpdateItem(item.id, (current) => ({
                            ...current,
                            observacoes: event.target.value,
                          }))
                        }
                        className="min-h-16"
                        disabled={canEditCargaOnly}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-wrap gap-1">
                        {TECHNIQUE_OPTIONS.map((technique) => {
                          const enabled = item.tecnicas?.some((entry) => entry.type === technique.value);
                          return (
                            <Button
                              key={technique.value}
                              variant={enabled ? "default" : "outline"}
                              size="sm"
                              onClick={() => onToggleTechnique(item.id, technique.value)}
                              disabled={canEditCargaOnly && technique.value !== "REPLICAR_SERIE"}
                            >
                              {enabled ? <Check className="mr-1 size-3.5" /> : null}
                              {technique.label}
                            </Button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => onDuplicateItem(item.id)}>
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onRemoveItem(item.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                        {canManageCatalog && selectedExercise ? (
                          <Badge variant="outline">
                            <ArrowUpDown className="mr-1 size-3.5" />
                            {selectedExercise.codigo ?? "Sem código"}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" min={1} value={value} onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))} />
    </div>
  );
}

function MetricCell({
  ariaLabel,
  value,
  status,
  onChange,
  disabled = false,
}: {
  ariaLabel: string;
  value: string;
  status: "VAZIO" | "VALIDO" | "INVALIDO";
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Input
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(status === "INVALIDO" ? "border-gym-danger text-gym-danger" : undefined)}
      disabled={disabled}
    />
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: Dispatch<SetStateAction<string>> | ((value: string) => void);
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatLabel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

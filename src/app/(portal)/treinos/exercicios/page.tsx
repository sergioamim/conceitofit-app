"use client";

/**
 * Biblioteca de Exercícios — grid de cards (Wave C, design Montagem
 * de Treino).
 *
 * Cards com thumb colorido por grupo muscular + chip de grupo no canto
 * + nome + equipamento + status. Filtros: search, grupo (select),
 * equipamento (select), apenas ativos. Mantém ações Editar/Toggle via
 * overflow no card.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ImageOff,
  Library,
  MoreVertical,
  PlayCircle,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { ExercicioModal, type ExercicioForm } from "@/components/shared/exercicio-modal";
import { ImportarDoCatalogoDialog } from "@/components/treinos/editor/importar-do-catalogo-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  useExercicios,
  useSaveExercicio,
  useToggleExercicio,
} from "@/lib/query/use-treinos";
import { useSanitizeBiblioteca } from "@/lib/query/use-catalogo-exercicios";
import type { Exercicio } from "@/lib/types";
import { grupoColorByName } from "@/lib/treinos/grupo-colors";
import { cn } from "@/lib/utils";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";

const TODOS = "todos";

export default function ExerciciosPage() {
  const router = useRouter();
  const { tenantId, tenantResolved } = useTenantContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState<string>(TODOS);
  const [equipFiltro, setEquipFiltro] = useState<string>(TODOS);
  const [apenasAtivos, setApenasAtivos] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Exercicio | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [sanitizeOpen, setSanitizeOpen] = useState(false);
  const sanitizeMutation = useSanitizeBiblioteca(tenantId ?? "");
  // Hydration-safe: tenantId vem do contexto client-only (cookie/storage).
  // SSR renderiza só "Novo exercício"; após mount, mostra Sanitizar/Importar.
  const hydrated = useHydrated();

  const { data, isLoading: loading, isError, error: queryError } = useExercicios({
    tenantId,
    tenantResolved,
    apenasAtivos,
  });

  const exercicios = data?.exercicios ?? [];
  const gruposMusculares = data?.gruposMusculares ?? [];
  const error = isError ? normalizeErrorMessage(queryError) : null;

  const saveExercicioMutation = useSaveExercicio();
  const toggleExercicioMutation = useToggleExercicio();

  // Equipamentos únicos pro filtro (extraídos da própria lista)
  const equipamentos = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const ex of exercicios) {
      const e = ex.equipamento?.trim();
      if (e && !seen.has(e)) {
        seen.add(e);
        out.push(e);
      }
    }
    return out.sort((a, b) => a.localeCompare(b));
  }, [exercicios]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return exercicios.filter((ex) => {
      const grupoNome = ex.grupoMuscularNome ?? ex.grupoMuscular ?? "";
      if (grupoFiltro !== TODOS && grupoNome !== grupoFiltro) return false;
      if (equipFiltro !== TODOS && (ex.equipamento ?? "") !== equipFiltro) return false;
      if (!q) return true;
      return `${ex.nome} ${grupoNome} ${ex.equipamento ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [exercicios, busca, grupoFiltro, equipFiltro]);

  async function handleSaveExercicio(payload: ExercicioForm) {
    if (!tenantId) return;
    const saved = await saveExercicioMutation.mutateAsync({
      tenantId,
      id: payload.id,
      nome: payload.nome,
      descricao: payload.descricao,
      grupoMuscularId: payload.grupoMuscularId,
      equipamento: payload.equipamento,
      videoUrl: payload.videoUrl,
      unidade: payload.unidade,
    });
    setModalOpen(false);
    setEditing(null);
    toast({
      title: payload.id ? "Exercício atualizado" : "Exercício criado",
      description: saved.nome,
    });
  }

  async function handleToggle(item: Exercicio) {
    if (!tenantId) return;
    try {
      const toggled = await toggleExercicioMutation.mutateAsync({ tenantId, id: item.id });
      toast({
        title: toggled.ativo ? "Exercício reativado" : "Exercício inativado",
        description: toggled.nome,
      });
    } catch (toggleError) {
      toast({
        title: "Não foi possível alterar o status do exercício",
        description: normalizeErrorMessage(toggleError),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      {tenantId ? (
        <ImportarDoCatalogoDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          tenantId={tenantId}
          onImported={() => {
            // Modal já mostrou toast com a contagem; aqui só invalidamos queries.
            void queryClient.invalidateQueries({ queryKey: ["exercicios"] });
          }}
        />
      ) : null}

      <ExercicioModal
        key={modalOpen ? editing?.id ?? "novo-exercicio" : "exercicio-closed"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSaveExercicio}
        gruposMusculares={gruposMusculares.filter((item) => item.ativo !== false)}
        initial={editing}
      />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Biblioteca de Exercícios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {exercicios.length} exercícios · {gruposMusculares.length} grupos
          musculares · {equipamentos.length} equipamentos
        </p>
      </div>

      {error ? <ListErrorState error={error} /> : null}

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="h-9 pl-8"
              placeholder="Buscar exercício, grupo ou equipamento..."
            />
          </div>
          <Select value={grupoFiltro} onValueChange={setGrupoFiltro}>
            <SelectTrigger className="h-9 w-auto min-w-[180px] border-border">
              <SelectValue placeholder="Grupo muscular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os grupos</SelectItem>
              {gruposMusculares
                .filter((g) => g.ativo !== false)
                .map((g) => (
                  <SelectItem key={g.id} value={g.nome}>
                    {g.nome}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={equipFiltro} onValueChange={setEquipFiltro}>
            <SelectTrigger className="h-9 w-auto min-w-[170px] border-border">
              <SelectValue placeholder="Equipamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos equipamentos</SelectItem>
              {equipamentos.map((eq) => (
                <SelectItem key={eq} value={eq}>
                  {eq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div role="group" aria-label="Filtro de status do exercício" className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setApenasAtivos(false)}
              aria-pressed={!apenasAtivos}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                !apenasAtivos
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setApenasAtivos(true)}
              aria-pressed={apenasAtivos}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                apenasAtivos
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              Apenas ativos
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hydrated && tenantId && exercicios.length > 0 ? (
            <Button
              variant="outline"
              onClick={() => setSanitizeOpen(true)}
              className="border-rose-500/40 text-rose-300 hover:bg-rose-500/5 hover:text-rose-200"
              title="Apaga todos os exercícios da biblioteca para reimportar do zero"
            >
              <Trash2 className="mr-2 size-4" />
              Sanitizar
            </Button>
          ) : null}
          {hydrated && tenantId ? (
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="border-border"
            >
              <Library className="mr-2 size-4" />
              Importar do catálogo
            </Button>
          ) : null}
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" />
            Novo exercício
          </Button>
        </div>
      </div>

      {/* Wave D.4: dialog de confirmação do sanitize. */}
      <AlertDialog open={sanitizeOpen} onOpenChange={setSanitizeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sanitizar biblioteca?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Vai apagar <b>{exercicios.length}</b> exercícios da biblioteca local
                  (soft delete — referências em treinos antigos continuam resolvendo).
                </p>
                <p>
                  Após confirmar, abra <b>Importar do catálogo</b> e selecione os
                  exercícios que quer trazer (com mídia, grupo muscular e equipamentos
                  já preenchidos do catálogo canônico).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sanitizeMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={sanitizeMutation.isPending}
              className="bg-rose-600 hover:bg-rose-500"
              onClick={(event) => {
                event.preventDefault();
                sanitizeMutation.mutate(undefined, {
                  onSuccess: (resp) => {
                    toast({
                      title: "Biblioteca sanitizada",
                      description: `${resp.totalRemovidos} exercícios removidos. Use "Importar do catálogo" pra repovoar.`,
                    });
                    setSanitizeOpen(false);
                    setImportDialogOpen(true);
                  },
                  onError: (err) => {
                    toast({
                      title: "Não foi possível sanitizar",
                      description: normalizeErrorMessage(err),
                      variant: "destructive",
                    });
                  },
                });
              }}
            >
              {sanitizeMutation.isPending ? "Apagando..." : "Sim, apagar tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contador */}
      <div className="text-xs text-muted-foreground">
        {loading
          ? "Carregando..."
          : `${filtrados.length} de ${exercicios.length} exercícios`}
      </div>

      {/* Grid de cards */}
      {!loading && filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
          Nenhum exercício encontrado para os filtros aplicados.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((ex) => {
            const grupoNome = ex.grupoMuscularNome ?? ex.grupoMuscular ?? "";
            const cor = grupoColorByName(grupoNome);
            const equip = ex.equipamento ?? "—";
            return (
              <article
                key={ex.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/treinos/exercicios/${ex.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/treinos/exercicios/${ex.id}`);
                  }
                }}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-gym-accent/40 hover:shadow-lg hover:shadow-gym-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gym-accent"
              >
                {/* Thumb: mídia real (gif/imagem) + hover ativa video preview se houver.
                    Fallback: placeholder com cor do grupo. */}
                <div
                  className="relative flex h-[120px] items-center justify-center overflow-hidden border-b border-border"
                  style={{
                    background: `linear-gradient(135deg, ${cor}1f, transparent), repeating-linear-gradient(45deg, transparent 0 8px, rgba(255,255,255,0.03) 8px 9px)`,
                  }}
                >
                  <ExercicioThumb
                    midiaUrl={ex.midiaUrl}
                    thumbnailUrl={ex.thumbnailUrl}
                    videoUrl={ex.videoUrl}
                    nome={ex.nome}
                  />
                  {/* Chip do grupo no canto sup esq */}
                  {grupoNome ? (
                    <span
                      className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black"
                      style={{ background: cor }}
                    >
                      {grupoNome}
                    </span>
                  ) : null}
                  {/* Status no canto sup dir */}
                  {ex.ativo === false ? (
                    <Badge
                      variant="outline"
                      className="absolute right-2 top-2 border-border/80 bg-background/80 text-[10px]"
                    >
                      Inativo
                    </Badge>
                  ) : null}
                  {/* Overflow menu */}
                  <div
                    className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {ex.ativo === false ? null : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 bg-background/70 backdrop-blur"
                            aria-label="Ações do exercício"
                          >
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(ex);
                              setModalOpen(true);
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void handleToggle(ex)}
                          >
                            Inativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                  <h3 className="text-[14px] font-medium leading-snug text-foreground transition-colors group-hover:text-gym-accent">
                    <span className="line-clamp-2">{ex.nome}</span>
                  </h3>
                  <p className="text-[12px] text-muted-foreground">{equip}</p>
                  {ex.descricao ? (
                    <p className="line-clamp-2 text-[11.5px] text-muted-foreground/80">
                      {ex.descricao}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}

/**
 * Wave D.3: thumb do card de exercício.
 *
 * - Renderiza `<img>` real (gif/imagem) quando `midiaUrl`/`thumbnailUrl` houver.
 * - On hover, se houver `videoUrl`, troca por `<video autoPlay muted loop>`.
 * - Sem mídia, mostra placeholder "vídeo demo" com PlayCircle.
 *
 * Hidratação: o estado `hover` só altera após mount (handlers de mouse não
 * rodam no SSR), então não há mismatch.
 */
function ExercicioThumb({
  midiaUrl,
  thumbnailUrl,
  videoUrl,
  nome,
}: {
  midiaUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  nome: string;
}) {
  const [hovering, setHovering] = useState(false);
  const imageUrl = midiaUrl ?? thumbnailUrl ?? null;
  const showVideo = hovering && Boolean(videoUrl);

  if (!imageUrl && !videoUrl) {
    return (
      <div className="flex flex-col items-center text-muted-foreground/70">
        <PlayCircle className="size-8 opacity-50" />
        <span className="mt-1 font-mono text-[10px] uppercase tracking-wider">
          vídeo demo
        </span>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 h-full w-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {showVideo && videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
      ) : imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={nome}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(event) => {
            // Fallback gracioso se o gif/imagem 404 — esconde, deixa o
            // gradiente do grupo aparecer com o ícone de placeholder.
            const target = event.currentTarget;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.dataset.broken = "true";
            }
          }}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground/70">
          <ImageOff className="size-8 opacity-50" />
        </div>
      )}
    </div>
  );
}

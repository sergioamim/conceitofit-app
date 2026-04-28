"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  useCatalogoExercicios,
  useImportarBatchExercicios,
} from "@/lib/query/use-catalogo-exercicios";
import type { CatalogoExercicio } from "@/lib/shared/types/exercicio-catalogo";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";

const ALL_VALUE = "__ALL__";
const DEBOUNCE_MS = 300;
const PAGE_SIZE = 24;

const BODY_PART_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "chest", label: "Peito" },
  { value: "back", label: "Costas" },
  { value: "shoulders", label: "Ombros" },
  { value: "upper arms", label: "Braços" },
  { value: "lower arms", label: "Antebraços" },
  { value: "waist", label: "Core" },
  { value: "upper legs", label: "Pernas" },
  { value: "lower legs", label: "Panturrilha" },
  { value: "cardio", label: "Cardio" },
  { value: "neck", label: "Pescoço" },
];

const EQUIPMENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "barbell", label: "Barra" },
  { value: "dumbbell", label: "Halter" },
  { value: "body weight", label: "Peso corporal" },
  { value: "cable", label: "Cabo" },
  { value: "machine", label: "Máquina" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "band", label: "Elástico" },
];

interface ImportarDoCatalogoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onImportSuccess: (exercicioId: string, nome: string) => void;
}

export function ImportarDoCatalogoDialog({
  open,
  onOpenChange,
  tenantId,
  onImportSuccess,
}: ImportarDoCatalogoDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [bodyPart, setBodyPart] = useState<string | undefined>(undefined);
  const [equipment, setEquipment] = useState<string | undefined>(undefined);
  const [comImagem, setComImagem] = useState<boolean>(true);
  const [page, setPage] = useState(0);
  const [selecionados, setSelecionados] = useState<Map<string, string>>(new Map());

  // Debounce manual em useEffect — SSR-safe (não roda no render inicial).
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Reseta página quando filtros mudam (mas não a seleção — seleção persiste entre páginas).
  useEffect(() => {
    setPage(0);
  }, [bodyPart, equipment, comImagem]);

  const { data, isLoading, isError, refetch, isFetching } = useCatalogoExercicios({
    search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
    bodyPart,
    equipment,
    comImagem,
    page,
    size: PAGE_SIZE,
  });

  const importBatchMutation = useImportarBatchExercicios(tenantId);
  const { toast } = useToast();

  const items = data?.content ?? [];
  const totalPaginas = data?.totalPages ?? 0;
  const totalItens = data?.totalElements ?? 0;
  const allOnPageSelected = items.length > 0 && items.every((it) => selecionados.has(it.exerciseIdExterno));
  const someOnPageSelected = !allOnPageSelected && items.some((it) => selecionados.has(it.exerciseIdExterno));

  function toggleOne(exercicio: CatalogoExercicio) {
    setSelecionados((prev) => {
      const next = new Map(prev);
      if (next.has(exercicio.exerciseIdExterno)) {
        next.delete(exercicio.exerciseIdExterno);
      } else {
        next.set(exercicio.exerciseIdExterno, exercicio.nomePt ?? exercicio.nome);
      }
      return next;
    });
  }

  function togglePage() {
    setSelecionados((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        items.forEach((it) => next.delete(it.exerciseIdExterno));
      } else {
        items.forEach((it) => next.set(it.exerciseIdExterno, it.nomePt ?? it.nome));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelecionados(new Map());
  }

  function handleImportSelected() {
    if (selecionados.size === 0) return;
    const ids = Array.from(selecionados.keys());
    importBatchMutation.mutate(ids, {
      onSuccess: (resp) => {
        toast({
          title: `${resp.totalImportados} exercícios importados`,
          description: resp.totalImportados === 1
            ? `"${resp.itens[0]?.nome ?? ""}" foi adicionado à biblioteca.`
            : `Os exercícios já estão disponíveis na biblioteca.`,
        });
        // Notifica callback original (compat com 1 item) — usa o primeiro como sentinel.
        if (resp.itens.length > 0) {
          onImportSuccess(resp.itens[0].exercicioId, resp.itens[0].nome);
        }
        clearSelection();
        onOpenChange(false);
      },
      onError: (err) => {
        toast({
          title: "Erro ao importar selecionados",
          description: normalizeErrorMessage(err),
          variant: "destructive",
        });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Importar exercícios do catálogo</DialogTitle>
          <DialogDescription>
            Mais de 11 mil exercícios disponíveis. Selecione os que quiser importar (nome, mídia,
            grupo muscular, equipamentos e instruções vão pra biblioteca local). Você pode editar
            depois.
          </DialogDescription>
        </DialogHeader>

        {/* Filtros + filtro "com imagem" */}
        <div className="grid grid-cols-1 gap-3 px-1 md:grid-cols-4">
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            value={bodyPart ?? ALL_VALUE}
            onValueChange={(value) => setBodyPart(value === ALL_VALUE ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Grupo muscular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              {BODY_PART_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={equipment ?? ALL_VALUE}
            onValueChange={(value) => setEquipment(value === ALL_VALUE ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Equipamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              {EQUIPMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <Checkbox
              checked={comImagem}
              onCheckedChange={(v) => setComImagem(v === true)}
              aria-label="Apenas com imagem"
            />
            <span>Apenas com imagem</span>
          </label>
        </div>

        {/* Toolbar seleção: select page + contador + clear */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-1 pb-2 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
              onCheckedChange={() => togglePage()}
              disabled={items.length === 0}
              aria-label="Selecionar todos da página"
            />
            <span className="text-muted-foreground">
              {allOnPageSelected
                ? `Página inteira selecionada (${items.length})`
                : `Selecionar ${items.length} desta página`}
            </span>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              <b className="font-semibold text-foreground">{selecionados.size}</b> selecionado(s)
              {selecionados.size > 0 ? (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="ml-2 text-xs text-muted-foreground underline hover:text-foreground"
                >
                  limpar
                </button>
              ) : null}
            </span>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-1">
          {isError ? (
            <Card className="bg-secondary/30 p-6 text-center">
              <p className="text-muted-foreground">
                Catálogo indisponível — aguardando deploy do backend.
              </p>
              <Button variant="outline" onClick={() => void refetch()} className="mt-3">
                Tentar novamente
              </Button>
            </Card>
          ) : null}

          {!isError && isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : null}

          {!isError && !isLoading && data ? (
            items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum exercício encontrado com os filtros atuais.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {items.map((exercicio) => (
                  <CatalogoExercicioCard
                    key={exercicio.exerciseIdExterno}
                    exercicio={exercicio}
                    selected={selecionados.has(exercicio.exerciseIdExterno)}
                    onToggle={() => toggleOne(exercicio)}
                  />
                ))}
              </div>
            )
          ) : null}

          {!isError && !isLoading && isFetching ? (
            <div className="py-2 text-center text-xs text-muted-foreground">Atualizando...</div>
          ) : null}
        </div>

        {/* Footer: paginação + ação importar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-1 pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isFetching}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span>
              Pág. <b className="font-semibold text-foreground">{page + 1}</b>
              {totalPaginas > 0 ? <> de {totalPaginas}</> : null}
              {totalItens > 0 ? <span className="ml-2">· {totalItens} no catálogo</span> : null}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPage((p) => p + 1)}
              disabled={totalPaginas > 0 ? page + 1 >= totalPaginas : items.length < PAGE_SIZE || isFetching}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
          <Button
            onClick={handleImportSelected}
            disabled={selecionados.size === 0 || importBatchMutation.isPending}
          >
            <Check className="mr-1 size-4" />
            {importBatchMutation.isPending
              ? "Importando..."
              : `Importar ${selecionados.size > 0 ? selecionados.size : ""} selecionado${selecionados.size === 1 ? "" : "s"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CatalogoExercicioCardProps {
  exercicio: CatalogoExercicio;
  selected: boolean;
  onToggle: () => void;
}

function CatalogoExercicioCard({ exercicio, selected, onToggle }: CatalogoExercicioCardProps) {
  const previewUrl = exercicio.gifUrl ?? exercicio.imageUrl ?? null;
  const nomeExibicao = exercicio.nomePt ?? exercicio.nome;

  return (
    <Card
      onClick={onToggle}
      className={cn(
        "cursor-pointer overflow-hidden transition hover:shadow-md",
        selected && "ring-2 ring-gym-accent",
      )}
    >
      <div className="relative aspect-video bg-secondary/50">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={nomeExibicao}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        <div className="absolute left-2 top-2">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            className="bg-card/90"
            aria-label={`Selecionar ${nomeExibicao}`}
          />
        </div>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{nomeExibicao}</h3>
        {exercicio.bodyParts.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {exercicio.bodyParts.slice(0, 2).map((bp) => (
              <Badge key={bp} variant="outline" className="text-[10px]">
                {bp}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

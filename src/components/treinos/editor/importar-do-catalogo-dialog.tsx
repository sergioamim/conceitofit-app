"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useCatalogoExercicios,
  useImportarExercicio,
} from "@/lib/query/use-catalogo-exercicios";
import type { CatalogoExercicio } from "@/lib/shared/types/exercicio-catalogo";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const ALL_VALUE = "__ALL__";
const DEBOUNCE_MS = 300;

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

  // Debounce manual em useEffect — SSR-safe (não roda no render inicial).
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch, isFetching } = useCatalogoExercicios({
    search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
    bodyPart,
    equipment,
  });

  const importMutation = useImportarExercicio(tenantId);
  const { toast } = useToast();

  function handleImport(exercicio: CatalogoExercicio) {
    importMutation.mutate(
      { exerciseIdExterno: exercicio.exerciseIdExterno },
      {
        onSuccess: (resp) => {
          toast({ title: `"${resp.nome}" importado` });
          onImportSuccess(resp.exercicioId, resp.nome);
          onOpenChange(false);
        },
        onError: (err) => {
          toast({
            title: "Erro ao importar",
            description: normalizeErrorMessage(err),
            variant: "destructive",
          });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Importar exercício do catálogo</DialogTitle>
          <DialogDescription>
            Mais de 11 mil exercícios disponíveis. Selecionar copia nome, mídia (gif/vídeo),
            grupo muscular, equipamentos e instruções pra biblioteca local. Você pode editar depois.
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="grid grid-cols-1 gap-3 px-1 md:grid-cols-3">
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
            data.content.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum exercício encontrado com os filtros atuais.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {data.content.map((exercicio) => (
                  <CatalogoExercicioCard
                    key={exercicio.exerciseIdExterno}
                    exercicio={exercicio}
                    importing={importMutation.isPending}
                    onImport={() => handleImport(exercicio)}
                  />
                ))}
              </div>
            )
          ) : null}

          {!isError && !isLoading && isFetching ? (
            <div className="py-2 text-center text-xs text-muted-foreground">Atualizando...</div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CatalogoExercicioCardProps {
  exercicio: CatalogoExercicio;
  importing: boolean;
  onImport: () => void;
}

function CatalogoExercicioCard({ exercicio, importing, onImport }: CatalogoExercicioCardProps) {
  const previewUrl = exercicio.gifUrl ?? exercicio.imageUrl ?? null;
  const nomeExibicao = exercicio.nomePt ?? exercicio.nome;

  return (
    <Card className="overflow-hidden transition hover:shadow-md">
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
        <Button
          size="sm"
          className="mt-3 w-full"
          disabled={importing}
          onClick={onImport}
        >
          {importing ? "Importando..." : "Importar"}
        </Button>
      </div>
    </Card>
  );
}

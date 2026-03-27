"use client";

import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";
import type { TreinoV2TechniqueType } from "@/lib/treinos/v2-domain";
import type { TreinoV2EditorSeed } from "@/lib/treinos/v2-runtime";
import { MetricCell } from "./shared";
import { TECHNIQUE_OPTIONS } from "./types";

type SerieConfigProps = {
  editor: TreinoV2EditorSeed;
  activeBlockId: string;
  canEditCargaOnly: boolean;
  canManageCatalog: boolean;
  catalog: TreinoV2CatalogExercise[];
  onActiveBlockChange: (blockId: string) => void;
  onAddBlock: () => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onRemoveBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onUpdateItem: (
    blockId: string,
    itemId: string,
    updater: (item: TreinoV2EditorSeed["blocos"][number]["itens"][number]) => TreinoV2EditorSeed["blocos"][number]["itens"][number],
  ) => void;
  onAddEmptyItem: (blockId: string) => void;
  onDuplicateItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: -1 | 1) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleTechnique: (itemId: string, type: TreinoV2TechniqueType) => void;
};

export function SerieConfig({
  editor,
  activeBlockId,
  canEditCargaOnly,
  canManageCatalog,
  catalog,
  onActiveBlockChange,
  onAddBlock,
  onDuplicateBlock,
  onMoveBlock,
  onRemoveBlock,
  onUpdateBlockName,
  onUpdateItem,
  onAddEmptyItem,
  onDuplicateItem,
  onMoveItem,
  onRemoveItem,
  onToggleTechnique,
}: SerieConfigProps) {
  const activeBlock = editor.blocos.find((block) => block.id === activeBlockId) ?? editor.blocos[0] ?? null;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg">Blocos e séries</CardTitle>
            <p className="text-sm text-muted-foreground">
              Abas horizontais para organizar a montagem em blocos nomeados.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onAddBlock}>
            <Plus className="mr-2 size-4" />
            Novo bloco
          </Button>
        </div>

        <Tabs value={activeBlock?.id} onValueChange={onActiveBlockChange}>
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
                    onChange={(event) => onUpdateBlockName(block.id, event.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => onMoveBlock(block.id, -1)} disabled={index === 0}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMoveBlock(block.id, 1)}
                    disabled={index === editor.blocos.length - 1}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDuplicateBlock(block.id)}>
                    <Copy className="mr-2 size-4" />
                    Duplicar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveBlock(block.id)}
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
                canEditCargaOnly={canEditCargaOnly}
                canManageCatalog={canManageCatalog}
                onUpdateItem={(itemId, updater) => onUpdateItem(block.id, itemId, updater)}
                onAddEmptyItem={() => onAddEmptyItem(block.id)}
                onDuplicateItem={onDuplicateItem}
                onMoveItem={onMoveItem}
                onRemoveItem={onRemoveItem}
                onToggleTechnique={onToggleTechnique}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardHeader>
    </Card>
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

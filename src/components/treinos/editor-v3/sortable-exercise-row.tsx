"use client";

/**
 * SortableExerciseRow — linha da tabela inline do editor V3.
 *
 * Extraído de treino-v3-editor.tsx para reduzir o tamanho do arquivo
 * principal (Wave F débito 4). Renderiza uma row sortable (drag&drop)
 * com 7 cells editáveis: drag handle, número, exercício+grupo,
 * séries×reps, carga, descanso, cadência, RIR e ações.
 *
 * Cells customizadas (modo instance) ficam em amber background.
 */

import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { grupoColorByName } from "@/lib/treinos/grupo-colors";
import {
  createTreinoV2MetricField,
  type TreinoV2TechniqueType,
} from "@/lib/tenant/treinos/v2-domain";
import type { TreinoV2EditorSeed } from "@/lib/tenant/treinos/v2-runtime";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";

type SessaoItem = TreinoV2EditorSeed["sessoes"][number]["itens"][number];

const CUSTOM_CELL_CLASS =
  "border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold";

const TECHNIQUE_OPTIONS: Array<{ value: "NORMAL" | TreinoV2TechniqueType; label: string }> = [
  { value: "NORMAL", label: "Normal" },
  { value: "DROP_SET", label: "Drop set" },
  { value: "PROGRESSIVO", label: "Progressivo" },
  { value: "CONJUGADO", label: "Conjugado" },
  { value: "REPLICAR_SERIE", label: "Replicar série" },
];

export interface SortableExerciseRowProps {
  item: SessaoItem;
  index: number;
  catalog: Map<string, TreinoV2CatalogExercise>;
  advancedMode: boolean;
  isCustom: (field: keyof SessaoItem) => boolean;
  onUpdate: (patch: Partial<SessaoItem>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function SortableExerciseRow({
  item,
  index,
  catalog,
  advancedMode,
  isCustom,
  onUpdate,
  onDuplicate,
  onRemove,
}: SortableExerciseRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const exercicio = item.exerciseId ? catalog.get(item.exerciseId) : undefined;
  const exNome = item.exerciseNome ?? exercicio?.nome ?? "—";
  const grupoNome = exercicio?.grupoMuscularNome ?? item.objetivo ?? "";
  const grupoCor = grupoColorByName(grupoNome);
  const tecnicaAtual = item.tecnicas?.[0]?.type ?? "NORMAL";

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
      <td className="px-2 py-2 text-xs font-bold text-muted-foreground">
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
            onChange={(e) =>
              onUpdate({ series: createTreinoV2MetricField(e.target.value) })
            }
            className={cn(
              "h-8 w-12 border-border bg-secondary px-2 text-center",
              isCustom("series") && CUSTOM_CELL_CLASS,
            )}
          />
          <span className="text-muted-foreground">×</span>
          <Input
            value={item.repeticoes?.raw ?? ""}
            onChange={(e) =>
              onUpdate({ repeticoes: createTreinoV2MetricField(e.target.value) })
            }
            placeholder="10-12"
            className={cn(
              "h-8 w-16 border-border bg-secondary px-2",
              isCustom("repeticoes") && CUSTOM_CELL_CLASS,
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
            isCustom("carga") && CUSTOM_CELL_CLASS,
          )}
        />
      </td>
      <td className="px-2 py-2">
        <Input
          value={item.intervalo?.raw ?? ""}
          onChange={(e) =>
            onUpdate({
              intervalo: e.target.value
                ? createTreinoV2MetricField(e.target.value.replace(/\D/g, ""))
                : undefined,
            })
          }
          placeholder="60"
          className={cn(
            "h-8 w-20 border-border bg-secondary px-2",
            isCustom("intervalo") && CUSTOM_CELL_CLASS,
          )}
        />
      </td>
      {advancedMode ? (
        <>
          <td className="px-2 py-2">
            <select
              value={tecnicaAtual}
              onChange={(e) =>
                onUpdate({
                  tecnicas:
                    e.target.value === "NORMAL"
                      ? []
                      : [{ type: e.target.value as TreinoV2TechniqueType }],
                })
              }
              className={cn(
                "h-8 w-28 rounded-md border border-border bg-secondary px-2 text-xs",
                isCustom("tecnicas") && CUSTOM_CELL_CLASS,
              )}
            >
              {TECHNIQUE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </td>
          <td className="px-2 py-2">
            <Input
              value={item.cadencia ?? ""}
              onChange={(e) => onUpdate({ cadencia: e.target.value || undefined })}
              placeholder="2-0-1"
              className={cn(
                "h-8 w-20 border-border bg-secondary px-2",
                isCustom("cadencia") && CUSTOM_CELL_CLASS,
              )}
              title="Cadência: excêntrica-pausa-concêntrica"
            />
          </td>
          <td className="px-2 py-2">
            <select
              value={item.rir ?? ""}
              onChange={(e) =>
                onUpdate({ rir: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              className={cn(
                "h-8 w-16 rounded-md border border-border bg-secondary px-2 text-sm",
                isCustom("rir") && CUSTOM_CELL_CLASS,
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
        </>
      ) : null}
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

"use client";

/**
 * PreviewModal — visualização read-only do template (Wave H.5).
 *
 * Mostra como o aluno verá o treino no app: sessões com letter box +
 * lista de exercícios com séries × reps · carga · descanso · cadência ·
 * RIR. Sem edição, sem drag-drop, sem cells customizadas em amber.
 *
 * Disparado pelo botão "Pré-visualizar" do header do editor V3.
 */

import { Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { grupoColorByName } from "@/lib/treinos/grupo-colors";
import type { TreinoV2EditorSeed } from "@/lib/tenant/treinos/v2-runtime";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";

type SessaoItem = TreinoV2EditorSeed["sessoes"][number]["itens"][number];

export interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  editor: TreinoV2EditorSeed;
  catalog: Map<string, TreinoV2CatalogExercise>;
}

export function PreviewModal({ open, onClose, editor, catalog }: PreviewModalProps) {
  const totalSessoes = editor.sessoes.length;
  const totalExercicios = editor.sessoes.reduce(
    (sum, s) => sum + s.itens.length,
    0,
  );
  const totalSeries = editor.sessoes.reduce(
    (sum, s) =>
      sum + s.itens.reduce((sub, it) => sub + (Number(it.series?.numericValue) || 0), 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] max-w-[760px] overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Eye className="size-5 text-gym-accent" />
            Pré-visualização do treino
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Como o aluno verá no app · {totalSessoes}{" "}
            {totalSessoes === 1 ? "sessão" : "sessões"} · {totalExercicios} exercícios ·{" "}
            {totalSeries} séries totais
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-4">
          {editor.sessoes.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Sem sessões cadastradas ainda.
            </div>
          ) : (
            editor.sessoes.map((sessao, idx) => {
              const letter = String.fromCharCode(65 + idx);
              return (
                <section
                  key={sessao.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <header className="flex items-center gap-3 border-b border-border p-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-gym-accent bg-gym-accent text-sm font-bold text-black">
                      {letter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">
                        Sessão {letter}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {sessao.itens.length}{" "}
                        {sessao.itens.length === 1 ? "exercício" : "exercícios"}
                      </div>
                    </div>
                  </header>
                  {sessao.itens.length === 0 ? (
                    <div className="p-4 text-xs italic text-muted-foreground">
                      Sem exercícios nesta sessão.
                    </div>
                  ) : (
                    <ol className="divide-y divide-border">
                      {sessao.itens.map((item, i) => (
                        <PreviewItem
                          key={item.id}
                          item={item}
                          index={i}
                          catalog={catalog}
                        />
                      ))}
                    </ol>
                  )}
                </section>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end border-t border-border px-6 py-4">
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="mr-1 size-3.5" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewItem({
  item,
  index,
  catalog,
}: {
  item: SessaoItem;
  index: number;
  catalog: Map<string, TreinoV2CatalogExercise>;
}) {
  const exercicio = item.exerciseId ? catalog.get(item.exerciseId) : undefined;
  const exNome = item.exerciseNome ?? exercicio?.nome ?? "Exercício sem nome";
  const grupoNome = exercicio?.grupoMuscularNome ?? item.objetivo ?? "";
  const grupoCor = grupoColorByName(grupoNome);

  const series = item.series?.raw ?? "—";
  const reps = item.repeticoes?.raw ?? "—";
  const carga = item.carga?.raw;
  const descanso = item.intervalo?.raw;

  return (
    <li className="flex items-start gap-3 p-3">
      <span
        className="mt-0.5 block h-6 w-1 shrink-0 rounded-sm"
        style={{ background: grupoCor }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="truncate text-sm font-medium">{exNome}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>
            <b className="text-foreground">{series}</b> ×{" "}
            <b className="text-foreground">{reps}</b>
          </span>
          {carga ? (
            <span>
              · Carga <b className="text-foreground">{carga}</b>
            </span>
          ) : null}
          {descanso ? (
            <span>
              · Descanso <b className="text-foreground">{descanso}s</b>
            </span>
          ) : null}
          {item.cadencia ? (
            <span>
              · Cadência <b className="text-foreground">{item.cadencia}</b>
            </span>
          ) : null}
          {item.rir != null ? <span>· RIR {item.rir}</span> : null}
          {grupoNome ? (
            <Badge
              variant="outline"
              className="ml-auto text-[10px]"
              style={{
                borderColor: `${grupoCor}60`,
                color: grupoCor,
                background: `${grupoCor}1a`,
              }}
            >
              {grupoNome}
            </Badge>
          ) : null}
        </div>
        {item.observacoes ? (
          <p className="mt-1 text-[11px] text-muted-foreground">{item.observacoes}</p>
        ) : null}
      </div>
    </li>
  );
}

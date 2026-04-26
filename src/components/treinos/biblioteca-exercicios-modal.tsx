"use client";

/**
 * BibliotecaExerciciosModal — modal multi-select de exercícios para o
 * Editor V3 (Wave B do design Montagem de Treino).
 *
 * Design source: project/templates.jsx (BibliotecaModal). Visual: pills
 * de grupos coloridos, grid 2-col de cards com thumb placeholder, footer
 * "N selecionados" + Cancelar + Adicionar.
 */

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { grupoColorByName } from "@/lib/treinos/grupo-colors";
import type { Exercicio } from "@/lib/shared/types/aluno";

export interface BibliotecaExerciciosModalProps {
  open: boolean;
  onClose: () => void;
  exercicios: Exercicio[];
  onAdd: (ids: string[]) => void;
  /** Ids já presentes na sessão ativa (mostra badge "já adicionado"). */
  excludeIds?: Set<string>;
}

export function BibliotecaExerciciosModal({
  open,
  onClose,
  exercicios,
  onAdd,
  excludeIds,
}: BibliotecaExerciciosModalProps) {
  const [busca, setBusca] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState<string>("todos");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Extrai grupos únicos dos exercícios disponíveis (preserva ordem de
  // primeira aparição pra usuário ver os mais comuns primeiro).
  const grupos = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const ex of exercicios) {
      const g = ex.grupoMuscularNome ?? ex.grupoMuscular;
      if (g && !seen.has(g)) {
        seen.add(g);
        out.push(g);
      }
    }
    return out;
  }, [exercicios]);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return exercicios.filter((ex) => {
      if (ex.ativo === false) return false;
      const grupoNome = ex.grupoMuscularNome ?? ex.grupoMuscular ?? "";
      if (grupoFiltro !== "todos" && grupoNome !== grupoFiltro) return false;
      if (!q) return true;
      return (
        ex.nome.toLowerCase().includes(q) ||
        grupoNome.toLowerCase().includes(q) ||
        (ex.equipamento?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [exercicios, busca, grupoFiltro]);

  const toggle = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClose = () => {
    setSelecionados(new Set());
    setBusca("");
    setGrupoFiltro("todos");
    onClose();
  };

  const handleConfirm = () => {
    if (selecionados.size === 0) return;
    onAdd(Array.from(selecionados));
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
      <DialogContent className="max-h-[90vh] max-w-[880px] overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <DialogTitle className="font-display text-lg font-bold">
            Adicionar exercícios
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {exercicios.length} exercícios na biblioteca · marque vários para
            inserir de uma vez
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 pt-4">
          {/* Busca */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar exercício, grupo ou aparelho..."
              className="h-9 pl-9"
              aria-label="Buscar exercício"
            />
          </div>

          {/* Pills de grupo */}
          {grupos.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setGrupoFiltro("todos")}
                aria-pressed={grupoFiltro === "todos"}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                  grupoFiltro === "todos"
                    ? "border-gym-accent/50 bg-gym-accent/10 text-gym-accent"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                Todos
              </button>
              {grupos.map((g) => {
                const active = grupoFiltro === g;
                const cor = grupoColorByName(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrupoFiltro(g)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                      !active && "border-border text-muted-foreground hover:bg-muted",
                    )}
                    style={
                      active
                        ? {
                            background: `${cor}1a`,
                            color: cor,
                            borderColor: `${cor}60`,
                          }
                        : undefined
                    }
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Grid de exercícios */}
        <div className="max-h-[420px] overflow-y-auto px-6 py-4">
          {filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
              Nenhum exercício encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filtered.map((ex) => {
                const sel = selecionados.has(ex.id);
                const ja = excludeIds?.has(ex.id) ?? false;
                const grupoNome = ex.grupoMuscularNome ?? ex.grupoMuscular ?? "";
                const cor = grupoColorByName(grupoNome);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggle(ex.id)}
                    aria-pressed={sel}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border bg-card p-2 text-left transition-all",
                      sel
                        ? "border-gym-accent bg-gym-accent/5"
                        : "border-border hover:border-gym-accent/40",
                    )}
                  >
                    {/* Thumb com cor do grupo */}
                    <div
                      className="relative flex size-[60px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-border"
                      style={{
                        background: `linear-gradient(135deg, ${cor}20, transparent)`,
                      }}
                    >
                      <span className="font-mono text-[9px] uppercase leading-tight text-muted-foreground/70">
                        video
                        <br />
                        demo
                      </span>
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">
                        {ex.nome}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {grupoNome ? (
                          <span
                            className="inline-flex h-1.5 w-1.5 rounded-full"
                            style={{ background: cor }}
                          />
                        ) : null}
                        <span>
                          {grupoNome || "—"}
                          {ex.equipamento ? ` · ${ex.equipamento}` : ""}
                        </span>
                      </div>
                      {ja ? (
                        <div className="mt-1 inline-flex items-center text-[10px] text-amber-300">
                          já está na sessão
                        </div>
                      ) : null}
                    </div>
                    {/* Check */}
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        sel
                          ? "border-gym-accent bg-gym-accent text-black"
                          : "border-border",
                      )}
                    >
                      {sel ? <Check className="size-3" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border px-6 py-4">
          <span className="flex-1 text-xs text-muted-foreground">
            {selecionados.size} selecionado{selecionados.size === 1 ? "" : "s"}
          </span>
          <Button variant="outline" size="sm" onClick={handleClose}>
            <X className="mr-1 size-3.5" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={selecionados.size === 0}
          >
            Adicionar
            {selecionados.size > 0 ? ` ${selecionados.size}` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

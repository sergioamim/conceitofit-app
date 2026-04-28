"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { addDaysToIsoDate } from "@/lib/business-date";
import { cn } from "@/lib/utils";
import type { Treino } from "@/lib/types";
import type { AssignmentState } from "./use-treinos-workspace";
import { getTemplateDisplayName } from "./use-treinos-workspace";

type AlunoOption = {
  id: string;
  nome: string;
  cpf?: string | null;
  email?: string | null;
};

type AssignmentDialogProps = {
  open: boolean;
  assignmentTemplate: Treino | null;
  assignmentForm: AssignmentState | null;
  alunoOptions: AlunoOption[];
  assigning: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentFormChange: (updater: (current: AssignmentState | null) => AssignmentState | null) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Calcula dataFim a partir do total de sessões e frequência semanal.
 * Ex.: 20 sessões × 3x/sem → ⌈20/3⌉ = 7 semanas → 49 dias.
 */
function computeDataFim(dataInicio: string, totalSessoes: number, freqSemanal: number): string {
  if (!dataInicio || totalSessoes <= 0 || freqSemanal <= 0) return dataInicio;
  const semanas = Math.ceil(totalSessoes / freqSemanal);
  return addDaysToIsoDate(dataInicio, semanas * 7);
}

/**
 * Combobox autocomplete de aluno — input filtrado + lista absoluta.
 * Sem dep externa de popover: posicionamento via CSS relative/absolute.
 * Fecha em click-fora via mousedown global; navegação por teclado básica.
 */
function AlunoCombobox({
  value,
  options,
  onChange,
  placeholder = "Buscar aluno por nome, CPF ou e-mail",
}: {
  value: string;
  options: AlunoOption[];
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const selected = useMemo(
    () => options.find((aluno) => aluno.id === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    if (selected && !open) {
      setQuery(selected.nome);
    }
  }, [selected, open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        if (selected) setQuery(selected.nome);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [open, selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options
      .filter((aluno) => {
        const haystack = [aluno.nome, aluno.cpf ?? "", aluno.email ?? ""]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 50);
  }, [options, query]);

  function handleSelect(aluno: AlunoOption) {
    onChange(aluno.id);
    setQuery(aluno.nome);
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlight(0);
            if (!event.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setHighlight((h) => Math.min(h + 1, filtered.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const target = filtered[highlight];
              if (target) handleSelect(target);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="pl-8 pr-8"
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            aria-label="Limpar seleção"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              Nenhum aluno encontrado
            </div>
          ) : (
            <ul role="listbox" className="py-1">
              {filtered.map((aluno, index) => (
                <li
                  key={aluno.id}
                  role="option"
                  aria-selected={aluno.id === value}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(aluno);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col gap-0.5 px-3 py-2 text-sm",
                    index === highlight && "bg-secondary",
                    aluno.id === value && "text-gym-accent",
                  )}
                >
                  <span className="font-medium leading-tight">{aluno.nome}</span>
                  {(aluno.cpf || aluno.email) ? (
                    <span className="text-[11px] text-muted-foreground">
                      {[aluno.cpf, aluno.email].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AssignmentDialog({
  assignmentTemplate,
  assignmentForm,
  alunoOptions,
  assigning,
  onOpenChange,
  onAssignmentFormChange,
  onCancel,
  onConfirm,
}: AssignmentDialogProps) {
  /**
   * Recalcula dataFim sempre que dataInicio, totalSessoes (quantidadePrevista)
   * ou frequenciaPlanejada mudarem. O usuário pode override manual depois.
   */
  function updateAndRecalc(
    patch: Partial<Pick<AssignmentState, "dataInicio" | "quantidadePrevista" | "frequenciaPlanejada">>,
  ) {
    onAssignmentFormChange((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      next.dataFim = computeDataFim(
        next.dataInicio,
        next.quantidadePrevista,
        next.frequenciaPlanejada,
      );
      // Mantém metaSessoesSemana sincronizado com frequencia (mesma coisa)
      if (patch.frequenciaPlanejada != null) {
        next.metaSessoesSemana = patch.frequenciaPlanejada;
      }
      return next;
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Atribuir treino padrão</DialogTitle>
          <DialogDescription>
            Formalize a atribuição do template {assignmentTemplate ? getTemplateDisplayName(assignmentTemplate) : "-"} para um aluno.
          </DialogDescription>
        </DialogHeader>

        {assignmentForm ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="template-assignment-aluno">Aluno *</Label>
              <AlunoCombobox
                value={assignmentForm.alunoId}
                options={alunoOptions}
                onChange={(id) =>
                  onAssignmentFormChange((current) =>
                    current ? { ...current, alunoId: id } : current,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-assignment-inicio">Início</Label>
              <Input
                id="template-assignment-inicio"
                type="date"
                value={assignmentForm.dataInicio}
                onChange={(event) => updateAndRecalc({ dataInicio: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-assignment-frequencia">Frequência semanal</Label>
              <Input
                id="template-assignment-frequencia"
                type="number"
                min={1}
                max={7}
                value={assignmentForm.frequenciaPlanejada}
                onChange={(event) =>
                  updateAndRecalc({ frequenciaPlanejada: Number(event.target.value) || 0 })
                }
              />
              <p className="text-[11px] text-muted-foreground">Vezes por semana que o aluno vai treinar.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-assignment-quantidade">Sessões para concluir</Label>
              <Input
                id="template-assignment-quantidade"
                type="number"
                min={1}
                value={assignmentForm.quantidadePrevista}
                onChange={(event) =>
                  updateAndRecalc({ quantidadePrevista: Number(event.target.value) || 0 })
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Total de treinos para finalizar a série. Sugerido pelo template.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-assignment-fim">Fim previsto</Label>
              <Input
                id="template-assignment-fim"
                type="date"
                value={assignmentForm.dataFim}
                onChange={(event) =>
                  onAssignmentFormChange((current) =>
                    current ? { ...current, dataFim: event.target.value } : current,
                  )
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Calculado automaticamente. Pode ser ajustado manualmente.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="template-assignment-objetivo">Objetivo individual</Label>
              <Textarea
                id="template-assignment-objetivo"
                value={assignmentForm.objetivoIndividual}
                onChange={(event) =>
                  onAssignmentFormChange((current) =>
                    current ? { ...current, objetivoIndividual: event.target.value } : current,
                  )
                }
                className="min-h-16"
                placeholder="Meta específica deste aluno (ex.: perder 5kg em 8 semanas)"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="template-assignment-restricoes">Restrições / Lesões</Label>
              <Textarea
                id="template-assignment-restricoes"
                value={assignmentForm.restricoes}
                onChange={(event) =>
                  onAssignmentFormChange((current) =>
                    current ? { ...current, restricoes: event.target.value } : current,
                  )
                }
                className="min-h-16"
                placeholder="Lesões a respeitar, exercícios a evitar"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="template-assignment-notas">Notas do professor</Label>
              <Textarea
                id="template-assignment-notas"
                value={assignmentForm.notasProfessor}
                onChange={(event) =>
                  onAssignmentFormChange((current) =>
                    current ? { ...current, notasProfessor: event.target.value } : current,
                  )
                }
                className="min-h-20"
                placeholder="Orientações livres (cargas iniciais, evolução, observações)"
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={assigning || !assignmentForm || !assignmentForm.alunoId}>
            {assigning ? "Atribuindo..." : "Atribuir treino"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ArchiveDialogProps = {
  template: Treino;
  archiving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ArchiveDialog({ template, archiving, onClose, onConfirm }: ArchiveDialogProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Arquivar treino padrão</DialogTitle>
          <DialogDescription>
            {`Confirme o arquivamento de ${getTemplateDisplayName(template)}. A ação remove o template do fluxo ativo de atribuição.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={archiving}>
            {archiving ? "Arquivando..." : "Arquivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

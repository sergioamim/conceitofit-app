"use client";

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

export function AssignmentDialog({
  open,
  assignmentTemplate,
  assignmentForm,
  alunoOptions,
  assigning,
  onOpenChange,
  onAssignmentFormChange,
  onCancel,
  onConfirm,
}: AssignmentDialogProps) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Atribuir treino padrão</DialogTitle>
          <DialogDescription>
            Formalize a atribuição do template {assignmentTemplate ? getTemplateDisplayName(assignmentTemplate) : "-"} para um aluno.
          </DialogDescription>
        </DialogHeader>

        {assignmentForm ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="template-assignment-aluno">Aluno *</Label>
              <select
                id="template-assignment-aluno"
                value={assignmentForm.alunoId}
                onChange={(event) =>
                  onAssignmentFormChange((current) =>
                    current ? { ...current, alunoId: event.target.value } : current,
                  )
                }
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
              >
                <option value="">Selecione um aluno</option>
                {alunoOptions.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-assignment-inicio">Início</Label>
              <Input
                id="template-assignment-inicio"
                type="date"
                value={assignmentForm.dataInicio}
                onChange={(event) =>
                  onAssignmentFormChange((current) =>
                    current ? { ...current, dataInicio: event.target.value } : current,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-assignment-fim">Fim</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-assignment-meta">Meta sessões/semana</Label>
              <Input
                id="template-assignment-meta"
                type="number"
                value={assignmentForm.metaSessoesSemana}
                onChange={(event) =>
                  onAssignmentFormChange((current) =>
                    current
                      ? {
                          ...current,
                          metaSessoesSemana: Number(event.target.value) || 0,
                        }
                      : current,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-assignment-frequencia">Frequência planejada</Label>
              <Input
                id="template-assignment-frequencia"
                type="number"
                value={assignmentForm.frequenciaPlanejada}
                onChange={(event) =>
                  onAssignmentFormChange((current) =>
                    current
                      ? {
                          ...current,
                          frequenciaPlanejada: Number(event.target.value) || 0,
                        }
                      : current,
                  )
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="template-assignment-quantidade">Quantidade prevista</Label>
              <Input
                id="template-assignment-quantidade"
                type="number"
                value={assignmentForm.quantidadePrevista}
                onChange={(event) =>
                  onAssignmentFormChange((current) =>
                    current
                      ? {
                          ...current,
                          quantidadePrevista: Number(event.target.value) || 0,
                        }
                      : current,
                  )
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="template-assignment-observacoes">Observações</Label>
              <Textarea
                id="template-assignment-observacoes"
                value={assignmentForm.observacoes}
                onChange={(event) =>
                  onAssignmentFormChange((current) =>
                    current ? { ...current, observacoes: event.target.value } : current,
                  )
                }
                className="min-h-24"
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={assigning || !assignmentForm}>
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
          <DialogTitle className="font-display text-lg font-bold">Arquivar treino padrão</DialogTitle>
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

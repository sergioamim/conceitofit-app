"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TreinoV2AssignmentConflictPolicy } from "@/lib/treinos/v2-domain";
import type { TreinoV2EditorSeed } from "@/lib/treinos/v2-runtime";
import type { Aluno } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SelectField, StatLabel } from "./shared";
import { type AssignmentDialogState, formatDateTime, formatDateRange } from "./types";

type ValidationIssue = {
  code: string;
  message: string;
  severity: "ERROR" | "WARNING";
  fieldPath?: string;
};

type ValidationCardProps = {
  validationIssues: ValidationIssue[];
};

export function ValidationCard({ validationIssues }: ValidationCardProps) {
  if (validationIssues.length === 0) return null;

  return (
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
  );
}

type GovernanceCardProps = {
  templateReviewLabel: string;
  versao: number;
  templateImpactedClients: number;
  assignmentHistoryLength: number;
  technicalBlockingIssuesCount: number;
};

export function GovernanceCard({
  templateReviewLabel,
  versao,
  templateImpactedClients,
  assignmentHistoryLength,
  technicalBlockingIssuesCount,
}: GovernanceCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">Governança operacional</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatLabel label="Status atual" value={templateReviewLabel} />
        <StatLabel label="Versão operacional" value={`v${versao}`} />
        <StatLabel label="Clientes impactados" value={String(templateImpactedClients)} />
        <StatLabel label="Jobs registrados" value={String(assignmentHistoryLength)} />
        <StatLabel
          label="Bloqueios técnicos"
          value={technicalBlockingIssuesCount > 0 ? String(technicalBlockingIssuesCount) : "Nenhum"}
        />
      </CardContent>
    </Card>
  );
}

type AssignmentHistoryCardProps = {
  editor: TreinoV2EditorSeed;
  assignment: AssignmentDialogState;
  historyExpandedJobId: string | null;
  onToggleJobExpand: (jobId: string) => void;
};

export function AssignmentHistoryCard({
  editor,
  assignment,
  historyExpandedJobId,
  onToggleJobExpand,
}: AssignmentHistoryCardProps) {
  return (
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
                  onClick={() => onToggleJobExpand(job.id)}
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
  );
}

type SnapshotCardProps = {
  editor: TreinoV2EditorSeed;
  assignedTraceability: {
    templateOrigemId: string;
    snapshotId: string;
    templateVersion: string;
    origem: string;
    customizadoLocalmente: string;
  };
};

export function SnapshotCard({ editor, assignedTraceability }: SnapshotCardProps) {
  if (!editor.snapshot) return null;

  return (
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
  );
}

type AssignmentDialogProps = {
  assignment: AssignmentDialogState;
  alunos: Aluno[];
  assignmentCandidates: Aluno[];
  canAssignMassively: boolean;
  onAssignmentChange: (updater: (current: AssignmentDialogState) => AssignmentDialogState) => void;
  onProcessIndividual: () => void;
  onProcessMassa: () => void;
};

export function AssignmentDialog({
  assignment,
  alunos,
  assignmentCandidates,
  canAssignMassively,
  onAssignmentChange,
  onProcessIndividual,
  onProcessMassa,
}: AssignmentDialogProps) {
  return (
    <Dialog
      open={assignment.open}
      onOpenChange={(open) => onAssignmentChange((current) => ({ ...current, open }))}
    >
      <DialogContent className="border-border bg-card sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Atribuir treino padrão</DialogTitle>
          <DialogDescription>
            Selecione um cliente ou um lote, defina vigência e aplique o snapshot da versão atual do template.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={assignment.tab} onValueChange={(value) => onAssignmentChange((current) => ({ ...current, tab: value as AssignmentDialogState["tab"] }))}>
          <TabsList className="grid h-auto grid-cols-3 gap-1 bg-secondary/40">
            <TabsTrigger value="INDIVIDUAL">Cliente</TabsTrigger>
            <TabsTrigger value="MASSA" disabled={!canAssignMassively}>
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
                onChange={(event) => onAssignmentChange((current) => ({ ...current, alunoId: event.target.value }))}
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
                onChange={(event) => onAssignmentChange((current) => ({ ...current, selectionSearch: event.target.value }))}
                placeholder="Filtrar clientes por nome, CPF ou e-mail"
              />
              <Button
                variant="outline"
                onClick={() =>
                  onAssignmentChange((current) => ({
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
                        onAssignmentChange((current) => ({
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
              onChange={(event) => onAssignmentChange((current) => ({ ...current, dataInicio: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assignment-fim">Fim da vigência</Label>
            <Input
              id="assignment-fim"
              type="date"
              value={assignment.dataFim}
              onChange={(event) => onAssignmentChange((current) => ({ ...current, dataFim: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assignment-professor">Professor responsável</Label>
            <Input
              id="assignment-professor"
              value={assignment.professorResponsavel}
              onChange={(event) => onAssignmentChange((current) => ({ ...current, professorResponsavel: event.target.value }))}
            />
          </div>
          <SelectField
            label="Política de conflito"
            value={assignment.conflictPolicy}
            onChange={(value: string) =>
              onAssignmentChange((current) => ({
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
              onChange={(event) => onAssignmentChange((current) => ({ ...current, observacao: event.target.value }))}
              className="min-h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onAssignmentChange((current) => ({ ...current, open: false }))}>
            Cancelar
          </Button>
          {assignment.tab === "INDIVIDUAL" ? (
            <Button onClick={onProcessIndividual} disabled={assignment.processing}>
              {assignment.processing ? "Processando..." : "Atribuir cliente"}
            </Button>
          ) : (
            <Button onClick={onProcessMassa} disabled={assignment.processing || !canAssignMassively}>
              {assignment.processing ? "Processando..." : "Executar lote"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

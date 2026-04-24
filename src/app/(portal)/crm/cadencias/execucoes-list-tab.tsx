"use client";

import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  CrmCadenceExecution,
  CrmCadenceExecutionStatus,
} from "@/lib/types";
import {
  CRM_CADENCE_EXECUTION_STATUS_LABEL,
  CRM_CADENCE_STEP_STATUS_LABEL,
  CRM_CADENCIA_ACTION_LABEL,
  getCrmStageName,
} from "@/lib/tenant/crm/workspace";
import { formatDateTime } from "@/lib/formatters";

const EXECUTION_STATUS_COLORS: Record<CrmCadenceExecutionStatus, string> = {
  EM_ANDAMENTO: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  CONCLUIDA: "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
  CANCELADA: "border-border bg-secondary/50 text-muted-foreground",
  ESCALADA: "border-gym-warning/30 bg-gym-warning/10 text-gym-warning",
};

const STEP_STATUS_COLORS: Record<string, string> = {
  PENDENTE: "border-border bg-secondary/50 text-muted-foreground",
  EXECUTADO: "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
  PULADO: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  FALHA: "border-gym-danger/30 bg-gym-danger/10 text-gym-danger",
};

export type ExecucoesStatusFilter = "TODAS" | CrmCadenceExecutionStatus;

export interface ExecucoesListTabProps {
  executions: CrmCadenceExecution[];
  loading: boolean;
  statusFilter: ExecucoesStatusFilter;
  onStatusFilterChange: (next: ExecucoesStatusFilter) => void;
  onCancel: (executionId: string) => void;
}

export function ExecucoesListTab({
  executions,
  loading,
  statusFilter,
  onStatusFilterChange,
  onCancel,
}: ExecucoesListTabProps) {
  const filtered =
    statusFilter === "TODAS"
      ? executions
      : executions.filter((e) => e.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="w-full max-w-xs space-y-2">
          <Label>Filtrar por status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as ExecucoesStatusFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
              <SelectItem value="CONCLUIDA">Concluídas</SelectItem>
              <SelectItem value="ESCALADA">Escaladas</SelectItem>
              <SelectItem value="CANCELADA">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((exec) => (
          <Card key={exec.id} className="border-border/80 bg-card/70">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">{exec.cadenciaNome}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Prospect:{" "}
                    <span className="font-medium text-foreground">{exec.prospectNome}</span>
                    {" · "}
                    {getCrmStageName(exec.stageStatus)}
                  </p>
                </div>
                <Badge className={EXECUTION_STATUS_COLORS[exec.status]}>
                  {exec.status === "EM_ANDAMENTO" && <Clock className="mr-1 size-3" />}
                  {exec.status === "CONCLUIDA" && (
                    <CheckCircle2 className="mr-1 size-3" />
                  )}
                  {exec.status === "ESCALADA" && (
                    <AlertTriangle className="mr-1 size-3" />
                  )}
                  {exec.status === "CANCELADA" && <XCircle className="mr-1 size-3" />}
                  {CRM_CADENCE_EXECUTION_STATUS_LABEL[exec.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-secondary/40">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Passo</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Agendado</TableHead>
                      <TableHead>Executado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exec.passos.map((passo, index) => (
                      <TableRow key={passo.id} className="border-border">
                        <TableCell className="text-xs text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {passo.stepTitulo}
                        </TableCell>
                        <TableCell className="text-sm">
                          {CRM_CADENCIA_ACTION_LABEL[passo.acao]}
                        </TableCell>
                        <TableCell>
                          <Badge className={STEP_STATUS_COLORS[passo.status] ?? ""}>
                            {CRM_CADENCE_STEP_STATUS_LABEL[passo.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(passo.agendadoPara)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(passo.executadoEm ?? "")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Início: {formatDateTime(exec.iniciadoEm)}</span>
                  {exec.concluidoEm && (
                    <span>Concluído: {formatDateTime(exec.concluidoEm)}</span>
                  )}
                  {exec.escaladoEm && (
                    <span className="text-gym-warning">
                      Escalado: {formatDateTime(exec.escaladoEm)}
                      {exec.escalacaoMotivo && ` — ${exec.escalacaoMotivo}`}
                    </span>
                  )}
                </div>
                {exec.status === "EM_ANDAMENTO" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gym-danger hover:text-gym-danger"
                    onClick={() => onCancel(exec.id)}
                  >
                    <XCircle className="mr-1 size-3.5" />
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma execução encontrada com o filtro selecionado.
        </div>
      )}
    </div>
  );
}

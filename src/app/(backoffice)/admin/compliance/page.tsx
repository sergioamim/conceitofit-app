"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Database,
  FileWarning,
  type LucideIcon,
  Minus,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  getComplianceDashboardApi,
  executarSolicitacaoExclusaoApi,
  rejeitarSolicitacaoExclusaoApi,
} from "@/lib/api/admin-compliance";
import type {
  ComplianceAcademiaResumo,
  ComplianceDashboard,
  SolicitacaoExclusao,
  SolicitacaoExclusaoStatus,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

/* ── Helpers ──────────────────────────────────── */

function formatDate(ts: string | undefined): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return ts;
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}

const STATUS_LABELS: Record<SolicitacaoExclusaoStatus, string> = {
  PENDENTE: "Pendente",
  EM_PROCESSAMENTO: "Em processamento",
  EXECUTADA: "Executada",
  REJEITADA: "Rejeitada",
};

const STATUS_COLORS: Record<SolicitacaoExclusaoStatus, string> = {
  PENDENTE: "bg-gym-warning/15 text-gym-warning border-gym-warning/30",
  EM_PROCESSAMENTO: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  EXECUTADA: "bg-gym-teal/15 text-gym-teal border-gym-teal/30",
  REJEITADA: "bg-gym-danger/15 text-gym-danger border-gym-danger/30",
};

const SENSITIVE_FIELDS = [
  { key: "cpf" as const, label: "CPF" },
  { key: "email" as const, label: "E-mail" },
  { key: "telefone" as const, label: "Telefone" },
];

/* ── KPI Card ─────────────────────────────────── */

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "neutral",
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    neutral: "text-muted-foreground",
    success: "text-gym-teal",
    warning: "text-gym-warning",
    danger: "text-gym-danger",
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-3 font-display text-3xl font-bold leading-none text-foreground">
            {value}
          </p>
        </div>
        <div
          className={`rounded-full border border-border bg-secondary p-2 ${toneClasses[tone]}`}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

/* ── Academias Table ──────────────────────────── */

function AcademiasTable({
  academias,
}: {
  academias: ComplianceAcademiaResumo[];
}) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Academia</TableHead>
            <TableHead className="text-right">Alunos</TableHead>
            <TableHead className="text-right">CPF</TableHead>
            <TableHead className="text-right">Email</TableHead>
            <TableHead className="text-right">Telefone</TableHead>
            <TableHead className="text-right">Termos aceitos</TableHead>
            <TableHead className="text-right">Termos pendentes</TableHead>
            <TableHead>Última exclusão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {academias.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-8 text-center text-muted-foreground"
              >
                Nenhuma academia encontrada
              </TableCell>
            </TableRow>
          ) : (
            academias.map((a) => (
              <TableRow key={a.academiaId}>
                <TableCell className="font-medium">{a.academiaNome}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(a.totalAlunos)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(a.alunosComCpf)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(a.alunosComEmail)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(a.alunosComTelefone)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-gym-teal">
                    {formatNumber(a.termosAceitos)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      a.termosPendentes > 0
                        ? "text-gym-warning"
                        : "text-muted-foreground"
                    }
                  >
                    {formatNumber(a.termosPendentes)}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(a.ultimaSolicitacaoExclusao)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ── Exposure Report ──────────────────────────── */

function FieldIndicator({ collected }: { collected: boolean }) {
  return collected ? (
    <span className="inline-flex items-center gap-1 text-xs text-gym-teal">
      <Check className="size-3.5" />
      Coleta
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/50">
      <Minus className="size-3.5" />
      Não coleta
    </span>
  );
}

function ExposureReport({
  academias,
}: {
  academias: ComplianceAcademiaResumo[];
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold font-display">
        Relatório de Exposição
      </h2>
      <p className="text-xs text-muted-foreground">
        Quais campos sensíveis cada academia coleta de seus titulares.
      </p>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Academia</TableHead>
              {SENSITIVE_FIELDS.map((f) => (
                <TableHead key={f.key} className="text-center">
                  {f.label}
                </TableHead>
              ))}
              <TableHead className="text-center">Campos coletados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {academias.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={SENSITIVE_FIELDS.length + 2}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhuma academia encontrada
                </TableCell>
              </TableRow>
            ) : (
              academias.map((a) => {
                const fields = {
                  cpf: a.alunosComCpf > 0,
                  email: a.alunosComEmail > 0,
                  telefone: a.alunosComTelefone > 0,
                };
                const collectedCount = Object.values(fields).filter(Boolean).length;

                return (
                  <TableRow key={a.academiaId}>
                    <TableCell className="font-medium">
                      {a.academiaNome}
                    </TableCell>
                    {SENSITIVE_FIELDS.map((f) => (
                      <TableCell key={f.key} className="text-center">
                        <FieldIndicator collected={fields[f.key]} />
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          collectedCount === SENSITIVE_FIELDS.length
                            ? "bg-gym-warning/15 text-gym-warning border-gym-warning/30"
                            : collectedCount > 0
                              ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                              : "bg-muted text-muted-foreground"
                        }
                      >
                        {collectedCount}/{SENSITIVE_FIELDS.length}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ── Solicitações de Exclusão ─────────────────── */

type ActionState =
  | { type: "executar"; id: string; nome: string }
  | { type: "rejeitar"; id: string; nome: string }
  | null;

function SolicitacoesExclusao({
  solicitacoes: initialSolicitacoes,
  onActionCompleted,
}: {
  solicitacoes: SolicitacaoExclusao[];
  onActionCompleted: () => void;
}) {
  const [filter, setFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");

  const filtered = filter
    ? initialSolicitacoes.filter((s) => s.status === filter)
    : initialSolicitacoes;

  async function handleConfirmExecutar() {
    if (!actionState || actionState.type !== "executar") return;
    setActionLoading(true);
    setActionError(null);
    try {
      await executarSolicitacaoExclusaoApi(actionState.id);
      setActionState(null);
      onActionCompleted();
    } catch (err) {
      setActionError(normalizeErrorMessage(err));
      setActionState(null);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmRejeitar() {
    if (!actionState || actionState.type !== "rejeitar" || !rejectMotivo.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await rejeitarSolicitacaoExclusaoApi(actionState.id, rejectMotivo.trim());
      setActionState(null);
      setRejectMotivo("");
      onActionCompleted();
    } catch (err) {
      setActionError(normalizeErrorMessage(err));
      setActionState(null);
    } finally {
      setActionLoading(false);
    }
  }

  function handleCloseDialog() {
    if (actionLoading) return;
    setActionState(null);
    setRejectMotivo("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-display">
          Solicitações de Exclusão
        </h2>
        <div className="w-44">
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v === "__all__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {actionError}
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Solicitante</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Academia</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhuma solicitação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.alunoNome}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{s.academiaNome}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(s.solicitadoEm)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[s.status] ?? ""}
                    >
                      {STATUS_LABELS[s.status] ?? s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {s.motivo ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === "PENDENTE" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() =>
                            setActionState({
                              type: "executar",
                              id: s.id,
                              nome: s.alunoNome,
                            })
                          }
                          className="text-gym-teal hover:text-gym-teal"
                        >
                          <CheckCircle2 className="mr-1 size-3.5" />
                          Executar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => {
                            setRejectMotivo("");
                            setActionState({
                              type: "rejeitar",
                              id: s.id,
                              nome: s.alunoNome,
                            });
                          }}
                          className="text-gym-danger hover:text-gym-danger"
                        >
                          <XCircle className="mr-1 size-3.5" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                    {s.status !== "PENDENTE" && (
                      <span className="text-xs text-muted-foreground">
                        {s.solicitadoPor ?? "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog: Executar exclusão */}
      <AlertDialog
        open={actionState?.type === "executar"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão de dados</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja executar a exclusão dos dados pessoais de{" "}
              <strong>{actionState?.nome}</strong>? Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={handleConfirmExecutar}
            >
              {actionLoading ? "Processando..." : "Executar exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Rejeitar exclusão */}
      <AlertDialog
        open={actionState?.type === "rejeitar"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar solicitação de exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição da solicitação de{" "}
              <strong>{actionState?.nome}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              placeholder="Motivo da rejeição..."
              value={rejectMotivo}
              onChange={(e) => setRejectMotivo(e.target.value)}
              disabled={actionLoading}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading || !rejectMotivo.trim()}
              onClick={handleConfirmRejeitar}
            >
              {actionLoading ? "Processando..." : "Rejeitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Page ─────────────────────────────────────── */

export default function CompliancePage() {
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(() => {
    setLoading(true);
    setError(null);
    getComplianceDashboardApi()
      .then(setDashboard)
      .catch((err) => setError(normalizeErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display">Compliance LGPD</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral de dados pessoais, termos de consentimento e solicitações
          de exclusão.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      )}

      {loading && !dashboard && (
        <div className="rounded-lg border border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Carregando dados de compliance...
        </div>
      )}

      {dashboard && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Dados Pessoais"
              value={formatNumber(dashboard.totalDadosPessoaisArmazenados)}
              description="Total estimado de registros com dados pessoais"
              icon={Database}
            />
            <KpiCard
              title="Exclusões Pendentes"
              value={formatNumber(dashboard.solicitacoesExclusaoPendentes)}
              description="Solicitações aguardando processamento"
              icon={dashboard.solicitacoesExclusaoPendentes > 0 ? AlertTriangle : Trash2}
              tone={dashboard.solicitacoesExclusaoPendentes > 0 ? "warning" : "neutral"}
            />
            <KpiCard
              title="Termos Aceitos"
              value={formatNumber(dashboard.termosAceitos)}
              description="Consentimentos registrados"
              icon={ShieldCheck}
              tone="success"
            />
            <KpiCard
              title="Termos Pendentes"
              value={formatNumber(dashboard.termosPendentes)}
              description="Aguardando aceite do titular"
              icon={FileWarning}
              tone={dashboard.termosPendentes > 0 ? "danger" : "neutral"}
            />
          </div>

          {/* Dados por Academia */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-display">
              Dados Pessoais por Academia
            </h2>
            <p className="text-xs text-muted-foreground">
              Volume de dados pessoais armazenados e status de termos por academia.
            </p>
            <AcademiasTable academias={dashboard.academias} />
          </div>

          {/* Relatório de Exposição (seção distinta) */}
          <ExposureReport academias={dashboard.academias} />

          {/* Solicitações de Exclusão */}
          <SolicitacoesExclusao
            solicitacoes={dashboard.solicitacoesPendentes}
            onActionCompleted={loadDashboard}
          />
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileWarning,
  type LucideIcon,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  EXECUTADA: "Executada",
  REJEITADA: "Rejeitada",
};

const STATUS_COLORS: Record<SolicitacaoExclusaoStatus, string> = {
  PENDENTE: "bg-gym-warning/15 text-gym-warning border-gym-warning/30",
  EXECUTADA: "bg-gym-teal/15 text-gym-teal border-gym-teal/30",
  REJEITADA: "bg-gym-danger/15 text-gym-danger border-gym-danger/30",
};

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

/* ── Solicitações de Exclusão ─────────────────── */

function SolicitacoesExclusao({
  solicitacoes: initialSolicitacoes,
  onActionCompleted,
}: {
  solicitacoes: SolicitacaoExclusao[];
  onActionCompleted: () => void;
}) {
  const [filter, setFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = filter
    ? initialSolicitacoes.filter((s) => s.status === filter)
    : initialSolicitacoes;

  async function handleExecutar(id: string) {
    if (!confirm("Confirma a execução desta solicitação de exclusão de dados?"))
      return;
    setActionLoading(id);
    setActionError(null);
    try {
      await executarSolicitacaoExclusaoApi(id);
      onActionCompleted();
    } catch (err) {
      setActionError(normalizeErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejeitar(id: string) {
    const motivo = prompt("Motivo da rejeição:");
    if (!motivo) return;
    setActionLoading(id);
    setActionError(null);
    try {
      await rejeitarSolicitacaoExclusaoApi(id, motivo);
      onActionCompleted();
    } catch (err) {
      setActionError(normalizeErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
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
                    {s.solicitanteNome}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.solicitanteEmail}
                  </TableCell>
                  <TableCell className="text-sm">{s.academiaNome}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(s.dataSolicitacao)}
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
                          disabled={actionLoading === s.id}
                          onClick={() => handleExecutar(s.id)}
                          className="text-gym-teal hover:text-gym-teal"
                        >
                          <CheckCircle2 className="mr-1 size-3.5" />
                          Executar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === s.id}
                          onClick={() => handleRejeitar(s.id)}
                          className="text-gym-danger hover:text-gym-danger"
                        >
                          <XCircle className="mr-1 size-3.5" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                    {s.status !== "PENDENTE" && (
                      <span className="text-xs text-muted-foreground">
                        {s.responsavelNome ?? "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────── */

export default function CompliancePage() {
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadDashboard() {
    setLoading(true);
    setError(null);
    getComplianceDashboardApi()
      .then(setDashboard)
      .catch((err) => setError(normalizeErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDashboard();
  }, []);

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
              value={formatNumber(dashboard.totalDadosPessoais)}
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

          {/* Exposição por Academia */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-display">
              Exposição de Dados por Academia
            </h2>
            <p className="text-xs text-muted-foreground">
              Campos sensíveis coletados e status de termos por academia.
            </p>
            <AcademiasTable academias={dashboard.academias} />
          </div>

          {/* Solicitações de Exclusão */}
          <SolicitacoesExclusao
            solicitacoes={dashboard.solicitacoes}
            onActionCompleted={loadDashboard}
          />
        </>
      )}
    </div>
  );
}

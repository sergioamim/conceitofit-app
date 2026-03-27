"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Database,
  FileWarning,
  FileX2,
  ShieldCheck,
  Trash2,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  formatComplianceDateTime,
  resolveComplianceFieldLabel,
} from "@/lib/admin-compliance";
import {
  executarSolicitacaoExclusao,
  getComplianceDashboard,
  rejeitarSolicitacaoExclusao,
} from "@/lib/api/admin-compliance";
import type {
  ComplianceAcademiaResumo,
  ComplianceDashboard,
  SolicitacaoExclusao,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type ComplianceActionMode = "executar" | "rejeitar";

const numberFormatter = new Intl.NumberFormat("pt-BR");

function formatCount(value: number): string {
  return numberFormatter.format(value);
}

function termsBadgeClassName(status: ComplianceAcademiaResumo["statusTermos"]): string {
  if (status === "ACEITO") return "border-gym-teal/30 bg-gym-teal/10 text-gym-teal";
  if (status === "PARCIAL") return "border-gym-warning/30 bg-gym-warning/10 text-gym-warning";
  return "border-gym-danger/30 bg-gym-danger/10 text-gym-danger";
}

function actionCopy(mode: ComplianceActionMode) {
  if (mode === "executar") {
    return {
      title: "Executar solicitação de exclusão",
      description: "A solicitação sairá da fila pendente e o dashboard será atualizado após a execução.",
      confirm: "Executar exclusão",
    };
  }

  return {
    title: "Rejeitar solicitação de exclusão",
    description: "A solicitação será removida da fila pendente e ficará fora do backlog de compliance.",
    confirm: "Rejeitar solicitação",
  };
}

export default function AdminCompliancePage() {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<{
    mode: ComplianceActionMode;
    request: SolicitacaoExclusao;
  } | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const nextDashboard = await getComplianceDashboard();
      setDashboard(nextDashboard);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const academias = dashboard?.academias ?? [];
  const solicitacoesPendentes = dashboard?.solicitacoesPendentes ?? [];
  const exposicaoCampos = dashboard?.exposicaoCamposSensiveis ?? [];

  const termosCobertura = useMemo(() => {
    const total = (dashboard?.termosAceitos ?? 0) + (dashboard?.termosPendentes ?? 0);
    if (total <= 0) return 0;
    return Math.round(((dashboard?.termosAceitos ?? 0) / total) * 100);
  }, [dashboard?.termosAceitos, dashboard?.termosPendentes]);

  const academiasComPendencia = useMemo(
    () => (dashboard?.academias ?? []).filter((item) => item.statusTermos !== "ACEITO").length,
    [dashboard?.academias]
  );

  async function handleConfirmAction() {
    if (!actionState) return;

    setActionLoadingId(actionState.request.id);
    try {
      if (actionState.mode === "executar") {
        await executarSolicitacaoExclusao(actionState.request.id);
      } else {
        await rejeitarSolicitacaoExclusao(actionState.request.id);
      }

      toast({
        title: actionState.mode === "executar" ? "Solicitação executada" : "Solicitação rejeitada",
        description: `${actionState.request.alunoNome} (${actionState.request.academiaNome})`,
      });
      setActionState(null);
      await loadDashboard();
    } catch (actionError) {
      toast({
        title: "Não foi possível processar a solicitação",
        description: normalizeErrorMessage(actionError),
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  const currentDialogCopy = actionState ? actionCopy(actionState.mode) : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Compliance</p>
        <h1 className="text-3xl font-display font-bold leading-tight">LGPD e dados pessoais</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Consolida exposição de dados sensíveis por academia, adesão aos termos e fila operacional de exclusões.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Dados pessoais</CardTitle>
            <Database className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{loading ? "…" : formatCount(dashboard?.totalDadosPessoaisArmazenados ?? 0)}</p>
            <p className="text-sm text-muted-foreground">Estimativa combinada de CPF, e-mail e telefone armazenados.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Exclusões pendentes</CardTitle>
            <FileX2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{loading ? "…" : formatCount(dashboard?.solicitacoesExclusaoPendentes ?? 0)}</p>
            <p className="text-sm text-muted-foreground">Backlog global de pedidos aguardando decisão operacional.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Termos aceitos</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{loading ? "…" : formatCount(dashboard?.termosAceitos ?? 0)}</p>
            <p className="text-sm text-muted-foreground">
              {loading ? "…" : `${termosCobertura}% de cobertura no recorte agregado da rede.`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Academias com pendência</CardTitle>
            <FileWarning className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{loading ? "…" : formatCount(academiasComPendencia)}</p>
            <p className="text-sm text-muted-foreground">Redes com aceite parcial ou pendente de termos.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visão por academia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando consolidado de compliance...</p>
            ) : academias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma academia retornada pelo endpoint de compliance.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Academia</TableHead>
                    <TableHead className="text-right">Alunos</TableHead>
                    <TableHead className="text-right">CPF</TableHead>
                    <TableHead className="text-right">E-mail</TableHead>
                    <TableHead className="text-right">Telefone</TableHead>
                    <TableHead>Última exclusão</TableHead>
                    <TableHead>Termos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academias.map((academia) => (
                    <TableRow key={academia.academiaId ?? academia.academiaNome}>
                      <TableCell className="font-medium">{academia.academiaNome}</TableCell>
                      <TableCell className="text-right">{formatCount(academia.totalAlunos)}</TableCell>
                      <TableCell className="text-right">{formatCount(academia.alunosComCpf)}</TableCell>
                      <TableCell className="text-right">{formatCount(academia.alunosComEmail)}</TableCell>
                      <TableCell className="text-right">{formatCount(academia.alunosComTelefone)}</TableCell>
                      <TableCell>{formatComplianceDateTime(academia.ultimaSolicitacaoExclusao)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${termsBadgeClassName(academia.statusTermos)}`}>
                            {academia.statusTermos === "ACEITO"
                              ? "Aceito"
                              : academia.statusTermos === "PARCIAL"
                                ? "Parcial"
                                : "Pendente"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatCount(academia.termosAceitos)} aceitos / {formatCount(academia.termosPendentes)} pendentes
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relatório de exposição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Mapeando campos sensíveis coletados...</p>
            ) : exposicaoCampos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem campos sensíveis catalogados no momento.</p>
            ) : (
              exposicaoCampos.map((campo) => (
                <div key={campo.key} className="rounded-xl border border-border/70 bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{resolveComplianceFieldLabel(campo.label)}</p>
                      <p className="text-sm text-muted-foreground">
                        Coletado por {formatCount(campo.totalAcademias)} academia(s).
                      </p>
                    </div>
                    <span className="rounded-full border border-border/70 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {formatCount(campo.totalAcademias)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {campo.academias.map((academiaNome) => (
                      <span
                        key={`${campo.key}-${academiaNome}`}
                        className="rounded-full border border-border/70 bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                      >
                        {academiaNome}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitações pendentes de exclusão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando fila de exclusões...</p>
          ) : solicitacoesPendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Não há solicitações pendentes para ação imediata.</p>
          ) : (
            solicitacoesPendentes.map((solicitacao) => (
              <div
                key={solicitacao.id}
                className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/60 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{solicitacao.alunoNome}</p>
                    <span className="rounded-full border border-gym-warning/30 bg-gym-warning/10 px-2.5 py-0.5 text-[11px] font-semibold text-gym-warning">
                      {solicitacao.status === "EM_PROCESSAMENTO" ? "Em processamento" : "Pendente"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{solicitacao.academiaNome}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Solicitado em {formatComplianceDateTime(solicitacao.solicitadoEm)}</span>
                    {solicitacao.solicitadoPor ? <span>Responsável: {solicitacao.solicitadoPor}</span> : null}
                    {solicitacao.email ? <span>E-mail: {solicitacao.email}</span> : null}
                    {solicitacao.cpf ? <span>CPF: {solicitacao.cpf}</span> : null}
                  </div>
                  {solicitacao.motivo ? (
                    <p className="text-sm text-muted-foreground">{solicitacao.motivo}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => setActionState({ mode: "executar", request: solicitacao })}
                    disabled={actionLoadingId === solicitacao.id}
                  >
                    <Trash2 className="size-4" />
                    Executar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActionState({ mode: "rejeitar", request: solicitacao })}
                    disabled={actionLoadingId === solicitacao.id}
                  >
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(actionState)} onOpenChange={(open) => (!open ? setActionState(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentDialogCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {currentDialogCopy?.description}
              {actionState ? ` Aluno: ${actionState.request.alunoNome}.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(actionLoadingId)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={Boolean(actionLoadingId)}
            >
              {actionLoadingId ? "Processando..." : currentDialogCopy?.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

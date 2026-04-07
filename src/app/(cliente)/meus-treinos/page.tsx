"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Dumbbell, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { useMeusTreinos, useRegistrarExecucaoTreino } from "@/lib/query/use-portal-aluno";
import type { Treino, TreinoItem, TreinoExecucao } from "@/lib/types";
import { formatDate } from "@/lib/formatters";

const STATUS_CICLO_LABEL: Record<string, { label: string; class: string }> = {
  PLANEJADO: { label: "Planejado", class: "bg-secondary text-muted-foreground" },
  EM_DIA: { label: "Em dia", class: "bg-gym-teal/15 text-gym-teal" },
  ATENCAO: { label: "Atenção", class: "bg-gym-warning/15 text-gym-warning" },
  ATRASADO: { label: "Atrasado", class: "bg-gym-danger/15 text-gym-danger" },
  ENCERRADO: { label: "Encerrado", class: "bg-secondary text-muted-foreground" },
};

const VALIDADE_LABEL: Record<string, { label: string; class: string }> = {
  ATIVO: { label: "Ativo", class: "bg-gym-teal/15 text-gym-teal" },
  VENCENDO: { label: "Vencendo", class: "bg-gym-warning/15 text-gym-warning" },
  VENCIDO: { label: "Vencido", class: "bg-gym-danger/15 text-gym-danger" },
};

function AderenciaBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const color = clamped >= 75 ? "bg-gym-teal" : clamped >= 50 ? "bg-gym-warning" : "bg-gym-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-secondary">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{clamped.toFixed(0)}%</span>
    </div>
  );
}

function ExercicioRow({ item }: { item: TreinoItem }) {
  const reps = item.repeticoesMin && item.repeticoesMax
    ? `${item.repeticoesMin}-${item.repeticoesMax}`
    : item.repeticoes
      ? String(item.repeticoes)
      : "—";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.exercicioNome ?? "Exercicio"}</p>
        {item.grupoMuscularNome ? (
          <p className="text-[11px] text-muted-foreground">{item.grupoMuscularNome}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
        <span>{item.series}x{reps}</span>
        {item.cargaSugerida || item.carga ? (
          <span className="font-semibold text-foreground">{item.cargaSugerida ?? item.carga}kg</span>
        ) : null}
        {item.intervaloSegundos ? (
          <span className="flex items-center gap-0.5"><Clock className="size-3" />{item.intervaloSegundos}s</span>
        ) : null}
      </div>
    </div>
  );
}

function ExecucaoItem({ exec }: { exec: TreinoExecucao }) {
  const statusLabel = exec.status === "CONCLUIDA" ? "Concluido" : exec.status === "PARCIAL" ? "Parcial" : "Pulado";
  const statusClass = exec.status === "CONCLUIDA"
    ? "bg-gym-teal/15 text-gym-teal"
    : exec.status === "PARCIAL"
      ? "bg-gym-warning/15 text-gym-warning"
      : "bg-secondary text-muted-foreground";

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{formatDate(exec.data)}</span>
      <span className={`rounded-full px-2 py-0.5 font-semibold ${statusClass}`}>{statusLabel}</span>
    </div>
  );
}

function TreinoCard({
  treino,
  onConcluir,
  concluindo,
}: {
  treino: Treino;
  onConcluir: (id: string) => void;
  concluindo: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const ciclo = STATUS_CICLO_LABEL[treino.statusCiclo ?? ""] ?? STATUS_CICLO_LABEL.PLANEJADO;
  const validade = VALIDADE_LABEL[treino.statusValidade ?? ""] ?? VALIDADE_LABEL.ATIVO;
  const itens = treino.itens ?? [];
  const execucoes = treino.execucoes ?? [];
  const isAtivo = treino.status === "ATIVO" && treino.statusValidade !== "VENCIDO";

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gym-accent/15">
          <Dumbbell className="size-5 text-gym-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display text-base font-bold">{treino.nome ?? "Treino"}</p>
            {treino.divisao ? (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                {treino.divisao}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {treino.funcionarioNome ? `Prof. ${treino.funcionarioNome}` : ""}
            {treino.funcionarioNome && treino.dataInicio ? " · " : ""}
            {treino.dataInicio ? `${formatDate(treino.dataInicio)} - ${treino.dataFim ? formatDate(treino.dataFim) : "—"}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${validade.class}`}>
            {validade.label}
          </span>
          {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-secondary/20 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Aderencia</p>
              <div className="mt-1.5">
                <AderenciaBar percent={treino.aderenciaPercentual ?? 0} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {treino.execucoesConcluidas ?? 0}/{treino.execucoesPrevistas ?? 0} sessoes
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/20 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ciclo</p>
              <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${ciclo.class}`}>
                {ciclo.label}
              </span>
              {treino.objetivo ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Target className="size-3" />{treino.objetivo}
                </p>
              ) : null}
            </div>
          </div>

          {itens.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Exercicios ({itens.length})
              </p>
              <div className="space-y-1.5">
                {itens.sort((a, b) => a.ordem - b.ordem).map((item) => (
                  <ExercicioRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          ) : null}

          {execucoes.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={() => setShowHistorico((v) => !v)}
                aria-expanded={showHistorico}
                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Historico ({execucoes.length})
                {showHistorico ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
              {showHistorico ? (
                <div className="mt-2 space-y-1.5 rounded-lg border border-border bg-secondary/20 p-3">
                  {execucoes
                    .sort((a, b) => b.data.localeCompare(a.data))
                    .slice(0, 10)
                    .map((exec) => <ExecucaoItem key={exec.id} exec={exec} />)}
                </div>
              ) : null}
            </div>
          ) : null}

          {isAtivo ? (
            <Button
              onClick={() => onConcluir(treino.id)}
              disabled={concluindo}
              className="w-full"
            >
              <CheckCircle2 className="mr-2 size-4" />
              {concluindo ? "Registrando..." : "Concluir treino"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card/60" />
      ))}
    </div>
  );
}

export default function MeusTreinosPage() {
  const { tenantId, tenantResolved, userId } = useTenantContext();
  const [error, setError] = useState<string | null>(null);
  const [concluindoId, setConcluindoId] = useState<string | null>(null);

  const { data: treinos = [], isLoading: loading } = useMeusTreinos({
    tenantId,
    tenantResolved,
    userId,
  });

  const concluirMutation = useRegistrarExecucaoTreino();

  async function handleConcluir(treinoId: string) {
    if (!tenantId || concluindoId) return;
    setConcluindoId(treinoId);
    try {
      await concluirMutation.mutateAsync({
        tenantId,
        id: treinoId,
        status: "CONCLUIDA",
      });
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setConcluindoId(null);
    }
  }

  const ativos = useMemo(() => treinos.filter((t) => t.status === "ATIVO"), [treinos]);
  const encerrados = useMemo(() => treinos.filter((t) => t.status !== "ATIVO"), [treinos]);

  return (
    <div className="space-y-6 px-4 py-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Portal do Aluno</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">Meus Treinos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seus treinos atribuidos, exercicios e progresso.
        </p>
      </div>

      {error ? (
        <div role="alert" aria-live="assertive" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-2 text-xs">
            Fechar
          </Button>
        </div>
      ) : null}

      {loading ? (
        <LoadingSkeleton />
      ) : treinos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-4 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
            <Dumbbell className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-display text-lg font-bold">Nenhum treino atribuido</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando seu professor montar seu treino, ele aparecera aqui.
            </p>
          </div>
        </div>
      ) : (
        <>
          {ativos.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Treinos ativos ({ativos.length})
              </p>
              {ativos.map((treino) => (
                <TreinoCard
                  key={treino.id}
                  treino={treino}
                  onConcluir={handleConcluir}
                  concluindo={concluindoId === treino.id}
                />
              ))}
            </div>
          ) : null}

          {encerrados.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Encerrados ({encerrados.length})
              </p>
              {encerrados.map((treino) => (
                <TreinoCard
                  key={treino.id}
                  treino={treino}
                  onConcluir={handleConcluir}
                  concluindo={concluindoId === treino.id}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

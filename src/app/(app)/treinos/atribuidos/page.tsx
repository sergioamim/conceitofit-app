"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Loader2, Search, SquareArrowOutUpRight, UserPlus } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_ACTIVE_TENANT_LABEL, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  buildTreinoV2EditorSeed,
  buildTreinoV2SaveInput,
  summarizeTreinoV2AssignedGovernance,
} from "@/lib/tenant/treinos/v2-runtime";
import {
  encerrarTreinoWorkspace,
  listTreinosWorkspace,
  saveTreinoWorkspace,
} from "@/lib/tenant/treinos/workspace";
import type { Treino } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";

const PAGE_SIZE = 12;

type VigenciaFilter = "TODOS" | "VIGENTE" | "VENCENDO" | "VENCIDO";

function formatDate(value?: string): string {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function resolveAssignedStatusBadgeVariant(status: string) {
  if (status === "ENCERRADO" || status === "SUBSTITUIDO") return "destructive" as const;
  if (status === "AGENDADO") return "outline" as const;
  return "secondary" as const;
}

function resolveVigenciaLabel(treino: Treino): VigenciaFilter {
  if (treino.statusValidade === "VENCIDO") return "VENCIDO";
  if (treino.statusValidade === "VENCENDO") return "VENCENDO";
  if (treino.statusValidade === "ATIVO") return "VIGENTE";
  return "TODOS";
}

export default function TreinosAtribuidosPage() {
  const { tenantId, tenantName, tenantResolved } = useTenantContext();
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [origemFilter, setOrigemFilter] = useState<string>("TODOS");
  const [professorFilter, setProfessorFilter] = useState<string>("TODOS");
  const [vigenciaFilter, setVigenciaFilter] = useState<VigenciaFilter>("TODOS");
  const [page, setPage] = useState(0);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listTreinosWorkspace({
        tenantId,
        tipoTreino: "CUSTOMIZADO",
        page: 0,
        size: 200,
      });
      setWorkouts(response.items);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;
    void loadData();
  }, [loadData, tenantId, tenantResolved]);

  const professorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          workouts
            .map((item) => item.funcionarioNome)
            .filter((value): value is string => Boolean(value?.trim())),
        ),
      ).sort((left, right) => left.localeCompare(right, "pt-BR")),
    [workouts],
  );

  const governanceItems = useMemo(
    () =>
      workouts.map((workout) => ({
        workout,
        governance: summarizeTreinoV2AssignedGovernance(workout),
      })),
    [workouts],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return governanceItems.filter(({ workout, governance }) => {
      const matchesSearch =
        !query ||
        [
          workout.nome,
          workout.alunoNome,
          workout.funcionarioNome,
          governance.templateOrigemNome,
          governance.templateOrigemId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "TODOS" || governance.status === statusFilter;
      const matchesOrigem = origemFilter === "TODOS" || governance.origem === origemFilter;
      const matchesProfessor = professorFilter === "TODOS" || workout.funcionarioNome === professorFilter;
      const matchesVigencia = vigenciaFilter === "TODOS" || resolveVigenciaLabel(workout) === vigenciaFilter;
      return matchesSearch && matchesStatus && matchesOrigem && matchesProfessor && matchesVigencia;
    });
  }, [governanceItems, origemFilter, professorFilter, search, statusFilter, vigenciaFilter]);

  useEffect(() => {
    setPage(0);
  }, [origemFilter, professorFilter, search, statusFilter, vigenciaFilter]);

  const pageItems = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  const statusCounts = useMemo(
    () =>
      governanceItems.reduce(
        (acc, item) => {
          acc.total += 1;
          if (item.governance.status === "ATIVO") acc.ativos += 1;
          if (item.governance.status === "AGENDADO") acc.agendados += 1;
          if (item.governance.status === "ENCERRADO" || item.governance.status === "SUBSTITUIDO") {
            acc.encerrados += 1;
          }
          if (item.governance.customizadoLocalmente) acc.customizados += 1;
          return acc;
        },
        { total: 0, ativos: 0, agendados: 0, encerrados: 0, customizados: 0 },
      ),
    [governanceItems],
  );

  async function handleEncerrar(workout: Treino) {
    if (!tenantId || actingId) return;
    setActingId(workout.id);
    try {
      await encerrarTreinoWorkspace({
        tenantId,
        id: workout.id,
        observacao: "Encerrado pela listagem operacional de treinos atribuídos.",
      });
      await loadData();
      toast({
        title: "Treino encerrado",
        description: workout.nome ?? workout.templateNome ?? workout.id,
      });
    } catch (actionError) {
      toast({
        title: "Não foi possível encerrar o treino",
        description: normalizeErrorMessage(actionError),
        variant: "destructive",
      });
    } finally {
      setActingId(null);
    }
  }

  async function handleDuplicar(workout: Treino) {
    if (!tenantId || actingId) return;
    setActingId(workout.id);
    try {
      const editor = buildTreinoV2EditorSeed(workout);
      editor.nome = `${editor.nome} cópia`;
      editor.assignedStatus = "RASCUNHO";
      editor.customizadoLocalmente = true;
      const payload = buildTreinoV2SaveInput({ treino: workout, editor });
      const duplicated = await saveTreinoWorkspace({
        tenantId,
        alunoId: workout.alunoId,
        alunoNome: workout.alunoNome,
        funcionarioId: workout.funcionarioId,
        funcionarioNome: workout.funcionarioNome,
        tipoTreino: "CUSTOMIZADO",
        treinoBaseId: workout.treinoBaseId,
        nome: payload.nome,
        templateNome: payload.templateNome,
        objetivo: payload.objetivo,
        metaSessoesSemana: payload.metaSessoesSemana,
        frequenciaPlanejada: payload.frequenciaPlanejada,
        quantidadePrevista: payload.quantidadePrevista,
        dataInicio: payload.dataInicio,
        dataFim: payload.dataFim,
        observacoes: payload.observacoes,
        ativo: true,
        status: "RASCUNHO",
        itens: payload.itens.map((item) => ({
          id: "",
          treinoId: "",
          exercicioId: item.exercicioId,
          ordem: item.ordem,
          series: item.series,
          repeticoes: item.repeticoes,
          repeticoesMin: item.repeticoesMin,
          repeticoesMax: item.repeticoesMax,
          carga: item.carga,
          cargaSugerida: item.cargaSugerida,
          intervaloSegundos: item.intervaloSegundos,
          observacao: item.observacao,
        })),
      });
      await loadData();
      toast({
        title: "Treino duplicado",
        description: duplicated.nome ?? duplicated.id,
      });
    } catch (actionError) {
      toast({
        title: "Não foi possível duplicar o treino",
        description: normalizeErrorMessage(actionError),
        variant: "destructive",
      });
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Treinos", href: "/treinos" },
          { label: "Treinos atribuídos" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Treinos atribuídos</h1>
          <p className="text-sm text-muted-foreground">
            Operação pós-atribuição por cliente, origem, vigência e versão na unidade {tenantResolved ? tenantName : DEFAULT_ACTIVE_TENANT_LABEL}.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/treinos">Voltar para templates</Link>
        </Button>
      </div>

      {error ? (
        <ListErrorState error={error} onRetry={() => void loadData()} />
      ) : null}

      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-5">
        <MetricCard label="Total" value={String(statusCounts.total)} detail="Treinos atribuídos na unidade" />
        <MetricCard label="Ativos" value={String(statusCounts.ativos)} detail="Em execução corrente" />
        <MetricCard label="Agendados" value={String(statusCounts.agendados)} detail="Vigência futura" />
        <MetricCard label="Encerrados" value={String(statusCounts.encerrados)} detail="Histórico consolidado" />
        <MetricCard label="Customizados" value={String(statusCounts.customizados)} detail="Instâncias alteradas localmente" />
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Filtros operacionais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Buscar por cliente, professor ou template de origem"
              aria-label="Buscar treino atribuído"
            />
          </div>

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "TODOS", label: "Todos" },
              { value: "RASCUNHO", label: "Rascunho" },
              { value: "AGENDADO", label: "Agendado" },
              { value: "ATIVO", label: "Ativo" },
              { value: "ENCERRADO", label: "Encerrado" },
              { value: "SUBSTITUIDO", label: "Substituído" },
            ]}
          />

          <FilterSelect
            label="Origem"
            value={origemFilter}
            onChange={setOrigemFilter}
            options={[
              { value: "TODOS", label: "Todas" },
              { value: "TEMPLATE", label: "Template" },
              { value: "MASSA", label: "Lote" },
              { value: "MANUAL", label: "Manual" },
              { value: "RENOVACAO", label: "Renovação" },
            ]}
          />

          <FilterSelect
            label="Professor"
            value={professorFilter}
            onChange={setProfessorFilter}
            options={[{ value: "TODOS", label: "Todos" }, ...professorOptions.map((item) => ({ value: item, label: item }))]}
          />

          <FilterSelect
            label="Vigência"
            value={vigenciaFilter}
            onChange={(value) => setVigenciaFilter(value as VigenciaFilter)}
            options={[
              { value: "TODOS", label: "Todas" },
              { value: "VIGENTE", label: "Vigente" },
              { value: "VENCENDO", label: "Vencendo" },
              { value: "VENCIDO", label: "Vencido" },
            ]}
          />

          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unidade</span>
            <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
              {tenantResolved ? tenantName : DEFAULT_ACTIVE_TENANT_LABEL}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Operação de treinos atribuídos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Carregando treinos atribuídos...
            </div>
          ) : (
            <PaginatedTable
              columns={[
                { label: "Cliente" },
                { label: "Status e vigência" },
                { label: "Origem e versão" },
                { label: "Responsável" },
                { label: "Ações" },
              ]}
              items={pageItems}
              emptyText="Nenhum treino atribuído encontrado com os filtros atuais"
              total={filtered.length}
              page={page}
              pageSize={PAGE_SIZE}
              hasNext={(page + 1) * PAGE_SIZE < filtered.length}
              onNext={() => setPage((current) => current + 1)}
              onPrevious={() => setPage((current) => Math.max(0, current - 1))}
              itemLabel="treinos atribuídos"
              getRowKey={(item) => item.workout.id}
              renderCells={({ workout, governance }) => (
                <>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <Link href={`/treinos/${workout.id}`} className="text-sm font-semibold text-foreground hover:text-gym-accent">
                        {workout.alunoNome ?? "Aluno não informado"}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {workout.nome ?? workout.templateNome ?? workout.id}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={resolveAssignedStatusBadgeVariant(governance.status)}>{governance.status}</Badge>
                        {governance.customizadoLocalmente ? <Badge variant="outline">Customizado</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(workout.dataInicio)} até {formatDate(workout.dataFim)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {governance.templateOrigemNome ?? "Sem origem de template"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {governance.origem}
                        {governance.templateVersion ? ` · v${governance.templateVersion}` : ""}
                        {governance.snapshotId ? ` · ${governance.snapshotId}` : ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {workout.funcionarioNome ?? "Professor não informado"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vínculo {workout.treinoBaseId ? "por template" : "manual"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/treinos/${workout.id}`}>
                          <SquareArrowOutUpRight className="size-4" />
                          Abrir
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleEncerrar(workout)}
                        disabled={actingId === workout.id || governance.status === "ENCERRADO" || governance.status === "SUBSTITUIDO"}
                      >
                        Encerrar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void handleDuplicar(workout)} disabled={actingId === workout.id}>
                        <Copy className="size-4" />
                        Duplicar
                      </Button>
                      {governance.templateOrigemId ? (
                        <Button asChild size="sm">
                          <Link href={`/treinos/${governance.templateOrigemId}?assign=1`}>
                            <UserPlus className="size-4" />
                            Reatribuir
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

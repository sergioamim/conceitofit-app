"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Edit3,
  Loader2,
  MoreVertical,
  Search,
  SquareArrowOutUpRight,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { grupoColorByName } from "@/lib/treinos/grupo-colors";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_ACTIVE_TENANT_LABEL, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  buildTreinoV2EditorSeed,
  buildTreinoV2SaveInput,
  summarizeTreinoV2AssignedGovernance,
} from "@/lib/tenant/treinos/v2-runtime";
import { saveTreinoWorkspace } from "@/lib/tenant/treinos/workspace";
import { useTreinosAtribuidos, useEncerrarTreino } from "@/lib/query/use-treinos";
import type { Treino } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";
import { formatDate } from "@/lib/formatters";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";

const PAGE_SIZE = 12;

type VigenciaFilter = WithFilterAll<"VIGENTE" | "VENCENDO" | "VENCIDO">;

export type TreinosAtribuidosContentProps = {
  initialData: Treino[];
};

function resolveAssignedStatusBadgeVariant(status: string) {
  if (status === "ENCERRADO" || status === "SUBSTITUIDO") return "destructive" as const;
  if (status === "AGENDADO") return "outline" as const;
  return "secondary" as const;
}

function resolveVigenciaLabel(treino: Treino): VigenciaFilter {
  if (treino.statusValidade === "VENCIDO") return "VENCIDO";
  if (treino.statusValidade === "VENCENDO") return "VENCENDO";
  if (treino.statusValidade === "ATIVO") return "VIGENTE";
  return FILTER_ALL;
}

export function TreinosAtribuidosContent({ initialData }: TreinosAtribuidosContentProps) {
  const { tenantId, tenantName, tenantResolved } = useTenantContext();
  const { toast } = useToast();
  const [actingId, setActingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(FILTER_ALL);
  const [origemFilter, setOrigemFilter] = useState<string>(FILTER_ALL);
  const [professorFilter, setProfessorFilter] = useState<string>(FILTER_ALL);
  const [vigenciaFilter, setVigenciaFilter] = useState<VigenciaFilter>(FILTER_ALL);
  const [page, setPage] = useState(0);

  const { data: workoutsFromQuery, isLoading: loading, isError, error: queryError } = useTreinosAtribuidos({
    tenantId,
    tenantResolved,
  });

  const workouts = workoutsFromQuery ?? initialData;

  const error = isError ? normalizeErrorMessage(queryError) : null;
  const encerrarMutation = useEncerrarTreino();
  const queryClient = useQueryClient();

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
      const matchesStatus = statusFilter === FILTER_ALL || governance.status === statusFilter;
      const matchesOrigem = origemFilter === FILTER_ALL || governance.origem === origemFilter;
      const matchesProfessor = professorFilter === FILTER_ALL || workout.funcionarioNome === professorFilter;
      const matchesVigencia = vigenciaFilter === FILTER_ALL || resolveVigenciaLabel(workout) === vigenciaFilter;
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
      await encerrarMutation.mutateAsync({
        tenantId,
        id: workout.id,
        observacao: "Encerrado pela listagem operacional de treinos atribuidos.",
      });
      toast({
        title: "Treino encerrado",
        description: workout.nome ?? workout.templateNome ?? workout.id,
      });
    } catch (actionError) {
      toast({
        title: "Nao foi possivel encerrar o treino",
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
      editor.nome = `${editor.nome} copia`;
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
      await queryClient.invalidateQueries({ queryKey: ["treinos"] });
      toast({
        title: "Treino duplicado",
        description: duplicated.nome ?? duplicated.id,
      });
    } catch (actionError) {
      toast({
        title: "Nao foi possivel duplicar o treino",
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
          { label: "Treinos atribuidos" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Treinos atribuídos
          </h1>
          <p className="text-sm text-muted-foreground">
            {statusCounts.total} alunos com treino ativo na unidade{" "}
            {tenantResolved ? tenantName : DEFAULT_ACTIVE_TENANT_LABEL}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="border-border">
            <Link href="/treinos">Voltar a templates</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/treinos">
              <UserPlus className="mr-1 size-4" />
              Atribuir treino
            </Link>
          </Button>
        </div>
      </div>

      {error ? (
        <ListErrorState error={error} />
      ) : null}

      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-5">
        <MetricCard label="Total" value={String(statusCounts.total)} detail="Treinos atribuidos na unidade" />
        <MetricCard label="Ativos" value={String(statusCounts.ativos)} detail="Em execucao corrente" />
        <MetricCard label="Agendados" value={String(statusCounts.agendados)} detail="Vigencia futura" />
        <MetricCard label="Encerrados" value={String(statusCounts.encerrados)} detail="Historico consolidado" />
        <MetricCard label="Customizados" value={String(statusCounts.customizados)} detail="Instancias alteradas localmente" />
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
              aria-label="Buscar treino atribuido"
            />
          </div>

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: FILTER_ALL, label: "Todos" },
              { value: "RASCUNHO", label: "Rascunho" },
              { value: "AGENDADO", label: "Agendado" },
              { value: "ATIVO", label: "Ativo" },
              { value: "ENCERRADO", label: "Encerrado" },
              { value: "SUBSTITUIDO", label: "Substituido" },
            ]}
          />

          <FilterSelect
            label="Origem"
            value={origemFilter}
            onChange={setOrigemFilter}
            options={[
              { value: FILTER_ALL, label: "Todas" },
              { value: "TEMPLATE", label: "Template" },
              { value: "MASSA", label: "Lote" },
              { value: "MANUAL", label: "Manual" },
              { value: "RENOVACAO", label: "Renovacao" },
            ]}
          />

          <FilterSelect
            label="Professor"
            value={professorFilter}
            onChange={setProfessorFilter}
            options={[{ value: FILTER_ALL, label: "Todos" }, ...professorOptions.map((item) => ({ value: item, label: item }))]}
          />

          <FilterSelect
            label="Vigencia"
            value={vigenciaFilter}
            onChange={(value) => setVigenciaFilter(value as VigenciaFilter)}
            options={[
              { value: FILTER_ALL, label: "Todas" },
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
          <CardTitle className="font-display text-lg">Operacao de treinos atribuidos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Carregando treinos atribuidos...
            </div>
          ) : (
            <PaginatedTable
              columns={[
                { label: "Cliente" },
                { label: "Status e vigencia" },
                { label: "Origem e versao" },
                { label: "Responsavel" },
                { label: "Acoes" },
              ]}
              items={pageItems}
              emptyText="Nenhum treino atribuido encontrado com os filtros atuais"
              total={filtered.length}
              page={page}
              pageSize={PAGE_SIZE}
              hasNext={(page + 1) * PAGE_SIZE < filtered.length}
              onNext={() => setPage((current) => current + 1)}
              onPrevious={() => setPage((current) => Math.max(0, current - 1))}
              itemLabel="treinos atribuidos"
              getRowKey={(item) => item.workout.id}
              renderCells={({ workout, governance }) => (
                <>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <AlunoAvatar nome={workout.alunoNome} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/treinos/${workout.id}`}
                          className="block truncate text-sm font-semibold text-foreground hover:text-gym-accent"
                        >
                          {workout.alunoNome ?? "Aluno não informado"}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {workout.nome ?? workout.templateNome ?? workout.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={resolveAssignedStatusBadgeVariant(governance.status)}>
                          {governance.status}
                        </Badge>
                        {governance.customizadoLocalmente ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 bg-amber-500/10 text-amber-300"
                            title="Treino editado localmente — diverge do template original"
                          >
                            <Edit3 className="mr-1 size-3" />
                            customizado
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/70">
                            usando template original
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {workout.dataInicio ? formatDate(workout.dataInicio) : "-"} até{" "}
                        {workout.dataFim ? formatDate(workout.dataFim) : "-"}
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
                        {workout.funcionarioNome ?? "Professor nao informado"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vinculo {workout.treinoBaseId ? "por template" : "manual"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {governance.templateOrigemId && workout.alunoId ? (
                        <Button
                          asChild
                          size="sm"
                          className="h-8"
                          title="Customizar template para este aluno (modo instance)"
                        >
                          <Link
                            href={`/treinos/${governance.templateOrigemId}?customize=1&alunoId=${workout.alunoId}&alunoNome=${encodeURIComponent(workout.alunoNome ?? "")}`}
                          >
                            <Edit3 className="mr-1 size-3.5" />
                            Customizar
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline" className="h-8 border-border">
                          <Link href={`/treinos/${workout.id}`}>
                            <SquareArrowOutUpRight className="mr-1 size-3.5" />
                            Abrir
                          </Link>
                        </Button>
                      )}
                      {workout.alunoId ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 border-border"
                        >
                          <Link href={`/treinos/progresso/${workout.alunoId}`}>
                            <TrendingUp className="mr-1 size-3.5" />
                            Progresso
                          </Link>
                        </Button>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                            aria-label="Mais ações"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/treinos/${workout.id}`}>
                              <SquareArrowOutUpRight className="mr-2 size-3.5" />
                              Abrir treino
                            </Link>
                          </DropdownMenuItem>
                          {governance.templateOrigemId ? (
                            <DropdownMenuItem asChild>
                              <Link href={`/treinos/${governance.templateOrigemId}?assign=1`}>
                                <UserPlus className="mr-2 size-3.5" />
                                Reatribuir template
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            onClick={() => void handleDuplicar(workout)}
                            disabled={actingId === workout.id}
                          >
                            <Copy className="mr-2 size-3.5" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => void handleEncerrar(workout)}
                            disabled={
                              actingId === workout.id ||
                              governance.status === "ENCERRADO" ||
                              governance.status === "SUBSTITUIDO"
                            }
                            className="text-gym-danger focus:text-gym-danger"
                          >
                            Encerrar treino
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

function AlunoAvatar({ nome }: { nome?: string }) {
  // Inicial + cor estável por hash do nome (sem cache cross-render).
  const initial = (nome?.trim().charAt(0) ?? "?").toUpperCase();
  const cor = grupoColorByName(nome ?? "?");
  return (
    <div
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-black"
      style={{ background: cor }}
      title={nome}
    >
      {initial}
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

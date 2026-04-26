"use client";

/**
 * TemplatesGridV3 — listagem de templates como grid de cards (Wave 5 PRD V3).
 *
 * Wave 8: pills por objetivo, favoritos via localStorage, chips coloridos
 * de grupos musculares, contador de alunos atribuídos, descrição em preview
 * e card clicável inteiro. Mantém governance (status, pendências) discreto.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Edit3,
  FileStack,
  MoreVertical,
  Search,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTreinosFavoritos } from "@/hooks/use-treinos-favoritos";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  resolveTemplateStatusBadgeVariant,
  getTemplateDisplayName,
  type useTreinosWorkspace,
} from "./use-treinos-workspace";

type Workspace = ReturnType<typeof useTreinosWorkspace>;

const OBJETIVO_PILLS: Array<{ value: string | null; label: string }> = [
  { value: null, label: "Todos" },
  { value: "HIPERTROFIA", label: "Hipertrofia" },
  { value: "EMAGRECIMENTO", label: "Emagrecimento" },
  { value: "CONDICIONAMENTO", label: "Condicionamento" },
  { value: "REABILITACAO", label: "Reabilitação" },
];

/**
 * Paleta de chips de grupos musculares. Mapeamento determinístico
 * por hash do nome → mesma cor para "Peito" em qualquer lugar.
 * Classes literais (nada interpolado) pra Tailwind preservar no build.
 */
const GRUPO_PALETTE = [
  "bg-rose-500/10 text-rose-300 border-rose-500/30",
  "bg-blue-500/10 text-blue-300 border-blue-500/30",
  "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  "bg-amber-500/10 text-amber-300 border-amber-500/30",
  "bg-violet-500/10 text-violet-300 border-violet-500/30",
  "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  "bg-pink-500/10 text-pink-300 border-pink-500/30",
  "bg-lime-500/10 text-lime-300 border-lime-500/30",
] as const;

function colorForGrupo(grupo: string): string {
  let hash = 0;
  for (let i = 0; i < grupo.length; i += 1) {
    hash = (hash * 31 + grupo.charCodeAt(i)) | 0;
  }
  return GRUPO_PALETTE[Math.abs(hash) % GRUPO_PALETTE.length] ?? GRUPO_PALETTE[0];
}

/** Extrai DD/MM de um ISO date/datetime (SSR-safe — só split de string). */
function formatAtualizadoEm(value?: string | null): string | null {
  if (!value) return null;
  const datePart = value.slice(0, 10);
  const formatted = formatDate(datePart);
  if (!formatted) return null;
  return formatted.slice(0, 5);
}

export function TemplatesGridV3({ workspace }: { workspace: Workspace }) {
  const router = useRouter();
  const { isFavorito, toggle: toggleFavorito } = useTreinosFavoritos();
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [showOnlyFavoritos, setShowOnlyFavoritos] = useState(false);

  const filteredTemplates = useMemo(() => {
    let items = workspace.templates;
    if (objetivo) {
      items = items.filter(
        (t) => (t.perfilIndicacao ?? "").toUpperCase() === objetivo,
      );
    }
    if (showOnlyFavoritos) {
      items = items.filter((t) => isFavorito(t.id));
    }
    return items;
  }, [workspace.templates, objetivo, showOnlyFavoritos, isFavorito]);

  return (
    <div className="space-y-6">
      {/* Header — totais + busca */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <FileStack className="size-5 text-gym-accent" />
          <span className="text-sm font-medium">
            {workspace.templateTotals.totalTemplates} templates
          </span>
          {workspace.templateTotals.comPendencias > 0 ? (
            <Badge variant="secondary">
              {workspace.templateTotals.comPendencias} com pendências
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {workspace.templateTotals.comPendencias > 0 ? (
            <Button
              type="button"
              variant={workspace.reviewOnly ? "default" : "outline"}
              size="sm"
              onClick={() => {
                workspace.setReviewOnly((current) => !current);
                workspace.setPage(0);
              }}
            >
              {workspace.reviewOnly ? "Mostrar todos" : "Apenas pendências"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={showOnlyFavoritos ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyFavoritos((v) => !v)}
            aria-pressed={showOnlyFavoritos}
          >
            <Star
              className={cn(
                "mr-1 size-3.5",
                showOnlyFavoritos && "fill-amber-300 text-amber-300",
              )}
            />
            Favoritos
          </Button>
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={workspace.search}
              onChange={(event) => {
                workspace.setSearch(event.target.value);
                workspace.setPage(0);
              }}
              className="pl-8"
              placeholder="Buscar por nome do template ou professor"
              aria-label="Buscar template"
            />
          </div>
        </div>
      </div>

      {/* Pills de filtro por objetivo */}
      <div className="flex flex-wrap gap-2">
        {OBJETIVO_PILLS.map((pill) => {
          const active = objetivo === pill.value;
          return (
            <Button
              key={pill.label}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className={cn(
                "h-8 rounded-full text-xs",
                !active && "border-border bg-transparent",
              )}
              onClick={() => setObjetivo(pill.value)}
              aria-pressed={active}
            >
              {pill.label}
            </Button>
          );
        })}
      </div>

      {/* Grid de cards */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
          {showOnlyFavoritos
            ? "Nenhum template favoritado ainda. Clique na estrela ao abrir um card."
            : objetivo
              ? `Nenhum template encontrado para o objetivo selecionado.`
              : workspace.emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const displayName = getTemplateDisplayName(template);
            const templateStatus =
              template.status ?? (template.precisaRevisao ? "EM_REVISAO" : "PUBLICADO");
            const canOperate =
              template.status !== "ARQUIVADO" && template.status !== "CANCELADO";
            const canEdit = workspace.permissions.canEditOwnTemplate && canOperate;
            const canAssign = workspace.permissions.canAssignIndividual && canOperate;
            const canArchive = workspace.permissions.canArchiveTemplate && canOperate;
            const actionLoading = workspace.actionTemplateId === template.id;
            const grupos = template.gruposMusculares ?? [];
            const gruposVisiveis = grupos.slice(0, 5);
            const gruposExtras = Math.max(0, grupos.length - gruposVisiveis.length);
            const totalAlunos = template.totalAtribuicoes ?? 0;
            const atualizadoEm = formatAtualizadoEm(template.atualizadoEm);
            const favorito = isFavorito(template.id);

            return (
              <Card
                key={template.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/treinos/${template.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/treinos/${template.id}`);
                  }
                }}
                className={cn(
                  "group relative flex cursor-pointer flex-col overflow-hidden border-border transition-shadow hover:shadow-lg hover:shadow-gym-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gym-accent",
                  template.precisaRevisao && "border-amber-500/40",
                )}
              >
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  {/* Linha 1: título + favorito + status */}
                  <div className="flex items-start gap-2">
                    <h3 className="min-w-0 flex-1 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-gym-accent">
                      <span className="line-clamp-2 break-words">{displayName}</span>
                    </h3>
                    <button
                      type="button"
                      aria-label={favorito ? "Remover dos favoritos" : "Favoritar template"}
                      aria-pressed={favorito}
                      className="-m-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-amber-300"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorito(template.id);
                      }}
                    >
                      <Star
                        className={cn(
                          "size-4",
                          favorito && "fill-amber-300 text-amber-300",
                        )}
                      />
                    </button>
                  </div>

                  {/* Linha 2: meta tags discretas */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <Badge
                      variant={resolveTemplateStatusBadgeVariant(templateStatus)}
                      className="shrink-0 text-[10px]"
                    >
                      {templateStatus}
                    </Badge>
                    {template.categoria ? (
                      <Badge variant="outline" className="border-border text-[10px]">
                        {template.categoria}
                      </Badge>
                    ) : null}
                    {template.perfilIndicacao ? (
                      <Badge variant="outline" className="border-border text-[10px]">
                        {template.perfilIndicacao}
                      </Badge>
                    ) : null}
                    {template.versaoTemplate ? (
                      <span className="text-[10px] text-muted-foreground">
                        v{template.versaoTemplate}
                      </span>
                    ) : null}
                  </div>

                  {/* Descrição (observações) — 2 linhas no preview */}
                  {template.observacoes ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {template.observacoes}
                    </p>
                  ) : null}

                  {/* Frequência / semanas */}
                  <div className="text-xs text-muted-foreground">
                    {template.frequenciaSemanal
                      ? `${template.frequenciaSemanal}x/sem`
                      : "Frequência não informada"}
                    {template.totalSemanas ? ` · ${template.totalSemanas}sem` : ""}
                  </div>

                  {/* Chips de grupos musculares */}
                  {gruposVisiveis.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {gruposVisiveis.map((grupo) => (
                        <span
                          key={grupo}
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                            colorForGrupo(grupo),
                          )}
                        >
                          {grupo}
                        </span>
                      ))}
                      {gruposExtras > 0 ? (
                        <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                          +{gruposExtras}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Pendências — destaque amber só quando >0 */}
                  {template.pendenciasAbertas > 0 ? (
                    <div className="rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-300">
                      {template.pendenciasAbertas} pendência(s) aberta(s)
                    </div>
                  ) : null}

                  {/* Spacer flex pra empurrar footer pra baixo */}
                  <div className="flex-1" />

                  {/* Footer: alunos + atualizado em */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {totalAlunos} {totalAlunos === 1 ? "aluno" : "alunos"}
                    </span>
                    <span className="truncate">
                      {template.professorNome
                        ? `Prof. ${template.professorNome}`
                        : "Sem professor"}
                    </span>
                    {atualizadoEm ? (
                      <span className="shrink-0">Atualizado {atualizadoEm}</span>
                    ) : null}
                  </div>

                  {/* Ações — abaixo, separadas para não competir com o card click */}
                  <div
                    className="flex flex-wrap items-center gap-1.5 pt-1"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Button asChild variant="default" size="sm" className="h-7 text-xs">
                      <Link href={`/treinos/${template.id}`}>
                        <Edit3 className="mr-1 size-3" />
                        Abrir
                      </Link>
                    </Button>
                    {canEdit ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 border-border text-xs"
                        onClick={() => void workspace.openEditTemplate(template)}
                        disabled={actionLoading}
                      >
                        Editar
                      </Button>
                    ) : null}
                    {canAssign ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 border-border text-xs"
                        onClick={() => void workspace.openAssignmentDialog(template)}
                        disabled={actionLoading}
                      >
                        <UserPlus className="mr-1 size-3" />
                        Atribuir
                      </Button>
                    ) : null}
                    {canArchive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-gym-danger"
                        onClick={() => void workspace.openArchiveDialog(template)}
                        disabled={actionLoading}
                        title="Arquivar"
                      >
                        <MoreVertical className="size-3" />
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Paginação minimalista */}
      {workspace.templatesTotal > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
          <span>
            {filteredTemplates.length} de {workspace.templatesTotal} templates
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-border text-xs"
              onClick={() => workspace.setPage((current) => Math.max(0, current - 1))}
              disabled={workspace.page === 0}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-border text-xs"
              onClick={() => {
                if (workspace.templatesHasNext) workspace.setPage((current) => current + 1);
              }}
              disabled={!workspace.templatesHasNext}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

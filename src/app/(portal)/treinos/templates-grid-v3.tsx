"use client";

/**
 * TemplatesGridV3 — listagem de templates como grid de cards (Wave 5 PRD V3).
 *
 * Alternativa à PaginatedTable usada na V2. Reusa o mesmo workspace
 * (useTreinosWorkspace) — apenas substitui a apresentação. Mantém
 * paginação, busca, filtro de pendências e ações.
 */

import Link from "next/link";
import { Edit3, FileStack, MoreVertical, Search, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  resolveTemplateStatusBadgeVariant,
  getTemplateDisplayName,
  type useTreinosWorkspace,
} from "./use-treinos-workspace";

type Workspace = ReturnType<typeof useTreinosWorkspace>;

export function TemplatesGridV3({ workspace }: { workspace: Workspace }) {
  return (
    <div className="space-y-6">
      {/* Filtros / busca */}
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

      {/* Grid de cards */}
      {workspace.templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
          {workspace.emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspace.templates.map((template) => {
            const displayName = getTemplateDisplayName(template);
            const templateStatus =
              template.status ?? (template.precisaRevisao ? "EM_REVISAO" : "PUBLICADO");
            const canOperate = template.status !== "ARQUIVADO" && template.status !== "CANCELADO";
            const canEdit = workspace.permissions.canEditOwnTemplate && canOperate;
            const canAssign = workspace.permissions.canAssignIndividual && canOperate;
            const canArchive = workspace.permissions.canArchiveTemplate && canOperate;
            const actionLoading = workspace.actionTemplateId === template.id;

            return (
              <Card
                key={template.id}
                className={cn(
                  "group relative overflow-hidden border-border transition-shadow hover:shadow-lg hover:shadow-gym-accent/5",
                  template.precisaRevisao && "border-amber-500/40",
                )}
              >
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/treinos/${template.id}`}
                      className="min-w-0 flex-1 text-base font-bold text-foreground hover:text-gym-accent"
                    >
                      <span className="line-clamp-2 break-words">{displayName}</span>
                    </Link>
                    <Badge
                      variant={resolveTemplateStatusBadgeVariant(templateStatus)}
                      className="shrink-0 text-[10px]"
                    >
                      {templateStatus}
                    </Badge>
                  </div>

                  {/* Meta tags */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {template.categoria ? (
                      <Badge variant="outline" className="border-border">
                        {template.categoria}
                      </Badge>
                    ) : null}
                    {template.versaoTemplate ? (
                      <Badge variant="outline" className="border-border">
                        v{template.versaoTemplate}
                      </Badge>
                    ) : null}
                    {template.precisaRevisao ? (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                        Revisão
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  <div className="text-xs text-muted-foreground">
                    {template.frequenciaSemanal
                      ? `${template.frequenciaSemanal}x/sem`
                      : "Frequência não informada"}
                    {template.totalSemanas ? ` · ${template.totalSemanas}sem` : ""}
                    {template.perfilIndicacao ? ` · ${template.perfilIndicacao}` : ""}
                  </div>

                  {template.pendenciasAbertas > 0 ? (
                    <div className="rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-300">
                      {template.pendenciasAbertas} pendência(s) aberta(s)
                    </div>
                  ) : null}

                  <div className="text-[11px] text-muted-foreground">
                    {template.professorNome
                      ? `Professor: ${template.professorNome}`
                      : "Sem professor responsável"}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
            {workspace.templates.length} de {workspace.templatesTotal} templates
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

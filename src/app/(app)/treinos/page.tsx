"use client";

import Link from "next/link";
import { Archive, ClipboardList, FileStack, PencilLine, Search, SquareArrowOutUpRight, UserPlus } from "lucide-react";
import dynamic from "next/dynamic";
const TreinoModal = dynamic(() => import("@/components/shared/treino-modal").then((mod) => mod.TreinoModal), { ssr: false });
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTreinosWorkspace, formatDateTime, resolveTemplateStatusBadgeVariant, getTemplateDisplayName } from "./use-treinos-workspace";
import { AssignmentDialog, ArchiveDialog } from "./treinos-dialogs";

export default function TreinosPage() {
  const workspace = useTreinosWorkspace();

  return (
    <div className="space-y-6">
      {workspace.createTemplateOpen ? (
        <TreinoModal
          key="template-create-open"
          open
          onClose={() => workspace.setCreateTemplateOpen(false)}
          clientes={[]}
          exercicios={workspace.exercicios.map((item) => ({
            id: item.id,
            nome: item.nome,
            grupoMuscular: item.grupoMuscularNome ?? item.grupoMuscular,
          }))}
          mode="PRE_MONTADO"
          title="Novo treino padrão"
          description="Cadastre um template reutilizável para encontrar, editar e atribuir com rapidez."
          submitLabel="Salvar treino padrão"
          onSave={workspace.handleCreateTemplate}
        />
      ) : null}

      {workspace.editingTemplate ? (
        <TreinoModal
          key={workspace.editingTemplate.id}
          open
          onClose={() => workspace.setEditingTemplate(null)}
          clientes={[]}
          exercicios={workspace.exercicios.map((item) => ({
            id: item.id,
            nome: item.nome,
            grupoMuscular: item.grupoMuscularNome ?? item.grupoMuscular,
          }))}
          mode="PRE_MONTADO"
          title="Editar treino padrão"
          description="Ajuste os metadados e os exercícios do template sem sair da listagem operacional."
          submitLabel="Salvar alterações"
          initialData={workspace.editingTemplateForm}
          onSave={workspace.handleEditTemplate}
        />
      ) : null}

      {workspace.assignmentDialogOpen ? (
        <AssignmentDialog
          open={workspace.assignmentDialogOpen}
          assignmentTemplate={workspace.assignmentTemplate}
          assignmentForm={workspace.assignmentForm}
          alunoOptions={workspace.alunoOptions}
          assigning={workspace.assigning}
          onOpenChange={(open) => {
            workspace.setAssignmentDialogOpen(open);
            if (!open) {
              workspace.setAssignmentTemplate(null);
              workspace.setAssignmentForm(null);
            }
          }}
          onAssignmentFormChange={workspace.setAssignmentForm}
          onCancel={() => {
            workspace.setAssignmentDialogOpen(false);
            workspace.setAssignmentTemplate(null);
            workspace.setAssignmentForm(null);
          }}
          onConfirm={() => void workspace.handleAssignTemplate()}
        />
      ) : null}

      {workspace.archiveTemplate ? (
        <ArchiveDialog
          template={workspace.archiveTemplate}
          archiving={workspace.archiving}
          onClose={() => workspace.setArchiveTemplate(null)}
          onConfirm={() => void workspace.handleArchiveTemplate()}
        />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight">Treino Padrão</h1>
            <Badge variant="outline">{workspace.templateTotals.totalTemplates} template(s)</Badge>
            {workspace.templateTotals.comPendencias > 0 ? (
              <Badge variant="secondary">{workspace.templateTotals.comPendencias} com pendências</Badge>
            ) : null}
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Biblioteca administrativa de templates reutilizáveis para a unidade {workspace.tenantResolved ? workspace.tenantName : workspace.DEFAULT_ACTIVE_TENANT_LABEL}, com busca rápida,
            ações operacionais e ordenação por atualização mais recente.
          </p>
          <button
            type="button"
            onClick={() => workspace.setShowInfo((current) => !current)}
            className="text-sm font-medium text-gym-accent underline underline-offset-4"
          >
            Saiba mais
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/treinos/atribuidos">
              <ClipboardList className="size-4" />
              Treinos atribuídos
            </Link>
          </Button>
          <Button
            onClick={() => workspace.setCreateTemplateOpen(true)}
            disabled={!workspace.permissions.canCreateTemplate}
            title={workspace.permissions.canCreateTemplate ? "Criar treino padrão" : "Seu perfil não pode criar templates"}
          >
            <FileStack className="size-4" />
            Criar treino padrão
          </Button>
        </div>
      </div>

      {workspace.showInfo ? (
        <Card className="border-border bg-card">
          <CardContent className="grid gap-2 p-4 text-sm text-muted-foreground md:grid-cols-3">
            <p>Use a busca principal para localizar templates por nome ou professor, sem misturar treinos atribuídos.</p>
            <p>As ações rápidas desta tela cobrem edição, montagem, atribuição e arquivamento sem inflar a navegação.</p>
            <p>Treinos atribuídos seguem em uma fila separada para preservar governança, vigência e rastreabilidade.</p>
          </CardContent>
        </Card>
      ) : null}

      {workspace.latestAssigned ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Última atribuição criada</p>
              <p className="text-sm text-muted-foreground">
                {workspace.latestAssigned.nome} foi atribuído para {workspace.latestAssigned.alunoNome}.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/treinos/${workspace.latestAssigned.treinoId}`}>Abrir treino atribuído</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TreinosMetricCard
          label="Total de templates"
          value={String(workspace.templateTotals.totalTemplates)}
          detail={workspace.reviewOnly ? "Filtro de pendências ativo" : "Catálogo retornado pelo endpoint canônico de templates"}
        />
        <TreinosMetricCard
          label="Publicados"
          value={String(workspace.templateTotals.publicados)}
          detail="Templates disponíveis para operação"
        />
        <TreinosMetricCard
          label="Em revisão"
          value={String(workspace.templateTotals.emRevisao)}
          detail="Templates atualmente em fluxo de revisão"
        />
        <TreinosMetricCard
          label="Com pendências"
          value={String(workspace.templateTotals.comPendencias)}
          detail="Templates sinalizados para revisão ou ajuste"
        />
      </div>

      {workspace.error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          <span>{workspace.error}</span>
          <Button variant="outline" className="border-gym-danger/30" onClick={() => void workspace.loadData()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      <Card className="border-border bg-card">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="font-display text-lg">Listagem operacional</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Busca principal, contador de resultados e ações rápidas para operar a biblioteca de treino padrão.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {workspace.templateTotals.comPendencias > 0 ? (
                <Button
                  type="button"
                  variant={workspace.reviewOnly ? "default" : "outline"}
                  onClick={() => {
                    workspace.setReviewOnly((current) => !current);
                    workspace.setPage(0);
                  }}
                >
                  {workspace.reviewOnly ? "Mostrar todos" : `Pendências (${workspace.templateTotals.comPendencias})`}
                </Button>
              ) : null}
              <div className="relative w-full min-w-72 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={workspace.search}
                  onChange={(event) => {
                    workspace.setSearch(event.target.value);
                    workspace.setPage(0);
                  }}
                  className="pl-8"
                  placeholder="Buscar por nome do template ou professor"
                  aria-label="Buscar template por nome ou professor"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PaginatedTable
            columns={[
              { label: "Nome do treino" },
              { label: "Resumo" },
              { label: "Professor" },
              { label: "Ações" },
            ]}
            items={workspace.templates}
            emptyText={workspace.emptyText}
            total={workspace.templatesTotal}
            page={workspace.page}
            pageSize={workspace.templatesSize}
            hasNext={workspace.templatesHasNext}
            onNext={() => {
              if (workspace.templatesHasNext) workspace.setPage((current) => current + 1);
            }}
            onPrevious={() => workspace.setPage((current) => Math.max(0, current - 1))}
            getRowKey={(template) => template.id}
            itemLabel="templates"
            rowClassName={(template) => (template.precisaRevisao ? "bg-amber-50/40 dark:bg-amber-950/10" : "")}
            renderCells={(template) => {
              const displayName = getTemplateDisplayName(template);
              const templateStatus =
                template.status ?? (template.precisaRevisao ? "EM_REVISAO" : "PUBLICADO");
              const canOperate = template.status !== "ARQUIVADO" && template.status !== "CANCELADO";
              const canEdit = workspace.permissions.canEditOwnTemplate && canOperate;
              const canAssign = workspace.permissions.canAssignIndividual && canOperate;
              const canArchive = workspace.permissions.canArchiveTemplate && canOperate;
              const actionLoading = workspace.actionTemplateId === template.id;

              return (
                <>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/treinos/${template.id}`} className="text-sm font-semibold text-foreground hover:text-gym-accent">
                          {displayName}
                        </Link>
                        <Badge variant={resolveTemplateStatusBadgeVariant(templateStatus)}>{templateStatus}</Badge>
                        {template.versaoTemplate ? <Badge variant="outline">v{template.versaoTemplate}</Badge> : null}
                        {template.precisaRevisao ? <Badge variant="outline">Revisão pendente</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {template.categoria ? `Categoria ${template.categoria}` : "Categoria não informada"}
                        {template.perfilIndicacao ? ` · Perfil ${template.perfilIndicacao}` : ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {template.pendenciasAbertas} pendência(s) aberta(s)
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {template.precisaRevisao
                          ? "Template sinalizado para revisão"
                          : "Template pronto para atribuição e manutenção"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {template.frequenciaSemanal
                          ? `${template.frequenciaSemanal}x por semana`
                          : "Frequência não informada"}
                        {template.totalSemanas ? ` · ${template.totalSemanas} semana(s)` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {template.professorNome ?? "Professor não informado"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Atualizado em {formatDateTime(template.atualizadoEm)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        title={
                          actionLoading
                            ? "Carregando detalhes do template"
                            : canEdit
                              ? "Editar treino"
                              : "Seu perfil não pode editar este template"
                        }
                        aria-label={`Editar treino ${displayName}`}
                        disabled={!canEdit || actionLoading}
                        onClick={() => void workspace.openEditTemplate(template)}
                      >
                        <PencilLine className="size-4" />
                        Editar
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        title="Abrir montagem"
                        aria-label={`Abrir montagem de ${displayName}`}
                      >
                        <Link href={`/treinos/${template.id}`}>
                          <SquareArrowOutUpRight className="size-4" />
                          Abrir montagem
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        title={
                          actionLoading
                            ? "Carregando detalhes do template"
                            : canAssign
                              ? "Atribuir treino"
                              : "Seu perfil não pode atribuir templates"
                        }
                        aria-label={`Atribuir treino ${displayName}`}
                        disabled={!canAssign || actionLoading}
                        onClick={() => void workspace.openAssignmentDialog(template)}
                      >
                        <UserPlus className="size-4" />
                        Atribuir treino
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title={
                          actionLoading
                            ? "Carregando detalhes do template"
                            : canArchive
                              ? "Excluir ou arquivar treino"
                              : "Seu perfil não pode arquivar templates"
                        }
                        aria-label={`Arquivar treino ${displayName}`}
                        disabled={!canArchive || actionLoading}
                        onClick={() => void workspace.openArchiveDialog(template)}
                      >
                        <Archive className="size-4" />
                        Arquivar
                      </Button>
                    </div>
                  </td>
                </>
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function TreinosMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
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

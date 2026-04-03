"use client";

import Link from "next/link";
import { GlobalSecurityShell } from "@/backoffice/components/security/global-security-shell";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UsuariosCreateForm } from "./usuarios-create-form";
import { UsuariosFilters } from "./usuarios-filters";
import { UsuariosTable } from "./usuarios-table";
import { StatCard } from "./usuarios-types";
import { useUsuariosWorkspace } from "./use-usuarios-workspace";

export default function AdminSegurancaUsuariosPage() {
  const ws = useUsuariosWorkspace();

  return (
    <GlobalSecurityShell
      title="Usuários e acessos"
      description="Procure uma pessoa por rede, identificador e escopo. A leitura separa identidade, unidade-base, unidade ativa e vínculos operacionais."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => ws.setShowCreateForm((current) => !current)}>
            {ws.showCreateForm ? "Fechar criação" : "Novo usuário"}
          </Button>
          <Button asChild variant="outline" className="border-border">
            <Link href="/admin/seguranca/revisoes">Abrir fila de revisões</Link>
          </Button>
        </div>
      }
    >
      {ws.showCreateForm ? (
        <UsuariosCreateForm
          createUserForm={ws.createUserForm}
          academias={ws.academias}
          unidades={ws.unidades}
          createAcademiaUnits={ws.createAcademiaUnits}
          creatingUser={ws.creatingUser}
          createFeedback={ws.createFeedback}
          createError={ws.createError}
          onSubmit={ws.handleCreateUser}
          toggleCreateTenant={ws.toggleCreateTenant}
          loadingCatalog={ws.loadingCatalog}
          createForm={ws.createForm}
          onResetForm={ws.resetCreateForm}
        />
      ) : null}

      {ws.createFeedback && !ws.showCreateForm ? (
        <Card>
          <CardContent className="px-6 py-4 text-sm text-gym-teal">{ws.createFeedback}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard title="Resultados" value={ws.loading ? "…" : String(ws.allItems.length)} subtitle="Pessoas no recorte atual" />
        <StatCard title="Acessos amplos" value={ws.loading ? "…" : String(ws.summary.broadAccess)} subtitle="Pessoas acima do padrão esperado" />
        <StatCard title="Revisões acionáveis" value={ws.loading ? "…" : String(ws.summary.pendingReview)} subtitle="Pendentes ou vencidas" />
        <StatCard title="Exceções visíveis" value={ws.loading ? "…" : String(ws.summary.exceptions)} subtitle="Somatório de exceções no recorte" />
      </div>

      <UsuariosFilters
        filters={ws.filters}
        setFilters={ws.setFilters}
        academias={ws.academias}
        unidadesFiltradas={ws.unidadesFiltradas}
        contextualNetworkNames={ws.contextualNetworkNames}
        onApply={ws.applyFilters}
        onClear={ws.clearFilters}
        loading={ws.loading || ws.loadingCatalog}
      />

      <SecuritySectionFeedback loading={ws.loadingCatalog || ws.loading} error={ws.error} />

      <UsuariosTable
        items={ws.pagedItems}
        appliedFilters={ws.appliedFilters}
        page={ws.page}
        total={ws.allItems.length}
        hasNext={ws.hasNext}
        onPrevious={() => ws.setPage((current) => Math.max(0, current - 1))}
        onNext={() => ws.setPage((current) => current + 1)}
        isLoading={ws.loading}
        selectedIds={ws.selectedIds}
        onSelectionChange={ws.setSelectedIds}
        bulkActions={ws.bulkActions}
      />
    </GlobalSecurityShell>
  );
}

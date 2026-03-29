"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/shared/table-skeleton";

import { useClientesWorkspace } from "./use-clientes-workspace";
import { ClientesFilterBar } from "./clientes-filter-bar";
import { ClientesTable } from "./clientes-table";
import { ClienteResumoDialog } from "./cliente-resumo-dialog";

const NovoClienteWizard = dynamic(
  () =>
    import("@/components/shared/novo-cliente-wizard").then(
      (mod) => mod.NovoClienteWizard,
    ),
  { ssr: false },
);

function ClientesPageContent() {
  const ws = useClientesWorkspace();

  return (
    <div className="space-y-6">
      {ws.ConfirmDialog}
      {ws.wizard.isOpen ? (
        <NovoClienteWizard
          open
          onClose={ws.wizard.close}
          onDone={async (created, opts) => {
            await ws.load();
            if (created && opts?.openSale) {
              ws.wizard.close();
              ws.router.push(
                `/vendas/nova?clienteId=${encodeURIComponent(created.id)}&prefill=1`,
              );
            }
          }}
        />
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ws.statusTotals.TODOS} clientes cadastrados
          </p>
        </div>
        <Button onClick={ws.wizard.open}>
          <Plus className="size-4" />
          Novo cliente
        </Button>
      </div>

      {ws.loadError ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {ws.loadError}
        </div>
      ) : null}

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Novos clientes
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">
            {ws.metrics.novos}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Clientes renovados
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">
            {ws.metrics.renovados}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contratos não renovados
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">
            {ws.metrics.naoRenovados}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Evasão
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-danger">
            {ws.metrics.evadidos}
          </p>
        </div>
      </div>

      <ClientesFilterBar
        filtro={ws.filtro}
        statusTotals={ws.statusTotals}
        buscaInput={ws.buscaInput}
        onBuscaChange={ws.setBuscaInput}
        pageSize={ws.pageSize}
        sortBy={ws.sortBy}
        onSortChange={ws.setSortBy}
        onFilterChange={ws.setParams}
        onClear={ws.clearParams}
        hasActiveFilters={ws.hasActiveFilters}
      />

      <ClientesTable
        items={ws.filtered}
        loading={ws.loading}
        selectedIds={ws.selectedIds}
        onSelectionChange={ws.setSelectedIds}
        bulkActions={ws.bulkActions}
        page={ws.metaPage}
        pageSize={ws.metaSize}
        total={ws.totalClientes}
        hasNext={ws.isSearchFiltered ? false : ws.hasNextPage}
        onPrevious={() => ws.setParams({ page: Math.max(0, ws.page - 1) })}
        onNext={() => ws.setParams({ page: ws.page + 1 })}
        onClienteClick={(aluno) => {
          ws.setClienteResumo(aluno);
          ws.resumoDialog.open();
        }}
        router={ws.router}
      />

      <ClienteResumoDialog
        isOpen={ws.resumoDialog.isOpen}
        onOpenChange={ws.resumoDialog.onOpenChange}
        clienteResumo={ws.clienteResumo}
        clienteResumoPlano={ws.clienteResumoPlano}
        clienteResumoBaseHref={ws.clienteResumoBaseHref}
        liberandoSuspensao={ws.liberandoSuspensao}
        onLiberarSuspensao={ws.handleLiberarSuspensao}
        onVerPerfil={ws.handleVerPerfil}
        onClose={ws.resumoDialog.close}
      />
    </div>
  );
}

export function ClientesClient() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-40 animate-pulse rounded-md bg-primary/10" />
              <div className="h-4 w-64 animate-pulse rounded-md bg-primary/10" />
            </div>
            <div className="h-10 w-32 animate-pulse rounded-md bg-primary/10" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-24 animate-pulse rounded-xl bg-primary/10" />
            <div className="h-24 animate-pulse rounded-xl bg-primary/10" />
            <div className="h-24 animate-pulse rounded-xl bg-primary/10" />
            <div className="h-24 animate-pulse rounded-xl bg-primary/10" />
          </div>
          <TableSkeleton
            columns={[
              { label: "Cliente" },
              { label: "CPF" },
              { label: "Telefone" },
              { label: "Nascimento" },
              { label: "Sexo" },
              { label: "Status" },
            ]}
            rowCount={10}
          />
        </div>
      }
    >
      <ClientesPageContent />
    </Suspense>
  );
}

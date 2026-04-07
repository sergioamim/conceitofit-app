"use client";

import { Suspense } from "react";
import { Plus, Users, UserPlus, TrendingUp, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { NovoClienteWizard } from "@/components/shared/novo-cliente-wizard";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { motion } from "framer-motion";

import { useClientesWorkspace } from "./use-clientes-workspace";
import { ClientesFilterBar } from "./clientes-filter-bar";
import { ClientesTable } from "./clientes-table";
import { ClienteResumoDialog } from "./cliente-resumo-dialog";

function ClientesPageContent() {
  const ws = useClientesWorkspace();

  return (
    <div className="space-y-8 pb-10">
      {ws.ConfirmDialog}
      {ws.wizard.isOpen ? (
        <NovoClienteWizard
          open
          onClose={ws.wizard.close}
          onDone={async (created, opts) => {
            await ws.load();
            if (!created) return;
            if (opts?.openSale) {
              ws.router.push(`/vendas/nova?clienteId=${encodeURIComponent(created.id)}&prefill=1`);
              return;
            }
            ws.router.push(`/clientes/${encodeURIComponent(created.id)}`);
          }}
        />
      ) : null}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Clientes
          </h1>
          <p className="mt-2 text-muted-foreground text-lg flex items-center gap-2">
            <Users size={18} className="text-primary" />
            {ws.statusTotals.TODOS} alunos cadastrados no sistema
          </p>
        </motion.div>
        <Button onClick={ws.wizard.open} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 font-bold">
          <Plus className="mr-2 size-5" />
          Novo Cliente
        </Button>
      </div>

      {ws.loadError ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {ws.loadError}
        </div>
      ) : null}

      {/* Metrics V2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BiMetricCard label="Novos clientes" value={String(ws.metrics.novos)} icon={UserPlus} tone="accent" description="Este mês" />
        <BiMetricCard label="Clientes renovados" value={String(ws.metrics.renovados)} icon={TrendingUp} tone="teal" description="Sucesso na base" />
        <BiMetricCard label="Não renovados" value={String(ws.metrics.naoRenovados)} icon={CreditCard} tone="warning" description="Atenção necessária" />
        <BiMetricCard label="Evasão" value={String(ws.metrics.evadidos)} icon={AlertTriangle} tone="danger" description="Perda de alunos" />
      </div>

      <div className="space-y-4">
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
      </div>

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
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-10 w-48 animate-pulse rounded-lg bg-primary/10" />
              <div className="h-5 w-72 animate-pulse rounded-lg bg-primary/10" />
            </div>
            <div className="h-11 w-36 animate-pulse rounded-xl bg-primary/10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-32 animate-pulse rounded-2xl bg-primary/5 border border-border/40" />
            <div className="h-32 animate-pulse rounded-2xl bg-primary/5 border border-border/40" />
            <div className="h-32 animate-pulse rounded-2xl bg-primary/5 border border-border/40" />
            <div className="h-32 animate-pulse rounded-2xl bg-primary/5 border border-border/40" />
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

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Users, UserPlus, TrendingUp, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { NovoClienteWizard } from "@/components/shared/novo-cliente-wizard";
import { VincularAgregadorModal } from "@/components/shared/vincular-agregador-modal";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { ExportMenu, type ExportColumn, type ServerExportAction } from "@/components/shared/export-menu";
import { exportarAlunosApi } from "@/lib/api/exportacao";
import { motion } from "framer-motion";

import { useClientesWorkspace } from "./use-clientes-workspace";
import { ClientesFilterBar } from "./clientes-filter-bar";
import { ClientesTable } from "./clientes-table";

const EXPORT_COLUMNS: ExportColumn<import("@/lib/types").Aluno>[] = [
  { label: "Nome", accessor: "nome" },
  { label: "CPF", accessor: "cpf" },
  { label: "Telefone", accessor: "telefone" },
  { label: "Email", accessor: "email" },
  { label: "Status", accessor: "status" },
];

function ClientesPageContent() {
  const ws = useClientesWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // VUN-5.1/5.2: state local para o CTA "Vincular agregador" do wizard.
  // Após criar o prospect, abrimos o modal passando o `alunoId` recém-criado.
  const [vincularAgregadorAlunoId, setVincularAgregadorAlunoId] = useState<string | null>(null);

  const serverExportActions = useMemo<ServerExportAction[]>(() => {
    const statusParam = ws.filtro === "TODOS" ? undefined : ws.filtro;
    return [
      {
        label: "Servidor CSV",
        onClick: () =>
          exportarAlunosApi({ tenantId: ws.tenantId, formato: "csv", status: statusParam }),
      },
      {
        label: "Servidor XLSX",
        onClick: () =>
          exportarAlunosApi({ tenantId: ws.tenantId, formato: "xlsx", status: statusParam }),
      },
    ];
  }, [ws.tenantId, ws.filtro]);

  useEffect(() => {
    if (searchParams.get("action") !== "new" || ws.wizard.isOpen) return;

    ws.wizard.open();

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("action");
    const nextHref = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextHref, { scroll: false });
  }, [pathname, router, searchParams, ws.wizard]);

  return (
    <div className="space-y-8 pb-10">
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
            if (opts?.linkAggregator) {
              // VUN-5.1 + VUN-5.2: abre o modal de vínculo logo após o cadastro.
              setVincularAgregadorAlunoId(created.id);
              return;
            }
            // CTA "Salvar": redireciona para o perfil do cliente recém-criado.
            ws.router.push(`/clientes/${encodeURIComponent(created.id)}`);
          }}
        />
      ) : null}

      {vincularAgregadorAlunoId ? (
        <VincularAgregadorModal
          open
          onOpenChange={(next) => {
            if (!next) setVincularAgregadorAlunoId(null);
          }}
          alunoId={vincularAgregadorAlunoId}
          tenantId={ws.tenantId}
          onSuccess={() => {
            const alunoId = vincularAgregadorAlunoId;
            setVincularAgregadorAlunoId(null);
            if (alunoId) {
              ws.router.push(`/clientes/${encodeURIComponent(alunoId)}`);
            }
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
        <div className="flex items-center gap-3">
          <ExportMenu
            data={ws.filtered}
            columns={EXPORT_COLUMNS}
            filename="clientes"
            title="Clientes"
            serverActions={serverExportActions}
          />
          <Button onClick={ws.wizard.open} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 font-bold">
            <Plus className="mr-2 size-5" />
            Novo Cliente
          </Button>
        </div>
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
          advancedFilters={ws.advancedFilters}
          advancedFilterCount={ws.advancedFilterCount}
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
          router={ws.router}
        />
      </div>
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

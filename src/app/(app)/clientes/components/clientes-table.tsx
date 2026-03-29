"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { StatusBadge } from "@/components/shared/status-badge";
import { HoverPopover } from "@/components/shared/hover-popover";
import { ClienteThumbnail } from "@/components/shared/cliente-thumbnail";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { formatDate } from "@/lib/formatters";
import type { Aluno } from "@/lib/types";

const SEXO_LABEL: Record<string, string> = {
  M: "Masculino",
  F: "Feminino",
  OUTRO: "Outro",
};

const COLUMNS = [
  { label: "Cliente" },
  { label: "CPF" },
  { label: "Telefone" },
  { label: "Nascimento" },
  { label: "Sexo" },
  { label: "Status" },
];

interface ClientesTableProps {
  items: Aluno[];
  loading: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  bulkActions: { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void }[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClienteClick: (aluno: Aluno) => void;
  router: AppRouterInstance;
}

export function ClientesTable({
  items,
  loading,
  selectedIds,
  onSelectionChange,
  bulkActions,
  page,
  pageSize,
  total,
  hasNext,
  onPrevious,
  onNext,
  onClienteClick,
  router,
}: ClientesTableProps) {
  return (
    <PaginatedTable<Aluno>
      isLoading={loading}
      itemLabel="clientes"
      tableAriaLabel="Tabela de clientes"
      selectable
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      bulkActions={bulkActions}
      columns={COLUMNS}
      items={items}
      emptyText="Nenhum cliente encontrado"
      getRowKey={(aluno) => aluno.id}
      onRowClick={(aluno) => router.push(`/clientes/${aluno.id}`)}
      rowClassName={() => "cursor-pointer transition-colors hover:bg-secondary/40"}
      renderCells={(aluno) => (
        <>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <ClienteThumbnail nome={aluno.nome} foto={aluno.foto} size="sm" />
              <div>
                <button
                  type="button"
                  className="cursor-pointer text-left text-sm font-medium hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClienteClick(aluno);
                  }}
                >
                  {aluno.nome}
                </button>
                {aluno.pendenteComplementacao ? (
                  <p className="text-xs uppercase tracking-wider text-amber-400">
                    Pré-cadastro
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">{aluno.email}</p>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">{aluno.cpf}</td>
          <td className="px-4 py-3 text-sm text-muted-foreground">{aluno.telefone}</td>
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {formatDate(aluno.dataNascimento)}
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {SEXO_LABEL[aluno.sexo] ?? aluno.sexo}
          </td>
          <td className="px-4 py-3">
            {aluno.status === "SUSPENSO" && aluno.suspensao ? (
              <HoverPopover
                content={
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Suspensão
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {aluno.suspensao.motivo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {aluno.suspensao.inicio || aluno.suspensao.fim
                        ? `${aluno.suspensao.inicio ? formatDate(aluno.suspensao.inicio) : "Imediato"} → ${aluno.suspensao.fim ? formatDate(aluno.suspensao.fim) : "Indeterminado"}`
                        : "Prazo indeterminado"}
                    </p>
                  </div>
                }
              >
                <StatusBadge status={aluno.status} />
              </HoverPopover>
            ) : (
              <StatusBadge status={aluno.status} />
            )}
          </td>
        </>
      )}
      page={page}
      pageSize={pageSize}
      total={total}
      hasNext={hasNext}
      onPrevious={onPrevious}
      onNext={onNext}
    />
  );
}

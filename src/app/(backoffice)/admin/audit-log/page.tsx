"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { useAdminAuditLog } from "@/backoffice/query";
import type {
  AuditLogAction,
  AuditLogEntityType,
  AuditLogEntry,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<AuditLogAction, string> = {
  CRIOU: "Criou",
  EDITOU: "Editou",
  EXCLUIU: "Excluiu",
  SUSPENDEU: "Suspendeu",
  ATIVOU: "Ativou",
  CANCELOU: "Cancelou",
  IMPORTOU: "Importou",
  IMPERSONOU: "Impersonou",
  ENCERROU_IMPERSONACAO: "Encerrou impersonação",
};

const ACTION_COLORS: Record<AuditLogAction, string> = {
  CRIOU: "bg-gym-teal/15 text-gym-teal border-gym-teal/30",
  EDITOU: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  EXCLUIU: "bg-gym-danger/15 text-gym-danger border-gym-danger/30",
  SUSPENDEU: "bg-gym-warning/15 text-gym-warning border-gym-warning/30",
  ATIVOU: "bg-gym-teal/15 text-gym-teal border-gym-teal/30",
  CANCELOU: "bg-gym-danger/15 text-gym-danger border-gym-danger/30",
  IMPORTOU: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  IMPERSONOU: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  ENCERROU_IMPERSONACAO: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
};

const ENTITY_LABELS: Record<AuditLogEntityType, string> = {
  ACADEMIA: "Academia",
  UNIDADE: "Unidade",
  USUARIO: "Usuário",
  CONTRATO: "Contrato",
  ALUNO: "Aluno",
  MATRICULA: "Matrícula",
  PAGAMENTO: "Pagamento",
  PERFIL: "Perfil",
  PLANO: "Plano",
};

function formatTimestamp(ts: string): string {
  if (!ts) return "—";
  try {
    const date = new Date(ts);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export default function AuditLogPage() {
  const [page, setPage] = useState(0);

  const [filterAction, setFilterAction] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  const auditQuery = useAdminAuditLog({
    page,
    size: PAGE_SIZE,
    action: filterAction || undefined,
    entityType: filterEntityType || undefined,
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
    query: filterQuery || undefined,
  });

  const items = auditQuery.data?.items ?? [];
  const total = auditQuery.data?.total;
  const hasNext = auditQuery.data?.hasNext ?? false;
  const loading = auditQuery.isLoading;
  const error = auditQuery.error ? normalizeErrorMessage(auditQuery.error) : null;

  function handleClearFilters() {
    setFilterAction("");
    setFilterEntityType("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterQuery("");
    setPage(0);
  }

  const hasActiveFilters =
    filterAction || filterEntityType || filterStartDate || filterEndDate || filterQuery;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Timeline de ações administrativas realizadas no backoffice.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs text-muted-foreground">Buscar</label>
          <Input
            placeholder="Usuário, entidade..."
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <div className="w-40">
          <label className="mb-1 block text-xs text-muted-foreground">Ação</label>
          <Select
            value={filterAction}
            onValueChange={(v) => {
              setFilterAction(v === "__all__" ? "" : v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <label className="mb-1 block text-xs text-muted-foreground">Entidade</label>
          <Select
            value={filterEntityType}
            onValueChange={(v) => {
              setFilterEntityType(v === "__all__" ? "" : v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <label className="mb-1 block text-xs text-muted-foreground">Data início</label>
          <Input
            type="date"
            value={filterStartDate}
            onChange={(e) => {
              setFilterStartDate(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <div className="w-40">
          <label className="mb-1 block text-xs text-muted-foreground">Data fim</label>
          <Input
            type="date"
            value={filterEndDate}
            onChange={(e) => {
              setFilterEndDate(e.target.value);
              setPage(0);
            }}
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <PaginatedTable<AuditLogEntry>
        tableAriaLabel="Audit log de ações administrativas"
        columns={[
          { label: "Data/Hora", className: "w-40" },
          { label: "Usuário", className: "w-40" },
          { label: "Ação", className: "w-28" },
          { label: "Entidade", className: "w-28" },
          { label: "Nome", className: "w-48" },
          { label: "Academia" },
          { label: "Detalhes" },
        ]}
        items={items}
        emptyText="Nenhum registro de audit log encontrado"
        getRowKey={(entry) => entry.id}
        renderCells={(entry) => (
          <>
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
              {formatTimestamp(entry.timestamp)}
            </TableCell>
            <TableCell className="text-sm">{entry.userName}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={ACTION_COLORS[entry.action] ?? ""}
              >
                {ACTION_LABELS[entry.action] ?? entry.action}
              </Badge>
            </TableCell>
            <TableCell>
              <span className="text-xs text-muted-foreground">
                {ENTITY_LABELS[entry.entityType] ?? entry.entityType}
              </span>
            </TableCell>
            <TableCell className="text-sm">{entry.entityName}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {entry.academiaNome ?? "—"}
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
              {entry.detalhes ?? "—"}
            </TableCell>
          </>
        )}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        hasNext={hasNext}
        onPrevious={() => setPage(Math.max(0, page - 1))}
        onNext={() => setPage(page + 1)}
        disablePrevious={page === 0}
        disableNext={!hasNext}
        isLoading={loading}
        itemLabel="registro"
      />
    </div>
  );
}

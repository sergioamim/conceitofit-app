"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar, type BulkAction } from "@/components/shared/bulk-action-bar";
import { cn } from "@/lib/utils";

export type PaginatedTableColumn = {
  label: string;
  className?: string;
  ariaLabel?: string;
  sort?: "ascending" | "descending" | "none" | "other";
};

type PaginatedTableProps<T> = {
  columns: PaginatedTableColumn[];
  items: T[];
  emptyText: string;
  renderCells: (item: T) => ReactNode;
  getRowKey: (item: T) => string;
  rowClassName?: (item: T) => string;
  onRowClick?: (item: T) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  hasNext?: boolean;
  totalPages?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  showPagination?: boolean;
  itemLabel?: string;
  tableAriaLabel?: string;
  isLoading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: BulkAction[];
};

export function PaginatedTable<T>({
  columns,
  items,
  emptyText,
  renderCells,
  getRowKey,
  rowClassName = () => "",
  onRowClick,
  page = 0,
  pageSize = 0,
  total,
  hasNext = false,
  totalPages,
  onPrevious,
  onNext,
  disablePrevious,
  disableNext,
  showPagination = true,
  itemLabel = "registros",
  tableAriaLabel,
  isLoading = false,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
}: PaginatedTableProps<T>) {
  const totalCount = total ?? items.length;
  const currentPage = Math.max(0, page);
  const effectiveSize = pageSize > 0 ? pageSize : items.length;
  const startIndex = effectiveSize > 0 ? currentPage * effectiveSize : 0;
  const rangeStart = items.length > 0 ? startIndex + 1 : 0;
  const rangeEnd = items.length > 0 ? startIndex + items.length : 0;
  const hasNextPage = Boolean(hasNext);
  const hasPreviousPage = currentPage > 0;
  const effectiveTotalPages =
    typeof totalPages === "number"
      ? Math.max(0, totalPages)
      : total !== undefined && effectiveSize > 0
        ? Math.max(0, Math.ceil(total / effectiveSize))
        : undefined;
  const previousDisabled = (disablePrevious ?? false) || !hasPreviousPage || !onPrevious;
  const nextDisabled = (disableNext ?? false) || !hasNextPage || !onNext;

  const allSelectedOnPage = items.length > 0 && items.every((item) => selectedIds.includes(getRowKey(item)));
  const someSelectedOnPage = items.length > 0 && items.some((item) => selectedIds.includes(getRowKey(item))) && !allSelectedOnPage;

  const handleToggleAllOnPage = () => {
    if (!onSelectionChange) return;
    if (allSelectedOnPage) {
      const visibleIds = items.map(getRowKey);
      onSelectionChange(selectedIds.filter(id => !visibleIds.includes(id)));
    } else {
      const visibleIds = items.map(getRowKey);
      const newSelected = new Set([...selectedIds, ...visibleIds]);
      onSelectionChange(Array.from(newSelected));
    }
  };

  const handleToggleRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(v => v !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (isLoading) {
    return (
      <TableSkeleton
        columns={columns.map((col) => ({ label: col.label, className: col.className }))}
        rowCount={effectiveSize > 0 ? Math.min(effectiveSize, 10) : 5}
        showPagination={showPagination}
        selectable={selectable}
      />
    );
  }

  const resolvedTableAriaLabel = tableAriaLabel ?? `Tabela paginada de ${itemLabel}`;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border">
        <Table
          role="grid"
          aria-label={resolvedTableAriaLabel}
          aria-rowcount={items.length}
          aria-colcount={columns.length + (selectable ? 1 : 0)}
          aria-multiselectable={selectable || undefined}
        >
          <TableHeader>
            <TableRow className="border-b border-border bg-secondary">
              {selectable && (
                <TableHead className="w-[50px] px-4 py-3" scope="col" aria-label="Selecionar linhas">
                  <Checkbox 
                    checked={allSelectedOnPage}
                    indeterminate={someSelectedOnPage}
                    onCheckedChange={handleToggleAllOnPage}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.label}
                  scope="col"
                  aria-label={column.ariaLabel ?? column.label}
                  aria-sort={column.sort ?? "none"}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${column.className ?? ""}`}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="py-10 text-center text-sm text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => {
              const key = getRowKey(item);
              const isSelected = selectedIds.includes(key);
              return (
                <TableRow
                  key={key}
                  className={cn(rowClassName(item), isSelected && "bg-muted/50")}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(item);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-selected={selectable ? isSelected : undefined}
                >
                  {selectable && (
                    <TableCell className="w-[50px] px-4 py-3">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleToggleRow(key)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar linha ${key}`}
                      />
                    </TableCell>
                  )}
                  {renderCells(item)}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {showPagination ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{rangeStart}</span> até{" "}
            <span className="font-semibold text-foreground">{rangeEnd}</span> de{" "}
            <span className="font-semibold text-foreground">{totalCount}</span> {itemLabel} · página{" "}
            <span className="font-semibold text-foreground">{page + 1}</span>
            {typeof effectiveTotalPages === "number" ? (
              <>
                {" "}
                de <span className="font-semibold text-foreground">{Math.max(1, effectiveTotalPages)}</span>
              </>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-border"
              disabled={previousDisabled}
              onClick={onPrevious}
              aria-label={`Ir para a página anterior. Página atual ${page + 1}.`}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border"
              disabled={nextDisabled}
              onClick={onNext}
              aria-label={`Ir para a próxima página. Página atual ${page + 1}.`}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}

      {bulkActions && bulkActions.length > 0 && selectedIds.length > 0 && onSelectionChange && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          actions={bulkActions}
          onClearSelection={() => onSelectionChange([])}
          selectedIds={selectedIds}
        />
      )}
    </div>
  );
}

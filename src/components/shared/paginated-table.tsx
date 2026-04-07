"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar, type BulkAction } from "@/components/shared/bulk-action-bar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="space-y-4">
      <div className="glass-card overflow-hidden rounded-2xl border shadow-lg shadow-black/5">
        <Table
          aria-label={resolvedTableAriaLabel}
          aria-rowcount={items.length}
          aria-colcount={columns.length + (selectable ? 1 : 0)}
          aria-multiselectable={selectable || undefined}
        >
          <TableHeader>
            <TableRow className="border-none bg-muted/40 hover:bg-muted/40 transition-none">
              {selectable && (
                <TableHead className="w-[50px] pl-6 py-4" scope="col" aria-label="Selecionar linhas">
                  <Checkbox 
                    checked={allSelectedOnPage}
                    indeterminate={someSelectedOnPage}
                    onCheckedChange={handleToggleAllOnPage}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
              )}
              {columns.map((column, i) => (
                <TableHead
                  key={column.label}
                  scope="col"
                  aria-label={column.ariaLabel ?? column.label}
                  aria-sort={column.sort ?? "none"}
                  className={cn(
                    "py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70",
                    !selectable && i === 0 && "pl-6",
                    column.className
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center opacity-40">
                    <p className="text-lg font-medium">{emptyText}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => {
                  const key = getRowKey(item);
                  const isSelected = selectedIds.includes(key);
                  return (
                    <motion.tr
                      as="tr"
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className={cn(
                        "group border-b border-border/20 transition-colors cursor-pointer hover:bg-primary/5",
                        isSelected && "bg-primary/[0.03]",
                        rowClassName(item)
                      )}
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
                        <TableCell className="w-[50px] pl-6 py-5">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleToggleRow(key)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Selecionar linha ${key}`}
                          />
                        </TableCell>
                      )}
                      {/* Note: renderCells needs to return TableCell components */}
                      {renderCells(item)}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 rounded-2xl border border-border/40 bg-muted/5 backdrop-blur-sm shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">
            Exibindo <span className="text-foreground font-bold">{rangeStart}-{rangeEnd}</span> de <span className="text-foreground font-bold">{totalCount}</span> {itemLabel}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/60 hover:bg-background"
              disabled={previousDisabled}
              onClick={onPrevious}
            >
              <ChevronLeft size={16} className="mr-1" />
              Anterior
            </Button>
            <div className="flex items-center gap-1 mx-2">
              <span className="size-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20">
                {page + 1}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/60 hover:bg-background"
              disabled={nextDisabled}
              onClick={onNext}
            >
              Próxima
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

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

"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type PaginatedTableColumn = {
  label: string;
  className?: string;
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
  onPrevious?: () => void;
  onNext?: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  showPagination?: boolean;
  itemLabel?: string;
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
  onPrevious,
  onNext,
  disablePrevious,
  disableNext,
  showPagination = true,
  itemLabel = "registros",
}: PaginatedTableProps<T>) {
  const totalCount = total ?? items.length;
  const currentPage = Math.max(0, page);
  const effectiveSize = pageSize > 0 ? pageSize : items.length;
  const startIndex = effectiveSize > 0 ? currentPage * effectiveSize : 0;
  const rangeStart = items.length > 0 ? startIndex + 1 : 0;
  const rangeEnd = items.length > 0 ? startIndex + items.length : 0;
  const hasNextPage = Boolean(hasNext);
  const hasPreviousPage = currentPage > 0;
  const previousDisabled = (disablePrevious ?? false) || !hasPreviousPage || !onPrevious;
  const nextDisabled = (disableNext ?? false) || !hasNextPage || !onNext;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-secondary">
              {columns.map((column) => (
                <TableHead key={column.label} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${column.className ?? ""}`}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => {
              const key = getRowKey(item);
              return (
                <TableRow
                  key={key}
                  className={rowClassName(item)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
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
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-border"
              disabled={previousDisabled}
              onClick={onPrevious}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border"
              disabled={nextDisabled}
              onClick={onNext}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

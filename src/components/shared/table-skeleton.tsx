import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export type TableSkeletonProps = {
  columns: Array<{ label: string; className?: string }>;
  rowCount?: number;
  showPagination?: boolean;
  selectable?: boolean;
};

export function TableSkeleton({ columns, rowCount = 5, showPagination = true, selectable = false }: TableSkeletonProps) {
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-secondary">
              {selectable && (
                <TableHead className="w-[50px] px-4 py-3">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                </TableHead>
              )}
              {columns.map((column, i) => (
                <TableHead key={i} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${column.className ?? ""}`}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                {selectable && (
                  <TableCell className="w-[50px] px-4 py-4">
                    <Skeleton className="h-4 w-4 rounded-sm" />
                  </TableCell>
                )}
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex} className="px-4 py-4">
                    <Skeleton className="h-4 w-full max-w-[80%]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {showPagination && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
          <Skeleton className="h-4 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      )}
    </div>
  );
}

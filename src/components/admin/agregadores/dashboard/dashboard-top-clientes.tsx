"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL, formatDateTimeBR } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { DashboardTopCliente } from "@/lib/api/agregadores-admin";

/**
 * AG-12 — Tabela Top Clientes (até 20 registros).
 *
 * Colunas: nome (fallback externalUserId), agregador (badge), check-ins,
 * valor total, última visita. Ordenável por check-ins / valor / última visita.
 * Deep link para `/clientes/{alunoId}` só quando há `alunoId`.
 */
type SortKey = "checkins" | "valor" | "ultimaVisita";
type SortDir = "asc" | "desc";

export function DashboardTopClientes({
  clientes,
}: {
  clientes: DashboardTopCliente[];
}) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("checkins");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...clientes];
    copy.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy.slice(0, 20);
  }, [clientes, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (clientes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
        Sem clientes no período.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border" data-testid="top-clientes-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Agregador</TableHead>
            <TableHead className="text-right">
              <SortButton
                label="Check-ins"
                active={sortKey === "checkins"}
                dir={sortDir}
                onClick={() => toggleSort("checkins")}
                testid="sort-checkins"
              />
            </TableHead>
            <TableHead className="text-right">
              <SortButton
                label="Valor total"
                active={sortKey === "valor"}
                dir={sortDir}
                onClick={() => toggleSort("valor")}
                testid="sort-valor"
              />
            </TableHead>
            <TableHead className="text-right">
              <SortButton
                label="Última visita"
                active={sortKey === "ultimaVisita"}
                dir={sortDir}
                onClick={() => toggleSort("ultimaVisita")}
                testid="sort-ultima-visita"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((c, i) => {
            const display = c.nome ?? c.externalUserId;
            const key = c.alunoId ?? `${c.externalUserId}-${i}`;
            const hasDeepLink = Boolean(c.alunoId);
            return (
              <TableRow
                key={key}
                className={cn(
                  hasDeepLink && "cursor-pointer hover:bg-secondary/40",
                )}
                onClick={
                  hasDeepLink
                    ? () => router.push(`/clientes/${c.alunoId}`)
                    : undefined
                }
                data-testid={`top-cliente-row-${c.externalUserId}`}
                data-aluno-id={c.alunoId ?? ""}
              >
                <TableCell className="font-medium">
                  {display}
                  {c.nome ? (
                    <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                      {c.externalUserId}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border text-[11px] font-semibold",
                      c.agregador === "WELLHUB"
                        ? "border-gym-accent/30 bg-gym-accent/10 text-gym-accent"
                        : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
                    )}
                  >
                    {c.agregador}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {c.checkins.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatBRL(c.valorTotal)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatDateTimeBR(c.ultimaVisita)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
  testid,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      data-dir={active ? dir : "none"}
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="size-3" aria-hidden />
        ) : (
          <ArrowDown className="size-3" aria-hidden />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-40" aria-hidden />
      )}
    </button>
  );
}

function getSortValue(
  c: DashboardTopCliente,
  key: SortKey,
): number | string {
  if (key === "checkins") return c.checkins;
  if (key === "valor") return c.valorTotal;
  return c.ultimaVisita;
}

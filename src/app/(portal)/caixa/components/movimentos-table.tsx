"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export interface MovimentoRow {
  id: string;
  tipo: string;
  valor: number;
  formaPagamento: string | null;
  dataMovimento: string;
}

interface MovimentosTableProps {
  items: MovimentoRow[];
  pageSize?: number;
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function MovimentoDataCell({ iso }: { iso: string }) {
  const [formatted, setFormatted] = useState<string>("");
  useEffect(() => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormatted(iso);
      return;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const next = `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(
      date.getHours(),
    )}:${pad(date.getMinutes())}`;
    setFormatted(next);
  }, [iso]);
  // Placeholder estável durante SSR para hydrations limpas.
  return <span>{formatted || "—"}</span>;
}

/**
 * Tabela de movimentos do caixa — paginada client-side. Como o endpoint
 * dedicado `GET /api/caixas/{id}/movimentos` não existe em CXO-105, a
 * tabela consome uma lista em memória (alimentada por sangria e futuros
 * eventos). Ordenação: mais recentes primeiro.
 */
export function MovimentosTable({
  items,
  pageSize = 10,
}: MovimentosTableProps) {
  const [page, setPage] = useState(0);

  const ordered = useMemo(
    () =>
      [...items].sort((a, b) =>
        a.dataMovimento < b.dataMovimento ? 1 : -1,
      ),
    [items],
  );

  const totalPages = Math.max(1, Math.ceil(ordered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const startIdx = safePage * pageSize;
  const slice = ordered.slice(startIdx, startIdx + pageSize);

  return (
    <section
      className="rounded-2xl border border-border/60 bg-card p-0 shadow-sm"
      data-testid="movimentos-table"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Movimentos
          </h3>
          <p className="text-xs text-muted-foreground">
            {ordered.length}{" "}
            {ordered.length === 1 ? "registro" : "registros"}
          </p>
        </div>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2 text-xs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              Anterior
            </Button>
            <span className="text-muted-foreground">
              {safePage + 1}/{totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage + 1 >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              Próxima
            </Button>
          </div>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6">Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Forma de pagamento</TableHead>
            <TableHead className="text-right pr-6">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slice.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="px-6 py-6 text-center text-xs text-muted-foreground"
              >
                Nenhum movimento registrado ainda.
              </TableCell>
            </TableRow>
          ) : (
            slice.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="px-6 font-mono text-xs">
                  <MovimentoDataCell iso={m.dataMovimento} />
                </TableCell>
                <TableCell className="text-xs font-semibold uppercase tracking-wide">
                  {m.tipo}
                </TableCell>
                <TableCell className="text-xs">
                  {m.formaPagamento ?? "—"}
                </TableCell>
                <TableCell className="pr-6 text-right text-sm font-semibold">
                  {BRL.format(m.valor)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

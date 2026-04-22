"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import type {
  AgregadorTipo,
  AgregadorWebhookEvento,
} from "@/lib/api/agregadores-admin";
import {
  useAgregadorEventos,
  useReprocessarAgregadorEvento,
} from "@/lib/query/use-agregadores-admin";

const PAGE_SIZE = 25;

type TipoFilter = "ALL" | AgregadorTipo;

export function AgregadoresEventosView() {
  const searchParams = useSearchParams();
  const tenantId = searchParams?.get("tenantId") ?? "";
  const tipoFromUrl = searchParams?.get("tipo") ?? null;

  const initialTipo: TipoFilter =
    tipoFromUrl === "WELLHUB" || tipoFromUrl === "TOTALPASS"
      ? tipoFromUrl
      : "ALL";

  const [tipoFilter, setTipoFilter] = useState<TipoFilter>(initialTipo);
  const [eventType, setEventType] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const query = useAgregadorEventos({
    tenantId,
    tipo: tipoFilter === "ALL" ? undefined : tipoFilter,
    eventType: eventType.trim() || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const reprocessar = useReprocessarAgregadorEvento(tenantId);
  const { toast } = useToast();

  function handleReprocessar(evento: AgregadorWebhookEvento) {
    reprocessar.mutate(
      { tipo: evento.agregador, eventId: evento.id },
      {
        onSuccess: (res) => {
          toast({
            title: res.success ? "Reprocessamento iniciado" : "Falha",
            description: res.message || undefined,
            variant: res.success ? "default" : "destructive",
          });
        },
        onError: (err) => {
          toast({
            title: "Falha ao reprocessar",
            description: err?.message || "Erro desconhecido",
            variant: "destructive",
          });
        },
      },
    );
  }

  const backToDashboardHref = useMemo(() => {
    return tenantId
      ? `/admin/integracoes/agregadores?tenantId=${encodeURIComponent(tenantId)}`
      : "/admin/integracoes/agregadores";
  }, [tenantId]);

  if (!tenantId) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-8 text-sm text-muted-foreground">
        Informe um tenant via <code>?tenantId=...</code> na URL.
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="agregadores-eventos-view"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href={backToDashboardHref}>
            <ArrowLeft className="mr-1 size-4" />
            Voltar ao dashboard
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          Tenant: <span className="font-mono">{tenantId}</span>
        </p>
      </div>

      {/* Filtros */}
      <fieldset
        className="grid gap-3 rounded-lg border px-3 py-3 md:grid-cols-5"
        data-testid="agregadores-eventos-filtros"
      >
        <legend className="px-1 text-xs font-semibold uppercase text-muted-foreground">
          Filtros
        </legend>
        <div className="space-y-1.5">
          <Label htmlFor="filter-tipo">Agregador</Label>
          <Select
            value={tipoFilter}
            onValueChange={(v) => {
              setTipoFilter(v as TipoFilter);
              setPage(0);
            }}
          >
            <SelectTrigger id="filter-tipo" className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="WELLHUB">Wellhub</SelectItem>
              <SelectItem value="TOTALPASS">TotalPass</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-event-type">Event type</Label>
          <Input
            id="filter-event-type"
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value);
              setPage(0);
            }}
            placeholder="ex: CHECK_IN"
            data-testid="filter-event-type"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(0);
            }}
          >
            <SelectTrigger id="filter-status" className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="PROCESSED">PROCESSED</SelectItem>
              <SelectItem value="FAILED">FAILED</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-from">De</Label>
          <Input
            id="filter-from"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-to">Até</Label>
          <Input
            id="filter-to"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </fieldset>

      {/* Tabela */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Criado em</TableHead>
              <TableHead>Agregador</TableHead>
              <TableHead>Event type</TableHead>
              <TableHead>Gym ID</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-xs text-muted-foreground"
                  data-testid="agregadores-eventos-empty"
                >
                  {query.isLoading
                    ? "Carregando eventos..."
                    : "Nenhum evento encontrado. Endpoint de listagem ainda não disponível. [TODO: AG-7.10.backend]"}
                </TableCell>
              </TableRow>
            ) : (
              items.map((evento) => (
                <TableRow
                  key={evento.id}
                  data-testid={`evento-row-${evento.id}`}
                >
                  <TableCell className="font-mono text-xs">
                    {evento.createdAt}
                  </TableCell>
                  <TableCell>{evento.agregador}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {evento.eventType}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {evento.externalGymId ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {evento.externalUserId ?? "—"}
                  </TableCell>
                  <TableCell>{evento.status}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReprocessar(evento)}
                      disabled={reprocessar.isPending}
                      data-testid={`evento-reprocessar-${evento.id}`}
                    >
                      <RefreshCw className="mr-1 size-3" />
                      Reprocessar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {total > 0
            ? `Mostrando ${items.length} de ${total} eventos`
            : "Sem eventos."}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            data-testid="pagination-prev"
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page + 1} de {pageCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page + 1 >= pageCount}
            data-testid="pagination-next"
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

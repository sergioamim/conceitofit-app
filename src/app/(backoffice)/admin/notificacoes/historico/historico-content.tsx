"use client";

/**
 * Histórico de emissões manuais de notificações globais
 * (Epic 4 — Story 4.24).
 *
 * UI tolerante ao endpoint BE ainda não publicado: se a requisição falhar
 * a página exibe um card informativo com retry manual, mas não bloqueia
 * a compilação nem a navegação para a página de emissão.
 */

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  History,
  Info,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { listHistoricoNotificacoesApi } from "@/lib/api/notificacoes-inbox";
import type {
  HistoricoNotificacaoItem,
  HistoricoNotificacoesResponse,
  NotificacaoAudienceTipo,
  NotificacaoSeveridade,
} from "@/lib/shared/types/notificacao-inbox";

// ---------------------------------------------------------------------------
// Visual helpers
// ---------------------------------------------------------------------------

type FiltroAudience = "TODAS" | NotificacaoAudienceTipo;

const SEVERIDADE_STYLE: Record<
  NotificacaoSeveridade,
  { label: string; className: string; Icon: typeof Info }
> = {
  INFO: {
    label: "Info",
    className: "bg-gym-primary/15 text-gym-primary border-gym-primary/30",
    Icon: Info,
  },
  AVISO: {
    label: "Aviso",
    className: "bg-gym-warning/15 text-gym-warning border-gym-warning/30",
    Icon: AlertCircle,
  },
  URGENTE: {
    label: "Urgente",
    className: "bg-gym-danger/15 text-gym-danger border-gym-danger/30",
    Icon: AlertTriangle,
  },
};

const AUDIENCE_LABELS: Record<NotificacaoAudienceTipo, string> = {
  GLOBAL: "Global",
  REDE: "Rede",
  TENANT: "Tenant",
  ROLE: "Papel",
  USUARIO: "Usuário",
};

const PAGE_LIMIT = 50;

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function HistoricoNotificacoesContent() {
  const [filtroAudience, setFiltroAudience] = useState<FiltroAudience>("TODAS");
  const [busca, setBusca] = useState("");

  const query = useInfiniteQuery<
    HistoricoNotificacoesResponse,
    Error,
    InfiniteData<HistoricoNotificacoesResponse>,
    readonly [string, FiltroAudience],
    string | null
  >({
    queryKey: ["notif-admin-historico", filtroAudience] as const,
    queryFn: ({ pageParam }) =>
      listHistoricoNotificacoesApi({
        limit: PAGE_LIMIT,
        cursor: pageParam ?? undefined,
        audienceTipo:
          filtroAudience === "TODAS" ? undefined : filtroAudience,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
    retry: false,
  });

  const items = useMemo<HistoricoNotificacaoItem[]>(() => {
    return (query.data?.pages ?? []).flatMap((p) => p.items);
  }, [query.data?.pages]);

  const filtered = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return items;
    return items.filter((i) => {
      return (
        i.titulo.toLowerCase().includes(termo) ||
        i.evento.toLowerCase().includes(termo)
      );
    });
  }, [items, busca]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gym-accent/10 text-gym-accent">
            <History className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Histórico de notificações
            </h1>
            <p className="text-sm text-muted-foreground">
              Auditoria de emissões manuais — busca por título/evento e filtro por público.
            </p>
          </div>
        </div>
        <Link href="/admin/notificacoes/emitir">
          <Button variant="outline" size="sm">
            Emitir notificação
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
      </header>

      <Card className="gap-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Público</span>
            <Select
              value={filtroAudience}
              onValueChange={(v) => setFiltroAudience(v as FiltroAudience)}
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todos</SelectItem>
                <SelectItem value="GLOBAL">Global</SelectItem>
                <SelectItem value="REDE">Rede</SelectItem>
                <SelectItem value="TENANT">Tenant</SelectItem>
                <SelectItem value="ROLE">Papel</SelectItem>
                <SelectItem value="USUARIO">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título ou evento..."
              className="pl-9"
              aria-label="Buscar por título ou evento"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={cn(
                "mr-2 size-4",
                query.isFetching && "animate-spin",
              )}
            />
            Atualizar
          </Button>
        </div>
      </Card>

      <HistoricoBody
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        items={filtered}
        retry={() => query.refetch()}
      />

      {query.isError ? null : query.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Carregando…
              </>
            ) : (
              "Carregar mais"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Corpo da lista
// ---------------------------------------------------------------------------

function HistoricoBody({
  isLoading,
  isError,
  error,
  items,
  retry,
}: {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  items: HistoricoNotificacaoItem[];
  retry: () => void;
}) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="space-y-4 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gym-warning/10 text-gym-warning">
          <AlertTriangle className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold">
            Histórico indisponível
          </h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            O endpoint de histórico ainda não está disponível no backend.
            Notificações emitidas continuam sendo registradas normalmente.
            Tente novamente em alguns instantes.
          </p>
          {error?.message ? (
            <p className="mt-2 text-xs text-muted-foreground/70">
              Detalhe técnico: {error.message}
            </p>
          ) : null}
        </div>
        <Button type="button" onClick={retry} variant="outline" size="sm">
          <RefreshCw className="mr-2 size-4" />
          Tentar novamente
        </Button>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma notificação emitida ainda.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Data/hora</TableHead>
              <TableHead className="w-[110px]">Severidade</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="w-[120px]">Público</TableHead>
              <TableHead className="w-[130px] text-right">Destinatários</TableHead>
              <TableHead className="w-[220px]">Emitido por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <HistoricoRow key={item.eventoId} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Linha
// ---------------------------------------------------------------------------

function HistoricoRow({
  item,
}: {
  item: HistoricoNotificacaoItem;
}): ReactElement {
  const severidade = SEVERIDADE_STYLE[item.severidade];
  const formattedDate = useFormattedDate(item.criadoEm);

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
        {formattedDate}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn("gap-1 font-semibold", severidade.className)}
        >
          <severidade.Icon className="size-3" />
          {severidade.label}
        </Badge>
      </TableCell>
      <TableCell className="min-w-[280px]">
        <div className="space-y-0.5">
          <p className="text-sm font-medium" title={item.titulo}>
            {item.titulo}
          </p>
          <p
            className="line-clamp-1 text-xs text-muted-foreground"
            title={item.evento}
          >
            {item.evento}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-medium">
          {AUDIENCE_LABELS[item.audienceTipo] ?? item.audienceTipo}
        </Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {item.destinatariosAtingidos.toLocaleString("pt-BR")}
      </TableCell>
      <TableCell
        className="truncate text-xs text-muted-foreground"
        title={item.emitidoPorEmail ?? undefined}
      >
        {item.emitidoPorEmail ?? "Sistema"}
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Formatação de data segura para SSR (placeholder estável até mount)
// ---------------------------------------------------------------------------

function useFormattedDate(iso: string): string {
  const [formatted, setFormatted] = useState<string>("—");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!iso) {
      setFormatted("—");
      return;
    }
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) {
        setFormatted(iso);
        return;
      }
      setFormatted(
        d.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      setFormatted(iso);
    }
  }, [iso]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return formatted;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  useContadoresInbox,
  useMarcarLida,
  useMarcarTodasLidas,
  useNotificacoesInboxInfinite,
  useRegistrarAcao,
} from "@/lib/query/use-notificacoes-inbox";
import type {
  NotificacaoInboxItem,
  NotificacaoSeveridade,
} from "@/lib/shared/types/notificacao-inbox";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type FiltroSeveridade = "TODAS" | NotificacaoSeveridade;

const SEVERIDADE_BADGE: Record<
  NotificacaoSeveridade,
  { label: string; className: string; Icon: typeof Bell }
> = {
  URGENTE: {
    label: "Urgente",
    className: "bg-gym-danger/15 text-gym-danger border-gym-danger/30",
    Icon: AlertTriangle,
  },
  AVISO: {
    label: "Aviso",
    className: "bg-gym-warning/15 text-gym-warning border-gym-warning/30",
    Icon: AlertCircle,
  },
  INFO: {
    label: "Info",
    className: "bg-gym-primary/15 text-gym-primary border-gym-primary/30",
    Icon: Info,
  },
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function NotificacoesContent() {
  const { tenantId: activeTenantId } = useTenantContext();
  const { toast } = useToast();

  const [filtroSeveridade, setFiltroSeveridade] =
    useState<FiltroSeveridade>("TODAS");
  const [apenasNaoLidas, setApenasNaoLidas] = useState<boolean>(false);

  const { data: contadores } = useContadoresInbox(activeTenantId ?? undefined);

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificacoesInboxInfinite(activeTenantId ?? undefined, {
    apenasNaoLidas,
  });

  const marcarLida = useMarcarLida(activeTenantId ?? undefined);
  const registrarAcao = useRegistrarAcao(activeTenantId ?? undefined);
  const marcarTodasLidas = useMarcarTodasLidas(activeTenantId ?? undefined);

  const todosItems = useMemo(() => {
    const pages = data?.pages ?? [];
    return pages.flatMap((page) => page.items);
  }, [data?.pages]);

  const itemsFiltrados = useMemo(() => {
    if (filtroSeveridade === "TODAS") return todosItems;
    return todosItems.filter((i) => i.severidade === filtroSeveridade);
  }, [todosItems, filtroSeveridade]);

  const naoLidas = contadores?.naoLidas ?? 0;

  const handleMarcarLida = useCallback(
    (item: NotificacaoInboxItem) => {
      marcarLida.mutate(item.id, {
        onSuccess: () => {
          toast({ title: "Notificacao marcada como lida" });
        },
        onError: () => {
          toast({
            title: "Nao foi possivel marcar como lida",
            variant: "destructive",
          });
        },
      });
    },
    [marcarLida, toast],
  );

  const handleRegistrarAcao = useCallback(
    (item: NotificacaoInboxItem) => {
      registrarAcao.mutate(item.id);
    },
    [registrarAcao],
  );

  const handleMarcarTodas = useCallback(() => {
    if (!activeTenantId || naoLidas === 0) return;
    marcarTodasLidas.mutate(undefined, {
      onSuccess: (result) => {
        toast({
          title: "Notificacoes marcadas como lidas",
          description: `${result.atualizadas} atualizada(s).`,
        });
      },
      onError: () => {
        toast({
          title: "Falha ao marcar todas como lidas",
          variant: "destructive",
        });
      },
    });
  }, [activeTenantId, marcarTodasLidas, naoLidas, toast]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Notificacoes
          </h1>
          <p className="text-sm text-muted-foreground">
            Todas as notificacoes do portal —{" "}
            <span className="font-medium">{naoLidas}</span> nao lida(s).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarcarTodas}
            disabled={naoLidas === 0 || marcarTodasLidas.isPending}
          >
            <CheckCheck className="mr-2 size-4" />
            Marcar todas como lidas
          </Button>
        </div>
      </header>

      <Card className="gap-4 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Severidade</span>
            <Select
              value={filtroSeveridade}
              onValueChange={(v) => setFiltroSeveridade(v as FiltroSeveridade)}
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="AVISO">Aviso</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={apenasNaoLidas}
              onCheckedChange={setApenasNaoLidas}
              aria-label="Apenas nao lidas"
            />
            <span className="text-muted-foreground">Apenas nao lidas</span>
          </label>

          {isFetching && !isFetchingNextPage ? (
            <span className="text-xs text-muted-foreground">Atualizando...</span>
          ) : null}
        </div>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Carregando notificacoes...
          </Card>
        ) : itemsFiltrados.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-10 text-center">
            <Bell className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhuma notificacao corresponde aos filtros.
            </p>
          </Card>
        ) : (
          itemsFiltrados.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onMarcarLida={() => handleMarcarLida(item)}
              onRegistrarAcao={() => handleRegistrarAcao(item)}
            />
          ))
        )}

        {hasNextPage ? (
          <div className="pt-2 text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card por notificacao
// ---------------------------------------------------------------------------

interface NotificationCardProps {
  item: NotificacaoInboxItem;
  onMarcarLida: () => void;
  onRegistrarAcao: () => void;
}

function NotificationCard({
  item,
  onMarcarLida,
  onRegistrarAcao,
}: NotificationCardProps) {
  const config = SEVERIDADE_BADGE[item.severidade] ?? SEVERIDADE_BADGE.INFO;
  const { Icon } = config;
  const lida = Boolean(item.lidaEm);

  return (
    <Card
      className={cn(
        "gap-3 p-4 transition-colors",
        !lida ? "border-gym-primary/30 bg-secondary/30" : "opacity-80",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", config.className)}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-[10px]", config.className)}
            >
              {config.label}
            </Badge>
            {!lida ? (
              <Badge variant="default" className="bg-gym-primary text-[10px]">
                Nao lida
              </Badge>
            ) : null}
            <AbsoluteTimeLabel iso={item.criadaEm} />
          </div>
          <h3
            className={cn(
              "mt-1 text-base",
              !lida ? "font-bold" : "font-medium",
            )}
          >
            {item.titulo}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.mensagem}</p>
        </div>
      </div>

      {(item.acaoUrl || !lida) ? (
        <div className="flex items-center justify-end gap-2 pt-1">
          {!lida ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onMarcarLida}
            >
              Marcar como lida
            </Button>
          ) : null}
          {item.acaoUrl ? (
            <Button
              type="button"
              size="sm"
              variant="default"
              asChild
              onClick={onRegistrarAcao}
            >
              <Link href={item.acaoUrl}>{item.acaoLabel ?? "Ver mais"}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

/** Exibe um timestamp absoluto (dd/mm/aaaa hh:mm) so apos mount, SSR-safe. */
function AbsoluteTimeLabel({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string>(() => iso.slice(0, 16).replace("T", " "));
  useEffect(() => {
    let cancelled = false;
    void import("@/lib/shared/formatters").then((mod) => {
      if (cancelled) return;
      try {
        setLabel(mod.formatDateTimeBR(iso));
      } catch {
        // mantem fallback
      }
    });
    return () => {
      cancelled = true;
    };
  }, [iso]);
  return (
    <span className="text-[11px] text-muted-foreground" title={iso}>
      {label}
    </span>
  );
}

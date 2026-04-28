"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  Info,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  useContadoresInbox,
  useMarcarLida,
  useMarcarTodasLidas,
  useNotificacoesInbox,
  useRegistrarAcao,
} from "@/lib/query/use-notificacoes-inbox";
import type {
  NotificacaoInboxItem,
  NotificacaoSeveridade,
} from "@/lib/shared/types/notificacao-inbox";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERIDADE_CONFIG: Record<
  NotificacaoSeveridade,
  { Icon: typeof Bell; iconClass: string; bgClass: string; label: string }
> = {
  URGENTE: {
    Icon: AlertTriangle,
    iconClass: "text-gym-danger",
    bgClass: "bg-gym-danger/10",
    label: "Urgente",
  },
  AVISO: {
    Icon: AlertCircle,
    iconClass: "text-gym-warning",
    bgClass: "bg-gym-warning/10",
    label: "Aviso",
  },
  INFO: {
    Icon: Info,
    iconClass: "text-gym-primary",
    bgClass: "bg-gym-primary/10",
    label: "Info",
  },
};

type GrupoTitulo = "Hoje" | "Ontem" | "Esta semana" | "Mais antigas";
const GROUP_ORDER: ReadonlyArray<GrupoTitulo> = [
  "Hoje",
  "Ontem",
  "Esta semana",
  "Mais antigas",
];

/**
 * Calcula um label de grupo (Hoje/Ontem/Esta semana/Mais antigas) a partir do
 * timestamp ISO da notificacao. Roda apenas client-side (chamado em useMemo
 * apos mount + apenas com dados da query, que so chega no client).
 */
function classifyGroup(criadaEmIso: string, nowMs: number): GrupoTitulo {
  const created = new Date(criadaEmIso).getTime();
  if (!Number.isFinite(created)) return "Mais antigas";

  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = todayStart - 6 * 24 * 60 * 60 * 1000;

  if (created >= todayStart) return "Hoje";
  if (created >= yesterdayStart) return "Ontem";
  if (created >= sevenDaysAgo) return "Esta semana";
  return "Mais antigas";
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function NotificationBellPortal() {
  const { tenantId: activeTenantId } = useTenantContext();
  const [open, setOpen] = useState(false);

  const { data: contadores } = useContadoresInbox(activeTenantId ?? undefined);
  const { data, isLoading } = useNotificacoesInbox(activeTenantId ?? undefined);

  const marcarLida = useMarcarLida(activeTenantId ?? undefined);
  const registrarAcao = useRegistrarAcao(activeTenantId ?? undefined);
  const marcarTodasLidas = useMarcarTodasLidas(activeTenantId ?? undefined);

  const naoLidas = contadores?.naoLidas ?? 0;
  const temUrgente = (contadores?.urgentesNaoLidas ?? 0) > 0;

  // SSR safety: agrupamento depende de Date.now() — calculado em efeito,
  // nunca no render. Antes do efeito rodar, `grupos` fica vazio e a UI
  // mostra fallback estavel.
  const [grupos, setGrupos] = useState<Map<GrupoTitulo, NotificacaoInboxItem[]>>(
    () => new Map<GrupoTitulo, NotificacaoInboxItem[]>(),
  );

  useEffect(() => {
    const items = data?.items ?? [];
    const nowMs = Date.now();
    const map = new Map<GrupoTitulo, NotificacaoInboxItem[]>();
    for (const item of items) {
      const key = classifyGroup(item.criadaEm, nowMs);
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    setGrupos(map);
  }, [data?.items]);

  const handleClickItem = useCallback(
    (item: NotificacaoInboxItem) => {
      if (item.acaoUrl) {
        registrarAcao.mutate(item.id);
        setOpen(false);
        return;
      }
      if (!item.lidaEm) {
        marcarLida.mutate(item.id);
      }
    },
    [marcarLida, registrarAcao],
  );

  const handleMarcarTodas = useCallback(() => {
    if (!activeTenantId || naoLidas === 0) return;
    marcarTodasLidas.mutate();
  }, [activeTenantId, marcarTodasLidas, naoLidas]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative size-10 rounded-xl text-muted-foreground"
          aria-label={
            naoLidas > 0
              ? `Notificacoes do portal (${naoLidas} nao lidas)`
              : "Notificacoes do portal"
          }
        >
          <Bell className="size-5" />
          {naoLidas > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gym-danger px-1 text-[10px] font-bold leading-none text-white"
            >
              {naoLidas > 99 ? "99+" : naoLidas}
            </span>
          ) : null}
          {temUrgente ? (
            <AlertCircle
              aria-label="Notificacao urgente nao lida"
              className="absolute -bottom-1 -right-1 size-3 fill-background text-gym-danger"
            />
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/40 px-4 py-3">
          <div className="flex items-center justify-between gap-2 pr-6">
            <SheetTitle className="text-base font-bold">
              Notificacoes
            </SheetTitle>
            {naoLidas > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={handleMarcarTodas}
                disabled={marcarTodasLidas.isPending}
              >
                <CheckCheck className="size-3.5" />
                Marcar todas como lidas
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Carregando notificacoes...
            </div>
          ) : (data?.items ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Bell className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificacao.
              </p>
            </div>
          ) : (
            GROUP_ORDER.map((title) => {
              const items = grupos.get(title);
              if (!items || items.length === 0) return null;
              return (
                <div key={title}>
                  <div className="sticky top-0 z-10 border-b border-border/30 bg-background/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 backdrop-blur">
                    {title}
                  </div>
                  {items.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      onActivate={() => handleClickItem(item)}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border/40 p-3 text-center">
          <Link
            href="/notificacoes"
            onClick={() => setOpen(false)}
            className="text-sm text-gym-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Linha de notificacao
// ---------------------------------------------------------------------------

interface NotificationRowProps {
  item: NotificacaoInboxItem;
  onActivate: () => void;
}

function NotificationRow({ item, onActivate }: NotificationRowProps) {
  const config = SEVERIDADE_CONFIG[item.severidade] ?? SEVERIDADE_CONFIG.INFO;
  const { Icon } = config;
  const lida = Boolean(item.lidaEm);

  const inner = (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      aria-label={`${lida ? "" : "Nao lida: "}${item.titulo}`}
      className={cn(
        "flex cursor-pointer gap-3 border-b border-border/20 px-4 py-3 transition-colors",
        !lida ? "bg-secondary/40 hover:bg-secondary/60" : "opacity-80 hover:bg-accent",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          config.bgClass,
        )}
      >
        <Icon className={cn("size-4", config.iconClass)} />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              !lida ? "font-bold" : "font-medium",
            )}
          >
            {item.titulo}
          </p>
          {!lida ? (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gym-primary" />
          ) : null}
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {item.mensagem}
        </p>
        <RelativeTime iso={item.criadaEm} />
      </div>
    </div>
  );

  if (item.acaoUrl) {
    return (
      <Link key={item.id} href={item.acaoUrl} className="block">
        {inner}
      </Link>
    );
  }

  return inner;
}

/**
 * Renderiza "ha X" so apos mount (SSR-safe).
 * Antes do mount, exibe o ISO truncado como fallback estavel.
 */
function RelativeTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string>(() => iso.slice(0, 16).replace("T", " "));

  useEffect(() => {
    let cancelled = false;
    void import("@/lib/shared/formatters").then((mod) => {
      if (cancelled) return;
      try {
        setLabel(mod.formatRelativeTime(iso));
      } catch {
        // mantem fallback
      }
    });
    return () => {
      cancelled = true;
    };
  }, [iso]);

  return <p className="text-[10px] text-muted-foreground/60">{label}</p>;
}

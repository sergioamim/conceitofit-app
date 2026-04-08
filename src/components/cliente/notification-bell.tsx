"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  CheckCheck,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time-format";
import {
  useNotificacoesAluno,
  useMarcarNotificacaoLida,
  useMarcarTodasLidas,
  type Notificacao,
  type NotificacaoTipo,
} from "@/lib/query/use-notificacoes-aluno";

const TIPO_CONFIG: Record<NotificacaoTipo, { icon: typeof Bell; color: string }> = {
  PAGAMENTO_VENCENDO: { icon: CreditCard, color: "text-gym-warning bg-gym-warning/10" },
  AULA_CONFIRMADA: { icon: CalendarCheck, color: "text-gym-teal bg-gym-teal/10" },
  TREINO_NOVO: { icon: Dumbbell, color: "text-blue-400 bg-blue-400/10" },
  MATRICULA_VENCENDO: { icon: AlertTriangle, color: "text-gym-danger bg-gym-danger/10" },
  GERAL: { icon: Info, color: "text-muted-foreground bg-muted/30" },
};

interface NotificationBellProps {
  tenantId: string | undefined;
  alunoId: string | undefined;
}

export function NotificationBell({ tenantId, alunoId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const { data: notificacoes = [] } = useNotificacoesAluno({
    tenantId,
    alunoId,
    enabled: !!alunoId,
  });

  const markOne = useMarcarNotificacaoLida();
  const markAll = useMarcarTodasLidas();

  const unreadCount = useMemo(
    () => notificacoes.filter((n) => !n.lida).length,
    [notificacoes],
  );

  const handleMarkRead = useCallback(
    (notificacao: Notificacao) => {
      if (notificacao.lida || !tenantId || !alunoId) return;
      markOne.mutate({
        tenantId,
        alunoId,
        notificacaoId: notificacao.id,
      });
    },
    [tenantId, alunoId, markOne],
  );

  const handleMarkAllRead = useCallback(() => {
    if (!tenantId || !alunoId) return;
    markAll.mutate({ tenantId, alunoId });
  }, [tenantId, alunoId, markAll]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 shrink-0 text-muted-foreground"
          aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
        >
          {unreadCount > 0 ? (
            <BellRing className="size-4" />
          ) : (
            <Bell className="size-4" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gym-danger px-1 text-[9px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96 p-0">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border/40 px-4 py-3">
          <SheetTitle className="text-base font-display font-bold">
            Notificações
          </SheetTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </Button>
          )}
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
          {notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>
            </div>
          ) : (
            notificacoes.slice(0, 30).map((notificacao) => {
              const config = TIPO_CONFIG[notificacao.tipo] ?? TIPO_CONFIG.GERAL;
              const Icon = config.icon;

              const content = (
                <div
                  key={notificacao.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 border-b border-border/20 transition-colors cursor-pointer",
                    !notificacao.lida
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/20",
                  )}
                  onClick={() => handleMarkRead(notificacao)}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl shrink-0",
                      config.color,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm truncate",
                          !notificacao.lida ? "font-bold" : "font-medium",
                        )}
                      >
                        {notificacao.titulo}
                      </p>
                      {!notificacao.lida && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notificacao.mensagem}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {formatRelativeTime(notificacao.createdAt)}
                    </p>
                  </div>
                </div>
              );

              if (notificacao.acaoUrl) {
                return (
                  <Link
                    key={notificacao.id}
                    href={notificacao.acaoUrl}
                    onClick={() => {
                      handleMarkRead(notificacao);
                      setOpen(false);
                    }}
                  >
                    {content}
                  </Link>
                );
              }

              return content;
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

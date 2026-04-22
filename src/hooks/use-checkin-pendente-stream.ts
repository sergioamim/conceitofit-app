"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * VUN-5.8 — hook que abre conexão SSE com `/api/v1/cockpit/stream` e mantém
 * uma fila reativa de check-ins pendentes (Gympass/TotalPass) pra recepção
 * mostrar como toasts laterais.
 *
 * Independente do `SSEConnectionProvider` do atendimento (que usa o endpoint
 * `/api/v1/conversas/stream`): abre EventSource própria por tenant.
 *
 * **Reconexão**: backoff exponencial 1s → 2s → 5s → 10s → 30s max (AC4).
 * **Scope**: só conecta enquanto o consumidor estiver montado (AC5).
 * **Stack**: mantém até {@link MAX_VISIVEIS} pendentes visíveis; restantes
 * ficam em `pendentesOcultos` (AC6).
 */

export interface CheckinPendenteReceived {
  checkinPendenteId: string;
  vinculoId: string;
  alunoId: string | null;
  alunoNome: string | null;
  agregador: string;
  externalUserId: string;
  recebidoEm: string | null;
  validoAte: string | null;
  /** Timestamp local quando o hook recebeu o evento — base pro contador UI. */
  receivedLocallyAt: number;
}

const BACKOFFS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
const MAX_VISIVEIS = 3;
/** Remove pendentes cujo `validoAte` já passou há mais de 60s (limpeza defensiva). */
const PENDENTE_CLEANUP_SLACK_MS = 60_000;

interface UseCheckinPendenteStreamOptions {
  tenantId: string | null | undefined;
  /** Default `true`. Passar `false` desliga o hook sem desmontar o componente. */
  enabled?: boolean;
}

export interface UseCheckinPendenteStreamResult {
  /** Lista visível (até 3) — os mais recentes primeiro. */
  pendentes: CheckinPendenteReceived[];
  /** Quantos pendentes foram recebidos e ficam colapsados no "+N". */
  pendentesOcultos: number;
  /** Pendentes totais (visíveis + ocultos). */
  totalPendentes: number;
  /** `true` quando o EventSource está aberto. */
  isConnected: boolean;
  /** Remove um pendente específico (dismiss do toast). */
  dismissPendente: (checkinPendenteId: string) => void;
  /** Limpa todos os pendentes (uso em "Nova venda" / logout etc). */
  dismissAll: () => void;
}

export function useCheckinPendenteStream({
  tenantId,
  enabled = true,
}: UseCheckinPendenteStreamOptions): UseCheckinPendenteStreamResult {
  const [isConnected, setIsConnected] = useState(false);
  const [pendentesQueue, setPendentesQueue] = useState<CheckinPendenteReceived[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffIndexRef = useRef(0);
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismissPendente = useCallback((checkinPendenteId: string) => {
    setPendentesQueue((prev) =>
      prev.filter((p) => p.checkinPendenteId !== checkinPendenteId),
    );
  }, []);

  const dismissAll = useCallback(() => {
    setPendentesQueue([]);
  }, []);

  useEffect(() => {
    if (!enabled || !tenantId) {
      return;
    }
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    let cancelled = false;

    function connect() {
      if (cancelled) return;
      // URL passa pelo rewrite `/backend/:path*` definido em next.config.ts
      // (proxy pro backend Spring). Sem o prefixo `/backend/`, Next servia
      // 404 direto do próprio server — reconnect-backoff em loop degradava
      // o cockpit e contribuía pra "Maximum update depth exceeded" visto no
      // DialogOverlay quando outros componentes disputavam re-render.
      const es = new EventSource(
        `/backend/api/v1/cockpit/stream?tenantId=${encodeURIComponent(tenantId!)}&timeout=300000`,
      );
      eventSourceRef.current = es;

      es.addEventListener("connected", () => {
        if (cancelled) return;
        setIsConnected(true);
        backoffIndexRef.current = 0;
      });

      es.addEventListener("checkin_pendente_criado", (ev: MessageEvent) => {
        if (cancelled) return;
        let data: unknown;
        try {
          data = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (!isCheckinPendentePayload(data)) return;
        const received: CheckinPendenteReceived = {
          checkinPendenteId: data.checkinPendenteId,
          vinculoId: data.vinculoId,
          alunoId: data.alunoId ?? null,
          alunoNome: data.alunoNome ?? null,
          agregador: data.agregador,
          externalUserId: data.externalUserId,
          recebidoEm: data.recebidoEm ?? null,
          validoAte: data.validoAte ?? null,
          receivedLocallyAt: Date.now(),
        };
        setPendentesQueue((prev) => {
          // Dedupe por id — se o mesmo pendente chega de novo, não duplica
          if (prev.some((p) => p.checkinPendenteId === received.checkinPendenteId)) {
            return prev;
          }
          return [received, ...prev];
        });
      });

      es.addEventListener("heartbeat", () => {
        // keepalive; nada a fazer
      });

      es.onerror = () => {
        if (cancelled) return;
        setIsConnected(false);
        es.close();
        eventSourceRef.current = null;

        const delay = BACKOFFS_MS[Math.min(backoffIndexRef.current, BACKOFFS_MS.length - 1)];
        backoffIndexRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    // Cleanup defensivo: remove pendentes vencidos há mais de 60s.
    cleanupTimerRef.current = setInterval(() => {
      setPendentesQueue((prev) => {
        const agora = Date.now();
        return prev.filter((p) => {
          if (!p.validoAte) return true;
          const vence = Date.parse(p.validoAte);
          if (Number.isNaN(vence)) return true;
          return vence + PENDENTE_CLEANUP_SLACK_MS > agora;
        });
      });
    }, 30_000);

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [tenantId, enabled]);

  const { visiveis, ocultos } = useMemo(() => {
    const visiveisArr = pendentesQueue.slice(0, MAX_VISIVEIS);
    const ocultosQtd = Math.max(0, pendentesQueue.length - MAX_VISIVEIS);
    return { visiveis: visiveisArr, ocultos: ocultosQtd };
  }, [pendentesQueue]);

  return {
    pendentes: visiveis,
    pendentesOcultos: ocultos,
    totalPendentes: pendentesQueue.length,
    isConnected,
    dismissPendente,
    dismissAll,
  };
}

function isCheckinPendentePayload(v: unknown): v is {
  checkinPendenteId: string;
  vinculoId: string;
  alunoId?: string | null;
  alunoNome?: string | null;
  agregador: string;
  externalUserId: string;
  recebidoEm?: string | null;
  validoAte?: string | null;
} {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.checkinPendenteId === "string" &&
    typeof obj.vinculoId === "string" &&
    typeof obj.agregador === "string" &&
    typeof obj.externalUserId === "string"
  );
}

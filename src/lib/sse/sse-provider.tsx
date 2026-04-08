"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SSEHandler = (event: string, data: unknown) => void;

interface SSEContextValue {
  isConnected: boolean;
  subscribe: (handler: SSEHandler) => () => void;
}

const SSEContext = createContext<SSEContextValue | null>(null);

const SSE_EVENTS = [
  "connected",
  "nova_mensagem",
  "conversa_atualizada",
  "conversa_encerrada",
  "heartbeat",
] as const;

const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 3_000;

interface SSEConnectionProviderProps {
  children: ReactNode;
  tenantId: string;
}

export function SSEConnectionProvider({
  children,
  tenantId,
}: SSEConnectionProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef<Set<SSEHandler>>(new Set());
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const subscribe = useCallback((handler: SSEHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    function connect() {
      const es = new EventSource(
        `/api/v1/conversas/stream?tenantId=${tenantId}&timeout=300000`
      );
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        backoffRef.current = INITIAL_BACKOFF_MS;
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        eventSourceRef.current = null;

        const delay = backoffRef.current;
        backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);

        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      for (const eventName of SSE_EVENTS) {
        es.addEventListener(eventName, (e: MessageEvent) => {
          let data: unknown;
          try {
            data = JSON.parse(e.data);
          } catch {
            data = e.data;
          }
          for (const handler of handlersRef.current) {
            handler(eventName, data);
          }
        });
      }
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [tenantId]);

  return (
    <SSEContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </SSEContext.Provider>
  );
}

export function useSSE(): SSEContextValue {
  const ctx = useContext(SSEContext);
  if (!ctx) {
    throw new Error("useSSE deve ser usado dentro de SSEConnectionProvider");
  }
  return ctx;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BackendStatus = "online" | "offline" | "checking";

// Qualquer rota do proxy serve — se responde (mesmo 401/404), o backend está up.
// Network error / timeout = backend down.
const HEALTH_PATH = "/backend/actuator/health/liveness";
const CHECK_INTERVAL_MS = 30_000;
const OFFLINE_CHECK_INTERVAL_MS = 5_000;
const TIMEOUT_MS = 5_000;

async function checkBackend(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(HEALTH_PATH, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    // Qualquer resposta HTTP (mesmo 401, 403, 404) indica que o backend está acessível
    return res.status < 502;
  } catch {
    return false;
  }
}

export function useBackendHealth(): {
  status: BackendStatus;
  check: () => void;
} {
  const [status, setStatus] = useState<BackendStatus>("online");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    const ok = await checkBackend();
    setStatus((prev) => {
      const next = ok ? "online" : "offline";
      if (prev === next) return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    // Initial check after small delay to not block page load
    const initial = setTimeout(() => void check(), 2_000);

    return () => clearTimeout(initial);
  }, [check]);

  useEffect(() => {
    const interval = status === "offline"
      ? OFFLINE_CHECK_INTERVAL_MS
      : CHECK_INTERVAL_MS;

    intervalRef.current = setInterval(() => void check(), interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [check, status]);

  // Only listen for browser-level connectivity changes, not individual fetch failures.
  // The "offline" event means the browser lost network entirely — re-check backend.
  // Failures from third-party services (e.g. image CDN) should NOT trigger offline state.
  useEffect(() => {
    function handleConnectivityChange() {
      void check();
    }

    window.addEventListener("offline", handleConnectivityChange);
    window.addEventListener("online", handleConnectivityChange);
    return () => {
      window.removeEventListener("offline", handleConnectivityChange);
      window.removeEventListener("online", handleConnectivityChange);
    };
  }, [check]);

  return { status, check };
}

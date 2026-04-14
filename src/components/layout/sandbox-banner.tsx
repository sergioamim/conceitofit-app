"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, LogOut } from "lucide-react";
import {
  exitSandboxApi,
  getTenantsTreeApi,
  switchSandboxApi,
  type TenantsTreeRede,
  type TenantsTreeResponse,
} from "@/lib/api/sandbox";
import {
  AUTH_SESSION_UPDATED_EVENT,
  getSandboxExpiresAtFromSession,
  getSandboxModeFromSession,
  getSandboxRedeIdFromSession,
  getSandboxUnidadeIdFromSession,
} from "@/lib/api/session";

interface SandboxState {
  active: boolean;
  redeId?: string;
  unidadeId?: string;
  expiresAt?: string;
}

function readSandboxState(): SandboxState {
  return {
    active: getSandboxModeFromSession(),
    redeId: getSandboxRedeIdFromSession(),
    unidadeId: getSandboxUnidadeIdFromSession(),
    expiresAt: getSandboxExpiresAtFromSession(),
  };
}

function formatRemaining(expiresAt?: string): string {
  if (!expiresAt) return "";
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return "";
  const diffMs = end - Date.now();
  if (diffMs <= 0) return "expirado";
  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
  return `${minutes}min`;
}

export function SandboxBanner() {
  const router = useRouter();
  const [state, setState] = useState<SandboxState>({ active: false });
  const [now, setNow] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tree, setTree] = useState<TenantsTreeResponse | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const refreshState = useCallback(() => {
    setState(readSandboxState());
  }, []);

  useEffect(() => {
    refreshState();
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, refreshState);
    window.addEventListener("storage", refreshState);
    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, refreshState);
      window.removeEventListener("storage", refreshState);
    };
  }, [refreshState]);

  useEffect(() => {
    if (!state.active) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [state.active]);

  useEffect(() => {
    if (!menuOpen || tree || loadingTree) return;
    let cancelled = false;
    setLoadingTree(true);
    getTenantsTreeApi()
      .then((data) => {
        if (!cancelled) setTree(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar a árvore de tenants.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTree(false);
      });
    return () => {
      cancelled = true;
    };
  }, [menuOpen, tree, loadingTree]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const currentRede = useMemo<TenantsTreeRede | null>(() => {
    if (!tree || !state.redeId) return null;
    return tree.redes.find((item) => item.redeId === state.redeId) ?? null;
  }, [tree, state.redeId]);

  // `now` participa da dep array para forçar recálculo a cada tick do intervalo.
  const remainingLabel = useMemo(
    () => {
      void now;
      return formatRemaining(state.expiresAt);
    },
    [state.expiresAt, now],
  );

  const handleSwitch = useCallback(
    async (redeId: string, unidadeId?: string) => {
      setBusy(true);
      setError(null);
      try {
        await switchSandboxApi({ redeId, unidadeId });
        setMenuOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao trocar de tenant.");
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const handleExit = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await exitSandboxApi();
      setMenuOpen(false);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao sair do sandbox.");
    } finally {
      setBusy(false);
    }
  }, [router]);

  if (!state.active) return null;

  const redeLabel = currentRede?.redeName ?? state.redeId ?? "—";
  const unidadeLabel =
    currentRede?.unidades.find((u) => u.id === state.unidadeId)?.nome ??
    state.unidadeId ??
    "—";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-gym-warning/40 bg-gym-warning/15 px-4 py-2 text-xs font-medium text-gym-warning"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-3.5 shrink-0" />
        <span>
          Modo Sandbox — Rede <strong>{redeLabel}</strong> · Unidade {" "}
          <strong>{unidadeLabel}</strong>
          {remainingLabel && ` · expira em ${remainingLabel}`}
        </span>
      </div>
      <div className="flex items-center gap-2" ref={dropdownRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded border border-gym-warning/40 px-2 py-1 text-[11px] transition-colors hover:bg-gym-warning/10"
            disabled={busy}
          >
            Trocar rede / unidade
            <ChevronDown className="size-3" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 max-h-80 w-72 overflow-auto rounded-md border border-gym-warning/30 bg-background p-2 text-xs text-foreground shadow-lg">
              {loadingTree && <div className="p-2 text-muted-foreground">Carregando…</div>}
              {error && <div className="p-2 text-gym-danger">{error}</div>}
              {tree?.redes.length === 0 && (
                <div className="p-2 text-muted-foreground">Nenhuma rede ativa.</div>
              )}
              {tree?.redes.map((rede) => (
                <div key={rede.redeId} className="py-1">
                  <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {rede.redeName}
                  </div>
                  {rede.unidades.length === 0 && (
                    <button
                      type="button"
                      onClick={() => handleSwitch(rede.redeId)}
                      disabled={busy}
                      className="block w-full rounded px-2 py-1 text-left hover:bg-muted"
                    >
                      Rede sem unidades — atuar na rede
                    </button>
                  )}
                  {rede.unidades.map((unidade) => (
                    <button
                      key={unidade.id}
                      type="button"
                      onClick={() => handleSwitch(rede.redeId, unidade.id)}
                      disabled={busy}
                      className="block w-full rounded px-2 py-1 text-left hover:bg-muted"
                    >
                      {unidade.nome}
                      {unidade.matriz && " (matriz)"}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleExit}
          disabled={busy}
          className="flex items-center gap-1 rounded border border-gym-warning/40 px-2 py-1 text-[11px] transition-colors hover:bg-gym-warning/10"
        >
          <LogOut className="size-3" />
          Sair do sandbox
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useBackendHealth } from "@/hooks/use-backend-health";

export function BackendStatusBanner() {
  const { status, check } = useBackendHealth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (status === "offline") {
      setVisible(true);
      setDismissed(false);
    } else if (status === "online") {
      // Small delay before hiding so user sees the recovery
      const timer = setTimeout(() => setVisible(false), 2_000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible || dismissed) return null;

  const isRecovering = status === "online";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium transition-colors duration-300 ${
        isRecovering
          ? "bg-gym-teal/15 text-gym-teal"
          : "bg-gym-danger/15 text-gym-danger"
      }`}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="size-3.5 shrink-0" />
        <span>
          {isRecovering
            ? "Conexão com o servidor restabelecida."
            : "Servidor indisponível — algumas funcionalidades podem não carregar."}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!isRecovering && (
          <button
            type="button"
            onClick={() => void check()}
            className="rounded border border-gym-danger/30 px-2 py-0.5 text-[11px] hover:bg-gym-danger/10 transition-colors"
          >
            Tentar novamente
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fechar aviso"
          className="text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { FlaskConical, X } from "lucide-react";
import { useCallback, useState } from "react";

const DEMO_STORAGE_KEY = "academia-demo-banner-dismissed";

export function DemoBanner() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DEMO_STORAGE_KEY) === "1";
  });

  const dismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(DEMO_STORAGE_KEY, "1");
  }, []);

  if (!isDemo || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gym-accent/30 bg-gym-accent/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-4 w-4 shrink-0 text-gym-accent" />
        <p className="text-sm">
          <span className="font-semibold text-gym-accent">Conta Demonstracao</span>
          <span className="text-muted-foreground">
            {" "}— Voce esta usando uma conta demo com dados de exemplo. Expira em 7 dias.
          </span>
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Fechar banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

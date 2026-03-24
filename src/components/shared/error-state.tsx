"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  className?: string;
}

export function ErrorState({ error, reset, title = "Ocorreu um erro inesperado", className }: ErrorStateProps) {
  useEffect(() => {
    // Log técnico isolado para possível emissão ao Sentry/Datadog no futuro
    console.error("Boundary Caught Error:", error);
  }, [error]);

  const isNetworkOrApi =
    error.message.includes("ApiRequestError") ||
    error.message.includes("fetch") ||
    error.name === "ApiRequestError";

  const displayTitle = isNetworkOrApi ? "Falha de Comunicação" : title;
  const displayMessage = isNetworkOrApi
    ? "Não foi possível conectar ao servidor ou a API retornou um erro inesperado."
    : "Tivemos um problema interno ao renderizar esta seção.";

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300 ${className || ""}`}>
      <div className="mb-5 flex size-14 items-center justify-center rounded-3xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <AlertTriangle className="size-6" />
      </div>
      <h3 className="mb-2 text-lg font-bold tracking-tight">{displayTitle}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{displayMessage}</p>
      
      {reset && (
        <Button onClick={reset} variant="outline" size="sm" className="gap-2 shadow-xs">
          <RefreshCcw className="size-3.5" />
          Tentar Novamente
        </Button>
      )}
      
      {error.digest && (
        <p className="mt-8 text-[10px] uppercase font-mono tracking-widest text-muted-foreground opacity-50">
          Trace: {error.digest}
        </p>
      )}
    </div>
  );
}

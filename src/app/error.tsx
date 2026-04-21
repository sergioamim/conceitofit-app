"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

/**
 * Exceções de controle de fluxo do Next.js (redirect, notFound) NÃO são
 * erros de aplicação — o runtime as usa como sinal. Se o error boundary
 * as captura e renderiza "NEXT_REDIRECT" como texto, é bug. Re-lançamos
 * pra que o Next processe o redirect corretamente.
 */
function isControlFlowException(error: Error & { digest?: string }): boolean {
  const digest = error.digest ?? "";
  const message = error.message ?? "";
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest.startsWith("NEXT_NOT_FOUND") ||
    message === "NEXT_REDIRECT" ||
    message === "NEXT_NOT_FOUND"
  );
}

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isControlFlow = isControlFlowException(error);

  useEffect(() => {
    if (isControlFlow) return;
    Sentry.captureException(error, {
      tags: { boundary: "root" },
    });
  }, [error, isControlFlow]);

  if (isControlFlow) {
    // Renderiza vazio — o Next.js já está processando o redirect/notFound
    // no nível de roteamento. Se renderizarmos ErrorState aqui, aparece
    // "NEXT_REDIRECT" como texto literal até a navegação terminar.
    return null;
  }

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-destructive/15 bg-card/80 shadow-lg">
        <ErrorState error={error} reset={reset} title="Falha geral da aplicação" />
      </div>
    </div>
  );
}

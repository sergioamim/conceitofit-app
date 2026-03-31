"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-[#16181c] text-white font-sans antialiased">
        <div className="flex h-screen items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <h2 className="text-xl font-bold">Algo deu errado</h2>
            <p className="mt-2 text-sm text-gray-400">
              Um erro inesperado foi registrado automaticamente. Tente novamente.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-lg bg-white/10 px-6 py-2 text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

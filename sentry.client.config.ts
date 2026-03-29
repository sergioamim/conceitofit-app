import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    beforeSend(event) {
      // Não enviar erros de dev sem DSN configurado
      if (!dsn) return null;
      return event;
    },
    ignoreErrors: [
      // Erros de rede comuns que não são acionáveis
      "Failed to fetch",
      "Load failed",
      "NetworkError",
      "AbortError",
      // Erros de extensões de browser
      "ResizeObserver loop",
    ],
  });
}

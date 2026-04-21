import * as Sentry from "@sentry/nextjs";

/**
 * Lightweight product analytics for tracking business events.
 *
 * Events are:
 *  1. Sent as Sentry breadcrumbs (visible in error traces for context)
 *  2. Logged to console in development
 *  3. Optionally sent to a backend analytics endpoint (when configured)
 *
 * No third-party analytics SDK required. When a tool like PostHog or
 * Plausible is added, this module becomes the single integration point.
 */

// ─── Types ────────────────────────────────────────────────────────────────

export type AnalyticsEventName =
  | "login"
  | "logout"
  | "tenant_switch"
  | "prospect_created"
  | "prospect_converted"
  | "matricula_created"
  | "matricula_cancelled"
  | "pagamento_received"
  | "venda_completed"
  | "treino_assigned"
  | "reserva_created"
  | "aluno_created"
  | "aluno_suspended"
  | "aluno_reactivated"
  | "aluno_deleted"
  | "aluno_migrated"
  | "nfse_emitted"
  | "billing_config_saved"
  | "billing_connection_tested"
  // Perfil v3 — instrumentação das métricas de sucesso §7 do PRD.
  | "perfil_drawer_acoes_open"
  | "perfil_sugestao_click"
  | "perfil_risco_detalhes_open"
  | "perfil_tab_change"
  | "perfil_cartoes_drawer_open";

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | undefined>;
  tenantId?: string;
  userId?: string;
  timestamp?: string;
};

// ─── Configuration ────────────────────────────────────────────────────────

// Reavaliado a cada chamada — permite ligar logging em testes via
// `process.env.ANALYTICS_VERBOSE = "1"` sem depender do NODE_ENV.
function isLoggingEnabled(): boolean {
  if (typeof process === "undefined") return false;
  return process.env?.NODE_ENV === "development" || process.env?.ANALYTICS_VERBOSE === "1";
}

const analyticsEndpoint =
  typeof process !== "undefined"
    ? process.env?.NEXT_PUBLIC_ANALYTICS_ENDPOINT
    : undefined;

let sentryAvailable: boolean | null = null;
function isSentryEnabled(): boolean {
  if (sentryAvailable === null) {
    sentryAvailable = Boolean(
      typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SENTRY_DSN,
    );
  }
  return sentryAvailable;
}

// ─── Core ─────────────────────────────────────────────────────────────────

/**
 * Track a business event.
 *
 * Cheap and non-blocking. Failures are silently ignored.
 */
export function trackEvent(event: AnalyticsEvent): void {
  const timestamp = event.timestamp ?? new Date().toISOString();
  const payload = { ...event, timestamp };

  // 1. Sentry breadcrumb (visible in error stack traces)
  if (isSentryEnabled()) {
    Sentry.addBreadcrumb({
      category: "analytics",
      message: event.name,
      data: {
        ...event.properties,
        tenantId: event.tenantId,
        userId: event.userId,
      },
      level: "info",
    });
  }

  // 2. Dev console (ou quando ANALYTICS_VERBOSE=1)
  if (isLoggingEnabled()) {
    console.log("[analytics]", event.name, event.properties ?? {});
  }

  // 3. Backend endpoint (fire-and-forget)
  if (analyticsEndpoint) {
    void fetch(analyticsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}

// ─── Convenience helpers ──────────────────────────────────────────────────

export function trackLogin(tenantId?: string, userId?: string) {
  trackEvent({ name: "login", tenantId, userId });
}

export function trackLogout(userId?: string) {
  trackEvent({ name: "logout", userId });
}

export function trackTenantSwitch(tenantId: string, userId?: string) {
  trackEvent({ name: "tenant_switch", tenantId, userId });
}

export function trackProspectCreated(tenantId: string, prospectId: string) {
  trackEvent({
    name: "prospect_created",
    tenantId,
    properties: { prospectId },
  });
}

export function trackProspectConverted(tenantId: string, prospectId: string) {
  trackEvent({
    name: "prospect_converted",
    tenantId,
    properties: { prospectId },
  });
}

export function trackMatriculaCreated(tenantId: string, matriculaId: string, planoId: string) {
  trackEvent({
    name: "matricula_created",
    tenantId,
    properties: { matriculaId, planoId },
  });
}

export function trackPagamentoReceived(tenantId: string, pagamentoId: string, valor: number) {
  trackEvent({
    name: "pagamento_received",
    tenantId,
    properties: { pagamentoId, valor },
  });
}

export function trackVendaCompleted(tenantId: string, vendaId: string, total: number) {
  trackEvent({
    name: "venda_completed",
    tenantId,
    properties: { vendaId, total },
  });
}

export function trackAlunoCreated(tenantId: string, alunoId: string) {
  trackEvent({
    name: "aluno_created",
    tenantId,
    properties: { alunoId },
  });
}

export function trackNfseEmitted(tenantId: string, pagamentoId: string) {
  trackEvent({
    name: "nfse_emitted",
    tenantId,
    properties: { pagamentoId },
  });
}

export function trackBillingConfigSaved(tenantId: string, provedor: string) {
  trackEvent({
    name: "billing_config_saved",
    tenantId,
    properties: { provedor },
  });
}

// ─── Perfil Cliente v3 ────────────────────────────────────────────────────
// Instrumentação para as métricas §7 do PRD:
//   - taxa de clique em sugestões do drawer (por tipo)
//   - % de renovações originadas via drawer (atribuição via perfil_sugestao_click)
//   - tempo médio de atendimento (pode ser inferido de perfil_tab_change + timestamps)

export function trackPerfilDrawerAcoesOpen(tenantId: string, alunoId: string, totalSugestoes: number) {
  trackEvent({
    name: "perfil_drawer_acoes_open",
    tenantId,
    properties: { alunoId, totalSugestoes },
  });
}

export function trackPerfilSugestaoClick(
  tenantId: string,
  alunoId: string,
  tipo: string,
  prioridade: "alta" | "media" | "baixa"
) {
  trackEvent({
    name: "perfil_sugestao_click",
    tenantId,
    properties: { alunoId, tipo, prioridade },
  });
}

export function trackPerfilRiscoDetalhesOpen(
  tenantId: string,
  alunoId: string,
  score: number,
  label: string
) {
  trackEvent({
    name: "perfil_risco_detalhes_open",
    tenantId,
    properties: { alunoId, score, label },
  });
}

export function trackPerfilTabChange(tenantId: string, alunoId: string, tab: string) {
  trackEvent({
    name: "perfil_tab_change",
    tenantId,
    properties: { alunoId, tab },
  });
}

export function trackPerfilCartoesDrawerOpen(tenantId: string, alunoId: string) {
  trackEvent({
    name: "perfil_cartoes_drawer_open",
    tenantId,
    properties: { alunoId },
  });
}

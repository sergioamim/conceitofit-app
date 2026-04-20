const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function readBooleanFlag(rawValue: string | undefined, fallback: boolean): boolean {
  const normalized = rawValue?.trim().toLowerCase();
  if (!normalized) return fallback;
  return TRUE_VALUES.has(normalized);
}

export function isContextualNetworkAccessEnabled(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED, true);
}

export function isClientOperationalEligibilityEnabled(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_CLIENT_OPERATIONAL_ELIGIBILITY_ENABLED, true);
}

export function isClientMigrationEnabled(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_CLIENT_MIGRATION_ENABLED, true);
}

// ─── Flags dos módulos FE fantasmas (ADR-001, Task #551) ────────────────
// Os módulos abaixo chamam endpoints que ainda não existem ou estão
// divergentes no backend Java. Mantidos no FE por preservar normalizers,
// tipos e código útil, mas desligados por default até o BE estar pronto.
// Ver: docs/adr/ADR-001-modulos-fe-fantasma.md

/** Billing recorrente (assinaturas via gateway). PRD Q2 Épico 3.2. */
export function isBillingRecurrenteEnabled(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_BILLING_RECORRENTE_ENABLED, false);
}

/** Integração WhatsApp completa (config/templates/logs/send/stats). */
export function isWhatsappIntegrationEnabled(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED, false);
}

/** Reservas de aulas (sessões, waitlist, check-in). PRD Q2 Épico 3.1. */
export function isReservasAulasEnabled(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_RESERVAS_AULAS_ENABLED, false);
}

/** Execuções de cadências CRM (trigger, escalation, process-overdue). */
export function isCrmCadenciasEnabled(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_CRM_CADENCIAS_ENABLED, false);
}

/** Drawer "Próximas Ações" no perfil do cliente (Perfil v3 — Wave 2). */
export function isPerfilDrawerAcoesEnabled(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_PERFIL_DRAWER_ACOES_ENABLED, true);
}

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

/**
 * Execuções de cadências CRM (trigger, escalation, process-overdue).
 *
 * Default: `true` desde Epic 3 (Wave 6, Story 3.24) — BE passou a expor
 * `/api/v1/crm/cadencias/*` completo. Para desabilitar explicitamente em
 * um ambiente específico, setar `NEXT_PUBLIC_CRM_CADENCIAS_ENABLED=false`.
 *
 * @deprecated Use `useCrmCadenciasEnabled()` de `@/lib/query/use-feature-flags`
 * em componentes React. Esta função só consulta env var (kill-switch global)
 * e não respeita a configuração per-tenant persistida em DB. Mantida apenas
 * para uso em server components, módulos não-React e adapters de baixo nível.
 */
export function isCrmCadenciasEnabledFallback(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_CRM_CADENCIAS_ENABLED, true);
}

/**
 * Drawer "Próximas Ações" no perfil do cliente (Perfil v3 — Wave 2).
 *
 * @deprecated Use `usePerfilDrawerAcoesEnabled()` de
 * `@/lib/query/use-feature-flags` em componentes React. Esta função só
 * consulta env var (kill-switch global), não respeita config per-tenant.
 */
export function isPerfilDrawerAcoesEnabledFallback(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_PERFIL_DRAWER_ACOES_ENABLED, true);
}

/**
 * Editor V3 de treino (tabela inline + drag&drop). PRD Montagem de Treino V3,
 * Wave 3. Default `false` durante coexistência com V2; cutover na Wave 7.
 *
 * Set `NEXT_PUBLIC_TREINO_EDITOR_V3_ENABLED=true` para ativar.
 */
export function isTreinoEditorV3Enabled(): boolean {
  return readBooleanFlag(process.env.NEXT_PUBLIC_TREINO_EDITOR_V3_ENABLED, false);
}

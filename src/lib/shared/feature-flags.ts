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

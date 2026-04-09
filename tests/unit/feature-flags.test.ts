import { describe, expect, it, vi, beforeEach } from "vitest";

// Re-import after each env stub to get fresh module evaluation
async function loadFlags() {
  // Clear module cache to re-evaluate with new env vars
  vi.resetModules();
  return import("@/lib/feature-flags");
}

describe("feature-flags", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  // ── isContextualNetworkAccessEnabled ──

  describe("isContextualNetworkAccessEnabled", () => {
    it("returns true by default (no env var)", async () => {
      vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED", "");
      const { isContextualNetworkAccessEnabled } = await loadFlags();
      expect(isContextualNetworkAccessEnabled()).toBe(true);
    });

    it("returns true when env is '1'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED", "1");
      const { isContextualNetworkAccessEnabled } = await loadFlags();
      expect(isContextualNetworkAccessEnabled()).toBe(true);
    });

    it("returns true when env is 'true'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED", "true");
      const { isContextualNetworkAccessEnabled } = await loadFlags();
      expect(isContextualNetworkAccessEnabled()).toBe(true);
    });

    it("returns true when env is 'yes'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED", "yes");
      const { isContextualNetworkAccessEnabled } = await loadFlags();
      expect(isContextualNetworkAccessEnabled()).toBe(true);
    });

    it("returns true when env is 'on'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED", "on");
      const { isContextualNetworkAccessEnabled } = await loadFlags();
      expect(isContextualNetworkAccessEnabled()).toBe(true);
    });

    it("returns false when env is 'false'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED", "false");
      const { isContextualNetworkAccessEnabled } = await loadFlags();
      expect(isContextualNetworkAccessEnabled()).toBe(false);
    });

    it("returns false when env is '0'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED", "0");
      const { isContextualNetworkAccessEnabled } = await loadFlags();
      expect(isContextualNetworkAccessEnabled()).toBe(false);
    });

    it("returns false when env is 'no'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED", "no");
      const { isContextualNetworkAccessEnabled } = await loadFlags();
      expect(isContextualNetworkAccessEnabled()).toBe(false);
    });

    it("handles whitespace in env value", async () => {
      vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED", "  TRUE  ");
      const { isContextualNetworkAccessEnabled } = await loadFlags();
      expect(isContextualNetworkAccessEnabled()).toBe(true);
    });
  });

  // ── isClientOperationalEligibilityEnabled ──

  describe("isClientOperationalEligibilityEnabled", () => {
    it("returns true by default", async () => {
      vi.stubEnv("NEXT_PUBLIC_CLIENT_OPERATIONAL_ELIGIBILITY_ENABLED", "");
      const { isClientOperationalEligibilityEnabled } = await loadFlags();
      expect(isClientOperationalEligibilityEnabled()).toBe(true);
    });

    it("returns true when '1'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CLIENT_OPERATIONAL_ELIGIBILITY_ENABLED", "1");
      const { isClientOperationalEligibilityEnabled } = await loadFlags();
      expect(isClientOperationalEligibilityEnabled()).toBe(true);
    });

    it("returns false when 'false'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CLIENT_OPERATIONAL_ELIGIBILITY_ENABLED", "false");
      const { isClientOperationalEligibilityEnabled } = await loadFlags();
      expect(isClientOperationalEligibilityEnabled()).toBe(false);
    });
  });

  // ── isClientMigrationEnabled ──

  describe("isClientMigrationEnabled", () => {
    it("returns true by default", async () => {
      vi.stubEnv("NEXT_PUBLIC_CLIENT_MIGRATION_ENABLED", "");
      const { isClientMigrationEnabled } = await loadFlags();
      expect(isClientMigrationEnabled()).toBe(true);
    });

    it("returns true when 'on'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CLIENT_MIGRATION_ENABLED", "on");
      const { isClientMigrationEnabled } = await loadFlags();
      expect(isClientMigrationEnabled()).toBe(true);
    });

    it("returns false when 'false'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CLIENT_MIGRATION_ENABLED", "false");
      const { isClientMigrationEnabled } = await loadFlags();
      expect(isClientMigrationEnabled()).toBe(false);
    });

    it("returns false when '0'", async () => {
      vi.stubEnv("NEXT_PUBLIC_CLIENT_MIGRATION_ENABLED", "0");
      const { isClientMigrationEnabled } = await loadFlags();
      expect(isClientMigrationEnabled()).toBe(false);
    });
  });
});

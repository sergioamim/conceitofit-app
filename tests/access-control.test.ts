import { describe, expect, it } from "vitest";
import {
  hasClientDeleteCapability,
  hasElevatedAccess,
  normalizeRoles,
} from "@/lib/access-control";

describe("normalizeRoles", () => {
  it("returns empty array for null/undefined", () => {
    expect(normalizeRoles(null)).toEqual([]);
    expect(normalizeRoles(undefined)).toEqual([]);
  });

  it("trims and uppercases roles", () => {
    expect(normalizeRoles([" admin ", "user"])).toEqual(["ADMIN", "USER"]);
  });

  it("filters empty strings", () => {
    expect(normalizeRoles(["admin", "", "  "])).toEqual(["ADMIN"]);
  });
});

describe("hasElevatedAccess", () => {
  it("returns true for ADMIN role", () => {
    expect(hasElevatedAccess(["ADMIN"])).toBe(true);
  });

  it("returns true for roles containing ADMIN", () => {
    expect(hasElevatedAccess(["SUPER_ADMIN"])).toBe(true);
  });

  it("returns false for non-admin roles", () => {
    expect(hasElevatedAccess(["USER", "MANAGER"])).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(hasElevatedAccess(null)).toBe(false);
    expect(hasElevatedAccess(undefined)).toBe(false);
  });
});

describe("hasClientDeleteCapability", () => {
  it("returns true for ALTO role", () => {
    expect(hasClientDeleteCapability(["ALTO"])).toBe(true);
  });

  it("returns true for CLIENT_DELETE role", () => {
    expect(hasClientDeleteCapability(["CLIENT_DELETE"])).toBe(true);
  });

  it("returns false for other roles", () => {
    expect(hasClientDeleteCapability(["ADMIN", "USER"])).toBe(false);
  });
});

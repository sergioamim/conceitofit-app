import { describe, expect, it } from "vitest";
import {
  forcedPasswordChangeFormSchema,
  networkCredentialFormSchema,
  networkLoginFormSchema,
  tenantStepFormSchema,
} from "@/lib/tenant/forms/auth-schemas";

describe("auth-schemas", () => {
  describe("networkLoginFormSchema", () => {
    it("aceita identifier + password", () => {
      const res = networkLoginFormSchema.safeParse({
        identifier: "user@test.com",
        password: "Senha123",
      });
      expect(res.success).toBe(true);
    });

    it("rejeita identifier vazio", () => {
      const res = networkLoginFormSchema.safeParse({
        identifier: "",
        password: "Senha123",
      });
      expect(res.success).toBe(false);
    });

    it("rejeita password vazio", () => {
      const res = networkLoginFormSchema.safeParse({
        identifier: "user",
        password: "",
      });
      expect(res.success).toBe(false);
    });

    it("trima identifier", () => {
      const res = networkLoginFormSchema.safeParse({
        identifier: "  user  ",
        password: "Senha123",
      });
      expect(res.success).toBe(true);
      if (res.success) expect(res.data.identifier).toBe("user");
    });
  });

  describe("networkCredentialFormSchema", () => {
    it("aceita identifier simples", () => {
      const res = networkCredentialFormSchema.safeParse({ identifier: "user" });
      expect(res.success).toBe(true);
    });

    it("rejeita vazio", () => {
      expect(
        networkCredentialFormSchema.safeParse({ identifier: "" }).success,
      ).toBe(false);
    });
  });

  describe("tenantStepFormSchema", () => {
    it("aceita tenantId", () => {
      const res = tenantStepFormSchema.safeParse({ tenantId: "abc-123" });
      expect(res.success).toBe(true);
    });

    it("rejeita tenantId vazio", () => {
      expect(tenantStepFormSchema.safeParse({ tenantId: "" }).success).toBe(
        false,
      );
    });
  });

  describe("forcedPasswordChangeFormSchema", () => {
    it("aceita nova senha válida e confirmação idêntica", () => {
      const res = forcedPasswordChangeFormSchema.safeParse({
        newPassword: "Senha123",
        confirmNewPassword: "Senha123",
      });
      expect(res.success).toBe(true);
    });

    it("rejeita senha com menos de 8 caracteres", () => {
      const res = forcedPasswordChangeFormSchema.safeParse({
        newPassword: "abc12",
        confirmNewPassword: "abc12",
      });
      expect(res.success).toBe(false);
    });

    it("rejeita senha sem letra", () => {
      const res = forcedPasswordChangeFormSchema.safeParse({
        newPassword: "12345678",
        confirmNewPassword: "12345678",
      });
      expect(res.success).toBe(false);
    });

    it("rejeita senha sem número", () => {
      const res = forcedPasswordChangeFormSchema.safeParse({
        newPassword: "abcdefgh",
        confirmNewPassword: "abcdefgh",
      });
      expect(res.success).toBe(false);
    });

    it("rejeita confirmação diferente", () => {
      const res = forcedPasswordChangeFormSchema.safeParse({
        newPassword: "Senha123",
        confirmNewPassword: "Outra456",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        const confirmError = res.error.issues.find((i) =>
          i.path.includes("confirmNewPassword"),
        );
        expect(confirmError?.message).toMatch(/idêntica/);
      }
    });
  });
});

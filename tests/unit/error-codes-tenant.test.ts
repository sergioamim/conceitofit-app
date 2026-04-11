import { describe, expect, it } from "vitest";
import {
  isTenantContextError,
  isTenantContextErrorMessage,
  TENANT_ERROR_MESSAGES,
} from "@/lib/shared/utils/error-codes";
import { ApiRequestError } from "@/lib/api/http";

describe("error-codes (tenant context)", () => {
  describe("TENANT_ERROR_MESSAGES", () => {
    it("expõe as mensagens esperadas", () => {
      expect(TENANT_ERROR_MESSAGES.CONTEXT_MISSING).toBe(
        "x-context-id sem unidade ativa",
      );
      expect(TENANT_ERROR_MESSAGES.CONTEXT_MISMATCH).toBe(
        "tenantid diverge da unidade ativa do contexto informado",
      );
    });
  });

  describe("isTenantContextError", () => {
    it("true para ApiRequestError 400 com CONTEXT_MISSING na mensagem", () => {
      const err = new ApiRequestError({
        status: 400,
        message: "X-Context-Id sem unidade ativa para tenant",
      });
      expect(isTenantContextError(err)).toBe(true);
    });

    it("true para ApiRequestError 400 com CONTEXT_MISMATCH", () => {
      const err = new ApiRequestError({
        status: 400,
        message: "TenantId diverge da unidade ativa do contexto informado",
      });
      expect(isTenantContextError(err)).toBe(true);
    });

    it("false para status != 400", () => {
      const err = new ApiRequestError({
        status: 500,
        message: "x-context-id sem unidade ativa",
      });
      expect(isTenantContextError(err)).toBe(false);
    });

    it("true para string que contém CONTEXT_MISSING", () => {
      expect(
        isTenantContextError(
          "X-Context-Id sem unidade ativa encontrada para o tenant",
        ),
      ).toBe(true);
    });

    it("true para string que contém CONTEXT_MISMATCH", () => {
      expect(
        isTenantContextError(
          "TenantId diverge da unidade ativa do contexto informado",
        ),
      ).toBe(true);
    });

    it("false para string sem padrão conhecido", () => {
      expect(isTenantContextError("erro qualquer")).toBe(false);
      expect(isTenantContextError("")).toBe(false);
    });

    it("false para outros tipos", () => {
      expect(isTenantContextError(null)).toBe(false);
      expect(isTenantContextError(undefined)).toBe(false);
      expect(isTenantContextError(42)).toBe(false);
      expect(isTenantContextError({ random: "object" })).toBe(false);
    });

    it("true quando o fragmento aparece no error/responseBody", () => {
      const err = new ApiRequestError({
        status: 400,
        message: "erro generico",
        error: "X-Context-Id sem unidade ativa",
      });
      expect(isTenantContextError(err)).toBe(true);
    });
  });

  describe("isTenantContextErrorMessage", () => {
    it("true se a mensagem contém CONTEXT_MISSING", () => {
      expect(
        isTenantContextErrorMessage("X-Context-Id sem unidade ativa..."),
      ).toBe(true);
    });

    it("true se contém CONTEXT_MISMATCH", () => {
      expect(
        isTenantContextErrorMessage(
          "TenantId diverge da unidade ativa do contexto informado",
        ),
      ).toBe(true);
    });

    it("é case-insensitive", () => {
      expect(isTenantContextErrorMessage("X-CONTEXT-ID SEM UNIDADE ATIVA")).toBe(
        true,
      );
    });

    it("false para strings sem o padrão", () => {
      expect(isTenantContextErrorMessage("outro erro")).toBe(false);
      expect(isTenantContextErrorMessage("")).toBe(false);
    });
  });
});

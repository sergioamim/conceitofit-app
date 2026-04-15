import { describe, expect, it } from "vitest";

import {
  AbrirCaixaSchema,
  FecharCaixaSchema,
  SangriaSchema,
} from "@/app/(portal)/caixa/lib/caixa-schemas";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("caixa-schemas", () => {
  describe("AbrirCaixaSchema", () => {
    it("aceita payload válido", () => {
      const result = AbrirCaixaSchema.safeParse({
        caixaCatalogoId: VALID_UUID,
        valorAbertura: 100,
        observacoes: "abertura",
      });
      expect(result.success).toBe(true);
    });

    it("rejeita catálogo não-UUID", () => {
      const result = AbrirCaixaSchema.safeParse({
        caixaCatalogoId: "not-uuid",
        valorAbertura: 100,
      });
      expect(result.success).toBe(false);
    });

    it("rejeita valor negativo", () => {
      const result = AbrirCaixaSchema.safeParse({
        caixaCatalogoId: VALID_UUID,
        valorAbertura: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("FecharCaixaSchema", () => {
    it("aceita valor 0", () => {
      const result = FecharCaixaSchema.safeParse({ valorInformado: 0 });
      expect(result.success).toBe(true);
    });

    it("rejeita valor negativo", () => {
      const result = FecharCaixaSchema.safeParse({ valorInformado: -10 });
      expect(result.success).toBe(false);
    });
  });

  describe("SangriaSchema", () => {
    it("aceita payload válido", () => {
      const result = SangriaSchema.safeParse({
        valor: 50,
        motivo: "retirada de excedente",
        autorizadoPor: VALID_UUID,
      });
      expect(result.success).toBe(true);
    });

    it("rejeita motivo curto (<5 chars)", () => {
      const result = SangriaSchema.safeParse({
        valor: 50,
        motivo: "abc",
        autorizadoPor: VALID_UUID,
      });
      expect(result.success).toBe(false);
    });

    it("rejeita autorizadoPor não-UUID", () => {
      const result = SangriaSchema.safeParse({
        valor: 50,
        motivo: "ok motivo válido",
        autorizadoPor: "not-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejeita valor zero", () => {
      const result = SangriaSchema.safeParse({
        valor: 0,
        motivo: "ok motivo válido",
        autorizadoPor: VALID_UUID,
      });
      expect(result.success).toBe(false);
    });
  });
});

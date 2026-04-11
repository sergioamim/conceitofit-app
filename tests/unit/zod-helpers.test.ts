import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  buildZodFieldErrors,
  optionalTrimmedString,
  requiredTrimmedString,
} from "@/lib/forms/zod-helpers";

describe("zod-helpers", () => {
  describe("requiredTrimmedString", () => {
    const schema = requiredTrimmedString("Campo obrigatório");

    it("aceita string não vazia após trim", () => {
      expect(schema.parse("hello")).toBe("hello");
      expect(schema.parse("  hello  ")).toBe("hello");
    });

    it("rejeita string vazia ou apenas espaços com a mensagem customizada", () => {
      const res = schema.safeParse("");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe("Campo obrigatório");
      }

      const res2 = schema.safeParse("   ");
      expect(res2.success).toBe(false);
    });
  });

  describe("optionalTrimmedString", () => {
    const schema = optionalTrimmedString();

    it("aceita undefined", () => {
      expect(schema.parse(undefined)).toBeUndefined();
    });

    it("aceita string vazia (trimmed)", () => {
      expect(schema.parse("")).toBe("");
    });

    it("trima valores não vazios", () => {
      expect(schema.parse("  hello  ")).toBe("hello");
    });
  });

  describe("buildZodFieldErrors", () => {
    it("extrai erros por campo do ZodError", () => {
      const schema = z.object({
        nome: z.string().min(3, "Nome muito curto"),
        idade: z.number().int().positive("Idade deve ser positiva"),
      });
      const res = schema.safeParse({ nome: "A", idade: -1 });
      expect(res.success).toBe(false);
      if (!res.success) {
        const errors = buildZodFieldErrors(res.error);
        expect(errors.nome).toBe("Nome muito curto");
        expect(errors.idade).toBe("Idade deve ser positiva");
      }
    });

    it("ignora erros sem path", () => {
      const fakeError = {
        issues: [{ path: [], message: "sem campo" }],
      } as unknown as Parameters<typeof buildZodFieldErrors>[0];
      expect(buildZodFieldErrors(fakeError)).toEqual({});
    });

    it("mantém apenas a primeira mensagem para campos com múltiplos erros", () => {
      const fakeError = {
        issues: [
          { path: ["nome"], message: "primeira" },
          { path: ["nome"], message: "segunda" },
        ],
      } as unknown as Parameters<typeof buildZodFieldErrors>[0];
      expect(buildZodFieldErrors(fakeError)).toEqual({ nome: "primeira" });
    });

    it("concatena paths aninhados com ponto", () => {
      const schema = z.object({
        endereco: z.object({
          cep: z.string().min(8, "CEP inválido"),
        }),
      });
      const res = schema.safeParse({ endereco: { cep: "123" } });
      expect(res.success).toBe(false);
      if (!res.success) {
        const errors = buildZodFieldErrors(res.error);
        expect(errors["endereco.cep"]).toBe("CEP inválido");
      }
    });
  });
});

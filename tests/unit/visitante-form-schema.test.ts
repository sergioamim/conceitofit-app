import { expect, test } from "vitest";
import {
  createVisitanteFormDefaults,
  visitanteFormSchema,
} from "../../src/app/(portal)/administrativo/visitantes/visitante-form";

test("visitante form schema rejeita telefone curto e validade passada", () => {
  const parsed = visitanteFormSchema.safeParse({
    ...createVisitanteFormDefaults(),
    nome: "João Visitante",
    telefone: "123",
    validoAte: "2020-01-01T10:00",
  });

  expect(parsed.success).toBe(false);
  if (parsed.success) return;
  expect(parsed.error.issues.some((issue) => issue.path.join(".") === "telefone")).toBe(true);
  expect(parsed.error.issues.some((issue) => issue.path.join(".") === "validoAte")).toBe(true);
});

test("visitante form schema aceita payload válido", () => {
  const parsed = visitanteFormSchema.safeParse({
    ...createVisitanteFormDefaults(),
    nome: "João Visitante",
    telefone: "11988887777",
    email: "visitante@academia.local",
    validoAte: createVisitanteFormDefaults().validoAte,
    maxEntradas: 2,
  });

  expect(parsed.success).toBe(true);
});

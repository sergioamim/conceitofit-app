import { describe, expect, it } from "vitest";
import { ApiRequestError } from "@/lib/api/http";
import { buildDuplicateProspectError } from "@/app/(portal)/prospects/components/prospect-form-errors";

describe("prospect form errors", () => {
  it("mapeia duplicidade para os campos informados", () => {
    const error = buildDuplicateProspectError({
      telefone: "11999990000",
      cpf: "12345678901",
      email: "lead@academia.local",
    });

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.fieldErrors).toEqual({
      telefone: "Já existe prospect com este telefone, CPF ou e-mail.",
      cpf: "Já existe prospect com este telefone, CPF ou e-mail.",
      email: "Já existe prospect com este telefone, CPF ou e-mail.",
    });
  });

  it("mantém ao menos o telefone quando não há campo explícito", () => {
    const error = buildDuplicateProspectError({
      telefone: "",
      cpf: "",
      email: "",
    });

    expect(error.fieldErrors).toEqual({
      telefone: "Já existe prospect com este telefone, CPF ou e-mail.",
    });
  });
});

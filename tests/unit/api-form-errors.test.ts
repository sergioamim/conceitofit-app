import { describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/lib/api/http";
import {
  applyApiFieldErrors,
  buildFormApiErrorMessage,
} from "@/lib/forms/api-form-errors";

describe("api-form-errors", () => {
  it("aplica fieldErrors diretamente quando o nome do campo coincide", () => {
    const setError = vi.fn();
    const error = new ApiRequestError({
      status: 400,
      message: "Validation error",
      fieldErrors: {
        nome: "Informe o nome.",
        email: "E-mail inválido.",
      },
    });

    const result = applyApiFieldErrors(error, setError);

    expect(result.appliedFields).toEqual(["nome", "email"]);
    expect(result.unmatchedFieldErrors).toEqual({});
    expect(setError).toHaveBeenCalledWith("nome", { type: "server", message: "Informe o nome." });
    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "E-mail inválido." });
  });

  it("respeita mapper e devolve erros não mapeados", () => {
    const setError = vi.fn();
    const error = new ApiRequestError({
      status: 400,
      message: "Validation error",
      fieldErrors: {
        nomeAcademia: "Informe a academia.",
        cnpj: "CNPJ inválido.",
      },
    });

    const result = applyApiFieldErrors(error, setError, {
      mapField: (field) => (field === "nomeAcademia" ? "academiaNome" : null),
    });

    expect(result.appliedFields).toEqual(["nomeAcademia"]);
    expect(result.unmatchedFieldErrors).toEqual({ cnpj: "CNPJ inválido." });
    expect(setError).toHaveBeenCalledWith("academiaNome", {
      type: "server",
      message: "Informe a academia.",
    });
  });

  it("normaliza índices em bracket notation para paths compatíveis com RHF", () => {
    const setError = vi.fn();
    const error = new ApiRequestError({
      status: 400,
      message: "Validation error",
      fieldErrors: {
        "passos[0].titulo": "Título obrigatório.",
      },
    });

    const result = applyApiFieldErrors(error, setError);

    expect(result.appliedFields).toEqual(["passos[0].titulo"]);
    expect(setError).toHaveBeenCalledWith("passos.0.titulo", {
      type: "server",
      message: "Título obrigatório.",
    });
  });

  it("gera fallback amigável quando todos os fieldErrors já foram aplicados inline", () => {
    const error = new ApiRequestError({
      status: 400,
      message: "Validation error",
      fieldErrors: {
        nome: "Informe o nome.",
      },
    });

    expect(buildFormApiErrorMessage(error, { appliedFields: ["nome"] })).toBe(
      "Revise os campos destacados e tente novamente.",
    );
  });

  it("preserva erros remanescentes quando nem todos os campos foram aplicados", () => {
    const error = new ApiRequestError({
      status: 400,
      message: "Validation error",
      fieldErrors: {
        nome: "Informe o nome.",
        email: "E-mail inválido.",
      },
    });

    expect(buildFormApiErrorMessage(error, { appliedFields: ["nome"] })).toBe(
      "email: E-mail inválido.",
    );
  });
});

import { expect, test } from "@playwright/test";
import { ApiRequestError } from "../../src/lib/api/http";
import { normalizeErrorMessage } from "../../src/lib/utils/api-error";

test.describe("normalizeErrorMessage", () => {
  test("prioriza fieldErrors vindos de ApiRequestError", () => {
    const error = new ApiRequestError({
      status: 400,
      message: "Validation error",
      fieldErrors: {
        apelido: "obrigatório",
        banco: "inválido",
      },
    });

    expect(normalizeErrorMessage(error)).toBe("apelido: obrigatório banco: inválido");
  });

  test("usa a mensagem do payload quando recebe erro serializado", () => {
    expect(
      normalizeErrorMessage({
        status: 503,
        error: "Service Unavailable",
        message: "backend offline",
      })
    ).toBe("backend offline");
  });
});

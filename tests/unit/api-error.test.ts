import { describe, expect, it } from "vitest";
import { ApiRequestError } from "@/lib/api/http";
import {
  describeErrorForUi,
  normalizeErrorMessage,
} from "@/lib/utils/api-error";

describe("api-error utilities", () => {
  describe("normalizeErrorMessage", () => {
    it("monta lista de erros por campo para ApiRequestError com fieldErrors", () => {
      const err = new ApiRequestError({
        status: 400,
        message: "Validation failed",
        fieldErrors: { nome: "obrigatório", email: "inválido" },
      });
      const result = normalizeErrorMessage(err);
      expect(result).toContain("nome: obrigatório");
      expect(result).toContain("email: inválido");
    });

    it("cai no message do ApiRequestError quando não há fieldErrors", () => {
      const err = new ApiRequestError({
        status: 500,
        message: "Erro interno",
      });
      expect(normalizeErrorMessage(err)).toBe("Erro interno");
    });

    it("retorna message de Error genérico", () => {
      const err = new Error("algo deu errado");
      expect(normalizeErrorMessage(err)).toBe("algo deu errado");
    });

    it("trata payload plain com fieldErrors", () => {
      const payload = { fieldErrors: { a: "erro A", b: "erro B" } };
      const result = normalizeErrorMessage(payload);
      expect(result).toContain("a: erro A");
      expect(result).toContain("b: erro B");
    });

    it("trata payload plain com message", () => {
      const payload = { message: "falha no backend" };
      expect(normalizeErrorMessage(payload)).toBe("falha no backend");
    });

    it("trata payload plain com error code", () => {
      const payload = { error: "NOT_FOUND" };
      expect(normalizeErrorMessage(payload)).toBe("NOT_FOUND");
    });

    it("trata ProblemDetail com detail e fieldErrors em properties", () => {
      const payload = {
        title: "Erro de validacao",
        detail: "email já cadastrado",
        properties: {
          fieldErrors: [
            { field: "email", message: "já cadastrado" },
          ],
        },
      };

      expect(normalizeErrorMessage(payload)).toBe("email: já cadastrado");
    });

    it("usa fallback padrão quando o valor não é reconhecido", () => {
      expect(normalizeErrorMessage(null)).toBe(
        "Não foi possível completar a operação.",
      );
      expect(normalizeErrorMessage(undefined)).toBe(
        "Não foi possível completar a operação.",
      );
      expect(normalizeErrorMessage(42)).toBe(
        "Não foi possível completar a operação.",
      );
      expect(normalizeErrorMessage("plain string")).toBe(
        "Não foi possível completar a operação.",
      );
    });
  });

  describe("describeErrorForUi", () => {
    it("401 vira 'Acesso indisponível'", () => {
      const err = new ApiRequestError({
        status: 401,
        message: "unauthorized",
      });
      const result = describeErrorForUi(err);
      expect(result.title).toBe("Acesso indisponível");
      expect(result.details.find((d) => d.label === "HTTP")?.value).toBe("401");
    });

    it("403 também vira 'Acesso indisponível'", () => {
      const err = new ApiRequestError({ status: 403, message: "forbidden" });
      expect(describeErrorForUi(err).title).toBe("Acesso indisponível");
    });

    it("404 vira 'Recurso não encontrado'", () => {
      const err = new ApiRequestError({
        status: 404,
        message: "not found",
      });
      const result = describeErrorForUi(err);
      expect(result.title).toBe("Recurso não encontrado");
    });

    it("5xx vira 'Falha no servidor'", () => {
      const err = new ApiRequestError({ status: 500, message: "boom" });
      expect(describeErrorForUi(err).title).toBe("Falha no servidor");
      expect(describeErrorForUi(new ApiRequestError({ status: 503, message: "down" })).title).toBe(
        "Falha no servidor",
      );
    });

    it("4xx genérico vira 'Falha de comunicação'", () => {
      const err = new ApiRequestError({ status: 422, message: "validation" });
      expect(describeErrorForUi(err).title).toBe("Falha de comunicação");
    });

    it("Error de rede vira 'Falha de comunicação'", () => {
      const err = new Error("failed to fetch");
      expect(describeErrorForUi(err).title).toBe("Falha de comunicação");
    });

    it("Error AbortError também vira network", () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      expect(describeErrorForUi(err).title).toBe("Falha de comunicação");
    });

    it("Error genérico usa fallbackTitle customizado", () => {
      const result = describeErrorForUi(new Error("boom"), {
        fallbackTitle: "Meu título",
      });
      expect(result.title).toBe("Meu título");
    });

    it("inclui digest como Trace nos details", () => {
      const result = describeErrorForUi(new Error("boom"), { digest: "abc123" });
      expect(result.details).toContainEqual({ label: "Trace", value: "abc123" });
    });

    it("payload plain com message vira 'Falha de comunicação'", () => {
      const result = describeErrorForUi({ message: "falha" });
      expect(result.title).toBe("Falha de comunicação");
      expect(result.message).toBe("falha");
    });

    it("valor não reconhecido usa fallback title padrão", () => {
      const result = describeErrorForUi(null);
      expect(result.title).toBe("Ocorreu um erro inesperado");
    });

    it("ApiRequestError inclui contextId e requestId nos details", () => {
      const err = new ApiRequestError({
        status: 500,
        message: "boom",
        path: "/api/v1/foo",
        contextId: "ctx-abc",
        requestId: "req-xyz",
      });
      const details = describeErrorForUi(err).details;
      expect(details.find((d) => d.label === "Rota")?.value).toBe("/api/v1/foo");
      expect(details.find((d) => d.label === "Contexto")?.value).toBe("ctx-abc");
      expect(details.find((d) => d.label === "Request-Id")?.value).toBe("req-xyz");
    });
  });
});

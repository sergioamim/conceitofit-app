import { describe, expect, it } from "vitest";
import { cn, maskCEP, maskCPF, maskPhone, validateCardExpiry } from "@/lib/utils";

describe("lib/utils", () => {
  describe("cn (classNames merger)", () => {
    it("combina strings simples", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("aceita condicionais via clsx", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });

    it("faz merge via tailwind-merge (remove duplicata de px-*)", () => {
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    });

    it("aceita array e objeto", () => {
      expect(cn(["foo", { bar: true, baz: false }])).toBe("foo bar");
    });
  });

  describe("maskCPF", () => {
    it("formata 11 dígitos progressivamente", () => {
      expect(maskCPF("12345678901")).toBe("123.456.789-01");
    });

    it("trunca em 11 dígitos", () => {
      expect(maskCPF("123456789012345")).toBe("123.456.789-01");
    });

    it("ignora caracteres não-numéricos", () => {
      expect(maskCPF("abc123.456-789/01")).toBe("123.456.789-01");
    });

    it("mascara parcialmente enquanto digita", () => {
      expect(maskCPF("123")).toBe("123");
      expect(maskCPF("1234")).toBe("123.4");
      expect(maskCPF("1234567")).toBe("123.456.7");
    });
  });

  describe("maskPhone", () => {
    it("formata celular (11 dígitos)", () => {
      expect(maskPhone("11999990000")).toBe("(11) 99999-0000");
    });

    it("formata fixo (10 dígitos)", () => {
      expect(maskPhone("1133334444")).toBe("(11) 3333-4444");
    });

    it("trunca acima de 11", () => {
      expect(maskPhone("119999900001234")).toBe("(11) 99999-0000");
    });

    it("ignora não-numéricos", () => {
      expect(maskPhone("(11) 99999-0000")).toBe("(11) 99999-0000");
    });
  });

  describe("maskCEP", () => {
    it("formata CEP de 8 dígitos", () => {
      expect(maskCEP("12345678")).toBe("12345-678");
    });

    it("trunca acima de 8", () => {
      expect(maskCEP("123456789")).toBe("12345-678");
    });

    it("ignora caracteres", () => {
      expect(maskCEP("12345-678")).toBe("12345-678");
    });
  });

  describe("validateCardExpiry", () => {
    it("rejeita menos de 4 dígitos", () => {
      const res = validateCardExpiry("12");
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/incompleta/i);
    });

    it("rejeita mês fora do range", () => {
      const res = validateCardExpiry("1330");
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/Mês inválido/i);
    });

    it("rejeita cartão vencido", () => {
      // Passado certo: jan/2020
      const res = validateCardExpiry("0120");
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/vencido/i);
    });

    it("aceita cartão futuro", () => {
      // dez/2099
      const res = validateCardExpiry("1299");
      expect(res.valid).toBe(true);
    });

    it("aceita formato com barra", () => {
      const res = validateCardExpiry("12/99");
      expect(res.valid).toBe(true);
    });
  });
});

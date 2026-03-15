import { expect, test } from "@playwright/test";
import { cn, maskCEP, maskCPF, maskPhone, validateCardExpiry } from "../../src/lib/utils";

const RealDate = Date;

test.afterEach(() => {
  global.Date = RealDate;
});

test.describe("utils shared helpers", () => {
  test("mescla classes utilitarias e aplica mascaras brasileiras", () => {
    expect(cn("px-2", false && "hidden", "px-4", "text-sm")).toBe("px-4 text-sm");
    expect(maskCPF("12345678901")).toBe("123.456.789-01");
    expect(maskPhone("11987654321")).toBe("(11) 98765-4321");
    expect(maskPhone("1132654321")).toBe("(11) 3265-4321");
    expect(maskCEP("30140071")).toBe("30140-071");
  });

  test("valida expiração de cartão com mensagens claras", () => {
    global.Date = class extends RealDate {
      constructor(value?: string | number | Date) {
        super(value ?? "2026-03-14T12:00:00Z");
      }

      static now() {
        return new RealDate("2026-03-14T12:00:00Z").getTime();
      }
    } as DateConstructor;

    expect(validateCardExpiry("03/26")).toEqual({ valid: true });
    expect(validateCardExpiry("13/26")).toEqual({
      valid: false,
      message: "Mês inválido.",
    });
    expect(validateCardExpiry("02/26")).toEqual({
      valid: false,
      message: "Cartão vencido.",
    });
    expect(validateCardExpiry("0")).toEqual({
      valid: false,
      message: "Validade incompleta.",
    });
  });
});

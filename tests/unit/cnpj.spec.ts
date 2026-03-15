import { expect, test } from "@playwright/test";
import { formatCnpj, isValidCnpj, normalizeCnpjDigits } from "../../src/lib/utils/cnpj";

test.describe("cnpj utils", () => {
  test("normaliza e formata CNPJ", () => {
    expect(normalizeCnpjDigits("46.208.771/0001-70")).toBe("46208771000170");
    expect(formatCnpj("46208771000170")).toBe("46.208.771/0001-70");
    expect(formatCnpj("46208771")).toBe("46.208.771");
  });

  test("valida CNPJ corretamente", () => {
    expect(isValidCnpj("46.208.771/0001-70")).toBeTruthy();
    expect(isValidCnpj("11.111.111/1111-11")).toBeFalsy();
    expect(isValidCnpj("46.208.771/0001-71")).toBeFalsy();
  });
});

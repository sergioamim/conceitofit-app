import { describe, expect, it } from "vitest";
import { cn, maskCPF, maskPhone, maskCEP, validateCardExpiry } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});

describe("maskCPF", () => {
  it("formats 11 digits as CPF", () => {
    expect(maskCPF("12345678901")).toBe("123.456.789-01");
  });

  it("strips non-digit characters", () => {
    expect(maskCPF("123.456.789-01")).toBe("123.456.789-01");
  });

  it("handles partial input", () => {
    expect(maskCPF("1234")).toBe("123.4");
  });

  it("truncates to 11 digits", () => {
    expect(maskCPF("123456789012345")).toBe("123.456.789-01");
  });
});

describe("maskPhone", () => {
  it("formats 10-digit landline", () => {
    expect(maskPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("formats 11-digit mobile", () => {
    expect(maskPhone("11999887766")).toBe("(11) 99988-7766");
  });

  it("strips non-digits", () => {
    expect(maskPhone("(11) 99999-0000")).toBe("(11) 99999-0000");
  });
});

describe("maskCEP", () => {
  it("formats 8 digits as CEP", () => {
    expect(maskCEP("01310100")).toBe("01310-100");
  });

  it("handles partial input", () => {
    expect(maskCEP("0131")).toBe("0131");
  });
});

describe("validateCardExpiry", () => {
  it("rejects incomplete expiry", () => {
    expect(validateCardExpiry("12")).toEqual({
      valid: false,
      message: "Validade incompleta.",
    });
  });

  it("rejects invalid month", () => {
    expect(validateCardExpiry("1399")).toEqual({
      valid: false,
      message: "Mês inválido.",
    });
  });

  it("accepts valid future date", () => {
    expect(validateCardExpiry("1299")).toEqual({ valid: true });
  });
});

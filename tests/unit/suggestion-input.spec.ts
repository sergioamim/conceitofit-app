import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test.describe("suggestion input", () => {
  test("não faz preload no foco por padrão e exige flag explícita", () => {
    const source = readFileSync(`${process.cwd()}/src/components/shared/suggestion-input.tsx`, "utf8");

    expect(source).toContain("preloadOnFocus = false");
    expect(source).toContain("if (shouldOpen && preloadOnFocus && onFocusOpen) onFocusOpen();");
    expect(source).toContain("if (shouldOpen && onFocusOpen) onFocusOpen();");
  });
});

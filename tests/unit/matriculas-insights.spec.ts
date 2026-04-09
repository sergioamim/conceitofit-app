import { expect, test } from "@playwright/test";
import {
  formatDateLabel,
  formatMonthLabel,
} from "../../src/lib/tenant/comercial/matriculas-insights";

test.describe("matriculas insights", () => {
  test("formata datas e mes sem depender de locale do navegador", () => {
    expect(formatDateLabel("2026-03-19")).toBe("19/03/2026");
    expect(formatMonthLabel("2026-03")).toBe("marco/2026");
  });

});

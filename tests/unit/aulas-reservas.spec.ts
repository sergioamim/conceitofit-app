import { expect, test } from "@playwright/test";
import {
  createSessaoAulaId,
  getNextOccurrenceForDiasSemana,
  listDatesBetween,
} from "../../src/lib/tenant/aulas/reservas";

test.describe("aulas reservas helpers", () => {
  test("createSessaoAulaId compõe id estável por grade e data", async () => {
    expect(createSessaoAulaId("agr-s1-001", "2026-03-11")).toBe("sessao-agr-s1-001-2026-03-11");
  });

  test("listDatesBetween expande intervalo inclusivo", async () => {
    expect(listDatesBetween("2026-03-10", "2026-03-12")).toEqual([
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
    ]);
  });

  test("getNextOccurrenceForDiasSemana encontra próxima data válida", async () => {
    const reference = new Date("2026-03-10T09:00:00");
    expect(getNextOccurrenceForDiasSemana(["QUA", "SEX"], reference)).toBe("2026-03-11");
    expect(getNextOccurrenceForDiasSemana(["SEG"], reference)).toBe("2026-03-16");
  });
});

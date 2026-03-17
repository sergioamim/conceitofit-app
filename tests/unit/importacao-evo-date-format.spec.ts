import { expect, test } from "@playwright/test";
import { formatDateTime, formatJobAliasDate } from "../../src/app/(backoffice)/admin/importacao-evo-p0/date-time-format";

test("formatDateTime retorna formato determinístico para alias de pacote", () => {
  const utc = formatDateTime("2026-03-13T10:00:00Z");
  const localLike = formatDateTime("2026-03-13T10:00:00");
  const repeated = formatDateTime("2026-03-13T10:00:00Z");

  expect(utc).toBe(repeated);
  expect(utc).toBe(localLike);
  expect(utc).toMatch(/\d{2}\/\d{2}\/\d{4}/);
});

test("formatJobAliasDate trata vazios de forma estável e normaliza sem timezone explícito", () => {
  expect(formatJobAliasDate(undefined)).toBe("");
  expect(formatJobAliasDate("2026-03-13T10:00:00")).toBe(formatJobAliasDate("2026-03-13T10:00:00Z"));
  expect(formatJobAliasDate("invalid")).toBe("");
});

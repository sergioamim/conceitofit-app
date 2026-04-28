import { z } from "zod";
import { getBusinessTodayIso } from "@/lib/business-date";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

function isLetter(char: string) {
  return /\p{L}/u.test(char);
}

function isCombiningMark(char: string) {
  return /\p{M}/u.test(char);
}

export function hasValidPersonalName(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return false;
  }

  const chars = Array.from(normalized);
  if (!isLetter(chars[0] ?? "") || !isLetter(chars[chars.length - 1] ?? "")) {
    return false;
  }

  let usefulLetters = 0;
  for (const char of chars) {
    if (isLetter(char)) {
      usefulLetters += 1;
      continue;
    }
    if (isCombiningMark(char)) {
      continue;
    }
    if (char === " " || char === "-" || char === "'" || char === "’") {
      continue;
    }
    return false;
  }

  return usefulLetters >= 3;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function requiredPersonalName(message: string, invalidMessage = "Informe um nome válido.") {
  return requiredTrimmedString(message).refine(hasValidPersonalName, invalidMessage);
}

export function requiredPastDateString(
  requiredMessage: string,
  invalidMessage = "Informe uma data válida.",
  futureMessage = "A data de nascimento deve ser anterior a hoje.",
) {
  return requiredTrimmedString(requiredMessage).superRefine((value, ctx) => {
    if (!isValidIsoDate(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: invalidMessage,
      });
      return;
    }
    if (value >= getBusinessTodayIso()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: futureMessage,
      });
    }
  });
}

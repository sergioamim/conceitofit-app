const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function getPartMap(reference: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.formatToParts(reference).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

export function getBusinessDateParts(reference: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const parts = getPartMap(reference);
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIsoDateAtNoon(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function getBusinessTodayIso(reference: Date = new Date()): string {
  const { year, month, day } = getBusinessDateParts(reference);
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function getBusinessTodayDate(reference: Date = new Date()): Date {
  return parseIsoDateAtNoon(getBusinessTodayIso(reference));
}

export function getBusinessCurrentMonthYear(reference: Date = new Date()): {
  month: number;
  year: number;
} {
  const { year, month } = getBusinessDateParts(reference);
  return { month: month - 1, year };
}

export function getBusinessMonthRange(reference: Date = new Date()): {
  start: string;
  end: string;
} {
  const { year, month } = getBusinessDateParts(reference);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${pad(month)}-01`,
    end: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

export function addDaysToIsoDate(value: string, days: number): string {
  const next = parseIsoDateAtNoon(value);
  next.setDate(next.getDate() + days);
  return toIsoDate(next);
}

import { formatDateTime as formatDateTimeCanonical } from "@/lib/formatters";

const TIMEZONE = "America/Sao_Paulo";
const DISPLAY_LOCALE = "pt-BR";
const EMPTY_JOB_ALIAS_DATE = "";

const JOB_ALIAS_FORMAT_OPTIONS = {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIMEZONE,
} as const;

const jobAliasDateFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, JOB_ALIAS_FORMAT_OPTIONS);

function normalizeIsoString(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hasExplicitOffset = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(trimmed);
  if (hasExplicitOffset) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00Z`;
  return `${trimmed}Z`;
}

export function formatJobAliasDate(value?: string | null): string {
  if (!value) return EMPTY_JOB_ALIAS_DATE;
  const normalized = normalizeIsoString(value);
  if (!normalized) return EMPTY_JOB_ALIAS_DATE;
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) return EMPTY_JOB_ALIAS_DATE;
  return jobAliasDateFormatter.format(new Date(timestamp));
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const normalized = normalizeIsoString(value);
  if (!normalized) return "—";
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) return "—";
  return formatDateTimeCanonical(new Date(timestamp).toISOString());
}

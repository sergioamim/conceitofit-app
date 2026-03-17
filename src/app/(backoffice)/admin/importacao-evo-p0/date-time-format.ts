const TIMEZONE = "America/Sao_Paulo";
const DISPLAY_LOCALE = "pt-BR";
const NO_VALUE_LABEL = "—";

const EMPTY_JOB_ALIAS_DATE = "";

const JOB_ALIAS_FORMAT_OPTIONS = {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIMEZONE,
} as const;

const DATE_TIME_FORMAT_OPTIONS = {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: TIMEZONE,
} as const;

const jobAliasDateFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, JOB_ALIAS_FORMAT_OPTIONS);
const dateTimeFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, DATE_TIME_FORMAT_OPTIONS);

function normalizeIsoString(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hasExplicitOffset = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(trimmed);
  if (hasExplicitOffset) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00Z`;
  return `${trimmed}Z`;
}

function formatSafeTimestamp(
  value: string | null | undefined,
  fallback: string
): string {
  if (!value) return fallback;
  const normalized = normalizeIsoString(value);
  if (!normalized) return fallback;
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) return fallback;
  return fallback === EMPTY_JOB_ALIAS_DATE
    ? jobAliasDateFormatter.format(new Date(timestamp))
    : dateTimeFormatter.format(new Date(timestamp));
}

export function formatJobAliasDate(value?: string | null): string {
  return formatSafeTimestamp(value, EMPTY_JOB_ALIAS_DATE);
}

export function formatDateTime(value?: string | null): string {
  return formatSafeTimestamp(value, NO_VALUE_LABEL);
}

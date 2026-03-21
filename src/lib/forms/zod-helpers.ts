import { z, ZodError } from "zod";

export function requiredTrimmedString(message: string) {
  return z.string().trim().min(1, message);
}

export function optionalTrimmedString() {
  return z.string().trim().optional();
}

export function buildZodFieldErrors(error: ZodError): Record<string, string> {
  const entries = error.issues.reduce<Record<string, string>>((acc, issue) => {
    const field = issue.path.map((segment) => String(segment)).join(".");
    if (field && !acc[field]) {
      acc[field] = issue.message;
    }
    return acc;
  }, {});

  return entries;
}

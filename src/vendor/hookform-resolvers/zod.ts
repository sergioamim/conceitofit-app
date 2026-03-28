import type { FieldErrors, FieldValues, Resolver, ResolverResult } from "react-hook-form";
import { type ZodIssue, type ZodType } from "zod";

function setNestedError(target: Record<string, unknown>, path: string[], issue: ZodIssue) {
  const [head, ...tail] = path;
  if (!head) return;

  if (tail.length === 0) {
    target[head] = {
      type: issue.code,
      message: issue.message,
    };
    return;
  }

  const current =
    target[head] && typeof target[head] === "object" && !Array.isArray(target[head])
      ? (target[head] as Record<string, unknown>)
      : {};
  target[head] = current;
  setNestedError(current, tail, issue);
}

function toFieldErrors<TFieldValues extends FieldValues>(issues: ZodIssue[]): FieldErrors<TFieldValues> {
  const errors: Record<string, unknown> = {};

  issues.forEach((issue) => {
    const path = issue.path.map((segment) => String(segment)).filter(Boolean);
    if (path.length === 0) return;
    setNestedError(errors, path, issue);
  });

  return errors as FieldErrors<TFieldValues>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodResolver<TFieldValues extends FieldValues = any>(
  schema: ZodType,
): Resolver<TFieldValues> {
  return async (values): Promise<ResolverResult<TFieldValues>> => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return {
        values: result.data as TFieldValues,
        errors: {},
      };
    }

    return {
      values: {} as Record<string, never>,
      errors: toFieldErrors<TFieldValues>(result.error.issues),
    };
  };
}

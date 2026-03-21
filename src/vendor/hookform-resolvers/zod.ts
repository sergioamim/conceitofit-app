import type { FieldErrors, FieldValues, Resolver, ResolverResult } from "react-hook-form";
import { z, type ZodIssue, type ZodType } from "zod";

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

export function zodResolver<TSchema extends ZodType>(
  schema: TSchema,
): Resolver<z.input<TSchema>, unknown, z.output<TSchema>> {
  return async (values): Promise<ResolverResult<z.input<TSchema>, z.output<TSchema>>> => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    return {
      values: {} as z.output<TSchema>,
      errors: toFieldErrors<z.input<TSchema>>(result.error.issues),
    };
  };
}

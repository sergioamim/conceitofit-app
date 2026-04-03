import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().optional());

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.url().optional());

const appEnvSchema = z.object({
  BACKEND_PROXY_TARGET: z
    .string({
      error: () => "BACKEND_PROXY_TARGET é obrigatório.",
    })
    .trim()
    .min(1, "BACKEND_PROXY_TARGET é obrigatório.")
    .url("BACKEND_PROXY_TARGET precisa ser uma URL válida."),
  BACKEND_PROXY_MAX_BODY_SIZE: z.coerce.number().int().positive().default(150),
  NEXT_PUBLIC_API_BASE_URL: optionalUrl,
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  NEXT_PUBLIC_DEBUG_REACT_SCAN: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_DEBUG_QUERY_DEVTOOLS: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_DEBUG_SESSION_DEVTOOLS: z.enum(["true", "false"]).optional(),
  STOREFRONT_ROOT_HOSTS: optionalString,
});

export type AppEnv = z.infer<typeof appEnvSchema>;

let cachedEnv: AppEnv | null = null;

function formatEnvIssues(error: z.ZodError<AppEnv>) {
  return error.issues
    .map((issue) => {
      const key = issue.path.join(".") || "ENV";
      return `- ${key}: ${issue.message}`;
    })
    .join("\n");
}

export function parseAppEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = appEnvSchema.safeParse(source);

  if (!parsed.success) {
    console.error("[env] Falha na validação das variáveis de ambiente:");
    console.error(formatEnvIssues(parsed.error));
    throw new Error("Variáveis de ambiente inválidas. Revise o log acima antes de subir o Next.js.");
  }

  return parsed.data;
}

export function getAppEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;
  cachedEnv = parseAppEnv();
  return cachedEnv;
}

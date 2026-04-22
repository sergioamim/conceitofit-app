/**
 * AG-7.9 — builders de schema Zod e valores default para o form
 * dinâmico de configuração de agregador. Extraído do componente para
 * manter o render sob 500 linhas e permitir testes isolados.
 */
import { z } from "zod";
import type {
  AgregadorConfigResponse,
  AgregadorSchemaEntry,
} from "@/lib/api/agregadores-admin";

export const FIELD_LABELS: Record<string, string> = {
  external_gym_id: "External Gym ID",
  site_id: "Site ID",
  access_token: "Access Token",
  webhook_secret: "Webhook Secret",
};

export function snakeToCamel(input: string): string {
  return input.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? snakeToCamel(key);
}

export function isSecretField(key: string): boolean {
  return key === "access_token" || key === "webhook_secret";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZod = z.ZodType<any, any, any>;

/**
 * Builder do zod schema a partir do metadata do agregador.
 *
 * Campos simples (excluindo access_token e webhook_secret que são secrets):
 *   - required → string().min(1)
 *   - optional → string().optional()
 *
 * Flags são tipadas por `schema.flags[].type`:
 *   - boolean → boolean
 *   - enum → enum(options)
 *   - string → string().optional()
 *   - number → number().optional()
 */
export function buildZodSchema(
  schema: AgregadorSchemaEntry,
  mode: "create" | "edit",
) {
  const shape: Record<string, AnyZod> = {};

  const simpleFields = [
    ...schema.camposRequeridos.filter((k) => !isSecretField(k)),
    ...schema.camposOpcionais.filter((k) => !isSecretField(k)),
  ];

  for (const rawKey of simpleFields) {
    const camelKey = snakeToCamel(rawKey);
    const required = schema.camposRequeridos.includes(rawKey);
    if (required) {
      shape[camelKey] = z
        .string()
        .min(1, `${fieldLabel(rawKey)} é obrigatório`);
    } else {
      shape[camelKey] = z.string().optional();
    }
  }

  if (mode === "create") {
    shape["accessToken"] = z.string().min(1, "Access Token é obrigatório");
  } else {
    shape["accessToken"] = z.string().optional();
  }

  shape["enabled"] = z.boolean().optional();

  for (const flag of schema.flags) {
    switch (flag.type) {
      case "boolean":
        shape[flag.key] = z.boolean().optional();
        break;
      case "enum": {
        const options =
          flag.options && flag.options.length > 0 ? flag.options : [""];
        shape[flag.key] = z
          .enum(options as [string, ...string[]])
          .optional();
        break;
      }
      case "number":
        shape[flag.key] = z.union([z.number(), z.string()]).optional();
        break;
      case "string":
      default:
        shape[flag.key] = z.string().optional();
        break;
    }
  }

  return z.object(shape);
}

export type AgregadorConfigFormValues = Record<
  string,
  string | boolean | number | undefined
>;

export function buildDefaults(
  schema: AgregadorSchemaEntry,
  config: AgregadorConfigResponse | undefined,
): AgregadorConfigFormValues {
  const defaults: AgregadorConfigFormValues = {};

  const simpleFields = [
    ...schema.camposRequeridos.filter((k) => !isSecretField(k)),
    ...schema.camposOpcionais.filter((k) => !isSecretField(k)),
  ];

  for (const rawKey of simpleFields) {
    const camelKey = snakeToCamel(rawKey);
    if (camelKey === "externalGymId") {
      defaults[camelKey] = config?.externalGymId ?? "";
    } else if (camelKey === "siteId") {
      defaults[camelKey] = config?.siteId ?? "";
    } else {
      const source = config?.flags as Record<string, unknown> | undefined;
      const candidate = source?.[camelKey] ?? source?.[rawKey];
      defaults[camelKey] = typeof candidate === "string" ? candidate : "";
    }
  }

  defaults["accessToken"] = "";
  defaults["enabled"] = config ? Boolean(config.enabled) : true;

  const currentFlags = (config?.flags ?? {}) as Record<string, unknown>;
  for (const flag of schema.flags) {
    const existing = currentFlags[flag.key];
    if (flag.type === "boolean") {
      if (typeof existing === "boolean") {
        defaults[flag.key] = existing;
      } else if (typeof flag.default === "boolean") {
        defaults[flag.key] = flag.default;
      } else {
        defaults[flag.key] = false;
      }
    } else if (flag.type === "enum") {
      if (typeof existing === "string") {
        defaults[flag.key] = existing;
      } else if (typeof flag.default === "string") {
        defaults[flag.key] = flag.default;
      } else {
        defaults[flag.key] = flag.options?.[0] ?? "";
      }
    } else if (flag.type === "number") {
      if (typeof existing === "number") {
        defaults[flag.key] = existing;
      } else if (typeof flag.default === "number") {
        defaults[flag.key] = flag.default;
      } else {
        defaults[flag.key] = "";
      }
    } else {
      if (typeof existing === "string") {
        defaults[flag.key] = existing;
      } else if (typeof flag.default === "string") {
        defaults[flag.key] = flag.default;
      } else {
        defaults[flag.key] = "";
      }
    }
  }

  return defaults;
}

export function buildWebhookUrl(
  schema: AgregadorSchemaEntry,
): string | undefined {
  const first = schema.webhookEndpoints?.[0];
  if (!first) return undefined;
  if (typeof window === "undefined") return first;
  try {
    return new URL(first, window.location.origin).toString();
  } catch {
    return first;
  }
}

export function splitFormValues(
  values: AgregadorConfigFormValues,
  schema: AgregadorSchemaEntry,
): {
  externalGymId?: string;
  siteId?: string;
  enabled?: boolean;
  accessToken?: string;
  flags: Record<string, unknown>;
} {
  const externalGymId =
    typeof values["externalGymId"] === "string"
      ? (values["externalGymId"] as string).trim() || undefined
      : undefined;
  const siteId =
    typeof values["siteId"] === "string"
      ? (values["siteId"] as string).trim() || undefined
      : undefined;
  const enabled =
    typeof values["enabled"] === "boolean"
      ? (values["enabled"] as boolean)
      : undefined;
  const accessTokenRaw = values["accessToken"];
  const accessToken =
    typeof accessTokenRaw === "string" && accessTokenRaw.trim() !== ""
      ? accessTokenRaw.trim()
      : undefined;

  const flags: Record<string, unknown> = {};
  for (const flag of schema.flags) {
    const v = values[flag.key];
    if (v === undefined || v === "") continue;
    if (flag.type === "number" && typeof v === "string") {
      const parsed = Number(v);
      if (!Number.isNaN(parsed)) flags[flag.key] = parsed;
    } else {
      flags[flag.key] = v;
    }
  }

  return { externalGymId, siteId, enabled, accessToken, flags };
}

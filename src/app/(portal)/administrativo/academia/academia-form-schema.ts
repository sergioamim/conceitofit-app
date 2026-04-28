import { z } from "zod";
import type { TenantThemePreset } from "@/lib/types";
import { DEFAULT_THEME_PRESET } from "@/lib/tenant/tenant-theme";
import { optionalTrimmedString, requiredTrimmedString } from "@/lib/forms/zod-helpers";

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
const emailSchema = z.string().email("Informe um e-mail válido.");

function hasValidPhone(value: string) {
  return value.replace(/\D/g, "").length >= 10;
}

const optionalHexColor = z
  .string()
  .trim()
  .regex(hexColorRegex, "Use um hex válido no formato #RRGGBB.")
  .optional()
  .or(z.literal(""));

const tenantThemePresetValues = [
  "CONCEITO_DARK",
  "AZUL_OCEANO",
  "VERDE_ENERGIA",
  "GRAFITE_FIRE",
  "DRACULA",
  "AREIA_SOLAR",
  "NUVEM_CLARA",
  "ROSA_EDITORIAL",
  "COBALTO_NOTURNO",
  "AURORA_BOREAL",
  "TERRACOTA_SUAVE",
  "MENTA_MODERNA",
  "LUMEN_FINANCE",
] as const satisfies readonly TenantThemePreset[];

export const academiaThemePresetSchema = z.enum(tenantThemePresetValues);

export const academiaThemeFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome da academia."),
  razaoSocial: optionalTrimmedString(),
  documento: optionalTrimmedString(),
  email: optionalTrimmedString().refine((value) => !value || emailSchema.safeParse(value).success, "Informe um e-mail válido."),
  telefone: optionalTrimmedString().refine((value) => !value || hasValidPhone(value), "Informe um telefone válido."),
  endereco: z.object({
    cep: optionalTrimmedString(),
    logradouro: optionalTrimmedString(),
    numero: optionalTrimmedString(),
    complemento: optionalTrimmedString(),
    bairro: optionalTrimmedString(),
    cidade: optionalTrimmedString(),
    estado: optionalTrimmedString(),
  }),
  branding: z.object({
    appName: optionalTrimmedString(),
    logoUrl: optionalTrimmedString(),
    themePreset: academiaThemePresetSchema.default(DEFAULT_THEME_PRESET),
    useCustomColors: z.boolean().default(false),
    colors: z.object({
      accent: optionalHexColor,
      primary: optionalHexColor,
      secondary: optionalHexColor,
      background: optionalHexColor,
      surface: optionalHexColor,
      border: optionalHexColor,
      foreground: optionalHexColor,
      mutedForeground: optionalHexColor,
      danger: optionalHexColor,
      warning: optionalHexColor,
      teal: optionalHexColor,
    }),
  }),
});

export type AcademiaThemeFormValues = z.infer<typeof academiaThemeFormSchema>;

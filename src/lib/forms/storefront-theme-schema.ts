import { z } from "zod";
import { optionalTrimmedString } from "./zod-helpers";

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

const optionalHexColor = z
  .string()
  .trim()
  .regex(hexColorRegex, "Cor deve ser um hex válido (#RRGGBB)")
  .optional()
  .or(z.literal(""));

export const storefrontThemeSchema = z.object({
  logoUrl: optionalTrimmedString(),
  faviconUrl: optionalTrimmedString(),
  heroImageUrl: optionalTrimmedString(),
  heroTitle: optionalTrimmedString(),
  heroSubtitle: optionalTrimmedString(),
  themePreset: optionalTrimmedString(),
  useCustomColors: z.boolean().optional(),
  colors: z
    .object({
      accent: optionalHexColor,
      primary: optionalHexColor,
      background: optionalHexColor,
      surface: optionalHexColor,
      foreground: optionalHexColor,
      mutedForeground: optionalHexColor,
      border: optionalHexColor,
    })
    .optional(),
  footerText: optionalTrimmedString(),
  instagram: optionalTrimmedString(),
  facebook: optionalTrimmedString(),
  whatsapp: optionalTrimmedString(),
});

export type StorefrontThemeFormValues = z.infer<typeof storefrontThemeSchema>;

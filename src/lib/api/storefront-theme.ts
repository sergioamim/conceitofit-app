import type { StorefrontTheme } from "@/lib/types";
import { apiRequest } from "./http";

/**
 * Payload aceito pelo endpoint `PUT /api/v1/storefront/theme`.
 * Reflete o contrato Java `StorefrontThemeRequest`: todos os campos são
 * opcionais e os de timestamp/id/academiaId não podem ser enviados.
 *
 * IMPORTANTE: redes sociais devem ir como campos FLAT (`instagram`, `facebook`,
 * `whatsapp`) ou via mapa `redesSociais`. O campo aninhado `socialLinks` do
 * tipo `StorefrontTheme` é legado do FE e **é ignorado pelo Jackson** —
 * nunca enviar.
 */
export type StorefrontThemePayload = Omit<
  StorefrontTheme,
  "id" | "academiaId" | "tenantId" | "dataCriacao" | "dataAtualizacao" | "updatedAt" | "socialLinks"
>;

export async function getStorefrontTheme(tenantId: string): Promise<StorefrontTheme | null> {
  try {
    return await apiRequest<StorefrontTheme>({
      path: "/api/v1/storefront/theme",
      query: { tenantId },
    });
  } catch {
    return null;
  }
}

export async function saveStorefrontTheme(
  tenantId: string,
  theme: StorefrontThemePayload,
): Promise<StorefrontTheme> {
  return apiRequest<StorefrontTheme>({
    path: "/api/v1/storefront/theme",
    method: "PUT",
    query: { tenantId },
    body: theme,
  });
}

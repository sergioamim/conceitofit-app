import type { StorefrontTheme } from "@/lib/types";
import { apiRequest } from "./http";

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
  theme: Omit<StorefrontTheme, "id" | "tenantId" | "updatedAt">,
): Promise<StorefrontTheme> {
  return apiRequest<StorefrontTheme>({
    path: "/api/v1/storefront/theme",
    method: "PUT",
    query: { tenantId },
    body: theme,
  });
}

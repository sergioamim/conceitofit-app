import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { normalizeUserKind } from "@/lib/shared/user-kind";
import { FeatureFlagsContent } from "./feature-flags-content";

export const metadata = {
  title: "Feature flags",
};

/**
 * Página admin `/admin/feature-flags` — gestão per-tenant de feature flags.
 *
 * Exclusiva PLATAFORMA (SaaS admin). O guard server-side rejeita CLIENTE e
 * usuários sem `userKind === "PLATAFORMA"` antes da hidratação. O endpoint
 * BE também enforça via `@PreAuthorize`.
 */
export default async function FeatureFlagsAdminPage() {
  const jar = await cookies();
  const claimsRaw = jar.get("fc_session_claims")?.value;

  if (claimsRaw) {
    try {
      const parsed = JSON.parse(claimsRaw) as {
        userKind?: unknown;
        broadAccess?: unknown;
        availableScopes?: unknown;
      };
      const direct = normalizeUserKind(
        typeof parsed.userKind === "string" ? parsed.userKind : undefined,
      );
      const scopes = Array.isArray(parsed.availableScopes)
        ? parsed.availableScopes
            .map((item) =>
              typeof item === "string" ? item.trim().toUpperCase() : "",
            )
            .filter(Boolean)
        : [];
      const inferredPlataforma =
        scopes.includes("GLOBAL") || parsed.broadAccess === true;
      const isPlataforma = direct === "PLATAFORMA" || inferredPlataforma;

      if (!isPlataforma) {
        redirect("/admin");
      }
    } catch {
      // Claims malformados → deixa hidratação client tratar.
    }
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Carregando feature flags...
        </div>
      }
    >
      <FeatureFlagsContent />
    </Suspense>
  );
}

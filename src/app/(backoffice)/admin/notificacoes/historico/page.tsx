import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { normalizeUserKind } from "@/lib/shared/user-kind";
import { HistoricoNotificacoesContent } from "./historico-content";

export const metadata = {
  title: "Histórico de notificações",
};

/**
 * Guard de PLATAFORMA (mesma lógica da página de emissão).
 */
export default async function HistoricoNotificacoesPage() {
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
      // Claims malformados → deixa a hidratação client-side tratar.
    }
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Carregando histórico...
        </div>
      }
    >
      <HistoricoNotificacoesContent />
    </Suspense>
  );
}

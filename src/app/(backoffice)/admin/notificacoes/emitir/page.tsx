import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { normalizeUserKind } from "@/lib/shared/user-kind";
import { EmitirNotificacaoContent } from "./emitir-content";

export const metadata = {
  title: "Emitir notificação",
};

/**
 * Guard server-side de PLATAFORMA.
 *
 * O layout `(backoffice)/admin/layout.tsx` já redireciona CLIENTE e o
 * `AdminLayoutClient` bloqueia usuários sem acesso elevado. Aqui reforçamos
 * que apenas PLATAFORMA vê a página (OPERADOR com privilégios elevados
 * segue sendo tratado como sem permissão — emissão é exclusiva do SaaS admin).
 */
export default async function EmitirNotificacaoPage() {
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
          Carregando formulário de emissão...
        </div>
      }
    >
      <EmitirNotificacaoContent />
    </Suspense>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeUserKind } from "@/lib/shared/user-kind";
import { AdminLayoutClient } from "./layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const hasSession =
    jar.get("fc_session_active")?.value === "true" ||
    Boolean(jar.get("fc_access_token")?.value);

  if (hasSession) {
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
        if (direct === "CLIENTE") {
          redirect("/dashboard");
        }
      } catch {
        // Claims malformados → deixa a hidratação client-side tratar
      }
    }
  }

  return (
    <AdminLayoutClient initialAuthenticated={hasSession}>
      {children}
    </AdminLayoutClient>
  );
}

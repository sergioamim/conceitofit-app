import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Rota "/" — hub de entrada:
 * - Usuário autenticado → /dashboard
 * - Visitante público   → /b2b (landing page comercial)
 */
export default async function HomePage() {
  const jar = await cookies();
  const hasSession = Boolean(jar.get("academia-active-tenant-id")?.value);

  if (hasSession) {
    redirect("/dashboard");
  }

  redirect("/b2b");
}

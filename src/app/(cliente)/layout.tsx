import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ClienteLayoutClient } from "./layout-client";

export const metadata: Metadata = {
  title: {
    default: "Minha área — Conceito Fit",
    template: "%s — Conceito Fit",
  },
  description: "Área do aluno no Conceito Fit — treinos, pagamentos, agenda.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const hasSession =
    jar.get("fc_session_active")?.value === "true" ||
    Boolean(jar.get("fc_access_token")?.value);

  return (
    <ClienteLayoutClient initialAuthenticated={hasSession}>
      {children}
    </ClienteLayoutClient>
  );
}

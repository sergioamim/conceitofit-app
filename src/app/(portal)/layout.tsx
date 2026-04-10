import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PortalLayoutClient } from "./layout-client";

export const metadata: Metadata = {
  title: {
    default: "Portal — Conceito Fit",
    template: "%s — Portal Conceito Fit",
  },
  description: "Portal operacional do Conceito Fit — gestão da sua academia.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const hasSession =
    jar.get("fc_session_active")?.value === "true" ||
    Boolean(jar.get("fc_access_token")?.value);

  return (
    <PortalLayoutClient initialAuthenticated={hasSession}>
      {children}
    </PortalLayoutClient>
  );
}

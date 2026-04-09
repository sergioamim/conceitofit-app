import { cookies } from "next/headers";
import { PortalLayoutClient } from "./layout-client";

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

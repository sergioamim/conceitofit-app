import { cookies } from "next/headers";
import { ClienteLayoutClient } from "./layout-client";

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

import { cookies } from "next/headers";
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

  return (
    <AdminLayoutClient initialAuthenticated={hasSession}>
      {children}
    </AdminLayoutClient>
  );
}

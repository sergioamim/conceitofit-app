import type { ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "Academia";
  return {
    title: `Matricula Online — ${tenantSlug}`,
    description: `Faca sua matricula online na ${tenantSlug}.`,
  };
}

export default function StorefrontAdesaoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

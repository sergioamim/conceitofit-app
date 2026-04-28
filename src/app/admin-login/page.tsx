import type { Metadata } from "next";
import dynamic from "next/dynamic";

const AdminLoginFlow = dynamic(() =>
  import("@/components/auth/admin-login-flow").then((m) => m.AdminLoginFlow),
);

export const metadata: Metadata = {
  title: "Login administrativo — Conceito Fit",
  description: "Acesso administrativo global da plataforma Conceito Fit.",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "https://conceito.fit/admin-login" },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;
  return <AdminLoginFlow nextPath={next} reason={reason} />;
}

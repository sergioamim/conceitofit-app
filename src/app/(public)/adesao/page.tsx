import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getPublicJourneyContextServer,
  listPublicTenantsServer,
} from "@/lib/public/server-services";
import { AdesaoLandingContent } from "./adesao-landing-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Adesão digital – Escolha seu plano",
  description:
    "Assine um plano da academia com checkout digital, contrato e branding da unidade.",
};

function AdesaoError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="max-w-xl border-rose-500/40 bg-rose-500/10">
        <CardContent className="px-6 py-5 text-sm text-rose-100">
          {message}
        </CardContent>
      </Card>
    </div>
  );
}

async function AdesaoLandingServer({
  tenantRef,
}: {
  tenantRef?: string | null;
}) {
  try {
    const [context, tenants] = await Promise.all([
      getPublicJourneyContextServer(tenantRef),
      listPublicTenantsServer(),
    ]);

    return <AdesaoLandingContent context={context} tenants={tenants} />;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar a jornada pública.";
    return <AdesaoError message={message} />;
  }
}

export default async function AdesaoLandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantRef =
    typeof params.tenant === "string" ? params.tenant : undefined;

  return (
    <Suspense fallback={<SuspenseFallback variant="page" message="Carregando jornada pública..." />}>
      <AdesaoLandingServer tenantRef={tenantRef} />
    </Suspense>
  );
}

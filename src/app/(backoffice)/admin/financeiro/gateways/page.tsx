import { Suspense } from "react";
import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";
import { GatewaysContent } from "./components/gateways-content";
import type { GatewayPagamento } from "@/lib/types";

async function Loader() {
  let gateways: GatewayPagamento[] = [];

  try {
    gateways = await serverFetch<GatewayPagamento[]>(
      "/api/v1/admin/financeiro/gateways",
      { next: { revalidate: 0 } },
    );
  } catch (error) {
    logger.warn("[AdminGatewaysPage] SSR fetch failed, falling back to client", {
      module: "AdminGatewaysPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return <GatewaysContent initialData={gateways} />;
}

export default function AdminGatewaysPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <Loader />
    </Suspense>
  );
}

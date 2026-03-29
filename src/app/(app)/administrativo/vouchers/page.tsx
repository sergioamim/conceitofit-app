import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import type { Voucher } from "@/lib/types";
import { VouchersContent } from "./vouchers-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

async function getActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("academia-active-tenant-id")?.value;
}

async function Loader() {
  const tenantId = await getActiveTenantId();
  let vouchers: Voucher[] = [];
  let usageCounts: Record<string, number> = {};

  try {
    if (tenantId) {
      const [vouchersData, countsData] = await Promise.all([
        serverFetch<Voucher[]>("/api/v1/administrativo/vouchers", {
          query: { tenantId },
          next: { revalidate: 0 },
        }),
        serverFetch<Record<string, number>>(
          "/api/v1/administrativo/vouchers/usage-counts",
          {
            query: { tenantId },
            next: { revalidate: 0 },
          },
        ),
      ]);
      vouchers = vouchersData;
      usageCounts = countsData;
    }
  } catch (error) {
    logger.warn("[VouchersPage] SSR fetch failed, falling back to client", {
      module: "VouchersPage",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return (
    <VouchersContent
      initialData={vouchers}
      initialUsageCounts={usageCounts}
      tenantId={tenantId || ""}
    />
  );
}

export default function VouchersPage() {
  return (
    <Suspense
      fallback={
        <SuspenseFallback variant="section" />
      }
    >
      <Loader />
    </Suspense>
  );
}

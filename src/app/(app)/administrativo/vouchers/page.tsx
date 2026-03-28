import { Suspense } from "react";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import type { Voucher } from "@/lib/types";
import { VouchersContent } from "./vouchers-content";

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
          }
        ),
      ]);
      vouchers = vouchersData;
      usageCounts = countsData;
    }
  } catch {
    /* fallback to client-side fetch */
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
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Carregando vouchers...
        </div>
      }
    >
      <Loader />
    </Suspense>
  );
}

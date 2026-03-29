"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { setSentryContext } from "@/lib/shared/sentry";

export function SentryContextSync() {
  const { tenantId, userId, networkId } = useTenantContext();
  const pathname = usePathname();

  useEffect(() => {
    setSentryContext({
      tenantId: tenantId ?? undefined,
      userId: userId ?? undefined,
      networkId: networkId ?? undefined,
      route: pathname ?? undefined,
    });
  }, [tenantId, userId, networkId, pathname]);

  return null;
}

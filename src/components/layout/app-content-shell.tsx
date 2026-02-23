"use client";

import { useEffect, useState } from "react";
import { getCurrentTenant } from "@/lib/mock/services";

export function AppContentShell({ children }: { children: React.ReactNode }) {
  const [tenantKey, setTenantKey] = useState("tenant-initial");

  useEffect(() => {
    async function syncKey() {
      const tenant = await getCurrentTenant();
      setTenantKey(`tenant-${tenant.id}`);
    }
    syncKey();

    function handleUpdate() {
      syncKey();
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return (
    <div key={tenantKey} className="flex-1 overflow-y-auto p-3 md:p-7">
      {children}
    </div>
  );
}

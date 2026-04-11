import { Suspense } from "react";
import { BillingDashboardContent } from "./billing-dashboard-content";

export const metadata = {
  title: "Dashboard de cobranças recorrentes",
};

export default function BillingDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Carregando dashboard de cobranças...
        </div>
      }
    >
      <BillingDashboardContent />
    </Suspense>
  );
}

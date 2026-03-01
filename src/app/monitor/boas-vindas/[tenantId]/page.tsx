import { CatracaWelcomeMonitor } from "@/components/monitor/catraca-welcome-monitor";

export default async function MonitorBoasVindasByTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  return <CatracaWelcomeMonitor tenantId={tenantId} />;
}

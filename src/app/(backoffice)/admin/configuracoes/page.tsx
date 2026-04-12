import { Suspense } from "react";
import { SettingsContent } from "./components/settings-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

export const dynamic = "force-dynamic";

export default function AdminConfiguracoesPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <SettingsContent />
    </Suspense>
  );
}

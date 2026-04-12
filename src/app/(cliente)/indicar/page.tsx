import { Suspense } from "react";
import { IndicarContent } from "./components/indicar-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

export const dynamic = "force-dynamic";

export default function IndicarPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <IndicarContent />
    </Suspense>
  );
}

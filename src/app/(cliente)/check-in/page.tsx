import { Suspense } from "react";
import { CheckInContent } from "./components/check-in-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

export const dynamic = "force-dynamic";

/**
 * Check-in — Server Component
 *
 * Page is a Server Component that delegates interactivity
 * (QR code, presenca history, refresh) to the Client Island.
 */
export default function CheckInPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <CheckInContent />
    </Suspense>
  );
}

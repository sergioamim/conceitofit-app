import { Suspense } from "react";
import { WhatsappContent } from "./components/whatsapp-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

export const dynamic = "force-dynamic";

export default function AdminWhatsAppPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <WhatsappContent />
    </Suspense>
  );
}

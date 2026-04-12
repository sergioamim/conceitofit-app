import { Suspense } from "react";
import { LojaContent } from "./components/loja-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

export const dynamic = "force-dynamic";

export default function LojaPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <LojaContent />
    </Suspense>
  );
}

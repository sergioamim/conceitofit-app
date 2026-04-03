import { Suspense } from "react";
import { NfseContent } from "./nfse-content";

export default function NfsePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <NfseContent />
    </Suspense>
  );
}

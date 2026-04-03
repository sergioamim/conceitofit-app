import { Suspense } from "react";
import { StorefrontConfigContent } from "./storefront-content";

export default function StorefrontPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <StorefrontConfigContent />
    </Suspense>
  );
}

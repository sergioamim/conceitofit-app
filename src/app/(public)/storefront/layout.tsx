import type { ReactNode } from "react";

/**
 * Layout raiz do storefront — shell mínimo.
 * O tema e branding são resolvidos pelo layout de [academiaSlug]
 * ou via headers (subdomínio) nas rotas legadas.
 */
export default function StorefrontRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

import type { ReactNode } from "react";

/**
 * Boundary explicito das superficies publicas.
 * Metadata e JSON-LD continuam locais por feature enquanto a home institucional
 * e a taxonomia final ainda estao sendo consolidadas.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return children;
}

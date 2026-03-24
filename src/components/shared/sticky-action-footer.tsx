"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StickyActionFooterProps = {
  children: ReactNode;
  isDirty?: boolean;
  className?: string;
  containerPadding?: string;
};

/**
 * Renderiza um rodapé pegajoso (sticky) na base do contêiner scrollável.
 * 
 * Foi concebido primariamente para formulários longos em Dialogs ou Cards Shadcn com
 * padding pré-definido. Para "quebrar" o padding lateral e inferior do pai,
 * utilizamos margens negativas passadas via `containerPadding` (padrão é "-mx-6 -mb-6" correspondendo a p-6).
 */
export function StickyActionFooter({ 
  children, 
  isDirty = false, 
  className,
  containerPadding = "-mx-6 -mb-6"
}: StickyActionFooterProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 border-t bg-card px-6 py-4 transition-colors duration-300",
        containerPadding,
        isDirty 
          ? "border-t-gym-accent shadow-[0_-4px_15px_-4px_rgba(var(--gym-accent),0.25)]" 
          : "border-border shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]",
        className
      )}
    >
      {children}
    </div>
  );
}

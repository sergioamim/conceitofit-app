"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

/**
 * Placeholder padrão para abas cujo backend ainda não expõe dados (AC4.2 —
 * Wave 4). Mantém a estrutura visual da tab disponível sem fabricar conteúdo.
 */
export function ClienteTabPlaceholder({
  icon: Icon,
  titulo,
  descricao,
  hint,
  className,
}: {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center",
        className
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <h3 className="text-base font-bold text-foreground">{titulo}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{descricao}</p>
      {hint ? (
        <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

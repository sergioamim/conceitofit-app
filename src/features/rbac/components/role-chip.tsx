import { Shield } from "lucide-react";

import { cn } from "@/lib/utils";

interface RoleChipProps {
  nome: string;
  cor?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Chip colorido representando um Papel (PerfilAcessoEntity).
 * Cor vem do backend (perfil_acesso.cor); fallback para neutro quando ausente.
 */
export function RoleChip({ nome, cor, size = "md", className }: RoleChipProps) {
  const dotSize = size === "sm" ? 8 : 10;
  const fontSize = size === "sm" ? 11 : 12;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium",
        className,
      )}
      style={{
        fontSize,
        borderColor: cor
          ? `color-mix(in oklab, ${cor} 30%, transparent)`
          : "var(--border)",
        background: cor
          ? `color-mix(in oklab, ${cor} 12%, transparent)`
          : "var(--muted)",
        color: cor ?? "var(--muted-foreground)",
      }}
    >
      <Shield style={{ width: dotSize + 2, height: dotSize + 2 }} />
      {nome}
    </span>
  );
}

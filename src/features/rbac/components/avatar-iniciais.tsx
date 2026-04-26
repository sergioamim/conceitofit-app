import { cn } from "@/lib/utils";

interface AvatarIniciaisProps {
  nome: string;
  cor?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function iniciais(nome: string): string {
  if (!nome) return "?";
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_MAP = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
};

/**
 * Avatar com iniciais e gradient sutil baseado na cor passada.
 * Cor default = paleta Conceito.fit.
 */
export function AvatarIniciais({
  nome,
  cor,
  size = "md",
  className,
}: AvatarIniciaisProps) {
  const baseCor = cor ?? "#6b8c1a";
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white",
        SIZE_MAP[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${baseCor}, color-mix(in oklab, ${baseCor} 65%, transparent))`,
      }}
      aria-hidden
    >
      {iniciais(nome)}
    </div>
  );
}

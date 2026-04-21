import { CameraOff } from "lucide-react";
import { cn } from "@/lib/utils";

type FotoAvisoBadgeSize = "xs" | "sm" | "md";

const SIZE_CLASSES: Record<FotoAvisoBadgeSize, { wrapper: string; icon: string; dot: string }> = {
  xs: { wrapper: "size-5", icon: "size-3", dot: "size-2 -right-0.5 -top-0.5 text-[8px]" },
  sm: { wrapper: "size-6", icon: "size-3.5", dot: "size-2.5 -right-0.5 -top-0.5 text-[9px]" },
  md: { wrapper: "size-7", icon: "size-4", dot: "size-3 -right-0.5 -top-0.5 text-[10px]" },
};

/**
 * Alerta visual para fotos inadequadas p/ catraca (menores que 160x160).
 * Camera-off cinza + dot amarelo com "!" no canto.
 */
export function FotoAvisoBadge({
  motivo,
  size = "sm",
  className,
}: {
  motivo?: string | null;
  size?: FotoAvisoBadgeSize;
  className?: string;
}) {
  const sz = SIZE_CLASSES[size];
  const tooltip = motivo?.trim() || "Foto inadequada para reconhecimento facial";
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500",
        sz.wrapper,
        className,
      )}
      title={tooltip}
      aria-label={tooltip}
    >
      <CameraOff className={sz.icon} aria-hidden="true" />
      <span
        className={cn(
          "absolute inline-flex items-center justify-center rounded-full bg-amber-400 font-bold text-black",
          sz.dot,
        )}
        aria-hidden="true"
      >
        !
      </span>
    </span>
  );
}

import { cn } from "@/lib/utils";

type SuspenseFallbackVariant = "page" | "section" | "inline";

interface SuspenseFallbackProps {
  /** Mensagem exibida ao usuário. Default: "Carregando..." */
  message?: string;
  /** Variante de layout:
   * - `page`: min-h-screen, centralizado (para páginas inteiras)
   * - `section`: min-h-[60vh], centralizado (para seções de página)
   * - `inline`: sem altura mínima, inline (para componentes pequenos)
   */
  variant?: SuspenseFallbackVariant;
  /** Classes CSS adicionais */
  className?: string;
}

const variantStyles: Record<SuspenseFallbackVariant, string> = {
  page: "flex min-h-screen items-center justify-center bg-background",
  section: "flex min-h-[60vh] items-center justify-center",
  inline: "flex items-center justify-center py-8",
};

export function SuspenseFallback({
  message = "Carregando...",
  variant = "section",
  className,
}: SuspenseFallbackProps) {
  return (
    <div className={cn(variantStyles[variant], className)}>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

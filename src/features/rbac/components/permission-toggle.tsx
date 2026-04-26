import { cn } from "@/lib/utils";

interface PermissionToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Cell-toggle visual (on/off) usado pela matriz de permissões.
 * Tamanho compacto pra caber em rows da tabela.
 */
export function PermissionToggle({
  checked,
  onChange,
  disabled,
  className,
}: PermissionToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      className={cn(
        "relative inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full border transition-colors",
        checked
          ? "border-gym-accent bg-gym-accent/90"
          : "border-border bg-muted",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block size-3.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-3.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

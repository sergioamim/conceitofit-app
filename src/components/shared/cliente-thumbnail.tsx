import { cn } from "@/lib/utils";

type ClienteThumbnailSize = "sm" | "md" | "lg" | number;

const AVATAR_COLORS = ["#c8f135", "#3de8a0", "#38bdf8", "#f472b6", "#fb923c", "#a78bfa"];

function getInitials(nome?: string | null): string {
  const words = (nome ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (words.length === 0) return "CL";
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

function avatarColor(nome?: string | null): string {
  const base = nome ?? "cliente";
  let hash = 0;
  for (const char of base) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function sizeClass(size: ClienteThumbnailSize): string {
  if (typeof size === "number") return "";
  if (size === "sm") return "size-9 text-xs";
  if (size === "lg") return "size-16 text-sm";
  return "size-10 text-xs";
}

export function ClienteThumbnail({
  nome,
  foto,
  size = "md",
  className,
  alt,
}: {
  nome?: string | null;
  foto?: string | null;
  size?: ClienteThumbnailSize;
  className?: string;
  alt?: string;
}) {
  const resolvedAlt = alt ?? nome ?? "Cliente";
  const color = avatarColor(nome);
  const dynamicSizeStyle =
    typeof size === "number"
      ? { width: `${size}px`, height: `${size}px` }
      : undefined;

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-full border border-border bg-secondary shadow-inner",
        sizeClass(size),
        className
      )}
      style={dynamicSizeStyle}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt={resolvedAlt} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-semibold"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {getInitials(nome)}
        </div>
      )}
    </div>
  );
}


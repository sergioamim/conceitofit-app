"use client";

import { cn } from "@/lib/utils";
import { resolveActivityIcon } from "@/lib/icons/activity-icons";

export function ActivityIconChip({
  icone,
  cor,
  className,
}: {
  icone?: string;
  cor?: string;
  className?: string;
}) {
  const resolved = resolveActivityIcon(icone);
  const Icon = resolved.lucideIcon;

  return (
    <div
      className={cn("flex size-11 items-center justify-center rounded-lg text-xl", className)}
      style={{ backgroundColor: (cor ?? "#3de8a0") + "22" }}
    >
      {resolved.emoji ? (
        <span>{resolved.emoji}</span>
      ) : Icon ? (
        <Icon className="size-5 text-foreground" />
      ) : (
        <span>🏋️</span>
      )}
    </div>
  );
}

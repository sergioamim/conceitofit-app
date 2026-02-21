import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

interface HoverPopoverProps {
  content: ReactNode;
  children: ReactNode;
  side?: Side;
  align?: Align;
  className?: string;
  contentClassName?: string;
}

const SIDE_POSITIONS: Record<Side, string> = {
  top: "bottom-full mb-2",
  bottom: "top-full mt-2",
  left: "right-full mr-2",
  right: "left-full ml-2",
};

const ALIGN_POSITIONS: Record<Align, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

export function HoverPopover({
  content,
  children,
  side = "top",
  align = "center",
  className,
  contentClassName,
}: HoverPopoverProps) {
  return (
    <span className={cn("relative inline-flex group", className)}>
      {children}
      <span
        className={cn(
          "pointer-events-none absolute z-50 hidden min-w-[180px] max-w-[260px] rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-md",
          "group-hover:block group-focus-within:block",
          SIDE_POSITIONS[side],
          ALIGN_POSITIONS[align],
          contentClassName
        )}
      >
        {content}
      </span>
    </span>
  );
}

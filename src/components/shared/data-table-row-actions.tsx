"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DataTableRowActionKind =
  | "edit"
  | "toggle"
  | "delete"
  | "view"
  | "open"
  | "copy"
  | "more";

export type DataTableRowAction = {
  label: string;
  kind: DataTableRowActionKind;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  title?: string;
  icon?: LucideIcon;
  tone?: "default" | "danger" | "accent";
};

const DEFAULT_ICONS: Record<DataTableRowActionKind, LucideIcon> = {
  edit: Pencil,
  toggle: Power,
  delete: Trash2,
  view: Eye,
  open: ArrowUpRight,
  copy: Copy,
  more: MoreHorizontal,
};

function resolveTone(action: DataTableRowAction): NonNullable<DataTableRowAction["tone"]> {
  if (action.tone) return action.tone;
  if (action.kind === "delete") return "danger";
  if (action.kind === "edit") return "accent";
  return "default";
}

function toneClass(tone: NonNullable<DataTableRowAction["tone"]>) {
  if (tone === "danger") {
    return "border-gym-danger/30 text-gym-danger hover:border-gym-danger/60 hover:bg-gym-danger/10 hover:text-gym-danger";
  }

  if (tone === "accent") {
    return "border-gym-accent/30 text-gym-accent hover:border-gym-accent/60 hover:bg-gym-accent/10 hover:text-gym-accent";
  }

  return "border-border text-muted-foreground hover:border-border/80 hover:bg-secondary hover:text-foreground";
}

export function DataTableRowActions({
  actions,
  className,
}: {
  actions: DataTableRowAction[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {actions.map((action) => {
        const Icon = action.icon ?? DEFAULT_ICONS[action.kind];
        const title = action.title ?? action.label;
        const classes = cn("rounded-lg border bg-card/80 shadow-none", toneClass(resolveTone(action)));

        if (action.href) {
          return (
            <Button
              key={`${action.kind}-${action.label}`}
              asChild
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={action.label}
              title={title}
              className={classes}
            >
              <Link href={action.href}>
                <Icon className="size-4" />
              </Link>
            </Button>
          );
        }

        return (
          <Button
            key={`${action.kind}-${action.label}`}
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={action.label}
            title={title}
            disabled={action.disabled}
            onClick={action.onClick}
            className={classes}
          >
            <Icon className="size-4" />
          </Button>
        );
      })}
    </div>
  );
}

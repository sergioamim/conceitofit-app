"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOTION_CLASSNAMES } from "@/lib/ui-motion";

export type BulkAction = {
  label: string;
  icon: React.ElementType;
  onClick: (selectedIds: string[]) => void | Promise<void>;
  variant?: "default" | "destructive" | "outline" | "ghost" | "secondary";
  requireConfirmation?: boolean;
};

export type BulkActionBarProps = {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  selectedIds: string[];
};

export function BulkActionBar({
  selectedCount,
  actions,
  onClearSelection,
  selectedIds,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 overflow-hidden rounded-full border border-border bg-card/95 p-1.5 px-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/75",
      MOTION_CLASSNAMES.slideUpEnter
    )}>
      <div className="flex items-center gap-2 pl-2 pr-4 border-r border-border">
        <div className="flex size-5 items-center justify-center rounded-full bg-gym-accent font-display text-[10px] font-bold text-white">
          {selectedCount}
        </div>
        <span className="text-sm font-medium text-foreground">
          {selectedCount === 1 ? "selecionado" : "selecionados"}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Button
              key={idx}
              variant={action.variant || "ghost"}
              size="sm"
              className="h-8 rounded-full text-xs font-semibold"
              onClick={() => action.onClick(selectedIds)}
            >
              <Icon className="mr-1.5 size-3.5" />
              {action.label}
            </Button>
          );
        })}
      </div>

      <div className="pl-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onClearSelection}
          aria-label="Limpar seleção"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

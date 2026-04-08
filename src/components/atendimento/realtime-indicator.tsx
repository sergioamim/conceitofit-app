"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ConnectionState = "connected" | "reconnecting" | "offline";

const STATE_CONFIG: Record<
  ConnectionState,
  { className: string; tooltip: string }
> = {
  connected: {
    className: "bg-gym-teal animate-pulse",
    tooltip: "Tempo real",
  },
  reconnecting: {
    className: "bg-amber-400 animate-pulse",
    tooltip: "Reconectando...",
  },
  offline: {
    className: "bg-muted-foreground/50",
    tooltip: "Offline — atualização a cada 15s",
  },
};

interface RealTimeIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export function RealTimeIndicator({
  isConnected,
  className,
}: RealTimeIndicatorProps) {
  const state: ConnectionState = isConnected ? "connected" : "offline";
  const config = STATE_CONFIG[state];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 rounded-full shrink-0",
              config.className,
              className
            )}
            aria-label={config.tooltip}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

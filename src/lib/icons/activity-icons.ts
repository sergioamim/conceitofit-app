import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bike,
  CircleDot,
  Dumbbell,
  Flame,
  HeartPulse,
  Shield,
  Sparkles,
  Target,
  Waves,
} from "lucide-react";

export interface ActivityIconOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const ACTIVITY_ICON_OPTIONS: ActivityIconOption[] = [
  { value: "dumbbell", label: "Dumbbell", icon: Dumbbell },
  { value: "activity", label: "Activity", icon: Activity },
  { value: "shield", label: "Shield", icon: Shield },
  { value: "heart-pulse", label: "Heart Pulse", icon: HeartPulse },
  { value: "bike", label: "Bike", icon: Bike },
  { value: "waves", label: "Waves", icon: Waves },
  { value: "target", label: "Target", icon: Target },
  { value: "flame", label: "Flame", icon: Flame },
  { value: "sparkles", label: "Sparkles", icon: Sparkles },
  { value: "circle-dot", label: "Circle Dot", icon: CircleDot },
];

const ICON_BY_NAME = new Map<string, LucideIcon>(
  ACTIVITY_ICON_OPTIONS.map((item) => [item.value, item.icon])
);

function normalizeIconName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

export function resolveActivityIcon(icone?: string): {
  lucideIcon?: LucideIcon;
  emoji?: string;
} {
  if (!icone?.trim()) {
    return { lucideIcon: Dumbbell };
  }
  const raw = icone.trim();
  const normalized = normalizeIconName(raw);
  const byName = ICON_BY_NAME.get(normalized);
  if (byName) {
    return { lucideIcon: byName };
  }

  const seemsEmoji = /[^\w-]/.test(raw);
  if (seemsEmoji) {
    return { emoji: raw };
  }

  return { lucideIcon: Dumbbell };
}

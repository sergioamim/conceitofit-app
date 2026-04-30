import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const cockpitSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-cockpit-dashboard",
  display: "swap",
});

/**
 * Tipografia alinhada ao protótipo cockpit (`dashboard/project/`) sem alterar o portal inteiro.
 */
export default function DashboardCockpitLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        cockpitSans.variable,
        "min-h-0 [font-family:var(--font-cockpit-dashboard),var(--font-sans)]",
      )}
    >
      {children}
    </div>
  );
}

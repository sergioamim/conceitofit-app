"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import {
  Dumbbell,
  CalendarDays,
  QrCode,
  Wallet,
  CircleUser,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALUNO_NAV_ITEMS = [
  { href: "/meus-treinos", label: "Treinos", icon: Dumbbell },
  { href: "/minhas-aulas", label: "Aulas", icon: CalendarDays },
  { href: "/check-in", label: "Check-in", icon: QrCode },
  { href: "/meus-pagamentos", label: "Pagamentos", icon: Wallet },
  { href: "/meu-perfil", label: "Perfil", icon: CircleUser },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ClienteBottomNavComponent() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background px-2 pb-safe pt-1 md:hidden">
      {ALUNO_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-md px-3 py-1 text-xs transition-colors",
              active
                ? "text-[color:var(--sidebar-primary)]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className={cn("size-5", active && "fill-current/10")} />
            <span
              className={cn(
                "text-[10px] font-medium",
                active ? "font-semibold" : "font-medium"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export const ClienteBottomNav = memo(ClienteBottomNavComponent);

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  CircleUser,
  Dumbbell,
  FileText,
  Home,
  Megaphone,
  Menu,
  QrCode,
  ShoppingBag,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALUNO_NAV_ITEMS = [
  { href: "/home", label: "Inicio", icon: Home },
  { href: "/check-in", label: "Check-in", icon: QrCode },
  { href: "/meus-treinos", label: "Treinos", icon: Dumbbell },
  { href: "/loja", label: "Loja", icon: ShoppingBag },
];

const MORE_MENU_ITEMS = [
  { href: "/meus-contratos", label: "Contratos", icon: FileText },
  { href: "/meus-pagamentos", label: "Pagamentos", icon: Wallet },
  { href: "/recompensas", label: "Recompensas", icon: Trophy },
  { href: "/indicar", label: "Indicar Amigos", icon: Users },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/meu-perfil", label: "Meu Perfil", icon: CircleUser },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ClienteBottomNavComponent() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMoreActive = MORE_MENU_ITEMS.some((item) => isActivePath(pathname, item.href));

  const closeMenu = useCallback(() => setMoreOpen(false), []);

  // Close on route change
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // Close on click outside
  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  return (
    <>
      {/* Backdrop */}
      {moreOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={closeMenu}
        />
      ) : null}

      {/* More menu drawer */}
      {moreOpen ? (
        <div
          ref={menuRef}
          className="fixed bottom-16 left-0 right-0 z-40 rounded-t-2xl border-t border-border/60 bg-background/95 backdrop-blur-xl p-4 pb-2 md:hidden"
        >
          <div className="grid grid-cols-4 gap-3">
            {MORE_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-colors",
                    active
                      ? "bg-primary/10 text-[color:var(--sidebar-primary)]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={closeMenu}
                >
                  <Icon className="size-5" />
                  <span className="text-[10px] font-bold text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Bottom nav */}
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

        {/* More button */}
        <button
          type="button"
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-md px-3 py-1 text-xs transition-colors",
            moreOpen || isMoreActive
              ? "text-[color:var(--sidebar-primary)]"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-label="Mais opcoes"
        >
          {moreOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className={cn("size-5", isMoreActive && "fill-current/10")} />
          )}
          <span
            className={cn(
              "text-[10px] font-medium",
              (moreOpen || isMoreActive) ? "font-semibold" : "font-medium"
            )}
          >
            Mais
          </span>
        </button>
      </nav>
    </>
  );
}

export const ClienteBottomNav = memo(ClienteBottomNavComponent);

"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuthAccess } from "@/hooks/use-session-context";
import { isRealApiEnabled } from "@/lib/api/http";
import { getAccessToken, isMockSessionActive } from "@/lib/api/session";
import { buildLoginHref } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/academias", label: "Academias" },
  { href: "/admin/unidades", label: "Unidades" },
  { href: "/admin/importacao-evo-p0", label: "Importação EVO P0" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const access = useAuthAccess();

  useEffect(() => {
    const authenticated = isRealApiEnabled() ? !!getAccessToken() : isMockSessionActive();
    if (!authenticated) {
      const queryString = searchParams.toString();
      const currentPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
      router.replace(buildLoginHref(currentPath));
    }
  }, [pathname, router, searchParams]);

  const authenticated = isRealApiEnabled() ? !!getAccessToken() : isMockSessionActive();

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Redirecionando para o login do backoffice...
        </div>
      </div>
    );
  }

  if (access.loading) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Validando permissões do backoffice...
        </div>
      </div>
    );
  }

  if (!access.canAccessElevatedModules) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-gym-danger/30 bg-gym-danger/10 p-6 text-sm text-gym-danger">
          O backoffice global exige perfil administrativo elevado.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-6">
        <aside className="sticky top-6 h-fit w-56 rounded-lg border border-border/80 bg-card/80 p-3 shadow-sm">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gym-accent">Conceito Fit</p>
            <p className="text-sm font-bold">Backoffice</p>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 transition-colors",
                    active
                      ? "bg-gym-accent/10 text-foreground border border-gym-accent/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

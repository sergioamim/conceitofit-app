"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useEffect, useState } from "react";
import { DevSessionPanel } from "@/debug/dev-session-panel";
import { TenantContextProvider } from "@/hooks/use-session-context";
import { useAuthAccess } from "@/hooks/use-session-context";
import { AUTH_SESSION_UPDATED_EVENT, getAccessToken, getNetworkSlugFromSession } from "@/lib/api/session";
import { buildLoginHref } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/operacional/saude", label: "Saúde Operacional" },
  { href: "/admin/academias", label: "Academias" },
  { href: "/admin/unidades", label: "Unidades" },
  { href: "/admin/financeiro/planos", label: "Planos da Plataforma" },
  { href: "/admin/busca", label: "Busca Global" },
  { href: "/admin/seguranca", label: "Segurança" },
  { href: "/admin/importacao-evo", label: "Importação EVO" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

function AdminShellFrame({
  children,
  pathname,
}: {
  children: ReactNode;
  pathname?: string;
}) {
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
              const active = pathname != null && (pathname === item.href || pathname.startsWith(item.href + "/"));
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
      <DevSessionPanel />
    </div>
  );
}

function AdminStatusPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 text-sm", className)}>
      {children}
    </div>
  );
}

function AdminLayoutFallback({ children }: { children: ReactNode }) {
  return (
    <AdminShellFrame>
      <div className="space-y-6">
        <AdminStatusPanel className="border-border text-muted-foreground">
          Carregando backoffice...
        </AdminStatusPanel>
        {children}
      </div>
    </AdminShellFrame>
  );
}

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const access = useAuthAccess();
  const [hydrated, setHydrated] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    function syncAuthenticated() {
      setAuthenticated(Boolean(getAccessToken()));
      setHydrated(true);
    }

    syncAuthenticated();
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuthenticated);
    window.addEventListener("storage", syncAuthenticated);
    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuthenticated);
      window.removeEventListener("storage", syncAuthenticated);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || authenticated) {
      return;
    }
    if (!authenticated) {
      const queryString = searchParams.toString();
      const currentPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
      router.replace(buildLoginHref(currentPath, getNetworkSlugFromSession()));
    }
  }, [authenticated, hydrated, pathname, router, searchParams]);

  if (!hydrated || access.loading) {
    return (
      <AdminShellFrame pathname={pathname}>
        <AdminStatusPanel className="border-border text-muted-foreground">
          Validando permissões do backoffice...
        </AdminStatusPanel>
      </AdminShellFrame>
    );
  }

  if (!authenticated) {
    return (
      <AdminShellFrame pathname={pathname}>
        <AdminStatusPanel className="border-border text-muted-foreground">
          Redirecionando para o login do backoffice...
        </AdminStatusPanel>
      </AdminShellFrame>
    );
  }

  if (!access.canAccessElevatedModules) {
    return (
      <AdminShellFrame pathname={pathname}>
        <AdminStatusPanel className="border-gym-danger/30 bg-gym-danger/10 text-gym-danger">
          O backoffice global exige perfil administrativo elevado.
        </AdminStatusPanel>
      </AdminShellFrame>
    );
  }

  return (
    <AdminShellFrame pathname={pathname}>{children}</AdminShellFrame>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <TenantContextProvider>
      <Suspense fallback={<AdminLayoutFallback>{children}</AdminLayoutFallback>}>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </Suspense>
    </TenantContextProvider>
  );
}

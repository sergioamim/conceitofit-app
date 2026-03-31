"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlunoBottomNav } from "@/components/layout/aluno-bottom-nav";
import { TenantThemeSync } from "@/components/layout/tenant-theme-sync";
import { TenantContextProvider, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  AUTH_SESSION_UPDATED_EVENT,
  getAccessToken,
  getNetworkSlugFromSession,
  clearAuthSession,
} from "@/lib/api/session";
import { buildLoginHref } from "@/lib/tenant/auth-redirect";

function AlunoTopbar() {
  const { displayName, networkName } = useTenantContext();

  function handleLogout() {
    clearAuthSession();
    window.location.assign("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {displayName ?? "Aluno"}
        </p>
        {networkName ? (
          <p className="truncate text-xs text-muted-foreground">{networkName}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="Sair"
        onClick={handleLogout}
      >
        <LogOut className="size-4" />
      </Button>
    </header>
  );
}

function AlunoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <a
        href="#main-content"
        className="focus-ring-brand sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-gym-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#0e0f11]"
      >
        Saltar para o conteúdo
      </a>
      <TenantThemeSync />
      <AlunoTopbar />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto px-4 pb-20 pt-4"
      >
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </main>
      <AlunoBottomNav />
    </div>
  );
}

function AlunoLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
    if (!hydrated || authenticated) return;
    const queryString = searchParams.toString();
    const currentPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
    router.replace(buildLoginHref(currentPath, getNetworkSlugFromSession()));
  }, [authenticated, hydrated, pathname, router, searchParams]);

  return <AlunoShell>{children}</AlunoShell>;
}

function AlunoLayoutFallback({ children }: { children: React.ReactNode }) {
  return <AlunoShell>{children}</AlunoShell>;
}

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantContextProvider>
      <Suspense fallback={<AlunoLayoutFallback>{children}</AlunoLayoutFallback>}>
        <AlunoLayoutContent>{children}</AlunoLayoutContent>
      </Suspense>
    </TenantContextProvider>
  );
}

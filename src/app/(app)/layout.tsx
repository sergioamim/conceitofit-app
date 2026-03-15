"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { AppContentShell } from "@/components/layout/app-content-shell";
import { TenantThemeSync } from "@/components/layout/tenant-theme-sync";
import { DevSessionPanel } from "@/debug/dev-session-panel";
import { TenantContextProvider } from "@/hooks/use-session-context";
import { getAccessToken } from "@/lib/api/session";
import { buildLoginHref } from "@/lib/auth-redirect";

function AppShellFrame({
  children,
  mobileMenuOpen = false,
  onOpenMenu,
  onCloseMenu,
}: {
  children: React.ReactNode;
  mobileMenuOpen?: boolean;
  onOpenMenu?: () => void;
  onCloseMenu?: () => void;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TenantThemeSync />
      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onCloseMenu}
        />
      ) : null}
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={onCloseMenu} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar onOpenMenu={onOpenMenu} />
        <AppContentShell>{children}</AppContentShell>
      </main>
      <DevSessionPanel />
    </div>
  );
}

function AppLayoutFallback({ children }: { children: React.ReactNode }) {
  return <AppShellFrame>{children}</AppShellFrame>;
}

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleOpenMenu = useCallback(() => setMobileMenuOpen(true), []);
  const handleCloseMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    const authenticated = !!getAccessToken();
    if (!authenticated) {
      const queryString = searchParams.toString();
      const currentPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
      router.replace(buildLoginHref(currentPath));
    }
  }, [pathname, router, searchParams]);

  return (
    <AppShellFrame mobileMenuOpen={mobileMenuOpen} onOpenMenu={handleOpenMenu} onCloseMenu={handleCloseMenu}>
      {children}
    </AppShellFrame>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantContextProvider>
      <Suspense fallback={<AppLayoutFallback>{children}</AppLayoutFallback>}>
        <AppLayoutContent>{children}</AppLayoutContent>
      </Suspense>
    </TenantContextProvider>
  );
}

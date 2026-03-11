"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { AppContentShell } from "@/components/layout/app-content-shell";
import { TenantThemeSync } from "@/components/layout/tenant-theme-sync";
import { isRealApiEnabled } from "@/lib/api/http";
import { getAccessToken, isMockSessionActive } from "@/lib/api/session";
import { buildLoginHref } from "@/lib/auth-redirect";

export default function AppLayout({
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
    const authenticated = isRealApiEnabled() ? !!getAccessToken() : isMockSessionActive();
    if (!authenticated) {
      const queryString = searchParams.toString();
      const currentPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
      router.replace(buildLoginHref(currentPath));
    }
  }, [pathname, router, searchParams]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TenantThemeSync />
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={handleCloseMenu}
        />
      )}
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={handleCloseMenu} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar onOpenMenu={handleOpenMenu} />
        <AppContentShell>{children}</AppContentShell>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { AppContentShell } from "@/components/layout/app-content-shell";
import { TenantThemeSync } from "@/components/layout/tenant-theme-sync";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TenantThemeSync />
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar onOpenMenu={() => setMobileMenuOpen(true)} />
        <AppContentShell>{children}</AppContentShell>
      </main>
    </div>
  );
}

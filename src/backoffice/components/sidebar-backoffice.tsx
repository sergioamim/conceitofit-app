"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { 
  ChevronRight, 
  Zap,
  LogOut,
  Command,
  Building2,
  Globe,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  adminGroups,
  type NavGroup,
  type NavItem,
} from "@/backoffice/lib/nav-items";
import {
  useAuthAccess,
} from "@/lib/tenant/hooks/use-session-context";
import { getAuthSessionSnapshot } from "@/lib/api/session";
import { useAcesso } from "@/backoffice/hooks/use-acesso";
import { useBackofficeContext } from "@/backoffice/lib/backoffice-context";
import { Button } from "@/components/ui/button";
import {
  clearAuthSession,
  getNetworkSlugFromSession,
} from "@/lib/api/session";
import { logoutApi } from "@/lib/api/auth";
import { buildLoginHref } from "@/lib/tenant/auth-redirect";
import { useIsMac } from "@/hooks/use-is-mac";
import { LogoutDialog } from "@/components/shared/logout-dialog";

function subscribeNoop() {
  return () => undefined;
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  
  if (item.paletteOnly) return null;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
        active 
          ? "bg-gym-accent/10 text-foreground font-bold border border-gym-accent/20" 
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {active && (
        <motion.div 
          layoutId="admin-active-pill"
          className="absolute left-0 w-1 h-6 bg-gym-accent rounded-r-full shadow-[0_0_10px_rgba(200,241,53,0.8)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
      
      <Icon className={cn("size-5 shrink-0 transition-transform group-hover:scale-110", active && "text-gym-accent")} />
      
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-[13.5px] tracking-tight">{item.label}</span>
          {item.description && !active && (
            <span className="text-[10px] opacity-40 group-hover:opacity-70 transition-opacity uppercase tracking-tighter font-medium">
              {item.description}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function SidebarGroup({ group, collapsed, pathname, podeVerRota }: { group: NavGroup; collapsed: boolean; pathname: string; podeVerRota: (href: string) => boolean }) {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = group.icon;

  const visibleItems = group.items.filter(i => !i.paletteOnly && podeVerRota(i.href));
  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-1 mb-6">
      {!collapsed && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon size={12} className="opacity-50" />
            {group.label}
          </div>
          <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
            <ChevronRight size={12} />
          </motion.div>
        </button>
      )}
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-1 px-2"
          >
            {visibleItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))}
                collapsed={collapsed}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type SidebarBackofficeProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onOpenCmdk: () => void;
};

export function SidebarBackoffice({ mobileOpen = false, onMobileClose, onOpenCmdk }: SidebarBackofficeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const pathname = usePathname();
  const { mode, inspectedTenant } = useBackofficeContext();
  useAuthAccess();
  const acesso = useAcesso();
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const sessionUser = mounted ? getAuthSessionSnapshot() : null;
  const isMac = useIsMac();
  const cmdText = isMac === null ? "" : isMac ? "⌘K" : "Ctrl+K";

  const handleLogout = async () => {
    try {
      const redirectHref = buildLoginHref(undefined, getNetworkSlugFromSession());
      try { await logoutApi(); } catch {}
      clearAuthSession();
      window.location.assign(redirectHref);
    } catch {}
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" 
          onClick={onMobileClose} 
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border/40 bg-card/40 backdrop-blur-2xl transition-all duration-500 md:static md:h-screen",
        collapsed ? "md:w-20" : "md:w-[260px]",
        mobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Brand Section */}
        <div className="p-6 mb-2">
          {!collapsed ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-gym-accent flex items-center justify-center shadow-lg shadow-gym-accent/20">
                  <Zap size={18} className="text-black fill-current" />
                </div>
                <span className="font-display text-xl font-extrabold tracking-tighter">
                  Conceito<span className="text-gym-accent">.fit</span>
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <BadgeAdmin mode={mode} inspectedName={inspectedTenant?.tenantName} />
              </div>
            </div>
          ) : (
            <div className="mx-auto size-10 rounded-xl bg-gym-accent flex items-center justify-center shadow-lg shadow-gym-accent/20">
               <Zap size={20} className="text-black fill-current" />
            </div>
          )}
        </div>

        {/* Command Palette Trigger */}
        <div className="px-4 mb-6">
          <button 
            onClick={onOpenCmdk}
            className={cn(
              "flex items-center gap-3 w-full h-11 px-3 rounded-xl bg-muted/40 border border-border/40 text-muted-foreground hover:bg-muted/60 transition-all group",
              collapsed && "justify-center"
            )}
          >
            <Command size={18} className="group-hover:text-gym-accent transition-colors" />
            {!collapsed && <span className="text-sm font-medium text-left flex-1">Comandos...</span>}
            {!collapsed && cmdText && (
              <kbd className="text-[10px] font-mono opacity-40 bg-background/50 px-1.5 py-0.5 rounded border border-border/40">
                {cmdText}
              </kbd>
            )}
          </button>
        </div>

        {/* Navigation Groups — filtrado por capacidades/features do user */}
        <nav className="flex-1 overflow-y-auto px-2 scrollbar-none">
          {adminGroups.map((group) => (
            <SidebarGroup
              key={group.label}
              group={group}
              collapsed={collapsed}
              pathname={pathname}
              podeVerRota={acesso.podeVerRota}
            />
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 space-y-4">
          {!collapsed && (
            <Link href="/admin/entrar-como-academia">
              <Button variant="outline" className="w-full h-11 rounded-xl border-gym-teal/30 text-gym-teal hover:bg-gym-teal/10 hover:border-gym-teal/50 font-semibold mb-2">
                <Building2 className="mr-2 size-4" />
                Acessar Unidade
              </Button>
            </Link>
          )}

          <div className={cn(
            "flex items-center gap-3 p-2 rounded-2xl bg-muted/30 border border-border/20",
            collapsed && "justify-center"
          )}>
            <div className="size-9 rounded-full bg-gradient-to-br from-gym-accent to-gym-accent/60 flex items-center justify-center text-xs font-bold text-black">
              {sessionUser?.displayName?.[0] || "A"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{sessionUser?.displayName || "Administrador"}</p>
                <p className="text-[10px] text-muted-foreground truncate uppercase font-medium">SaaS Admin</p>
              </div>
            )}
            {!collapsed && (
              <button 
                onClick={() => setLogoutOpen(true)}
                className="p-1.5 text-muted-foreground hover:text-gym-danger transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
            </div>
            </div>

            <LogoutDialog 
            isOpen={logoutOpen} 
            onOpenChange={setLogoutOpen} 
            onConfirm={handleLogout} 
            title="Sair do Backoffice?"
            />

            {/* Collapse Toggle */}        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-10 size-6 rounded-full bg-border/80 backdrop-blur-md border border-sidebar-border flex items-center justify-center hover:bg-gym-accent hover:border-gym-accent hover:text-black transition-all shadow-md z-50"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
            <ChevronRight size={14} />
          </motion.div>
        </button>
      </aside>
    </>
  );
}

function BadgeAdmin({ mode, inspectedName }: { mode: string, inspectedName?: string }) {
  if (mode === "tenant" && inspectedName) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-gym-warning/30 bg-gym-warning/10 px-2.5 py-1 text-[10px] font-bold text-gym-warning uppercase tracking-tighter">
        <Eye className="size-3" />
        {inspectedName}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-gym-accent/30 bg-gym-accent/10 px-2.5 py-1 text-[10px] font-bold text-gym-accent uppercase tracking-tighter">
      <Globe className="size-3" />
      Plataforma
    </div>
  );
}

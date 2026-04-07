"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, memo } from "react";
import { 
  ArrowLeft,
  ChevronRight, 
  Search, 
  Zap,
  LogOut,
  Star,
  CircleUser,
  ShieldCheck,
  UserCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  allGroupsV2, 
  type NavGroupV2, 
  type NavItemV2 
} from "@/lib/tenant/nav-items-v2";
import { allNavItems } from "@/lib/tenant/nav-items";
import { 
  useTenantContext,
  DEFAULT_ACADEMIA_LABEL
} from "@/lib/tenant/hooks/use-session-context";
import { useUserPreferences } from "@/lib/tenant/hooks/use-user-preferences";
import {
  clearAuthSession,
  getNetworkSlugFromSession,
  hasBackofficeReturnSession,
  restoreBackofficeReturnSession,
} from "@/lib/api/session";
import { logoutApi } from "@/lib/api/auth";
import { buildLoginHref } from "@/lib/tenant/auth-redirect";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMac } from "@/hooks/use-is-mac";
import { LogoutDialog } from "@/components/shared/logout-dialog";

type SidebarFavoriteItem = NavItemV2 | (typeof allNavItems)[number];

function hasNestedMenuEntry(
  item: SidebarFavoriteItem,
  items: readonly SidebarFavoriteItem[],
): boolean {
  return items.some((candidate) => (
    candidate.href !== item.href
    && candidate.href.startsWith(`${item.href}/`)
  ));
}

function isSidebarItemActive(
  pathname: string,
  item: SidebarFavoriteItem,
  items: readonly SidebarFavoriteItem[],
): boolean {
  const exact = item.exact ?? hasNestedMenuEntry(item, items);
  if (exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLinkV2({ item, active, collapsed }: { item: NavItemV2, active: boolean, collapsed: boolean }) {
  const Icon = item.icon;
  const { isFavorite, toggleFavorite } = useUserPreferences();
  const favorited = isFavorite(item.href);
  
  return (
    <div className="group relative flex items-center">
      <Link
        href={item.href}
        className={cn(
          "flex flex-1 items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
          active 
            ? "bg-primary/10 text-primary font-bold shadow-[inset_0_0_15px_rgba(200,241,53,0.05)]" 
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        {active && (
          <motion.div 
            layoutId="active-pill"
            className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(200,241,53,0.8)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
        
        <Icon className={cn("size-5 shrink-0 transition-transform group-hover:scale-110", active && "text-primary")} />
        
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-[13.5px] tracking-tight">{item.label}</span>
          </div>
        )}
      </Link>
      {!collapsed && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(item.href);
          }}
          className={cn(
            "absolute right-3 p-1 transition-all opacity-0 group-hover:opacity-100 hover:text-primary",
            favorited ? "opacity-100 text-primary" : "text-muted-foreground"
          )}
          aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Star className={cn("size-3.5", favorited && "fill-current")} />
        </button>
      )}
    </div>
  );
}

function SidebarGroup({ group, collapsed, pathname }: { group: NavGroupV2, collapsed: boolean, pathname: string }) {
  const hasActiveItem = group.items.some((item) => isSidebarItemActive(pathname, item, group.items));
  const [isOpen, setIsOpen] = useState(false);
  const Icon = group.icon;
  const isExpanded = isOpen || hasActiveItem;
  
  return (
    <div className="space-y-1 mb-6">
      {!collapsed && (
        <button 
          onClick={() => setIsOpen(!isExpanded)}
          className="flex items-center justify-between w-full px-4 mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon size={12} className="opacity-50" />
            {group.label}
          </div>
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
            <ChevronRight size={12} />
          </motion.div>
        </button>
      )}
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-1 px-2"
          >
            {group.items.map((item) => (
              <NavLinkV2 
                key={item.href} 
                item={item} 
                active={isSidebarItemActive(pathname, item, group.items)} 
                collapsed={collapsed} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  shellReady?: boolean;
};

function SidebarComponent({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const pathname = usePathname();
  const { tenant, academia, brandingSnapshot, displayName } = useTenantContext();
  const { favorites } = useUserPreferences();
  const isMac = useIsMac();
  const cmdText = isMac === null ? "" : isMac ? "⌘K" : "Ctrl+K";

  const favoriteItems = favorites
    .map((href) => {
      for (const group of allGroupsV2) {
        const item = group.items.find(i => i.href === href);
        if (item) return item;
      }
      return allNavItems.find((i) => i.href === href);
    })
    .filter((item): item is SidebarFavoriteItem => Boolean(item));

  useEffect(() => {
    if (mobileOpen) {
      onMobileClose?.();
    }
  }, [mobileOpen, onMobileClose, pathname]);

  const handleLogout = async () => {
    try {
      const redirectHref = buildLoginHref(undefined, getNetworkSlugFromSession());
      try { await logoutApi(); } catch {}
      clearAuthSession();
      window.location.assign(redirectHref);
    } catch {}
  };

  const academiaName = academia?.nome || tenant?.nome || DEFAULT_ACADEMIA_LABEL;
  const userInitial = displayName?.trim().charAt(0).toUpperCase() || "U";
  const userName = displayName?.trim() || "Usuário";
  const canReturnToBackoffice = hasBackofficeReturnSession();

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" 
          onClick={onMobileClose} 
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-card/40 backdrop-blur-2xl transition-all duration-500 md:static md:h-screen",
        collapsed ? "md:w-20" : "md:w-[240px]",
        mobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 mb-2">
          <div className="flex items-center justify-between">
            {!collapsed ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Zap size={18} className="text-primary-foreground fill-current" />
                  </div>
                  <span className="font-display text-xl font-extrabold tracking-tighter">
                    {(brandingSnapshot?.appName || "Conceito.fit").replace(".fit", "")}
                    <span className="text-primary">.fit</span>
                  </span>
                </div>
                <div className="mt-3 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Rede</p>
                  <p className="text-[12px] font-semibold truncate text-foreground/80">{academiaName}</p>
                </div>
              </div>
            ) : (
              <div className="mx-auto size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                 <Zap size={20} className="text-primary-foreground fill-current" />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mb-6">
          <button 
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className={cn(
              "flex items-center gap-3 w-full h-11 px-3 rounded-xl bg-muted/40 border border-border/40 text-muted-foreground hover:bg-muted/60 transition-all group",
              collapsed && "justify-center"
            )}
          >
            <Search size={18} className="group-hover:text-primary transition-colors" />
            {!collapsed && <span className="text-sm font-medium text-left flex-1">Buscar...</span>}
            {!collapsed && cmdText && (
              <kbd className="text-[10px] font-mono opacity-40 bg-background/50 px-1.5 py-0.5 rounded border border-border/40">
                {cmdText}
              </kbd>
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 scrollbar-none">
          {favoriteItems.length > 0 && (
            <div className="mb-6">
              {!collapsed && (
                <p className="px-4 mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary/60">
                  Favoritos
                </p>
              )}
              <div className="flex flex-col gap-1 px-2">
                {favoriteItems.map((item) => (
                  <NavLinkV2 
                    key={`fav-${item.href}`} 
                    item={item} 
                    active={isSidebarItemActive(pathname, item, favoriteItems)} 
                    collapsed={collapsed} 
                  />
                ))}
              </div>
            </div>
          )}

          {allGroupsV2.map((group) => {
            const filteredItems = group.items.filter(item => !favorites.includes(item.href));
            if (filteredItems.length === 0) return null;
            return (
              <SidebarGroup 
                key={group.label} 
                group={{ ...group, items: filteredItems }} 
                collapsed={collapsed} 
                pathname={pathname} 
              />
            );
          })}
        </nav>

        <div className="p-4 space-y-4">
          <Sheet>
            <SheetTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full p-2 rounded-2xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-all",
                collapsed && "justify-center"
              )}>
                <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {userInitial}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold truncate">{userName}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase font-medium">Meu Perfil</p>
                  </div>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] border-r border-border/40 p-0 bg-card/95 backdrop-blur-2xl">
              <SheetHeader className="p-6 text-left border-b border-border/40 bg-muted/10">
                <SheetTitle className="font-display text-xl font-bold flex items-center gap-2">
                  <UserCircle className="size-5 text-primary" />
                  Conta e Perfil
                </SheetTitle>
              </SheetHeader>

              <div className="p-6 space-y-6">                
                <div className="grid gap-3 px-6">
                  <Link 
                    href="/conta/perfil"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/20 hover:bg-primary/10 hover:border-primary/30 transition-all group"
                  >
                    <div className="size-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <CircleUser size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold">Meu Perfil</p>
                      <p className="text-[11px] text-muted-foreground">Dados pessoais e foto</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link 
                    href="/seguranca/acesso-unidade"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/20 hover:bg-primary/10 hover:border-primary/30 transition-all group"
                  >
                    <div className="size-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold">Segurança</p>
                      <p className="text-[11px] text-muted-foreground">Minha senha e acessos</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {canReturnToBackoffice && (
                    <button
                      type="button"
                      onClick={() => {
                        restoreBackofficeReturnSession();
                        window.location.assign("/admin");
                      }}
                      className="flex items-center gap-4 w-full p-4 rounded-2xl bg-muted/30 border border-border/20 hover:bg-primary/10 hover:border-primary/30 transition-all group"
                    >
                      <div className="size-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        <ArrowLeft size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold">Voltar ao Backoffice</p>
                        <p className="text-[11px] text-muted-foreground">Restaurar a sessão administrativa</p>
                      </div>
                    </button>
                  )}
                  
                  <div className="pt-4 border-t border-border/40">
                    <button 
                      onClick={() => setLogoutOpen(true)}
                      className="flex items-center gap-4 w-full p-4 rounded-2xl bg-gym-danger/5 border border-gym-danger/10 hover:bg-gym-danger/10 transition-all group"
                    >
                      <div className="size-10 rounded-xl bg-background flex items-center justify-center text-gym-danger transition-colors">
                        <LogOut size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-gym-danger">Sair do Sistema</p>
                        <p className="text-[11px] text-muted-foreground">Encerrar minha sessão</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <LogoutDialog 
          isOpen={logoutOpen} 
          onOpenChange={setLogoutOpen} 
          onConfirm={handleLogout} 
        />
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-10 size-6 rounded-full bg-border/80 backdrop-blur-md border border-sidebar-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all shadow-md z-50"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
            <ChevronRight size={14} />
          </motion.div>
        </button>
      </aside>
    </>
  );
}

export const Sidebar = memo(SidebarComponent);

"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InboxLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  selectedConversationId: string | null;
  onBack?: () => void;
}

export function InboxLayout({
  children,
  sidebar,
  selectedConversationId,
  onBack,
}: InboxLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const hasSelection = selectedConversationId !== null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Sidebar (Desktop) ── */}
      <motion.aside
        aria-label="Lista de conversas"
        animate={{ width: collapsed ? 60 : 320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "hidden lg:flex flex-col border-r border-border/40 bg-background shrink-0 overflow-hidden"
        )}
      >
        <div className="flex items-center justify-end p-2 border-b border-border/40">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden">{sidebar}</div>
        )}
      </motion.aside>

      {/* ── Mobile: sidebar OU main ── */}
      <AnimatePresence mode="wait">
        {!hasSelection ? (
          <motion.div
            key="mobile-sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="flex-1 lg:hidden overflow-hidden"
            aria-label="Lista de conversas"
          >
            {sidebar}
          </motion.div>
        ) : (
          <motion.div
            key="mobile-main"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.15 }}
            className="flex-1 lg:hidden flex flex-col overflow-hidden"
            aria-label="Detalhe da conversa"
          >
            <div className="flex items-center gap-2 p-2 border-b border-border/40">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onBack}
                aria-label="Voltar para lista"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground">
                Conversa
              </span>
            </div>
            <div className="flex-1 overflow-hidden">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main area (Desktop) ── */}
      <main
        aria-label="Detalhe da conversa"
        className="hidden lg:flex flex-1 flex-col bg-background overflow-hidden"
      >
        {children}
      </main>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  ExternalLink,
  Eye,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { formatDate } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import type { CampanhaCliente } from "@/lib/api/app-cliente";
import {
  listCampanhasClienteApi,
  marcarCampanhaLidaApi,
} from "@/lib/api/app-cliente";

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function CampanhaCard({
  campanha,
  onMarkRead,
}: {
  campanha: CampanhaCliente;
  onMarkRead: (id: string) => void;
}) {
  const [marking, setMarking] = useState(false);

  async function handleMarkRead() {
    setMarking(true);
    try {
      onMarkRead(campanha.id);
    } finally {
      setMarking(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-card/50 backdrop-blur-sm overflow-hidden ${
        campanha.lida
          ? "border-border/40"
          : "border-gym-accent/30 ring-1 ring-gym-accent/10"
      }`}
    >
      {campanha.imagemUrl ? (
        <div className="aspect-[16/9] w-full bg-muted/20 overflow-hidden">
          <img
            src={campanha.imagemUrl}
            alt={campanha.titulo}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {!campanha.lida ? (
                <span className="flex size-2 rounded-full bg-gym-accent shrink-0" />
              ) : null}
              <h3 className="text-sm font-bold text-foreground truncate">
                {campanha.titulo}
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatDate(campanha.criadaEm)}
              {campanha.tipo ? ` · ${campanha.tipo}` : ""}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {campanha.mensagem}
        </p>

        <div className="flex items-center gap-2 pt-1">
          {campanha.ctaUrl && campanha.ctaLabel ? (
            <a
              href={campanha.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gym-accent px-4 py-2 text-xs font-bold text-[#0e0f11] hover:bg-gym-accent/90 transition-colors shadow-sm"
            >
              {campanha.ctaLabel}
              <ExternalLink className="size-3" />
            </a>
          ) : null}

          {!campanha.lida ? (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs h-8 text-muted-foreground hover:text-foreground"
              onClick={() => void handleMarkRead()}
              disabled={marking}
            >
              <Eye className="mr-1 size-3.5" />
              Marcar lida
            </Button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CampanhasPage() {
  const { tenantId, tenantResolved } = useTenantContext();
  const [campanhas, setCampanhas] = useState<CampanhaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantResolved || !tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listCampanhasClienteApi({ tenantId });
      setCampanhas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar campanhas.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, tenantResolved]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const unreadCount = useMemo(
    () => campanhas.filter((c) => !c.lida).length,
    [campanhas],
  );

  async function handleMarkRead(id: string) {
    if (!tenantId) return;
    // Optimistic update
    setCampanhas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, lida: true } : c)),
    );
    try {
      await marcarCampanhaLidaApi({ id, tenantId });
    } catch {
      // Revert on failure
      setCampanhas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, lida: false } : c)),
      );
    }
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 relative">
          <Megaphone className="size-7 text-primary" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gym-danger text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Campanhas</h1>
        {unreadCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            <Bell className="inline size-3 mr-1 -mt-0.5" />
            {unreadCount} {unreadCount === 1 ? "campanha nao lida" : "campanhas nao lidas"}
          </p>
        ) : null}
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-4 text-sm text-gym-danger flex items-center gap-3">
          <AlertTriangle className="size-5" />
          {error}
        </div>
      ) : null}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
          ))}
        </div>
      ) : campanhas.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border/60 bg-card/30 px-4 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Nenhuma campanha no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {campanhas.map((c) => (
              <CampanhaCard
                key={c.id}
                campanha={c}
                onMarkRead={handleMarkRead}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

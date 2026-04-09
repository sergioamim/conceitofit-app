"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  IdCard,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  useCarteirinhaDigital,
  useRotacionarCarteirinha,
} from "@/lib/query/use-portal-aluno";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskToken(token: string): string {
  if (token.length <= 8) return token;
  return `${token.slice(0, 4)}****${token.slice(-4)}`;
}

function formatExpiresAt(value: string): string {
  try {
    const d = new Date(value);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function isExpiringSoon(expiresAt: string): boolean {
  try {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 5 * 60 * 1000; // 5 min
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// CarteirinhaContent
// ---------------------------------------------------------------------------

export function CarteirinhaContent() {
  const { tenantId, tenantResolved } = useTenantContext();

  const {
    data: carteirinha,
    isLoading,
    isError,
  } = useCarteirinhaDigital({ tenantId, tenantResolved });

  const rotacionar = useRotacionarCarteirinha();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const expiringSoon = useMemo(() => {
    if (!carteirinha?.expiresAt || !mounted) return false;
    return isExpiringSoon(carteirinha.expiresAt);
  }, [carteirinha?.expiresAt, mounted]);

  function handleRotacionar() {
    if (!tenantId) return;
    rotacionar.mutate({ tenantId });
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <IdCard className="size-7 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Carteirinha Digital
        </h1>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="size-56 animate-pulse rounded-3xl bg-muted/20 border border-border/40" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted/20" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted/20" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-4 text-sm text-gym-danger flex items-center gap-3">
          <AlertTriangle className="size-5 shrink-0" />
          Falha ao carregar carteirinha. Tente novamente mais tarde.
        </div>
      ) : carteirinha ? (
        <div className="flex flex-col items-center gap-6">
          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-border/40 bg-white p-6 shadow-2xl shadow-black/10"
          >
            <QRCodeSVG
              value={carteirinha.qrPayload}
              size={240}
              level="H"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </motion.div>

          {/* Student Info */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            {carteirinha.fotoUrl ? (
              <img
                src={carteirinha.fotoUrl}
                alt={carteirinha.alunoNome}
                className="size-16 rounded-full object-cover border-2 border-border/40"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-muted text-xl font-bold text-muted-foreground">
                {carteirinha.alunoNome.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="font-display text-lg font-bold text-foreground">
              {carteirinha.alunoNome}
            </p>
          </motion.div>

          {/* Token & Expiry Info */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full space-y-3"
          >
            <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                  Token
                </span>
              </div>
              <span className="font-mono text-sm text-foreground">
                {maskToken(carteirinha.token)}
              </span>
            </div>

            <div
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                expiringSoon
                  ? "border-gym-warning/30 bg-gym-warning/5"
                  : "border-border/40 bg-card/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock
                  className={`size-4 ${
                    expiringSoon
                      ? "text-gym-warning"
                      : "text-muted-foreground"
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                  Validade
                </span>
              </div>
              <span
                className={`text-sm font-bold ${
                  expiringSoon ? "text-gym-warning" : "text-foreground"
                }`}
              >
                {mounted ? formatExpiresAt(carteirinha.expiresAt) : "--"}
              </span>
            </div>
          </motion.div>

          {/* Rotate Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full px-8 font-bold border-border/60"
              disabled={rotacionar.isPending}
              onClick={handleRotacionar}
            >
              <RefreshCw
                className={`mr-2 size-4 ${
                  rotacionar.isPending ? "animate-spin" : ""
                }`}
              />
              {rotacionar.isPending ? "Gerando..." : "Rotacionar"}
            </Button>
          </motion.div>

          {/* Auto-refresh notice */}
          <p className="text-[11px] text-muted-foreground/60 text-center">
            A carteirinha e verificada automaticamente a cada 30 segundos.
          </p>
        </div>
      ) : null}
    </div>
  );
}

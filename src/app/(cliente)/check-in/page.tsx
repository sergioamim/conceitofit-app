"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarDays,
  Clock,
  DoorOpen,
  Dumbbell,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useCheckInPresencas, useClienteOperationalContext } from "@/lib/query/use-portal-aluno";
import { formatDate } from "@/lib/formatters";
import type { Presenca } from "@/lib/shared/types/aluno";
import { StatusBadge } from "@/components/shared/status-badge";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORIGEM_CONFIG: Record<
  Presenca["origem"],
  { label: string; icon: any; className: string }
> = {
  CHECKIN: {
    label: "Check-in",
    icon: ScanLine,
    className: "bg-gym-accent/15 text-gym-accent",
  },
  AULA: {
    label: "Aula",
    icon: Dumbbell,
    className: "bg-gym-teal/15 text-gym-teal",
  },
  ACESSO: {
    label: "Acesso",
    icon: DoorOpen,
    className: "bg-muted text-muted-foreground",
  },
};

function buildQrPayload(tenantId: string, userId: string): string {
  return JSON.stringify({ t: tenantId, u: userId, ts: Date.now() });
}

// ---------------------------------------------------------------------------
// QR Code Card
// ---------------------------------------------------------------------------

function QrCodeCard({
  tenantId,
  userId,
  displayName,
  active,
}: {
  tenantId: string;
  userId: string;
  displayName: string;
  active: boolean;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  const qrValue = useMemo(
    () => buildQrPayload(tenantId, userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenantId, userId, refreshKey],
  );

  // Auto-refresh QR a cada 30 segundos (Task 461)
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setRefreshKey((k) => k + 1), 30_000);
    return () => clearInterval(timer);
  }, [active]);

  if (!active) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-3xl border-2 border-dashed border-border p-10 text-center bg-muted/5">
        <div className="flex size-20 items-center justify-center rounded-full bg-gym-danger/10 text-gym-danger">
          <AlertTriangle className="size-10" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold">Acesso Bloqueado</h3>
          <p className="text-sm text-muted-foreground max-w-[240px]">
            Sua matrícula não está ativa ou possui pendências financeiras. Procure a recepção.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div 
        layout
        className="rounded-3xl border border-border/40 bg-white p-6 shadow-2xl shadow-black/10"
      >
        <QRCodeSVG
          value={qrValue}
          size={220}
          level="H"
          marginSize={2}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </motion.div>
      
      <div className="text-center space-y-1">
        <p className="font-display text-lg font-bold text-foreground">{displayName}</p>
        <p className="text-xs text-muted-foreground">
          Código dinâmico · Atualiza a cada 30s
        </p>
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="rounded-full px-6 h-10 border-border/60 font-bold"
        onClick={() => setRefreshKey((k) => k + 1)}
      >
        <RefreshCw className="mr-2 size-4" />
        Gerar novo código
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presença Row
// ---------------------------------------------------------------------------

function PresencaRow({ presenca, index }: { presenca: Presenca; index: number }) {
  const cfg = ORIGEM_CONFIG[presenca.origem] ?? ORIGEM_CONFIG.CHECKIN;
  const Icon = cfg.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }}
      className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 hover:bg-primary/5 transition-colors"
    >
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${cfg.className}`}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{cfg.label}</p>
        {presenca.atividade ? (
          <p className="truncate text-xs text-muted-foreground font-medium">
            {presenca.atividade}
          </p>
        ) : (
          <p className="truncate text-xs text-muted-foreground font-medium">
            Unidade Principal
          </p>
        )}
      </div>
      <div className="shrink-0 text-right space-y-1">
        <p className="flex items-center justify-end gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <CalendarDays className="size-3" />
          {formatDate(presenca.data)}
        </p>
        {presenca.horario ? (
          <p className="flex items-center justify-end gap-1.5 text-[11px] font-bold text-muted-foreground">
            <Clock className="size-3" />
            {presenca.horario}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CheckInPage() {
  const { tenantId, userId, displayName, tenantResolved } = useTenantContext();

  const { 
    data: context, 
    isLoading: loadingContext,
    isError: isErrorContext
  } = useClienteOperationalContext({
    id: userId,
    tenantId,
    enabled: tenantResolved && !!userId
  });

  const { 
    data: presencas = [], 
    isLoading: loadingPresencas, 
    isError: isErrorPresencas, 
    error: queryError, 
    refetch 
  } = useCheckInPresencas({
    tenantId,
    tenantResolved,
    userId,
  });

  const error = (isErrorContext || isErrorPresencas) 
    ? (queryError instanceof Error ? queryError.message : "Falha ao carregar dados.") 
    : null;

  const hasIdentity = tenantResolved && tenantId && userId;
  const isBlocked = context?.blocked ?? true;
  const isActive = !isBlocked && context?.aluno?.status === "ATIVO";

  // Limitar histórico aos últimos 30 (Task 461)
  const last30Presencas = useMemo(() => presencas.slice(0, 30), [presencas]);

  return (
    <div className="space-y-10 py-8">
      {/* Status da Matrícula */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl border border-border/40 p-4 flex items-center justify-between shadow-lg shadow-black/5"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isActive ? 'bg-gym-teal/10 text-gym-teal' : 'bg-gym-danger/10 text-gym-danger'}`}>
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status Matrícula</p>
            <p className="text-sm font-bold">{context?.aluno?.estadoAtual?.descricaoContratoAtual || "Consultando..."}</p>
          </div>
        </div>
        <StatusBadge status={context?.aluno?.status || "INATIVO"} />
      </motion.section>

      {/* QR Code Section */}
      <section className="flex flex-col items-center gap-6 py-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <QrCode className="size-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Meu Check-in
          </h1>
        </div>

        {hasIdentity && !loadingContext ? (
          <QrCodeCard
            tenantId={tenantId}
            userId={userId}
            displayName={displayName ?? "Aluno"}
            active={isActive}
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="size-52 animate-pulse rounded-3xl bg-muted/20 border border-border/40" />
            <p className="text-sm text-muted-foreground animate-pulse font-medium">
              Validando acesso...
            </p>
          </div>
        )}
      </section>

      {/* Histórico */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Histórico recente
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl hover:bg-primary/10 text-primary font-bold"
            onClick={() => void refetch()}
            disabled={loadingPresencas || !hasIdentity}
          >
            <RefreshCw
              className={`mr-2 size-4 ${loadingPresencas ? "animate-spin" : ""}`}
            />
            Sincronizar
          </Button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-4 text-sm text-gym-danger flex items-center gap-3">
            <AlertTriangle className="size-5" />
            {error}
          </div>
        ) : null}

        {loadingPresencas && last30Presencas.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-muted/20 border border-border/40"
              />
            ))}
          </div>
        ) : last30Presencas.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border/60 bg-card/30 px-4 py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma presença registrada ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {last30Presencas.map((p, i) => (
                <PresencaRow key={p.id} presenca={p} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useCheckInPresencas } from "@/lib/query/use-portal-aluno";
import { formatDate } from "@/lib/formatters";
import type { Presenca } from "@/lib/shared/types/aluno";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORIGEM_CONFIG: Record<
  Presenca["origem"],
  { label: string; icon: typeof QrCode; className: string }
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
}: {
  tenantId: string;
  userId: string;
  displayName: string;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  const qrValue = useMemo(
    () => buildQrPayload(tenantId, userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenantId, userId, refreshKey],
  );

  // Auto-refresh QR a cada 2 minutos
  useEffect(() => {
    const timer = setInterval(() => setRefreshKey((k) => k + 1), 120_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <QRCodeSVG
          value={qrValue}
          size={200}
          level="M"
          marginSize={2}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <p className="text-sm font-medium text-foreground">{displayName}</p>
      <p className="text-xs text-muted-foreground">
        Apresente o QR Code na recepção
      </p>
      <Button
        variant="outline"
        size="sm"
        className="border-border"
        onClick={() => setRefreshKey((k) => k + 1)}
      >
        <RefreshCw className="mr-1.5 size-3.5" />
        Atualizar código
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presença Row
// ---------------------------------------------------------------------------

function PresencaRow({ presenca }: { presenca: Presenca }) {
  const cfg = ORIGEM_CONFIG[presenca.origem] ?? ORIGEM_CONFIG.CHECKIN;
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${cfg.className}`}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{cfg.label}</p>
        {presenca.atividade ? (
          <p className="truncate text-xs text-muted-foreground">
            {presenca.atividade}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3" />
          {formatDate(presenca.data)}
        </p>
        {presenca.horario ? (
          <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {presenca.horario}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CheckInPage() {
  const { tenantId, userId, displayName, tenantResolved } = useTenantContext();

  const { data: presencas = [], isLoading: loading, isError, error: queryError, refetch } = useCheckInPresencas({
    tenantId,
    tenantResolved,
    userId,
  });

  const error = isError ? (queryError instanceof Error ? queryError.message : "Falha ao carregar presenças.") : null;

  const hasIdentity = tenantResolved && tenantId && userId;

  return (
    <div className="space-y-8 py-6">
      {/* QR Code */}
      <section className="flex flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
          <QrCode className="size-6 text-gym-accent" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Check-in
        </h1>

        {hasIdentity ? (
          <QrCodeCard
            tenantId={tenantId}
            userId={userId}
            displayName={displayName ?? "Aluno"}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Carregando identificação...
          </p>
        )}
      </section>

      {/* Histórico */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            Histórico de presenças
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={loading || !hasIdentity}
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
            {error}
          </div>
        ) : null}

        {loading && presencas.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-primary/10"
              />
            ))}
          </div>
        ) : presencas.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma presença registrada ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {presencas.map((p) => (
              <PresencaRow key={p.id} presenca={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

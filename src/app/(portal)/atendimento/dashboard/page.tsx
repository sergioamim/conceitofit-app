"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useConversas } from "@/lib/query/use-conversas";
import { useWhatsAppCredentials } from "@/lib/query/use-whatsapp-credentials";
import { MetricCard } from "@/components/atendimento/metric-card";
import { CredentialHealthBadge } from "@/components/admin/credential-health-badge";

export default function AtendimentoDashboardPage() {
  const { tenantId, tenantResolved } = useTenantContext();

  const { data: conversasData, isLoading: conversasLoading } = useConversas({
    tenantId,
    tenantResolved,
    page: 0,
    size: 200,
  });

  const { data: credentials = [], isLoading: credentialsLoading } =
    useWhatsAppCredentials({
      tenantId,
      tenantResolved,
    });

  const conversas = conversasData?.content ?? [];

  const abertas = conversas.filter(
    (c) => c.status === "ABERTA" || c.status === "EM_ATENDIMENTO",
  ).length;
  const pendentes = conversas.filter((c) => c.status === "PENDENTE").length;
  const total = conversas.length;
  const credenciaisVerificadas = credentials.filter(
    (c) => c.onboardingStatus === "VERIFIED",
  ).length;
  const credenciaisAlerta = credentials.filter(
    (c) => c.tokenExpiringSoon || c.tokenExpired,
  ).length;

  const isLoading = conversasLoading || credentialsLoading;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Atendimento
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Dashboard WhatsApp
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral das conversas e saúde das credenciais.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Conversas Abertas"
          value={isLoading ? "…" : abertas}
          icon={MessageSquare}
          color="bg-gym-teal/10 text-gym-teal"
        />
        <MetricCard
          label="Conversas Pendentes"
          value={isLoading ? "…" : pendentes}
          icon={Clock}
          color="bg-amber-500/10 text-amber-500"
        />
        <MetricCard
          label="Total Conversas"
          value={isLoading ? "…" : total}
          icon={MessagesSquare}
          color="bg-blue-500/10 text-blue-500"
        />
        <MetricCard
          label="Credenciais Ativas"
          value={isLoading ? "…" : credenciaisVerificadas}
          icon={ShieldCheck}
          color="bg-gym-teal/10 text-gym-teal"
        />
        <MetricCard
          label="Credenciais com Alerta"
          value={isLoading ? "…" : credenciaisAlerta}
          icon={AlertTriangle}
          color={
            credenciaisAlerta > 0
              ? "bg-gym-danger/10 text-gym-danger"
              : "bg-muted/50 text-muted-foreground"
          }
        />
        <MetricCard
          label="Encerradas"
          value={
            isLoading
              ? "…"
              : conversas.filter((c) => c.status === "ENCERRADA").length
          }
          icon={CheckCircle}
          color="bg-muted/50 text-muted-foreground"
        />
      </div>

      {/* Saúde das credenciais */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Saúde das Credenciais
        </h2>
        {credentialsLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : credentials.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma credencial cadastrada.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {cred.phoneNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    WABA: {cred.wabaId}
                  </p>
                </div>
                <CredentialHealthBadge credential={cred} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

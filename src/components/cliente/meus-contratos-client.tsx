"use client";

import { useCallback, useMemo, useState } from "react";
import {
  FileText,
  Eye,
  PenLine,
  Calendar,
  CreditCard,
  ChevronRight,
  ArrowLeft,
  Send,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  useMeusContratos,
  useContratoDetalhe,
  useEnviarContratoOtp,
  useAssinarContrato,
} from "@/lib/query/use-portal-aluno";
import { getContratoPdfApi } from "@/lib/api/app-cliente";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatBRL, formatDate } from "@/lib/formatters";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function contratoStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    ATIVO: { label: "Ativo", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
    PENDENTE: { label: "Pendente", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    CANCELADO: { label: "Cancelado", className: "bg-muted/50 text-muted-foreground border-border/40" },
    ENCERRADO: { label: "Encerrado", className: "bg-muted/50 text-muted-foreground border-border/40" },
    SUSPENSO: { label: "Suspenso", className: "bg-gym-warning/10 text-gym-warning border-gym-warning/20" },
  };
  const config = map[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Assinatura flow (multi-step)
// ---------------------------------------------------------------------------

type SignStep = "idle" | "sending-otp" | "enter-otp" | "signing" | "done";

function AssinaturaFlow({
  contratoId,
  tenantId,
  onDone,
}: {
  contratoId: string;
  tenantId: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState<SignStep>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [error, setError] = useState("");

  const enviarOtp = useEnviarContratoOtp();
  const assinar = useAssinarContrato();

  const handleSendOtp = useCallback(async () => {
    setStep("sending-otp");
    setError("");
    try {
      const res = await enviarOtp.mutateAsync({ id: contratoId, tenantId });
      setOtpMsg(res.mensagem);
      setStep("enter-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar OTP");
      setStep("idle");
    }
  }, [contratoId, tenantId, enviarOtp]);

  const handleAssinar = useCallback(async () => {
    if (!otpCode.trim()) return;
    setStep("signing");
    setError("");
    try {
      await assinar.mutateAsync({ id: contratoId, tenantId, codigoOtp: otpCode.trim() });
      setStep("done");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na assinatura");
      setStep("enter-otp");
    }
  }, [contratoId, tenantId, otpCode, assinar, onDone]);

  if (step === "done") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-gym-teal/30 bg-gym-teal/[0.06] p-4">
        <CheckCircle2 className="size-5 text-gym-teal shrink-0" />
        <p className="text-sm font-bold text-gym-teal">Contrato assinado com sucesso!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {step === "idle" && (
        <Button
          onClick={() => void handleSendOtp()}
          className="w-full rounded-xl bg-gym-accent text-[#0e0f11] font-bold hover:bg-gym-accent/90 shadow-lg shadow-gym-accent/20"
        >
          <PenLine className="size-4 mr-2" />
          Assinar contrato
        </Button>
      )}

      {step === "sending-otp" && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Enviando codigo de verificacao...
        </div>
      )}

      {step === "enter-otp" && (
        <div className="space-y-3">
          {otpMsg && (
            <p className="text-xs text-muted-foreground">{otpMsg}</p>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Codigo OTP"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="rounded-xl border-border/60 bg-muted/30 font-mono text-center tracking-[0.3em]"
              maxLength={8}
              autoFocus
            />
            <Button
              onClick={() => void handleAssinar()}
              disabled={!otpCode.trim()}
              className="rounded-xl bg-gym-accent text-[#0e0f11] font-bold hover:bg-gym-accent/90 shrink-0 px-6"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() => void handleSendOtp()}
            className="text-xs text-primary underline underline-offset-2"
          >
            Reenviar codigo
          </button>
        </div>
      )}

      {step === "signing" && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Assinando contrato...
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-gym-danger">{error}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detalhe do contrato
// ---------------------------------------------------------------------------

function ContratoDetalheView({
  contratoId,
  onBack,
}: {
  contratoId: string;
  onBack: () => void;
}) {
  const { tenantId, tenantResolved } = useTenantContext();
  const { data: contrato, isLoading } = useContratoDetalhe({
    id: contratoId,
    tenantId,
    tenantResolved,
  });
  const [pdfLoading, setPdfLoading] = useState(false);
  const [signDone, setSignDone] = useState(false);

  const handleVerPdf = useCallback(async () => {
    if (!tenantId) return;
    setPdfLoading(true);
    try {
      const res = await getContratoPdfApi({ id: contratoId, tenantId });
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch {
      // silencioso — toast futuro
    } finally {
      setPdfLoading(false);
    }
  }, [contratoId, tenantId]);

  if (isLoading) {
    return (
      <div className="space-y-4 py-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-primary/10" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Contrato nao encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-extrabold tracking-tight truncate">
            {contrato.planoNome}
          </h2>
          <div className="mt-1">{contratoStatusBadge(contrato.status)}</div>
        </div>
      </div>

      <Card className="glass-card rounded-2xl border-border/40 shadow-lg shadow-black/5">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Valor mensal</p>
              <p className="text-lg font-display font-extrabold">{formatBRL(contrato.valorMensal)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Dia vencimento</p>
              <p className="text-lg font-display font-extrabold">{contrato.diaVencimento}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Forma pagamento</p>
              <p className="text-sm font-bold">{contrato.formaPagamento}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Periodo</p>
              <p className="text-sm font-bold">
                {formatDate(contrato.dataInicio)}
                {contrato.dataFim ? ` - ${formatDate(contrato.dataFim)}` : " - Indeterminado"}
              </p>
            </div>
          </div>

          {contrato.assinado && contrato.assinadoEm && (
            <div className="flex items-center gap-2 rounded-xl bg-gym-teal/[0.06] border border-gym-teal/20 px-4 py-2.5">
              <CheckCircle2 className="size-4 text-gym-teal shrink-0" />
              <p className="text-xs font-medium text-gym-teal">
                Assinado em {formatDate(contrato.assinadoEm)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acoes */}
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={() => void handleVerPdf()}
          disabled={pdfLoading}
          className="w-full rounded-xl border-border/60 h-12 justify-between font-bold"
        >
          <span className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            Ver PDF do contrato
          </span>
          {pdfLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ExternalLink className="size-4 text-muted-foreground" />
          )}
        </Button>

        {!contrato.assinado && !signDone && tenantId && (
          <AssinaturaFlow
            contratoId={contrato.id}
            tenantId={tenantId}
            onDone={() => setSignDone(true)}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lista de contratos
// ---------------------------------------------------------------------------

export function MeusContratosClient() {
  const { tenantId, tenantResolved } = useTenantContext();
  const { data: contratos = [], isLoading } = useMeusContratos({
    tenantId,
    tenantResolved,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return (
      <ContratoDetalheView
        contratoId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8 py-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-primary/10" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <FileText className="size-5 text-primary" />
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
            Juridico
          </Badge>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Meus Contratos
        </h1>
        <p className="mt-1 text-muted-foreground font-medium">
          Contratos ativos, pendentes e historico.
        </p>
      </motion.div>

      {/* Lista */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {contratos.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border/60 p-12 text-center bg-card/30">
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum contrato encontrado.
              </p>
            </div>
          ) : (
            contratos.map((c, i) => (
              <motion.button
                key={c.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full text-left glass-card group rounded-2xl border border-border/40 p-5 transition-all hover:shadow-xl hover:shadow-primary/5",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <FileText size={24} />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-base tracking-tight truncate">
                        {c.planoNome}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} className="text-primary/60" />
                          {formatDate(c.dataInicio)}
                          {c.dataFim ? ` - ${formatDate(c.dataFim)}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {contratoStatusBadge(c.status)}
                    <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="glass-card rounded-2xl border border-border/40 p-5 flex items-start gap-4 bg-primary/5">
        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
          <Info size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold tracking-tight text-foreground">Sobre seus contratos</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Contratos pendentes de assinatura podem ser assinados digitalmente.
            Clique no contrato para visualizar detalhes e assinar.
          </p>
        </div>
      </div>
    </div>
  );
}

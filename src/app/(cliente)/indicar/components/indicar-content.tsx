"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { z } from "zod";
import {
  AlertTriangle,
  Check,
  Copy,
  Gift,
  Share2,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { formatDate } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import type { ReferralInfo } from "@/lib/api/app-cliente";
import {
  getReferralInfoApi,
  criarReferralApi,
} from "@/lib/api/app-cliente";

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const referralSchema = z.object({
  indicadoNome: z.string().min(2, "Nome obrigatorio (min. 2 caracteres)"),
  indicadoEmail: z.string().email("Email invalido").or(z.literal("")).optional(),
  indicadoTelefone: z.string().optional(),
});

type ReferralFormData = z.infer<typeof referralSchema>;

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const INDICACAO_STATUS: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  CONVERTIDO: { label: "Convertido", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
  EXPIRADO: { label: "Expirado", className: "bg-muted/50 text-muted-foreground border-border/40" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function IndicarContent() {
  const { tenantId, tenantResolved } = useTenantContext();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: { indicadoNome: "", indicadoEmail: "", indicadoTelefone: "" },
  });

  const fetchData = useCallback(async () => {
    if (!tenantResolved || !tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReferralInfoApi({ tenantId });
      setInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar programa de indicacao.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, tenantResolved]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleCopyLink() {
    if (!info?.shareLink) return;
    try {
      await navigator.clipboard.writeText(info.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback — select & copy
    }
  }

  async function handleShare() {
    if (!info?.shareLink) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: info.campanhaNome,
          text: `Venha treinar comigo! Ganhe pontos usando meu link de indicacao.`,
          url: info.shareLink,
        });
      } catch {
        // user cancelled or not supported
      }
    } else {
      void handleCopyLink();
    }
  }

  async function onSubmit(data: ReferralFormData) {
    if (!tenantId) return;
    setError(null);
    try {
      const result = await criarReferralApi({
        tenantId,
        indicadoNome: data.indicadoNome,
        indicadoEmail: data.indicadoEmail || undefined,
        indicadoTelefone: data.indicadoTelefone || undefined,
      });
      setSubmitSuccess(`${result.indicadoNome} foi indicado com sucesso!`);
      reset();
      // Refresh data
      void fetchData();
      setTimeout(() => setSubmitSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar indicacao.");
    }
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Users className="size-7 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Indicar Amigos</h1>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {submitSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal font-bold flex items-center gap-2"
          >
            <Check className="size-4" />
            {submitSuccess}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-4 text-sm text-gym-danger flex items-center gap-3">
          <AlertTriangle className="size-5" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
          ))}
        </div>
      ) : info ? (
        <>
          {/* Share Card */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-gym-accent/30 bg-gym-accent/5 p-5 space-y-4 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <Gift className="size-5 text-gym-accent" />
              <p className="font-display text-lg font-bold">
                Indique e ganhe {info.pontosIndicacao} pontos!
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {info.campanhaNome} &middot; Ganhe {info.pontosConversao} pontos extras quando seu amigo se matricular.
            </p>

            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/80 px-3 py-2">
              <input
                readOnly
                value={info.shareLink}
                className="flex-1 bg-transparent text-xs text-foreground outline-none truncate"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => void handleCopyLink()}
              >
                {copied ? <Check className="size-4 text-gym-teal" /> : <Copy className="size-4" />}
              </Button>
            </div>

            <Button
              className="w-full h-11 rounded-xl font-bold bg-gym-accent text-[#0e0f11] hover:bg-gym-accent/90 shadow-lg shadow-gym-accent/20"
              onClick={() => void handleShare()}
            >
              <Share2 className="mr-2 size-4" />
              Compartilhar Link
            </Button>
          </motion.section>

          {/* Stats */}
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border/40 bg-card/50 p-4 text-center space-y-1">
              <p className="text-2xl font-display font-extrabold text-foreground">{info.indicacoesFeitas}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Indicacoes</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/50 p-4 text-center space-y-1">
              <p className="text-2xl font-display font-extrabold text-gym-teal">{info.conversoes}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Conversoes</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/50 p-4 text-center space-y-1">
              <p className="text-2xl font-display font-extrabold text-gym-accent">{info.pontosAcumulados}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Pontos</p>
            </div>
          </section>

          {/* Form — Indicar amigo */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold tracking-tight px-1">
              <UserPlus className="inline mr-2 size-5 -mt-0.5" />
              Indicar Amigo
            </h2>
            <form
              onSubmit={(e) => void handleSubmit(onSubmit)(e)}
              className="space-y-3 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4"
            >
              <div>
                <Input
                  placeholder="Nome do amigo *"
                  className="rounded-xl border-border/60 bg-background/80"
                  {...register("indicadoNome")}
                />
                {errors.indicadoNome ? (
                  <p className="mt-1 text-xs text-gym-danger">{errors.indicadoNome.message}</p>
                ) : null}
              </div>
              <Input
                placeholder="Email (opcional)"
                type="email"
                className="rounded-xl border-border/60 bg-background/80"
                {...register("indicadoEmail")}
              />
              <Input
                placeholder="Telefone (opcional)"
                className="rounded-xl border-border/60 bg-background/80"
                {...register("indicadoTelefone")}
              />
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-bold bg-gym-accent text-[#0e0f11] hover:bg-gym-accent/90 shadow-lg shadow-gym-accent/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Indicar Amigo"}
              </Button>
            </form>
          </section>

          {/* Lista de indicacoes */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold tracking-tight px-1">Minhas Indicacoes</h2>
            {info.indicacoes.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border/60 bg-card/30 px-4 py-12 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Voce ainda nao indicou ninguem.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {info.indicacoes.map((ind) => {
                  const statusCfg = INDICACAO_STATUS[ind.status] ?? {
                    label: ind.status,
                    className: "bg-muted/50 text-muted-foreground border-border/40",
                  };
                  return (
                    <motion.div
                      key={ind.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <UserPlus className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate">{ind.indicadoNome}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(ind.dataCriacao)}
                          {ind.pontosEmitidos > 0 ? ` · +${ind.pontosEmitidos} pts` : ""}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

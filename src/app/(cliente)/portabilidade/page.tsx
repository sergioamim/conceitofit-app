"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Loader2, MapPin, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  getPortabilidadeApi,
  type Portabilidade,
} from "@/lib/api/app-cliente";

export default function PortabilidadePage() {
  const { tenantId, tenantResolved } = useTenantContext();
  const [portabilidade, setPortabilidade] = useState<Portabilidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPortabilidadeApi({ tenantId: tenantId! });
        if (!cancelled) setPortabilidade(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Erro ao carregar portabilidade.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, tenantResolved]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <XCircle className="h-12 w-12 text-gym-danger/40 mb-3" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!portabilidade) return null;

  const ativa = portabilidade.portabilidadeAtiva;

  return (
    <div className="space-y-6 py-4 pb-20">
      <div>
        <h1 className="font-display text-2xl font-bold">Portabilidade</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acesso a outras unidades da rede.
        </p>
      </div>

      {/* Status card */}
      <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Unidade de origem
              </p>
              <p className="text-sm font-bold">{portabilidade.unidadeOrigem}</p>
            </div>
          </div>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              ativa
                ? "bg-gym-teal/10 text-gym-teal"
                : "bg-muted/30 text-muted-foreground",
            )}
          >
            {ativa ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {ativa ? "Ativa" : "Inativa"}
          </span>
        </div>
      </div>

      {/* Unidades permitidas */}
      {ativa && portabilidade.unidadesPermitidas.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Unidades permitidas ({portabilidade.unidadesPermitidas.length})
          </p>

          <div className="space-y-2">
            {portabilidade.unidadesPermitidas.map((unidade) => (
              <div
                key={unidade.tenantId}
                className="rounded-2xl border border-border/40 bg-card p-4 flex items-start gap-3"
              >
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{unidade.nome}</p>
                  {unidade.endereco && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {unidade.endereco}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/60 text-center pt-2">
            Voce pode fazer check-in nas unidades listadas acima.
          </p>
        </div>
      ) : ativa ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma unidade adicional disponivel no momento.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Portabilidade nao esta ativa no seu plano.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Fale com a recepcao para saber mais sobre planos com portabilidade.
          </p>
        </div>
      )}
    </div>
  );
}

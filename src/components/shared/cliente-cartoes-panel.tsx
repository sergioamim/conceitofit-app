"use client";

import { useState } from "react";
import type { BandeiraCartao, CartaoCliente } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { NovoCartaoModal } from "@/components/shared/novo-cartao-modal";

function maskCard(ultimos4: string) {
  return `•••• •••• •••• ${ultimos4}`;
}

function cardGradient(name?: string) {
  const normalized = (name ?? "").toLowerCase();
  if (normalized.includes("visa")) return "from-blue-600/90 via-blue-500/70 to-cyan-500/60";
  if (normalized.includes("master")) return "from-orange-600/90 via-rose-500/70 to-yellow-500/60";
  if (normalized.includes("elo")) return "from-emerald-600/90 via-teal-500/70 to-lime-500/60";
  return "from-slate-700/90 via-slate-600/70 to-slate-500/60";
}

export function ClienteCartoesPanel({
  cartoes,
  bandeiras,
  loading,
  error,
  onCreate,
  onDelete,
  onReload,
  onSetDefault,
}: {
  cartoes: CartaoCliente[];
  bandeiras: BandeiraCartao[];
  loading: boolean;
  error: string | null;
  onCreate: (data: {
    bandeiraId: string;
    titular: string;
    ultimos4: string;
    validade: string;
    cpfTitular?: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReload: () => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <NovoCartaoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        bandeiras={bandeiras}
        onSave={async (data) => {
          await onCreate(data);
          setModalOpen(false);
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold">Cartões</h2>
          <p className="mt-1 text-sm text-muted-foreground">Formas de pagamento salvas do cliente.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={loading}>
          Novo cartão
        </Button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando cartões...</p>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-gym-danger/40 bg-gym-danger/10 p-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {cartoes.map((cartao) => {
            const bandeira = bandeiras.find((item) => item.id === cartao.bandeiraId);
            return (
              <div key={cartao.id} className="rounded-xl border border-border bg-card p-4">
                <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br p-4 text-white shadow-lg">
                  <div className={`absolute inset-0 bg-gradient-to-br ${cardGradient(bandeira?.nome)} opacity-90`} />
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10" />
                  <div className="absolute -left-6 bottom-6 h-24 w-24 rounded-full bg-white/5" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Cartão</p>
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                        {bandeira?.nome ?? "Crédito"}
                      </span>
                    </div>
                    <div className="mt-6 font-display text-xl tracking-[0.2em]">{maskCard(cartao.ultimos4)}</div>
                    <div className="mt-6 flex items-center justify-between text-xs text-white/80">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/60">Titular</p>
                        <p className="text-xs font-semibold text-white">{cartao.titular}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-white/60">Validade</p>
                        <p className="text-xs font-semibold text-white">{cartao.validade}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {cartao.padrao ? (
                    <span className="inline-flex items-center rounded-full bg-gym-teal/15 px-2.5 py-0.5 text-[11px] font-semibold text-gym-teal">
                      Padrão
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={async () => {
                        await onSetDefault(cartao.id);
                        await onReload();
                      }}
                    >
                      Definir padrão
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-gym-danger hover:text-gym-danger"
                    onClick={async () => {
                      if (!confirm("Remover este cartão?")) return;
                      await onDelete(cartao.id);
                      await onReload();
                    }}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            );
          })}

          {cartoes.length === 0 ? (
            <div className="col-span-2 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhum cartão cadastrado
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

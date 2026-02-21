"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { listCartoesCliente, listBandeirasCartao, createCartaoCliente, deleteCartaoCliente, setCartaoPadrao } from "@/lib/mock/services";
import type { CartaoCliente, BandeiraCartao } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { NovoCartaoModal } from "@/components/shared/novo-cartao-modal";

function maskCard(ultimos4: string) {
  return `•••• •••• •••• ${ultimos4}`;
}

function cardGradient(name?: string) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("visa")) return "from-blue-600/90 via-blue-500/70 to-cyan-500/60";
  if (n.includes("master")) return "from-orange-600/90 via-rose-500/70 to-yellow-500/60";
  if (n.includes("elo")) return "from-emerald-600/90 via-teal-500/70 to-lime-500/60";
  return "from-slate-700/90 via-slate-600/70 to-slate-500/60";
}

export default function CartoesClientePage() {
  const params = useParams<{ id: string }>();
  const [cartoes, setCartoes] = useState<CartaoCliente[]>([]);
  const [bandeiras, setBandeiras] = useState<BandeiraCartao[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    const id = params?.id;
    if (!id) return;
    const [cards, brands] = await Promise.all([
      listCartoesCliente(id),
      listBandeirasCartao({ apenasAtivas: true }),
    ]);
    setCartoes(cards);
    setBandeiras(brands);
  }

  useEffect(() => {
    load();
  }, [params?.id]);

  return (
    <div className="space-y-6">
      <NovoCartaoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        bandeiras={bandeiras}
        onSave={async (data) => {
          const id = params?.id;
          if (!id) return;
          await createCartaoCliente({
            alunoId: id,
            bandeiraId: data.bandeiraId,
            titular: data.titular,
            ultimos4: data.ultimos4,
            validade: data.validade,
            cpfTitular: data.cpfTitular,
          });
          setModalOpen(false);
          await load();
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Cartões do cliente</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie formas de pagamento salvas
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Novo cartão</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cartoes.map((c) => {
          const bandeira = bandeiras.find((b) => b.id === c.bandeiraId);
          return (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4">
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
                  <div className="mt-6 font-display text-xl tracking-[0.2em]">
                    {maskCard(c.ultimos4)}
                  </div>
                  <div className="mt-6 flex items-center justify-between text-xs text-white/80">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/60">Titular</p>
                      <p className="text-xs font-semibold text-white">{c.titular}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-white/60">Validade</p>
                      <p className="text-xs font-semibold text-white">{c.validade}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  {c.padrao ? (
                    <span className="inline-flex items-center rounded-full bg-gym-teal/15 px-2.5 py-0.5 text-[11px] font-semibold text-gym-teal">
                      Padrão
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={async () => {
                        await setCartaoPadrao(c.id);
                        await load();
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
                      await deleteCartaoCliente(c.id);
                      await load();
                    }}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {cartoes.length === 0 && (
          <div className="col-span-2 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhum cartão cadastrado
          </div>
        )}
      </div>
    </div>
  );
}

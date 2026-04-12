"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { formatBRL, formatDate } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import type { CatalogoItem, PedidoLoja } from "@/lib/api/app-cliente";
import {
  getCatalogoLojaApi,
  listPedidosLojaApi,
  criarPedidoLojaApi,
} from "@/lib/api/app-cliente";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartItem {
  item: CatalogoItem;
  quantidade: number;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const PEDIDO_STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  CONFIRMADO: { label: "Confirmado", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  PREPARANDO: { label: "Preparando", className: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
  PRONTO: { label: "Pronto", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
  ENTREGUE: { label: "Entregue", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
  CANCELADO: { label: "Cancelado", className: "bg-gym-danger/10 text-gym-danger border-gym-danger/20" },
};

function PedidoStatusBadge({ status }: { status: string }) {
  const cfg = PEDIDO_STATUS_MAP[status] ?? {
    label: status,
    className: "bg-muted/50 text-muted-foreground border-border/40",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Catalog Card
// ---------------------------------------------------------------------------

function CatalogoCard({
  item,
  cartQty,
  onAdd,
}: {
  item: CatalogoItem;
  cartQty: number;
  onAdd: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden"
    >
      {item.imagemUrl ? (
        <div className="aspect-[4/3] w-full bg-muted/20 overflow-hidden">
          <img
            src={item.imagemUrl}
            alt={item.nome}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] w-full bg-muted/10 flex items-center justify-center">
          {item.tipo === "SERVICO" ? (
            <Sparkles className="size-10 text-muted-foreground/30" />
          ) : (
            <Package className="size-10 text-muted-foreground/30" />
          )}
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">{item.nome}</p>
            {item.descricao ? (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.descricao}</p>
            ) : null}
          </div>
          <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            item.tipo === "SERVICO"
              ? "bg-violet-500/10 text-violet-500 border-violet-500/20"
              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
          }`}>
            {item.tipo === "SERVICO" ? "Servico" : "Produto"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-lg font-display font-extrabold text-gym-accent">
            {formatBRL(item.preco)}
          </p>
          {item.disponivel ? (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl h-9 px-4 font-bold border-border/60"
              onClick={onAdd}
            >
              <Plus className="mr-1 size-4" />
              {cartQty > 0 ? `(${cartQty})` : "Adicionar"}
            </Button>
          ) : (
            <span className="text-xs font-bold text-muted-foreground">Indisponivel</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Cart Sheet
// ---------------------------------------------------------------------------

function CartSheet({
  cart,
  onUpdateQty,
  onRemove,
  onClose,
  onFinalize,
  submitting,
}: {
  cart: CartItem[];
  onUpdateQty: (itemId: string, delta: number) => void;
  onRemove: (itemId: string) => void;
  onClose: () => void;
  onFinalize: () => void;
  submitting: boolean;
}) {
  const total = useMemo(
    () => cart.reduce((sum, c) => sum + c.item.preco * c.quantidade, 0),
    [cart],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border/40 bg-background p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-bold">Meu Carrinho</h3>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Seu carrinho esta vazio.
          </p>
        ) : (
          <div className="space-y-3">
            {cart.map((c) => (
              <div
                key={c.item.id}
                className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{c.item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBRL(c.item.preco)} un.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-border/60"
                    onClick={() => onUpdateQty(c.item.id, -1)}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-bold">{c.quantidade}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-border/60"
                    onClick={() => onUpdateQty(c.item.id, 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gym-danger"
                    onClick={() => onRemove(c.item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4">
              <p className="text-sm font-bold text-muted-foreground">Total</p>
              <p className="text-xl font-display font-extrabold text-gym-accent">
                {formatBRL(total)}
              </p>
            </div>

            <Button
              className="w-full h-12 rounded-xl font-bold text-base bg-gym-accent text-[#0e0f11] hover:bg-gym-accent/90 shadow-lg shadow-gym-accent/20"
              disabled={submitting || cart.length === 0}
              onClick={onFinalize}
            >
              {submitting ? "Finalizando..." : "Finalizar Pedido"}
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Pedidos List
// ---------------------------------------------------------------------------

function PedidoRow({ pedido }: { pedido: PedidoLoja }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {formatDate(pedido.criadoEm)}
        </p>
        <PedidoStatusBadge status={pedido.status} />
      </div>
      <div className="space-y-1">
        {pedido.items.map((it, i) => (
          <p key={i} className="text-sm text-foreground">
            {it.quantidade}x {it.nome}{" "}
            <span className="text-muted-foreground">
              ({formatBRL(it.precoUnitario)})
            </span>
          </p>
        ))}
      </div>
      <div className="flex justify-end">
        <p className="text-base font-display font-extrabold text-gym-accent">
          {formatBRL(pedido.total)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function LojaContent() {
  const { tenantId, tenantResolved } = useTenantContext();
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [pedidos, setPedidos] = useState<PedidoLoja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantResolved || !tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [cat, ped] = await Promise.all([
        getCatalogoLojaApi({ tenantId }),
        listPedidosLojaApi({ tenantId }),
      ]);
      setCatalogo(cat);
      setPedidos(ped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar loja.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, tenantResolved]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function addToCart(item: CatalogoItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantidade: c.quantidade + 1 } : c,
        );
      }
      return [...prev, { item, quantidade: 1 }];
    });
  }

  function updateCartQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.item.id === itemId
            ? { ...c, quantidade: Math.max(0, c.quantidade + delta) }
            : c,
        )
        .filter((c) => c.quantidade > 0),
    );
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  }

  async function handleFinalize() {
    if (!tenantId || cart.length === 0) return;
    setSubmitting(true);
    try {
      const pedido = await criarPedidoLojaApi({
        tenantId,
        items: cart.map((c) => ({ itemId: c.item.id, quantidade: c.quantidade })),
      });
      setPedidos((prev) => [pedido, ...prev]);
      setCart([]);
      setCartOpen(false);
      setSuccessMsg("Pedido realizado com sucesso!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  const cartTotal = cart.reduce((s, c) => s + c.quantidade, 0);

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <ShoppingBag className="size-7 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Loja</h1>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {successMsg ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal font-bold flex items-center gap-2"
          >
            <Check className="size-4" />
            {successMsg}
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

      {/* Cart FAB */}
      {cartTotal > 0 ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-20 right-4 z-30 md:right-6"
        >
          <Button
            className="h-14 w-14 rounded-full bg-gym-accent text-[#0e0f11] shadow-xl shadow-gym-accent/30 hover:bg-gym-accent/90"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="size-6" />
            <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-gym-danger text-[11px] font-bold text-white">
              {cartTotal}
            </span>
          </Button>
        </motion.div>
      ) : null}

      {/* Catalogo */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold tracking-tight px-1">Catalogo</h2>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
            ))}
          </div>
        ) : catalogo.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border/60 bg-card/30 px-4 py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum item disponivel no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {catalogo.map((item) => (
              <CatalogoCard
                key={item.id}
                item={item}
                cartQty={cart.find((c) => c.item.id === item.id)?.quantidade ?? 0}
                onAdd={() => addToCart(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Meus Pedidos */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold tracking-tight px-1">Meus Pedidos</h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
            ))}
          </div>
        ) : pedidos.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border/60 bg-card/30 px-4 py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Voce ainda nao fez nenhum pedido.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((p) => (
              <PedidoRow key={p.id} pedido={p} />
            ))}
          </div>
        )}
      </section>

      {/* Cart Sheet */}
      <AnimatePresence>
        {cartOpen ? (
          <CartSheet
            cart={cart}
            onUpdateQty={updateCartQty}
            onRemove={removeFromCart}
            onClose={() => setCartOpen(false)}
            onFinalize={() => void handleFinalize()}
            submitting={submitting}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

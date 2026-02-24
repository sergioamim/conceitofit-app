"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listVendas } from "@/lib/mock/services";
import type { Venda } from "@/lib/types";
import { Button } from "@/components/ui/button";

function formatBRL(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TIPO_LABEL: Record<Venda["tipo"], string> = {
  PLANO: "Plano",
  SERVICO: "Serviço",
  PRODUTO: "Produto",
};

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);

  async function load() {
    const data = await listVendas();
    setVendas(data.slice(0, 20));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    function handleUpdate() {
      load();
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    return () => window.removeEventListener("academia-store-updated", handleUpdate);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Vendas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Últimas vendas registradas da unidade ativa
          </p>
        </div>
        <Link href="/vendas/nova">
          <Button>
            <Plus className="size-4" />
            Nova venda
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Itens</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pagamento</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendas.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma venda registrada ainda
                </td>
              </tr>
            )}
            {vendas.map((venda) => (
              <tr key={venda.id}>
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(venda.dataCriacao)}</td>
                <td className="px-4 py-3 text-sm">{venda.clienteNome ?? "Consumidor não identificado"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{TIPO_LABEL[venda.tipo]}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{venda.itens.length}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{venda.pagamento.formaPagamento}</td>
                <td className="px-4 py-3 text-right font-semibold text-gym-accent">{formatBRL(venda.total)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gym-teal/15 px-2.5 py-1 text-[11px] font-semibold text-gym-teal">
                    {venda.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

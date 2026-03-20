"use client";

import { useEffect, useState } from "react";
import {
  createProdutoApi,
  deleteProdutoApi,
  listProdutosApi,
  toggleProdutoApi,
  updateProdutoApi,
} from "@/lib/api/comercial-catalogo";
import type { Produto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ProdutoModal } from "@/components/shared/produto-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { cn } from "@/lib/utils";

function formatBRL(value: number) {
  return (value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);

  async function load() {
    const data = await listProdutosApi(false);
    setProdutos(data);
  }

  useEffect(() => {
    void listProdutosApi(false).then(setProdutos);
  }, []);

  async function handleSave(data: Omit<Produto, "id" | "tenantId">, id?: string) {
    const { ativo = true, ...payload } = data;

    if (id) {
      await updateProdutoApi(id, payload);
      if (editing && editing.ativo !== ativo) {
        await toggleProdutoApi(id);
      }
    } else {
      const created = await createProdutoApi(payload);
      if (!ativo) {
        await toggleProdutoApi(created.id);
      }
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleToggle(id: string) {
    await toggleProdutoApi(id);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este produto?")) return;
    await deleteProdutoApi(id);
    await load();
  }

  return (
    <div className="space-y-6">
      <ProdutoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cadastro completo para venda de produtos físicos e controle de margem/estoque</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Novo produto</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Produto</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SKU / Categoria</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Venda / Custo</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estoque</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Regras</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {produtos.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.marca ?? "Sem marca"} · {p.unidadeMedida}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <p>{p.sku}</p>
                  <p className="text-xs">{p.categoria ?? "Sem categoria"}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <p>{formatBRL(p.valorVenda)}</p>
                  <p className="text-xs">Custo {formatBRL(p.custo ?? 0)}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.controlaEstoque ? `${p.estoqueAtual} (mín ${p.estoqueMinimo ?? 0})` : "Sem controle"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <p>Desc: {p.permiteDesconto ? "Sim" : "Não"}</p>
                  <p>Voucher: {p.permiteVoucher ? "Sim" : "Não"}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", p.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-muted text-muted-foreground")}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Editar",
                        kind: "edit",
                        onClick: () => {
                          setEditing(p);
                          setModalOpen(true);
                        },
                      },
                      {
                        label: p.ativo ? "Desativar" : "Ativar",
                        kind: "toggle",
                        onClick: () => handleToggle(p.id),
                      },
                      {
                        label: "Remover",
                        kind: "delete",
                        onClick: () => handleDelete(p.id),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {produtos.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nenhum produto cadastrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

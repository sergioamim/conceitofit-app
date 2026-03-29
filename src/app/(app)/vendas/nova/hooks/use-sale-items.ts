"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listProdutosService,
  listServicosService,
} from "@/lib/tenant/comercial/runtime";
import { formatBRL } from "@/lib/formatters";
import type { Plano, Produto, Servico, TipoVenda } from "@/lib/types";
import type { SuggestionOption } from "@/components/shared/suggestion-input";
import type { CartItem } from "@/lib/tenant/hooks/use-commercial-flow";

export interface UseSaleItems {
  servicos: Servico[];
  produtos: Produto[];
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  itemQuery: string;
  setItemQuery: (query: string) => void;
  qtd: string;
  setQtd: (qtd: string) => void;
  itemOptions: SuggestionOption[];
  addItem: () => void;
  applyCodeToProduct: (code: string) => boolean;
}

export function useSaleItems(input: {
  tipoVenda: TipoVenda;
  planos: Plano[];
  addItemToCart: (item: CartItem) => void;
  setTipoVenda: (tipo: TipoVenda) => void;
}): UseSaleItems {
  const { tipoVenda, planos, addItemToCart, setTipoVenda } = input;

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemQuery, setItemQuery] = useState("");
  const [qtd, setQtd] = useState("1");
  const [servicosLoaded, setServicosLoaded] = useState(false);
  const [produtosLoaded, setProdutosLoaded] = useState(false);

  useEffect(() => {
    if (tipoVenda === "SERVICO" && !servicosLoaded) {
      void listServicosService(true).then((r) => { setServicos(r); setServicosLoaded(true); });
    }
    if (tipoVenda === "PRODUTO" && !produtosLoaded) {
      void listProdutosService(true).then((r) => { setProdutos(r); setProdutosLoaded(true); });
    }
  }, [tipoVenda, servicosLoaded, produtosLoaded]);

  const options = useMemo(() => {
    if (tipoVenda === "PLANO") {
      return planos.map((p) => ({ id: p.id, nome: p.nome, valor: Number(p.valor ?? 0), searchText: p.nome }));
    }
    if (tipoVenda === "SERVICO") {
      return servicos.map((s) => ({ id: s.id, nome: s.nome, valor: Number(s.valor ?? 0), searchText: `${s.nome} ${s.sku ?? ""}` }));
    }
    return produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      valor: Number(p.valorVenda ?? 0),
      codigoBarras: p.codigoBarras,
      sku: p.sku,
      searchText: `${p.nome} ${p.sku ?? ""} ${p.codigoBarras ?? ""}`,
    }));
  }, [tipoVenda, planos, servicos, produtos]);

  const itemOptions = useMemo<SuggestionOption[]>(
    () =>
      options.map((o) => ({
        id: o.id,
        label: `${o.nome} · ${formatBRL(o.valor)}`,
        searchText: `${o.searchText ?? ""}`,
      })),
    [options]
  );

  useEffect(() => {
    if (!selectedItemId) return;
    const selected = itemOptions.find((o) => o.id === selectedItemId);
    if (selected) setItemQuery(selected.label);
  }, [selectedItemId, itemOptions]);

  function addItem() {
    const selected = options.find((o) => o.id === selectedItemId);
    if (!selected) return;

    addItemToCart({
      tipo: tipoVenda,
      referenciaId: selected.id,
      descricao: selected.nome,
      quantidade: Math.max(1, parseInt(qtd, 10) || 1),
      valorUnitario: selected.valor,
      desconto: 0,
    });
  }

  const applyCodeToProduct = useCallback((code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return false;

    const match = produtos.find((p) => {
      const cb = p.codigoBarras?.trim().toUpperCase();
      const sku = p.sku?.trim().toUpperCase();
      return cb === normalized || sku === normalized;
    });

    if (!match) return false;

    if (tipoVenda !== "PRODUTO") {
      setTipoVenda("PRODUTO");
    }
    setSelectedItemId(match.id);
    setItemQuery(`${match.nome} · ${formatBRL(Number(match.valorVenda ?? 0))}`);
    return true;
  }, [produtos, tipoVenda, setTipoVenda]);

  return {
    servicos,
    produtos,
    selectedItemId,
    setSelectedItemId,
    itemQuery,
    setItemQuery,
    qtd,
    setQtd,
    itemOptions,
    addItem,
    applyCodeToProduct,
  };
}

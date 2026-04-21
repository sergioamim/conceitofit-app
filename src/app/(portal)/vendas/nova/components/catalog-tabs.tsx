"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Produto, Servico } from "@/lib/shared/types/plano";
import type { TipoVenda } from "@/lib/types";
import type { VendaWorkspace } from "../hooks/use-venda-workspace";
import { CatalogPlanos } from "./catalog-planos";
import { CatalogProdutos } from "./catalog-produtos";
import { CatalogServicos } from "./catalog-servicos";
import { PlanoDetails } from "./plano-details";

interface CatalogTabsProps {
  workspace: VendaWorkspace;
}

/**
 * VUN-2.3 — Tab segmented que orquestra os 3 catálogos (Planos/Serviços/Produtos).
 *
 * RN-011: trocar tab NÃO zera o carrinho (combo livre permitido). A tab
 * atualiza `tipoVenda` apenas para controlar qual catálogo é renderizado e
 * para que o lazy-load de serviços/produtos em `use-sale-items` ocorra.
 */
export function CatalogTabs({ workspace }: CatalogTabsProps) {
  const {
    tipoVenda,
    setTipoVenda,
    planos,
    selectedPlanoId,
    handleAddPlano,
    servicos,
    produtos,
    addItemToCart,
  } = workspace;

  const handleAddServico = (servico: Servico) => {
    addItemToCart({
      tipo: "SERVICO",
      referenciaId: servico.id,
      descricao: servico.nome,
      quantidade: 1,
      valorUnitario: Number(servico.valor ?? 0),
      desconto: 0,
    });
  };

  const handleAddProduto = (produto: Produto) => {
    addItemToCart({
      tipo: "PRODUTO",
      referenciaId: produto.id,
      descricao: produto.nome,
      quantidade: 1,
      valorUnitario: Number(produto.valorVenda ?? 0),
      desconto: 0,
    });
  };

  return (
    <Tabs
      value={tipoVenda}
      onValueChange={(value) => setTipoVenda(value as TipoVenda)}
      className="w-full"
    >
      <TabsList
        aria-label="Tipo de item a adicionar"
        className="grid w-full grid-cols-3"
      >
        <TabsTrigger value="PLANO" data-testid="catalog-tab-PLANO">
          Plano
        </TabsTrigger>
        <TabsTrigger value="SERVICO" data-testid="catalog-tab-SERVICO">
          Serviço
        </TabsTrigger>
        <TabsTrigger value="PRODUTO" data-testid="catalog-tab-PRODUTO">
          Produto
        </TabsTrigger>
      </TabsList>

      <TabsContent value="PLANO" className="mt-3 space-y-3">
        <CatalogPlanos
          planos={planos}
          selectedPlanoId={selectedPlanoId}
          onAdd={handleAddPlano}
        />
        <PlanoDetails workspace={workspace} />
      </TabsContent>

      <TabsContent value="SERVICO" className="mt-3">
        <CatalogServicos servicos={servicos} onAdd={handleAddServico} />
      </TabsContent>

      <TabsContent value="PRODUTO" className="mt-3">
        <CatalogProdutos produtos={produtos} onAdd={handleAddProduto} />
      </TabsContent>
    </Tabs>
  );
}

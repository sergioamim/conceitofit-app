"use client";

import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { VendaWorkspace } from "../hooks/use-venda-workspace";

interface ClientAndItemSelectorProps {
  workspace: VendaWorkspace;
}

export function ClientAndItemSelector({ workspace }: ClientAndItemSelectorProps) {
  const {
    tipoVenda,
    requireCliente,
    clienteQuery,
    setClienteQuery,
    setClienteId,
    loadAlunos,
    clienteOptions,
    itemQuery,
    setItemQuery,
    setSelectedItemId,
    itemOptions,
    setScannerOpen,
    qtd,
    setQtd,
    addItem,
    selectedItemId,
  } = workspace;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={tipoVenda === "PLANO" ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-3 md:grid-cols-2"}>
        <div className="space-y-1.5">
          <label htmlFor="venda-cliente-suggestion" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cliente {requireCliente ? "*" : "(opcional)"}
          </label>
          <SuggestionInput
            inputId="venda-cliente-suggestion"
            value={clienteQuery}
            onValueChange={(value) => {
              setClienteQuery(value);
              const exact = clienteOptions.find((option) => option.label === value);
              setClienteId(exact?.id ?? "");
            }}
            onSelect={(option) => {
              setClienteId(option.id);
              setClienteQuery(option.label);
            }}
            onFocusOpen={loadAlunos}
            options={clienteOptions}
            placeholder="Buscar por nome ou CPF"
            minCharsToSearch={3}
          />
          {!requireCliente && (
            <button
              type="button"
              className="cursor-pointer text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              onClick={() => {
                setClienteId("");
                setClienteQuery("");
              }}
            >
              Limpar cliente (venda sem identificação)
            </button>
          )}
        </div>

        {tipoVenda !== "PLANO" && (
          <div className="space-y-1.5">
            <label htmlFor="venda-item-suggestion" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Item</label>
            <div className="flex items-center gap-2">
              <SuggestionInput
                inputId="venda-item-suggestion"
                className="flex-1"
                value={itemQuery}
                onValueChange={(value) => {
                  setItemQuery(value);
                  const exact = itemOptions.find((option) => option.label === value);
                  setSelectedItemId(exact?.id ?? "");
                }}
                onSelect={(option) => {
                  setSelectedItemId(option.id);
                  setItemQuery(option.label);
                }}
                options={itemOptions}
                placeholder="Buscar item por nome"
              />
              {tipoVenda === "PRODUTO" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-border"
                  onClick={() => setScannerOpen(true)}
                  title="Leitor de código de barras"
                  aria-label="Abrir leitor de código de barras"
                >
                  <ScanLine className="size-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {tipoVenda !== "PLANO" && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quantidade</label>
            <Input type="number" min={1} value={qtd} onChange={(e) => setQtd(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="flex items-end">
            <Button onClick={addItem} className="w-full" disabled={!selectedItemId}>Adicionar item</Button>
          </div>
        </div>
      )}
    </div>
  );
}

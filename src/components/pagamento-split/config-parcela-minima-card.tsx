"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL } from "@/lib/formatters";
import {
  getConfigParcelaMinimaApi,
  putConfigParcelaMinimaApi,
} from "@/lib/api/pagamentos-split";

/**
 * Card de configuração do valor mínimo de parcela na Unidade.
 * Usado quando carrinho não tem plano (só produto/avulso) — limite efetivo
 * de parcelas em cartão de crédito = floor(total / valorMinimoParcela), capado em 12x.
 *
 * NULL/0 = sem regra (cap em 12x). Plug-and-play em qualquer tela admin de Unidade.
 */
interface ConfigParcelaMinimaCardProps {
  tenantId: string;
}

export function ConfigParcelaMinimaCard({ tenantId }: ConfigParcelaMinimaCardProps) {
  const { toast } = useToast();
  const [valor, setValor] = useState<string>("");
  const [valorOriginal, setValorOriginal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    setLoading(true);
    getConfigParcelaMinimaApi(tenantId)
      .then((r) => {
        if (cancelled) return;
        setValorOriginal(r.valorMinimoParcela);
        setValor(r.valorMinimoParcela == null ? "" : r.valorMinimoParcela.toFixed(2));
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erro ao carregar configuração";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const num = valor.trim() === "" ? null : Number(valor.replace(",", "."));
      const result = await putConfigParcelaMinimaApi(
        tenantId,
        num != null && Number.isFinite(num) && num > 0 ? num : null,
      );
      setValorOriginal(result.valorMinimoParcela);
      setValor(result.valorMinimoParcela == null ? "" : result.valorMinimoParcela.toFixed(2));
      toast({
        title: "Configuração salva",
        description:
          result.valorMinimoParcela == null
            ? "Sem regra de mínimo (cap padrão em 12x)."
            : `Mínimo por parcela: ${formatBRL(result.valorMinimoParcela)}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    (valorOriginal == null ? "" : valorOriginal.toFixed(2)) !== valor.trim();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-1 text-sm font-semibold">Parcelamento — Valor mínimo de parcela</div>
      <p className="mb-3 text-xs text-muted-foreground">
        Aplicado quando carrinho só tem produto/avulso (sem plano). Limite efetivo de parcelas em cartão = total ÷ valor mínimo (cap 12x). Vazio = sem regra.
      </p>
      <div className="flex items-end gap-3">
        <div className="space-y-1 flex-1 max-w-xs">
          <label
            htmlFor="config-parcela-minima"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Valor mínimo (R$)
          </label>
          <Input
            id="config-parcela-minima"
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00 (sem regra)"
            disabled={loading || saving}
            data-testid="config-parcela-minima-valor"
            className="font-mono"
          />
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={loading || saving || !dirty}
          data-testid="config-parcela-minima-salvar"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar
        </Button>
      </div>
    </div>
  );
}

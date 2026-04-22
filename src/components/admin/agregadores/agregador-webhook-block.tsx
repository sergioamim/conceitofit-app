"use client";

/**
 * AG-7.9 — Bloco "Webhook" do sheet de configuração.
 *
 * Mostra a URL do webhook (read-only + copiar) e o botão "Gerar novo
 * webhook secret". Extraído do sheet principal para respeitar o limite
 * de linhas por arquivo.
 */
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AgregadorWebhookBlockProps {
  webhookUrl: string;
  mode: "create" | "edit";
  rotatePending: boolean;
  onRotate: () => void;
}

export function AgregadorWebhookBlock({
  webhookUrl,
  mode,
  rotatePending,
  onRotate,
}: AgregadorWebhookBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // silenciar
    }
  }, [webhookUrl]);

  return (
    <fieldset className="space-y-3 rounded-lg border px-3 py-3">
      <legend className="px-1 text-xs font-semibold uppercase text-muted-foreground">
        Webhook
      </legend>
      <div className="space-y-1.5">
        <Label htmlFor="agregador-webhook-url">Webhook URL</Label>
        <div className="flex items-center gap-2">
          <Input
            id="agregador-webhook-url"
            readOnly
            value={webhookUrl}
            className="font-mono text-xs"
            data-testid="agregador-webhook-url"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopy}
            aria-label="Copiar Webhook URL"
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Use esta URL no painel do parceiro para enviar eventos.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRotate}
          disabled={rotatePending || mode === "create"}
          data-testid="agregador-action-rotate-webhook-secret"
        >
          {rotatePending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <KeyRound className="size-3.5" />
          )}
          Gerar novo webhook secret
        </Button>
      </div>
      {mode === "create" ? (
        <p className="text-xs text-muted-foreground">
          Rotação de secret fica disponível após a criação.
        </p>
      ) : null}
    </fieldset>
  );
}

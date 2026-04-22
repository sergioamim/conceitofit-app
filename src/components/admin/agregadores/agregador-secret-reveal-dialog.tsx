"use client";

import { useCallback, useState } from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AgregadorSecretRevealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Texto do secret a revelar. Quando null/undefined, o dialog mostra aviso genérico. */
  secret: string | null | undefined;
  /** Título exibido (ex: "Webhook secret gerado"). */
  title?: string;
  /** Texto descritivo curto explicando o que é este secret. */
  description?: string;
  /** URL do webhook a exibir também (opcional). */
  webhookUrl?: string | null;
  /** Warning extra do backend (ex: "Salve este valor — não será exibido novamente"). */
  warning?: string | null;
}

/**
 * AG-7.9 — Dialog one-time reveal para secrets.
 *
 * Usado tanto no create flow (sistema gera webhook_secret automaticamente) quanto
 * no rotate-webhook-secret. Força o admin a confirmar que copiou antes de fechar.
 *
 * Design:
 *  - Input readonly com botão Copiar (clipboard)
 *  - Warning visual destacado
 *  - Botão "Entendi, fechar" = confirmação explícita (não usar X nem overlay)
 */
export function AgregadorSecretRevealDialog({
  open,
  onOpenChange,
  secret,
  title = "Secret gerado",
  description = "Salve este valor agora. Ele não será exibido novamente.",
  webhookUrl,
  warning,
}: AgregadorSecretRevealDialogProps) {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!secret) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // silenciar — ainda conseguimos exibir o valor para copiar manualmente
    }
  }, [secret]);

  const handleCopyUrl = useCallback(async () => {
    if (!webhookUrl) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(webhookUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch {
      // silenciar
    }
  }, [webhookUrl]);

  return (
    <Dialog
      open={open}
      // Exige confirmação explícita via botão — não fecha por overlay/ESC.
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
    >
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        showCloseButton={false}
        data-testid="agregador-secret-reveal-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-500" aria-hidden />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {webhookUrl ? (
            <div className="space-y-1.5">
              <Label htmlFor="agregador-reveal-webhook-url">Webhook URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="agregador-reveal-webhook-url"
                  readOnly
                  value={webhookUrl}
                  className="font-mono text-xs"
                  data-testid="agregador-reveal-webhook-url"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  aria-label="Copiar Webhook URL"
                >
                  {copiedUrl ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          {secret ? (
            <div className="space-y-1.5">
              <Label htmlFor="agregador-reveal-secret">Secret</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="agregador-reveal-secret"
                  readOnly
                  value={secret}
                  className="font-mono text-xs"
                  data-testid="agregador-reveal-secret"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  aria-label="Copiar secret"
                  data-testid="agregador-reveal-copy"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          <p
            role="alert"
            aria-live="polite"
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200"
          >
            {warning ??
              "Este valor não será exibido novamente. Salve em local seguro antes de fechar."}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            data-testid="agregador-reveal-confirm"
          >
            Entendi, fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

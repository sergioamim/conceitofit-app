"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  enviarMensagemSchema,
  type EnviarMensagemFormValues,
} from "@/lib/forms/atendimento-schemas";
import type { EnviarMensagemRequest } from "@/lib/shared/types/whatsapp-crm";
import { idempotencyKeyStore } from "@/lib/utils/idempotency";

/* ---------------------------------------------------------------------------
 * Props
 * --------------------------------------------------------------------------- */

export interface MessageInputProps {
  conversationId: string;
  tenantId: string;
  onSend: (
    data: EnviarMensagemRequest,
    idempotencyKey: string,
  ) => Promise<void>;
  isSending: boolean;
  sendError?: string | null;
  onRetry?: () => void;
  className?: string;
}

/* ---------------------------------------------------------------------------
 * Componente principal
 * --------------------------------------------------------------------------- */

export function MessageInput({
  conversationId,
  tenantId: _tenantId,
  onSend,
  isSending,
  sendError,
  onRetry,
  className,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cooldownRef = useRef(false);
  const [cooldown, setCooldown] = useState(false);

  const form = useForm<EnviarMensagemFormValues>({
    resolver: zodResolver(enviarMensagemSchema),
    defaultValues: {
      content: "",
      contentType: "TEXTO",
      mediaUrl: undefined,
      templateName: undefined,
      templateVariables: undefined,
    },
  });

  const content = form.watch("content");
  const isEmpty = !content || content.trim().length === 0;

  /* -- Auto-resize da textarea -- */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 120);
    el.style.height = `${newHeight}px`;
  }, [content]);

  /* -- Cooldown de 2s após envio -- */
  const applyCooldown = useCallback(() => {
    cooldownRef.current = true;
    setCooldown(true);
    setTimeout(() => {
      cooldownRef.current = false;
      setCooldown(false);
    }, 2000);
  }, []);

  /* -- Submit -- */
  const handleSend = useCallback(
    async (values: EnviarMensagemFormValues) => {
      if (cooldownRef.current || isSending) return;

      const idempotencyKey = idempotencyKeyStore.acquireKey(conversationId);
      applyCooldown();

      const request: EnviarMensagemRequest = {
        content: values.content.trim(),
        contentType: values.contentType,
        mediaUrl: values.mediaUrl,
        templateName: values.templateName,
        templateVariables: values.templateVariables,
      };

      try {
        await onSend(request, idempotencyKey);
        idempotencyKeyStore.releaseKey(conversationId);
        form.reset();
      } catch {
        // Erro tratado pelo caller — bubble com status de falha
      }
    },
    [conversationId, isSending, applyCooldown, onSend, form],
  );

  /* -- Enter para enviar (Shift+Enter = nova linha) -- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.handleSubmit(handleSend)();
      }
    },
    [form, handleSend],
  );

  const canSend = !isEmpty && !isSending && !cooldown;

  return (
    <div className={cn("border-t border-border bg-card p-3", className)}>
      {/* Erro de envio */}
      {sendError && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-xs text-gym-danger">
          <span>{sendError}</span>
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px]"
              onClick={onRetry}
            >
              Reenviar
            </Button>
          )}
        </div>
      )}

      <form
        onSubmit={form.handleSubmit(handleSend)}
        className="flex items-end gap-2"
      >
        {/* Anexo (placeholder para upload futuro) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          title="Anexar arquivo"
          disabled
        >
          <Paperclip className="size-4" />
        </Button>

        {/* Textarea */}
        <div className="min-w-0 flex-1">
          <Controller
            control={form.control}
            name="content"
            render={({ field, fieldState }) => (
              <Textarea
                ref={(node) => {
                  textareaRef.current = node;
                  // Also wire up react-hook-form's ref
                  if (typeof field.ref === "function") {
                    field.ref(node);
                  }
                }}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                placeholder="Digite sua mensagem…"
                className={cn(
                  "min-h-[40px] max-h-[120px] resize-none overflow-y-auto border-border bg-secondary pr-3 text-sm leading-relaxed",
                  fieldState.error &&
                    "border-gym-danger focus-visible:ring-gym-danger",
                )}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Mensagem"
              />
            )}
          />
          {form.formState.errors.content && (
            <p className="mt-1 text-[11px] text-gym-danger">
              {form.formState.errors.content.message}
            </p>
          )}
        </div>

        {/* Botão Enviar */}
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={!canSend}
          aria-label="Enviar mensagem"
        >
          {isSending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

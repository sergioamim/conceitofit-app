"use client";

import Link from "next/link";
import { Check, ExternalLink, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CONTATO_ORIGEM_LABELS,
  type ConversaResponse,
} from "@/lib/shared/types/whatsapp-crm";

/* ---------------------------------------------------------------------------
 * ContatoContext — dados extras do contato (simulados por enquanto)
 * --------------------------------------------------------------------------- */

export interface ContatoContext {
  id: string;
  tenantId: string;
  phoneNumber: string;
  phoneNumberNormalized: string;
  nome: string;
  origem: "WHATSAPP_INBOUND" | "CADASTRO_MANUAL" | "IMPORTACAO" | "FORMULARIO_WEB";
  consentimentoWhatsApp: boolean;
  consentimentoAt: boolean;
  consentimentoConteudo: boolean;
  alunoId: string | null;
  prospectId: string | null;
  obsFinais: string | null;
}

/* ---------------------------------------------------------------------------
 * ContactCard
 * --------------------------------------------------------------------------- */

export interface ContactCardProps {
  conversation: ConversaResponse | null;
  contato?: ContatoContext | null;
  /** Se informado, mostra botão "Avançar Stage". */
  onAvancarStage?: () => void;
  className?: string;
}

export function ContactCard({
  conversation,
  contato,
  onAvancarStage,
  className,
}: ContactCardProps) {
  if (!conversation) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center rounded-xl border border-border bg-card p-6 text-center",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">
          Selecione uma conversa para ver os detalhes do contato.
        </p>
      </div>
    );
  }

  const nome = contato?.nome ?? conversation.contatoNome;
  const telefone = contato?.phoneNumber ?? conversation.contatoTelefone;
  const origem = contato?.origem;

  return (
    <div className={cn("space-y-4 rounded-xl border border-border bg-card p-4", className)}>
      {/* Header */}
      <div>
        <h3 className="font-medium text-foreground">{nome}</h3>
        <p className="text-sm text-muted-foreground">{telefone}</p>
        {origem && (
          <Badge variant="outline" className="mt-2 text-[10px]">
            {CONTATO_ORIGEM_LABELS[origem] ?? origem}
          </Badge>
        )}
      </div>

      {/* Vínculos */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Vínculos
        </p>
        <div className="flex flex-wrap gap-2">
          {conversation.alunoId ? (
            <Link
              href={`/alunos/${conversation.alunoId}`}
              className="inline-flex items-center gap-1 rounded-md border border-gym-teal/30 bg-gym-teal/10 px-2.5 py-1 text-xs font-medium text-gym-teal transition-colors hover:bg-gym-teal/15"
            >
              Aluno
              <ExternalLink className="size-3" />
            </Link>
          ) : null}

          {conversation.prospectId ? (
            <div className="flex items-center gap-1.5">
              <Link
                href={`/prospects/${conversation.prospectId}`}
                className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-500/15"
              >
                Prospect
                <ExternalLink className="size-3" />
              </Link>
              {onAvancarStage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-1.5 text-[10px] text-blue-400"
                  onClick={onAvancarStage}
                  title="Avançar stage do prospect"
                >
                  <UserPlus className="size-3" />
                </Button>
              )}
            </div>
          ) : null}

          {!conversation.alunoId && !conversation.prospectId && (
            <span className="text-xs text-muted-foreground">Sem vínculo</span>
          )}
        </div>
      </div>

      {/* Consentimentos */}
      {contato && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Consentimentos
          </p>
          <ul className="space-y-1 text-xs">
            <ConsentItem
              label="WhatsApp"
              granted={contato.consentimentoWhatsApp}
            />
            <ConsentItem
              label="Atendimento"
              granted={contato.consentimentoAt}
            />
            <ConsentItem
              label="Conteúdo"
              granted={contato.consentimentoConteudo}
            />
          </ul>
        </div>
      )}

      {/* Observações */}
      {contato?.obsFinais && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Observações
          </p>
          <p className="text-xs text-muted-foreground">
            {contato.obsFinais}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * ConsentItem
 * --------------------------------------------------------------------------- */

function ConsentItem({
  label,
  granted,
}: {
  label: string;
  granted: boolean;
}) {
  return (
    <li className="flex items-center gap-1.5">
      {granted ? (
        <Check className="size-3.5 text-gym-teal" />
      ) : (
        <span className="size-3.5 rounded-full border border-border" />
      )}
      <span className={granted ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </li>
  );
}

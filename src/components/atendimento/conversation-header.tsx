"use client";

import { useCallback, useState } from "react";
import {
  Building,
  CheckCircle,
  ListFilter,
  MoreVertical,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { ConversationStatus, ConversaResponse } from "@/lib/shared/types/whatsapp-crm";
import { ConversaStatusBadge } from "./status-badge";

/* ---------------------------------------------------------------------------
 * Labels e ordem dos status
 * --------------------------------------------------------------------------- */

const STATUS_OPTIONS: { value: ConversationStatus; label: string }[] = [
  { value: "ABERTA", label: "Aberta" },
  { value: "EM_ATENDIMENTO", label: "Em atendimento" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "ENCERRADA", label: "Encerrada" },
  { value: "SPAM", label: "Spam" },
  { value: "BLOQUEADA", label: "Bloqueada" },
];

/* ---------------------------------------------------------------------------
 * Props
 * --------------------------------------------------------------------------- */

export interface ConversationHeaderProps {
  conversation: ConversaResponse;
  onStatusChange: (status: ConversationStatus) => void;
  onOwnerChange: (ownerUserId: string | null) => void;
  onQueueChange: (queue: string | null) => void;
  onUnidadeChange: (unidadeId: string | null) => void;
  onCloseConversation?: () => void;
  /** Usuários disponíveis para atribuição. */
  users?: { id: string; nome: string }[];
  /** Filas disponíveis. */
  queues?: string[];
  /** Unidades disponíveis. */
  unidades?: { id: string; nome: string }[];
  className?: string;
}

/* ---------------------------------------------------------------------------
 * Componente principal
 * --------------------------------------------------------------------------- */

export function ConversationHeader({
  conversation,
  onStatusChange,
  onOwnerChange,
  onQueueChange,
  onUnidadeChange,
  onCloseConversation,
  users = [],
  queues = [],
  unidades = [],
  className,
}: ConversationHeaderProps) {
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const handleCloseClick = useCallback(() => {
    setConfirmCloseOpen(false);
    onStatusChange("ENCERRADA");
  }, [onStatusChange]);

  const statusValue = conversation.status;
  const ownerValue = conversation.ownerUserId ?? "__clear__";
  const queueValue = conversation.queue ?? "__clear__";
  const unidadeValue = conversation.unidadeId ?? "__clear__";

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-3 border-b border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        {/* Esquerda: nome + telefone */}
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {conversation.contatoNome}
          </h2>
          <p className="text-xs text-muted-foreground">
            {conversation.contatoTelefone}
          </p>
        </div>

        {/* Centro + Direita: status + ações */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <Select
            value={statusValue}
            onValueChange={(v) =>
              onStatusChange(v as ConversationStatus)
            }
          >
            <SelectTrigger className="h-8 w-auto min-w-[130px] border-border bg-secondary text-xs">
              <ConversaStatusBadge status={conversation.status} />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ações rápidas — desktop */}
          <div className="hidden items-center gap-1.5 md:flex">
            {users.length > 0 && (
              <QuickSelect
                icon={<UserPlus className="size-3.5" />}
                label="Responsável"
                value={ownerValue}
                onChange={(v) =>
                  onOwnerChange(v === "__clear__" ? null : v)
                }
                options={[
                  { value: "__clear__", label: "Sem responsável" },
                  ...users.map((u) => ({ value: u.id, label: u.nome })),
                ]}
              />
            )}
            {queues.length > 0 && (
              <QuickSelect
                icon={<ListFilter className="size-3.5" />}
                label="Fila"
                value={queueValue}
                onChange={(v) =>
                  onQueueChange(v === "__clear__" ? null : v)
                }
                options={[
                  { value: "__clear__", label: "Sem fila" },
                  ...queues.map((q) => ({ value: q, label: q })),
                ]}
              />
            )}
            {unidades.length > 0 && (
              <QuickSelect
                icon={<Building className="size-3.5" />}
                label="Unidade"
                value={unidadeValue}
                onChange={(v) =>
                  onUnidadeChange(v === "__clear__" ? null : v)
                }
                options={[
                  { value: "__clear__", label: "Sem unidade" },
                  ...unidades.map((u) => ({ value: u.id, label: u.nome })),
                ]}
              />
            )}

            {/* Encerrar */}
            {conversation.status !== "ENCERRADA" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-gym-teal"
                onClick={() => setConfirmCloseOpen(true)}
              >
                <CheckCircle className="size-3.5" />
                Encerrar
              </Button>
            )}
          </div>

          {/* Mobile: menu ⋮ */}
          <div className="flex items-center gap-1.5 md:hidden">
            {users.length > 0 && (
              <QuickSelect
                icon={<UserPlus className="size-3.5" />}
                label="Responsável"
                value={ownerValue}
                onChange={(v) =>
                  onOwnerChange(v === "__clear__" ? null : v)
                }
                options={[
                  { value: "__clear__", label: "Sem responsável" },
                  ...users.map((u) => ({ value: u.id, label: u.nome })),
                ]}
              />
            )}
            {queues.length > 0 && (
              <QuickSelect
                icon={<ListFilter className="size-3.5" />}
                label="Fila"
                value={queueValue}
                onChange={(v) =>
                  onQueueChange(v === "__clear__" ? null : v)
                }
                options={[
                  { value: "__clear__", label: "Sem fila" },
                  ...queues.map((q) => ({ value: q, label: q })),
                ]}
              />
            )}
            {unidades.length > 0 && (
              <QuickSelect
                icon={<Building className="size-3.5" />}
                label="Unidade"
                value={unidadeValue}
                onChange={(v) =>
                  onUnidadeChange(v === "__clear__" ? null : v)
                }
                options={[
                  { value: "__clear__", label: "Sem unidade" },
                  ...unidades.map((u) => ({ value: u.id, label: u.nome })),
                ]}
              />
            )}

            {conversation.status !== "ENCERRADA" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setConfirmCloseOpen(true)}
              >
                <MoreVertical className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo de confirmação para encerrar */}
      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação altera o status da conversa para{" "}
              <strong>Encerrada</strong>. É possível reabri-la depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseClick}>
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ---------------------------------------------------------------------------
 * QuickSelect — botão com ícone + Select dropdown
 * --------------------------------------------------------------------------- */

function QuickSelect({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="h-7 w-7 border-0 bg-transparent p-0 text-muted-foreground hover:text-foreground"
        aria-label={label}
      >
        <SelectValue asChild>
          <span className="flex items-center justify-center">{icon}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[180px]">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

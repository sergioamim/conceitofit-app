"use client";

import { ClienteThumbnail } from "@/components/shared/cliente-thumbnail";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/formatters";
import type { Aluno } from "@/lib/types";

interface ClienteResumoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clienteResumo: Aluno | null;
  clienteResumoPlano: { nome: string; dataFim?: string | null } | null;
  clienteResumoBaseHref: string;
  liberandoSuspensao: boolean;
  onLiberarSuspensao: () => void;
  onVerPerfil: () => void;
  onClose: () => void;
}

export function ClienteResumoDialog({
  isOpen,
  onOpenChange,
  clienteResumo,
  clienteResumoPlano,
  clienteResumoBaseHref,
  liberandoSuspensao,
  onLiberarSuspensao,
  onVerPerfil,
  onClose,
}: ClienteResumoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Resumo do Cliente</DialogTitle>
          <DialogDescription>
            Visão rápida para validar situação e plano antes de abrir o perfil completo.
          </DialogDescription>
        </DialogHeader>
        {clienteResumo ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ClienteThumbnail nome={clienteResumo.nome} foto={clienteResumo.foto} size="md" />
              <div>
                <p className="text-base font-semibold text-foreground">{clienteResumo.nome}</p>
                <p className="text-xs text-muted-foreground">{clienteResumo.email}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Situação</p>
                <div className="mt-2">
                  <StatusBadge status={clienteResumo.status} />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plano</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {clienteResumoPlano?.nome ?? "Sem plano ativo"}
                </p>
                {clienteResumoPlano?.dataFim ? (
                  <p className="mt-1 text-xs text-muted-foreground">Válido até {formatDate(clienteResumoPlano.dataFim)}</p>
                ) : null}
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF</p>
                <p className="mt-2 text-sm text-foreground">{clienteResumo.cpf}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</p>
                <p className="mt-2 text-sm text-foreground">{clienteResumo.telefone}</p>
              </div>
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" className="border-border" onClick={onClose}>
            Fechar
          </Button>
          {clienteResumo?.status === "SUSPENSO" ? (
            <Button
              type="button"
              variant="outline"
              className="border-border text-gym-accent"
              onClick={onLiberarSuspensao}
              disabled={liberandoSuspensao}
            >
              {liberandoSuspensao ? "Liberando..." : "Liberar suspensão"}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onVerPerfil}
          >
            Ver perfil completo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

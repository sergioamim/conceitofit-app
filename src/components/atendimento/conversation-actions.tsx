"use client";

import { useCallback, useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * QueueSelector — dropdown para trocar a fila de uma conversa
 * --------------------------------------------------------------------------- */

export interface QueueSelectorProps {
  currentQueue: string | null | undefined;
  onQueueChange: (queue: string | null) => void;
  /** Lista de filas disponíveis. Se omitida, permite input livre. */
  queues?: string[];
  className?: string;
}

export function QueueSelector({
  currentQueue,
  onQueueChange,
  queues,
  className,
}: QueueSelectorProps) {
  const labelId = useId();

  const handleChange = useCallback(
    (value: string) => {
      onQueueChange(value === "__clear__" ? null : value);
    },
    [onQueueChange],
  );

  // Filas predefinidas + opção "nenhuma"
  const options = queues ?? [];

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label
        id={labelId}
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Fila
      </Label>
      <Select
        value={currentQueue ?? "__clear__"}
        onValueChange={handleChange}
        aria-labelledby={labelId}
      >
        <SelectTrigger className="h-8 min-w-[140px] border-border bg-secondary text-xs">
          <SelectValue placeholder="Sem fila" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__clear__">Sem fila</SelectItem>
          {options.map((q) => (
            <SelectItem key={q} value={q}>
              {q}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * OwnerAssign — busca/select de responsável
 * --------------------------------------------------------------------------- */

export interface OwnerAssignProps {
  currentOwnerUserId: string | null | undefined;
  onOwnerChange: (ownerUserId: string | null) => void;
  /** Usuários disponíveis para atribuição. */
  users: { id: string; nome: string }[];
  className?: string;
}

export function OwnerAssign({
  currentOwnerUserId,
  onOwnerChange,
  users,
  className,
}: OwnerAssignProps) {
  const labelId = useId();

  const handleChange = useCallback(
    (value: string) => {
      onOwnerChange(value === "__clear__" ? null : value);
    },
    [onOwnerChange],
  );

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label
        id={labelId}
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Responsável
      </Label>
      <Select
        value={currentOwnerUserId ?? "__clear__"}
        onValueChange={handleChange}
        aria-labelledby={labelId}
      >
        <SelectTrigger className="h-8 min-w-[160px] border-border bg-secondary text-xs">
          <SelectValue placeholder="Sem responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__clear__">Sem responsável</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * UnitSelector — dropdown para mudar unidade da conversa
 * --------------------------------------------------------------------------- */

export interface UnitSelectorProps {
  currentUnidadeId: string | null | undefined;
  onUnidadeChange: (unidadeId: string | null) => void;
  /** Lista de unidades do tenant. */
  unidades: { id: string; nome: string }[];
  className?: string;
}

export function UnitSelector({
  currentUnidadeId,
  onUnidadeChange,
  unidades,
  className,
}: UnitSelectorProps) {
  const labelId = useId();

  const handleChange = useCallback(
    (value: string) => {
      onUnidadeChange(value === "__clear__" ? null : value);
    },
    [onUnidadeChange],
  );

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label
        id={labelId}
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Unidade
      </Label>
      <Select
        value={currentUnidadeId ?? "__clear__"}
        onValueChange={handleChange}
        aria-labelledby={labelId}
      >
        <SelectTrigger className="h-8 min-w-[160px] border-border bg-secondary text-xs">
          <SelectValue placeholder="Sem unidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__clear__">Sem unidade</SelectItem>
          {unidades.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * TaskCreateDialog — dialog para criar tarefa vinculada à conversa
 * --------------------------------------------------------------------------- */

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { criarTarefaSchema, type CriarTarefaFormValues } from "@/lib/forms/atendimento-schemas";
import type { CriarTarefaConversaRequest } from "@/lib/shared/types/whatsapp-crm";

export interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  /** Callback ao submeter. O caller deve chamar a mutation. */
  onSubmit: (data: CriarTarefaConversaRequest) => void;
  /** Se true, desabilita o botão e mostra spinner. */
  isSubmitting?: boolean;
}

export function TaskCreateDialog({
  open,
  onOpenChange,
  tenantId,
  onSubmit,
  isSubmitting,
}: TaskCreateDialogProps) {
  const form = useForm<CriarTarefaFormValues>({
    resolver: zodResolver(criarTarefaSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      prioridade: "MEDIA",
      responsavel: undefined,
      prazoEm: undefined,
    },
  });

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next) form.reset();
    },
    [form, onOpenChange],
  );

  const handleValidSubmit = useCallback(
    (values: CriarTarefaFormValues) => {
      const request: CriarTarefaConversaRequest = {
        tenantId,
        titulo: values.titulo,
        descricao: values.descricao,
        responsavel: values.responsavel,
        prioridade: values.prioridade,
        prazoEm: values.prazoEm,
      };
      onSubmit(request);
      if (!isSubmitting) handleOpenChange(false);
    },
    [tenantId, onSubmit, isSubmitting, handleOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Tarefa</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleValidSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="task-titulo">Título *</Label>
            <Input
              id="task-titulo"
              {...form.register("titulo")}
              placeholder="Ex: Ligar para confirmar horário"
            />
            {form.formState.errors.titulo && (
              <p className="text-xs text-gym-danger">
                {form.formState.errors.titulo.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-descricao">Descrição</Label>
            <Textarea
              id="task-descricao"
              {...form.register("descricao")}
              rows={3}
              placeholder="Detalhes da tarefa..."
            />
            {form.formState.errors.descricao && (
              <p className="text-xs text-gym-danger">
                {form.formState.errors.descricao.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Controller
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 border-border bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAIXA">Baixa</SelectItem>
                      <SelectItem value="MEDIA">Média</SelectItem>
                      <SelectItem value="ALTA">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-prazo">Prazo</Label>
              <Input
                id="task-prazo"
                type="datetime-local"
                {...form.register("prazoEm")}
                className="h-9 border-border bg-secondary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuggestionInput } from "@/components/shared/suggestion-input";

type AtividadeOption = { id: string; nome: string };
type FuncionarioOption = { id: string; nome: string };
type ClienteOption = { id: string; nome: string; cpf?: string; email?: string };

export type TreinoForm = {
  alunoId: string;
  alunoNome: string;
  atividadeId?: string;
  atividadeNome?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  vencimento: string;
  observacoes?: string;
  ativo: boolean;
};

function toDateValue(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function TreinoModal({
  open,
  onClose,
  onSave,
  clientes,
  atividades,
  funcionarios,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: TreinoForm) => Promise<void>;
  clientes: ClienteOption[];
  atividades: AtividadeOption[];
  funcionarios: FuncionarioOption[];
}) {
  const [form, setForm] = useState<TreinoForm>({
    alunoId: "",
    alunoNome: "",
    vencimento: toDateValue(+7),
    ativo: true,
  });
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteErr, setClienteErr] = useState("");
  const [vencErr, setVencErr] = useState("");

  const clienteOptions = useMemo(
    () =>
      clientes.map((cliente) => ({
        id: cliente.id,
        label: cliente.nome,
        searchText: `${cliente.cpf ?? ""} ${cliente.email ?? ""}`.trim(),
      })),
    [clientes],
  );

  const atividadeOptions = useMemo(
    () => atividades.map((atividade) => ({ id: atividade.id, label: atividade.nome })),
    [atividades],
  );

  const funcionarioOptions = useMemo(
    () => funcionarios.map((funcionario) => ({ id: funcionario.id, label: funcionario.nome })),
    [funcionarios],
  );

  async function handleSave() {
    if (!form.alunoId) {
      setClienteErr("Selecione um aluno.");
      return;
    }

    if (!form.vencimento) {
      setVencErr("Informe a data de vencimento.");
      return;
    }

    await onSave({
      ...form,
      observacoes: form.observacoes?.trim() || undefined,
      atividadeId: form.atividadeId || undefined,
      atividadeNome: atividades.find((a) => a.id === form.atividadeId)?.nome || form.atividadeNome,
      funcionarioId: form.funcionarioId || undefined,
      funcionarioNome:
        funcionarios.find((f) => f.id === form.funcionarioId)?.nome || form.funcionarioNome,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Novo treino</DialogTitle>
          <DialogDescription>
            Associe o treino a um aluno e defina validade para vencer.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Aluno *
            </label>
            <SuggestionInput
              value={clienteQuery}
              onValueChange={(value) => {
                setClienteQuery(value);
                if (!value) {
                  setForm((current) => ({ ...current, alunoId: "", alunoNome: "" }));
                }
              }}
              onSelect={(option) => {
                const selected = clientes.find((cliente) => cliente.id === option.id);
                if (!selected) return;
                setClienteQuery(selected.nome);
                setForm((current) => ({
                  ...current,
                  alunoId: selected.id,
                  alunoNome: selected.nome,
                }));
              }}
              onFocusOpen={() => {
                setClienteQuery(clienteQuery);
              }}
              options={clienteOptions}
              placeholder="Digite o nome, CPF ou e-mail"
              minCharsToSearch={0}
            />
            {clienteErr && <p className="text-xs text-gym-danger">{clienteErr}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Atividade
              </label>
              <Select
                value={form.atividadeId || "__sem_atividade"}
                onValueChange={(value) => {
                  const nextValue = value === "__sem_atividade" ? "" : value;
                  setForm((current) => ({
                    ...current,
                    atividadeId: nextValue || undefined,
                    atividadeNome: atividadeOptions.find((a) => a.id === nextValue)?.label,
                  }));
                }}
              >
                <SelectTrigger className="bg-secondary border-border text-sm">
                  <SelectValue placeholder="Selecione uma atividade" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__sem_atividade">Sem atividade</SelectItem>
                  {atividadeOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Professor
              </label>
              <Select
                value={form.funcionarioId || "__sem_professor"}
                onValueChange={(value) => {
                  const nextValue = value === "__sem_professor" ? "" : value;
                  setForm((current) => ({
                    ...current,
                    funcionarioId: nextValue || undefined,
                    funcionarioNome: funcionarioOptions.find((f) => f.id === nextValue)?.label,
                  }));
                }}
              >
                <SelectTrigger className="bg-secondary border-border text-sm">
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="__sem_professor">Sem professor</SelectItem>
                  {funcionarioOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Vencimento *
              </label>
              <Input
                type="date"
                value={form.vencimento}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    vencimento: event.target.value,
                  }))
                }
                className="bg-secondary border-border"
              />
              {vencErr && <p className="text-xs text-gym-danger">{vencErr}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </label>
            <textarea
              value={form.observacoes || ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, observacoes: event.target.value }))
              }
              className="min-h-20 rounded-md border border-border bg-secondary p-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(event) =>
                setForm((current) => ({ ...current, ativo: event.target.checked }))
              }
            />
            Treino ativo
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar treino</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

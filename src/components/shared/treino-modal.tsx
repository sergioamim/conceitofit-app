"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { cn } from "@/lib/utils";

type ClienteOption = { id: string; nome: string; cpf?: string; email?: string };
type ExercicioOption = { id: string; nome: string; grupoMuscular?: string };

export type TreinoItemForm = {
  exercicioId: string;
  ordem: number;
  series: number;
  repeticoesMin?: number;
  repeticoesMax?: number;
  intervaloSegundos?: number;
  tempoExecucaoSegundos?: number;
  cargaSugerida?: number;
  observacao?: string;
  diasSemana?: string[];
};

export type TreinoForm = {
  alunoId: string;
  alunoNome: string;
  nome: string;
  divisao?: string;
  metaSessoesSemana?: number;
  dataInicio: string;
  dataFim: string;
  observacoes?: string;
  ativo: boolean;
  itens: TreinoItemForm[];
};

const DIVISOES = ["A", "B", "C", "D"];

function today(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function TreinoModal({
  open,
  onClose,
  onSave,
  clientes,
  exercicios,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: TreinoForm) => Promise<void>;
  clientes: ClienteOption[];
  exercicios: ExercicioOption[];
}) {
  const [form, setForm] = useState<TreinoForm>({
    alunoId: "",
    alunoNome: "",
    nome: "Treino A",
    divisao: "A",
    metaSessoesSemana: 3,
    dataInicio: today(0),
    dataFim: today(30),
    ativo: true,
    itens: [
      {
        exercicioId: "",
        ordem: 1,
        series: 3,
        repeticoesMin: 8,
        repeticoesMax: 10,
        intervaloSegundos: 45,
      },
    ],
  });
  const [clienteQuery, setClienteQuery] = useState("");
  const [errors, setErrors] = useState<{ aluno?: string; dataFim?: string; itens?: string }>({});

  const clienteOptions = useMemo(
    () =>
      clientes.map((cliente) => ({
        id: cliente.id,
        label: cliente.nome,
        searchText: `${cliente.cpf ?? ""} ${cliente.email ?? ""}`.trim(),
      })),
    [clientes],
  );

  const exercicioOptions = useMemo(
    () =>
      exercicios.map((ex) => ({
        id: ex.id,
        label: ex.nome,
        searchText: `${ex.nome} ${ex.grupoMuscular ?? ""}`.trim(),
      })),
    [exercicios],
  );

  function updateItem(index: number, patch: Partial<TreinoItemForm>) {
    setForm((current) => {
      const itens = [...current.itens];
      itens[index] = { ...itens[index], ...patch };
      return { ...current, itens };
    });
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      itens: [
        ...current.itens,
        {
          exercicioId: "",
          ordem: current.itens.length + 1,
          series: 3,
          repeticoesMin: 8,
          repeticoesMax: 10,
          intervaloSegundos: 45,
        },
      ],
    }));
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      itens: current.itens.filter((_, i) => i !== index).map((item, i) => ({ ...item, ordem: i + 1 })),
    }));
  }

  async function handleSave() {
    const nextErrors: typeof errors = {};
    if (!form.alunoId) nextErrors.aluno = "Selecione um aluno.";
    if (!form.dataFim) nextErrors.dataFim = "Informe a data de término.";
    if (form.itens.length === 0 || form.itens.some((i) => !i.exercicioId)) {
      nextErrors.itens = "Inclua pelo menos um exercício.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSave({
      ...form,
      observacoes: form.observacoes?.trim() || undefined,
      nome: form.nome?.trim() || `Treino ${form.divisao ?? ""}`.trim(),
      itens: form.itens.map((item, index) => ({
        ...item,
        ordem: item.ordem ?? index + 1,
      })),
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Novo treino</DialogTitle>
          <DialogDescription>Cadastre um treino completo para o aluno.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Aluno *</label>
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
              onFocusOpen={() => setClienteQuery(clienteQuery)}
              options={clienteOptions}
              placeholder="Digite o nome, CPF ou e-mail"
              minCharsToSearch={0}
            />
            {errors.aluno && <p className="text-xs text-gym-danger">{errors.aluno}</p>}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome do treino</label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((c) => ({ ...c, nome: e.target.value }))}
                className="bg-secondary border-border"
                placeholder="Ex.: Treino A"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Divisão</label>
              <div className="flex gap-2">
                {DIVISOES.map((div) => (
                  <button
                    key={div}
                    type="button"
                    onClick={() => setForm((c) => ({ ...c, divisao: div, nome: c.nome || `Treino ${div}` }))}
                    className={cn(
                      "flex-1 rounded-md border px-2 py-2 text-sm font-semibold transition-colors",
                      form.divisao === div
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {div}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Meta sessões/semana</label>
              <Input
                type="number"
                min={1}
                value={form.metaSessoesSemana ?? ""}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    metaSessoesSemana: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Início</label>
              <Input
                type="date"
                value={form.dataInicio}
                onChange={(e) => setForm((c) => ({ ...c, dataInicio: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fim *</label>
              <Input
                type="date"
                value={form.dataFim}
                onChange={(e) => setForm((c) => ({ ...c, dataFim: e.target.value }))}
                className="bg-secondary border-border"
              />
              {errors.dataFim && <p className="text-xs text-gym-danger">{errors.dataFim}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
            <Textarea
              value={form.observacoes || ""}
              onChange={(e) => setForm((c) => ({ ...c, observacoes: e.target.value }))}
              className="min-h-20 bg-secondary border-border"
              placeholder="Instruções gerais, foco do ciclo, etc."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Itens do treino</p>
                <p className="text-xs text-muted-foreground">Séries, repetições, descanso e ordem.</p>
              </div>
              <Button variant="outline" size="sm" onClick={addItem}>
                Adicionar exercício
              </Button>
            </div>
            {errors.itens && <p className="text-xs text-gym-danger">{errors.itens}</p>}
            <div className="space-y-2">
              {form.itens.map((item, index) => (
                <div key={index} className="rounded-md border border-border/70 bg-secondary/60 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-12">
                      <Input
                        type="number"
                        min={1}
                        value={item.ordem}
                        onChange={(e) => updateItem(index, { ordem: Number(e.target.value) || index + 1 })}
                        className="bg-card border-border text-center"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Exercício *</label>
                      <SuggestionInput
                        value={
                          exercicioOptions.find((opt) => opt.id === item.exercicioId)?.label ?? ""
                        }
                        onValueChange={() => {}}
                        onSelect={(option) => updateItem(index, { exercicioId: option.id })}
                        options={exercicioOptions}
                        placeholder="Buscar exercício"
                        minCharsToSearch={0}
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                      Remover
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <FieldNumber
                      label="Séries"
                      value={item.series}
                      onChange={(v) => updateItem(index, { series: v })}
                    />
                    <FieldNumber
                      label="Rep. mín"
                      value={item.repeticoesMin}
                      onChange={(v) => updateItem(index, { repeticoesMin: v })}
                    />
                    <FieldNumber
                      label="Rep. máx"
                      value={item.repeticoesMax}
                      onChange={(v) => updateItem(index, { repeticoesMax: v })}
                    />
                    <FieldNumber
                      label="Descanso (s)"
                      value={item.intervaloSegundos}
                      onChange={(v) => updateItem(index, { intervaloSegundos: v })}
                    />
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <FieldNumber
                      label="Tempo exec. (s)"
                      value={item.tempoExecucaoSegundos}
                      onChange={(v) => updateItem(index, { tempoExecucaoSegundos: v })}
                    />
                    <FieldNumber
                      label="Carga sugerida"
                      value={item.cargaSugerida}
                      onChange={(v) => updateItem(index, { cargaSugerida: v })}
                    />
                    <Input
                      placeholder="Dias da semana (ex.: SEG, QUA)"
                      value={(item.diasSemana ?? []).join(", ")}
                      onChange={(e) =>
                        updateItem(index, {
                          diasSemana: e.target.value
                            .split(",")
                            .map((s) => s.trim().toUpperCase())
                            .filter(Boolean),
                        })
                      }
                      className="bg-card border-border text-sm"
                    />
                  </div>
                  <Textarea
                    placeholder="Observação do exercício"
                    value={item.observacao ?? ""}
                    onChange={(e) => updateItem(index, { observacao: e.target.value })}
                    className="bg-card border-border text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))}
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

function FieldNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="bg-card border-border"
      />
    </div>
  );
}

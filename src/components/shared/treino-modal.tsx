"use client";

import { useMemo, useState } from "react";
import { addDaysToIsoDate, getBusinessTodayIso } from "@/lib/business-date";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { cn } from "@/lib/utils";

type ClienteOption = { id: string; nome: string; cpf?: string; email?: string };
type ExercicioOption = { id: string; nome: string; grupoMuscular?: string };

export type TreinoItemForm = {
  id?: string;
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
  alunoId?: string;
  alunoNome?: string;
  nome: string;
  templateNome?: string;
  objetivo?: string;
  divisao?: string;
  metaSessoesSemana?: number;
  frequenciaPlanejada?: number;
  quantidadePrevista?: number;
  dataInicio: string;
  dataFim: string;
  observacoes?: string;
  ativo: boolean;
  tipoTreino: "CUSTOMIZADO" | "PRE_MONTADO";
  itens: TreinoItemForm[];
};

const DIVISOES = ["A", "B", "C", "D"];

function today(offsetDays = 0): string {
  return addDaysToIsoDate(getBusinessTodayIso(), offsetDays);
}

function buildInitialForm(mode: TreinoForm["tipoTreino"], initialData?: Partial<TreinoForm> | null): TreinoForm {
  const base: TreinoForm = {
    alunoId: "",
    alunoNome: "",
    nome: mode === "PRE_MONTADO" ? "Template Base" : "Treino A",
    templateNome: mode === "PRE_MONTADO" ? "Template Base" : undefined,
    objetivo: "",
    divisao: "A",
    metaSessoesSemana: 3,
    frequenciaPlanejada: 3,
    quantidadePrevista: 12,
    dataInicio: today(0),
    dataFim: today(30),
    ativo: true,
    tipoTreino: mode,
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
  };

  if (!initialData) {
    return base;
  }

  return {
    ...base,
    ...initialData,
    tipoTreino: mode,
    itens:
      initialData.itens?.length
        ? initialData.itens.map((item, index) => ({
            ...item,
            ordem: item.ordem ?? index + 1,
          }))
        : base.itens,
  };
}

export function TreinoModal({
  open,
  onClose,
  onSave,
  clientes,
  exercicios,
  mode = "CUSTOMIZADO",
  initialData = null,
  title,
  description,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: TreinoForm) => Promise<void>;
  clientes: ClienteOption[];
  exercicios: ExercicioOption[];
  mode?: TreinoForm["tipoTreino"];
  initialData?: Partial<TreinoForm> | null;
  title?: string;
  description?: string;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<TreinoForm>(() => buildInitialForm(mode, initialData));
  const [clienteQuery, setClienteQuery] = useState(initialData?.alunoNome ?? "");
  const [errors, setErrors] = useState<{ aluno?: string; dataFim?: string; itens?: string }>({});

  const clienteOptions = useMemo(
    () =>
      clientes.map((cliente) => ({
        id: cliente.id,
        label: cliente.nome,
        searchText: `${cliente.cpf ?? ""} ${cliente.email ?? ""}`.trim(),
      })),
    [clientes]
  );

  const exercicioOptions = useMemo(
    () =>
      exercicios.map((ex) => ({
        id: ex.id,
        label: ex.nome,
        searchText: `${ex.nome} ${ex.grupoMuscular ?? ""}`.trim(),
      })),
    [exercicios]
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
    if (form.tipoTreino === "CUSTOMIZADO" && !form.alunoId) nextErrors.aluno = "Selecione um aluno.";
    if (!form.dataFim) nextErrors.dataFim = "Informe a data de término.";
    if (form.itens.length === 0 || form.itens.some((item) => !item.exercicioId)) {
      nextErrors.itens = "Inclua pelo menos um exercício.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSave({
      ...form,
      objetivo: form.objetivo?.trim() || undefined,
      observacoes: form.observacoes?.trim() || undefined,
      nome: form.nome?.trim() || `Treino ${form.divisao ?? ""}`.trim(),
      templateNome: form.tipoTreino === "PRE_MONTADO" ? form.templateNome?.trim() || form.nome.trim() : undefined,
      itens: form.itens.map((item, index) => ({
        ...item,
        ordem: item.ordem ?? index + 1,
      })),
    });
    setForm(buildInitialForm(mode, initialData));
    setClienteQuery("");
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {title ?? (mode === "PRE_MONTADO" ? "Novo template de treino" : "Novo treino")}
          </DialogTitle>
          <DialogDescription>
            {description
              ?? (mode === "PRE_MONTADO"
                ? "Cadastre um template reutilizável para atribuição rápida."
                : "Cadastre um treino completo para o aluno.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {mode === "CUSTOMIZADO" ? (
            <div className="space-y-1.5">
              <label
                htmlFor="treino-modal-aluno"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Aluno *
              </label>
              <SuggestionInput
                inputId="treino-modal-aluno"
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
                options={clienteOptions}
                placeholder="Digite o nome, CPF ou e-mail"
                minCharsToSearch={0}
              />
              {errors.aluno && <p className="text-xs text-gym-danger">{errors.aluno}</p>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label
                htmlFor="treino-modal-template"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Template
              </label>
              <Input
                id="treino-modal-template"
                value={form.templateNome ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, templateNome: event.target.value, nome: event.target.value }))}
                className="bg-secondary border-border"
                placeholder="Ex.: Template Hipertrofia Base"
              />
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="treino-modal-nome"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Nome do treino
              </label>
              <Input
                id="treino-modal-nome"
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                className="bg-secondary border-border"
                placeholder="Ex.: Treino A"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Divisão</label>
              <div className="flex gap-2">
                {DIVISOES.map((divisao) => (
                  <button
                    key={divisao}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, divisao }))}
                    className={cn(
                      "flex-1 rounded-md border px-2 py-2 text-sm font-semibold transition-colors",
                      form.divisao === divisao
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {divisao}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="treino-modal-objetivo"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Objetivo
              </label>
              <Input
                id="treino-modal-objetivo"
                value={form.objetivo ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, objetivo: event.target.value }))}
                className="bg-secondary border-border"
                placeholder="Hipertrofia, reabilitação, mobilidade..."
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <FieldNumber
              label="Meta sessões/semana"
              inputId="treino-modal-meta"
              value={form.metaSessoesSemana}
              onChange={(value) =>
                setForm((current) => ({ ...current, metaSessoesSemana: value, frequenciaPlanejada: value ?? current.frequenciaPlanejada }))
              }
            />
            <FieldNumber
              label="Frequência planejada"
              inputId="treino-modal-frequencia"
              value={form.frequenciaPlanejada}
              onChange={(value) => setForm((current) => ({ ...current, frequenciaPlanejada: value }))}
            />
            <FieldNumber
              label="Quantidade prevista"
              inputId="treino-modal-quantidade"
              value={form.quantidadePrevista}
              onChange={(value) => setForm((current) => ({ ...current, quantidadePrevista: value }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="treino-modal-inicio"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Início
              </label>
              <Input
                id="treino-modal-inicio"
                type="date"
                value={form.dataInicio}
                onChange={(event) => setForm((current) => ({ ...current, dataInicio: event.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="treino-modal-fim"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Fim *
              </label>
              <Input
                id="treino-modal-fim"
                type="date"
                value={form.dataFim}
                onChange={(event) => setForm((current) => ({ ...current, dataFim: event.target.value }))}
                className="bg-secondary border-border"
              />
              {errors.dataFim && <p className="text-xs text-gym-danger">{errors.dataFim}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="treino-modal-observacoes"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Observações
            </label>
            <Textarea
              id="treino-modal-observacoes"
              value={form.observacoes || ""}
              onChange={(event) => setForm((current) => ({ ...current, observacoes: event.target.value }))}
              className="min-h-20 bg-secondary border-border"
              placeholder="Instruções gerais, foco do ciclo, critérios de revisão, restrições, etc."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Itens do treino</p>
                <p className="text-xs text-muted-foreground">Séries, repetições, descanso, ordem e dias da semana.</p>
              </div>
              <Button variant="outline" size="sm" onClick={addItem}>
                Adicionar exercício
              </Button>
            </div>
            {errors.itens && <p className="text-xs text-gym-danger">{errors.itens}</p>}
            <div className="space-y-2">
              {form.itens.map((item, index) => (
                <div key={index} className="space-y-2 rounded-md border border-border/70 bg-secondary/60 p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-12">
                      <Input
                        type="number"
                        min={1}
                        value={item.ordem}
                        onChange={(event) => updateItem(index, { ordem: Number(event.target.value) || index + 1 })}
                        className="bg-card border-border text-center"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label
                        htmlFor={`treino-item-${index}-exercicio`}
                        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Exercício *
                      </label>
                      <select
                        id={`treino-item-${index}-exercicio`}
                        value={item.exercicioId}
                        onChange={(event) => updateItem(index, { exercicioId: event.target.value })}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      >
                        <option value="">Selecione um exercício</option>
                        {exercicioOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                      Remover
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <FieldNumber
                      label="Séries"
                      inputId={`treino-item-${index}-series`}
                      value={item.series}
                      onChange={(value) => updateItem(index, { series: value ?? 0 })}
                    />
                    <FieldNumber
                      label="Rep. mín"
                      inputId={`treino-item-${index}-rep-min`}
                      value={item.repeticoesMin}
                      onChange={(value) => updateItem(index, { repeticoesMin: value })}
                    />
                    <FieldNumber
                      label="Rep. máx"
                      inputId={`treino-item-${index}-rep-max`}
                      value={item.repeticoesMax}
                      onChange={(value) => updateItem(index, { repeticoesMax: value })}
                    />
                    <FieldNumber
                      label="Descanso (s)"
                      inputId={`treino-item-${index}-descanso`}
                      value={item.intervaloSegundos}
                      onChange={(value) => updateItem(index, { intervaloSegundos: value })}
                    />
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <FieldNumber
                      label="Tempo exec. (s)"
                      inputId={`treino-item-${index}-tempo`}
                      value={item.tempoExecucaoSegundos}
                      onChange={(value) => updateItem(index, { tempoExecucaoSegundos: value })}
                    />
                    <FieldNumber
                      label="Carga sugerida"
                      inputId={`treino-item-${index}-carga`}
                      value={item.cargaSugerida}
                      onChange={(value) => updateItem(index, { cargaSugerida: value })}
                    />
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`treino-item-${index}-dias`}
                        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Dias da semana
                      </label>
                      <Input
                        id={`treino-item-${index}-dias`}
                        placeholder="Ex.: SEG, QUA"
                        value={(item.diasSemana ?? []).join(", ")}
                        onChange={(event) =>
                          updateItem(index, {
                            diasSemana: event.target.value
                              .split(",")
                              .map((value) => value.trim().toUpperCase())
                              .filter(Boolean),
                          })
                        }
                        className="bg-card border-border text-sm"
                      />
                    </div>
                  </div>
                  <Textarea
                    id={`treino-item-${index}-observacao`}
                    placeholder="Observação do exercício"
                    value={item.observacao ?? ""}
                    onChange={(event) => updateItem(index, { observacao: event.target.value })}
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
          <Button onClick={handleSave}>
            {submitLabel ?? (mode === "PRE_MONTADO" ? "Salvar template" : "Salvar treino")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldNumber({
  label,
  inputId,
  value,
  onChange,
}: {
  label: string;
  inputId?: string;
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      <Input
        id={inputId}
        type="number"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}
        className="bg-card border-border"
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AtividadeOcorrenciaForm {
  data: string;
  horaInicio: string;
  horaFim: string;
  capacidade: string;
  local: string;
  salaNome: string;
  instrutorNome: string;
  observacoes: string;
}

const EMPTY_FORM: AtividadeOcorrenciaForm = {
  data: "",
  horaInicio: "",
  horaFim: "",
  capacidade: "1",
  local: "",
  salaNome: "",
  instrutorNome: "",
  observacoes: "",
};

export function AtividadeOcorrenciaModal({
  open,
  onClose,
  onSave,
  saving = false,
  atividadeNome,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AtividadeOcorrenciaForm) => Promise<void> | void;
  saving?: boolean;
  atividadeNome?: string;
  initial?: Partial<AtividadeOcorrenciaForm>;
}) {
  const [form, setForm] = useState<AtividadeOcorrenciaForm>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      data: initial?.data ?? "",
      horaInicio: initial?.horaInicio ?? "",
      horaFim: initial?.horaFim ?? "",
      capacidade: initial?.capacidade ?? "1",
      local: initial?.local ?? "",
      salaNome: initial?.salaNome ?? "",
      instrutorNome: initial?.instrutorNome ?? "",
      observacoes: initial?.observacoes ?? "",
    });
    setError("");
  }, [initial, open]);

  function set<K extends keyof AtividadeOcorrenciaForm>(key: K, value: AtividadeOcorrenciaForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (!form.data || !form.horaInicio || !form.horaFim) {
      setError("Data e horário são obrigatórios.");
      return;
    }
    if ((parseInt(form.capacidade, 10) || 0) < 1) {
      setError("A capacidade deve ser maior que zero.");
      return;
    }
    if (form.horaFim <= form.horaInicio) {
      setError("O horário final deve ser posterior ao inicial.");
      return;
    }
    setError("");
    await onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Criar ocorrência
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm text-muted-foreground">
            {atividadeNome ? (
              <span>
                Esta ocorrência avulsa será publicada para <span className="font-semibold text-foreground">{atividadeNome}</span>.
              </span>
            ) : (
              "Esta ocorrência avulsa será publicada para a grade selecionada."
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data *</label>
              <Input
                type="date"
                value={form.data}
                onChange={(event) => set("data", event.target.value)}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Capacidade *</label>
              <Input
                type="number"
                min={1}
                value={form.capacidade}
                onChange={(event) => set("capacidade", event.target.value)}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hora início *</label>
              <Input
                type="time"
                value={form.horaInicio}
                onChange={(event) => set("horaInicio", event.target.value)}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hora fim *</label>
              <Input
                type="time"
                value={form.horaFim}
                onChange={(event) => set("horaFim", event.target.value)}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Local</label>
              <Input
                value={form.local}
                onChange={(event) => set("local", event.target.value)}
                className="border-border bg-secondary"
                placeholder="Ex.: Sala 2"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sala</label>
              <Input
                value={form.salaNome}
                onChange={(event) => set("salaNome", event.target.value)}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Instrutor</label>
              <Input
                value={form.instrutorNome}
                onChange={(event) => set("instrutorNome", event.target.value)}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(event) => set("observacoes", event.target.value.slice(0, 500))}
                className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                placeholder="Informações opcionais para a agenda."
              />
            </div>
          </div>

          {error ? <p className="text-sm text-gym-danger">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving} className="border-border">
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Criando..." : "Criar ocorrência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

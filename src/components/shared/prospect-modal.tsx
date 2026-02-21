"use client";

import { useEffect, useState } from "react";
import type { CreateProspectInput, Funcionario, Prospect, OrigemProspect } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ORIGEM_LABELS: Record<OrigemProspect, string> = {
  VISITA_PRESENCIAL: "Visita presencial",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  INDICACAO: "Indicação",
  SITE: "Site",
  OUTROS: "Outros",
};

export function ProspectModal({
  open,
  onClose,
  onSave,
  funcionarios,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateProspectInput) => void;
  funcionarios: Funcionario[];
  initial?: Prospect | null;
}) {
  const [form, setForm] = useState<CreateProspectInput>({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
    origem: "INSTAGRAM",
    observacoes: "",
    responsavelId: "",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome,
        telefone: initial.telefone,
        email: initial.email ?? "",
        cpf: initial.cpf ?? "",
        origem: initial.origem,
        observacoes: initial.observacoes ?? "",
        responsavelId: initial.responsavelId ?? "",
      });
    } else {
      setForm({
        nome: "",
        telefone: "",
        email: "",
        cpf: "",
        origem: "INSTAGRAM",
        observacoes: "",
        responsavelId: "",
      });
    }
  }, [initial, open]);

  function set(key: keyof CreateProspectInput) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleSubmit() {
    if (!form.nome || !form.telefone) return;
    const payload: CreateProspectInput = {
      ...form,
      responsavelId: form.responsavelId ? form.responsavelId : undefined,
    };
    onSave(payload);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar Prospect" : "Novo Prospect"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome *
              </label>
              <Input
                placeholder="Nome completo"
                value={form.nome}
                onChange={set("nome")}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Telefone *
              </label>
              <MaskedInput
                mask="phone"
                placeholder="(11) 99999-0000"
                value={form.telefone}
                onChange={(v) => setForm((f) => ({ ...f, telefone: v }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                CPF
              </label>
              <MaskedInput
                mask="cpf"
                placeholder="000.000.000-00"
                value={form.cpf ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, cpf: v }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="exemplo@email.com"
                value={form.email ?? ""}
                onChange={set("email")}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Origem
              </label>
              <Select
                value={form.origem}
                onValueChange={(v) => setForm((f) => ({ ...f, origem: v as OrigemProspect }))}
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(ORIGEM_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Responsável
              </label>
              <Select
                value={form.responsavelId ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, responsavelId: v }))}
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue placeholder="Sem responsável" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">Sem responsável</SelectItem>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </label>
            <Input
              placeholder="Observações do prospect"
              value={form.observacoes ?? ""}
              onChange={set("observacoes")}
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

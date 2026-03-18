"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Aluno } from "@/lib/types";

const MOTIVOS = [
  { value: "INADIMPLENCIA", label: "Inadimplência" },
  { value: "SAUDE", label: "Saúde" },
  { value: "VIAGEM", label: "Viagem" },
  { value: "PAUSA_CONTRATO", label: "Pausa de contrato" },
  { value: "OUTROS", label: "Outros" },
];

export function SuspenderClienteModal({
  open,
  onClose,
  onConfirm,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: NonNullable<Aluno["suspensao"]>) => void;
  initial?: Aluno["suspensao"];
}) {
  const [form, setForm] = useState({
    motivo: "",
    inicio: "",
    fim: "",
    detalhes: "",
    arquivoBase64: "",
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        motivo: initial.motivo ?? "",
        inicio: initial.inicio ?? "",
        fim: initial.fim ?? "",
        detalhes: initial.detalhes ?? "",
        arquivoBase64: initial.arquivoBase64 ?? "",
      });
    } else {
      setForm({
        motivo: "",
        inicio: "",
        fim: "",
        detalhes: "",
        arquivoBase64: "",
      });
    }
  }, [initial, open]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="bg-card border-border max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Suspender cliente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Motivo
            </label>
            <Select
              value={form.motivo}
              onValueChange={(v) => setForm((prev) => ({ ...prev, motivo: v }))}
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {MOTIVOS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Início
              </label>
              <Input
                type="date"
                value={form.inicio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, inicio: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fim
              </label>
              <Input
                type="date"
                value={form.fim}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fim: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Anexo (opcional)
            </label>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setForm((prev) => ({
                    ...prev,
                    arquivoBase64: String(reader.result),
                  }));
                };
                reader.readAsDataURL(file);
              }}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </label>
            <textarea
              value={form.detalhes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, detalhes: e.target.value }))
              }
              className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
              placeholder="Detalhes adicionais da suspensão..."
            />
            <p className="text-xs text-muted-foreground">
              Se não informar datas, a suspensão é imediata e por prazo
              indeterminado.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!form.motivo) return;
              onConfirm({
                motivo: form.motivo,
                inicio: form.inicio || undefined,
                fim: form.fim || undefined,
                detalhes: form.detalhes || undefined,
                arquivoBase64: form.arquivoBase64 || undefined,
              });
            }}
            disabled={!form.motivo}
          >
            Suspender
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

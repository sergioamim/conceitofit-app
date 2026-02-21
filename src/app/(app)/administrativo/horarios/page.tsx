"use client";

import { useEffect, useState } from "react";
import { listHorarios, updateHorarios } from "@/lib/mock/services";
import type { HorarioFuncionamento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DIAS_LABEL: Record<HorarioFuncionamento["dia"], string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
  DOM: "Domingo",
};

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<HorarioFuncionamento[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listHorarios().then(setHorarios);
  }, []);

  async function handleSave() {
    setSaving(true);
    await updateHorarios(horarios);
    setSaving(false);
  }

  function updateDia(idx: number, data: Partial<HorarioFuncionamento>) {
    setHorarios((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, ...data } : h))
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Horário de funcionamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Defina os horários da academia</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dia</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Abre</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fechado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {horarios.map((h, i) => (
              <tr key={h.dia} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 text-sm font-medium">{DIAS_LABEL[h.dia]}</td>
                <td className="px-4 py-3">
                  <Input
                    type="time"
                    value={h.abre}
                    onChange={(e) => updateDia(i, { abre: e.target.value })}
                    className="w-32 bg-secondary border-border"
                    disabled={h.fechado}
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="time"
                    value={h.fecha}
                    onChange={(e) => updateDia(i, { fecha: e.target.value })}
                    className="w-32 bg-secondary border-border"
                    disabled={h.fechado}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={!!h.fechado}
                    onChange={(e) => updateDia(i, { fechado: e.target.checked })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar horários"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PreferenciasPage() {
  const [compactMode, setCompactMode] = useState(false);
  const [mostrarDicas, setMostrarDicas] = useState(true);
  const [atalhos, setAtalhos] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Preferências</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalize sua experiência
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />
            <span>Modo compacto nas tabelas</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={mostrarDicas} onChange={(e) => setMostrarDicas(e.target.checked)} />
            <span>Mostrar dicas e atalhos</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={atalhos} onChange={(e) => setAtalhos(e.target.checked)} />
            <span>Ativar atalhos de teclado</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button>Salvar preferências</Button>
        </div>
      </div>
    </div>
  );
}

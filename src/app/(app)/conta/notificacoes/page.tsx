"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function NotificacoesPage() {
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(false);
  const [vencimentos, setVencimentos] = useState(true);
  const [novosLeads, setNovosLeads] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Notificações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina como deseja ser avisado
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
            <span>Notificações por e-mail</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} />
            <span>Notificações por WhatsApp</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={vencimentos} onChange={(e) => setVencimentos(e.target.checked)} />
            <span>Avisar sobre vencimentos</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={novosLeads} onChange={(e) => setNovosLeads(e.target.checked)} />
            <span>Avisar sobre novos prospects</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button>Salvar notificações</Button>
        </div>
      </div>
    </div>
  );
}

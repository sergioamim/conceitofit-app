"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SegurancaPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Segurança</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Troque sua senha de acesso
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Senha atual</label>
            <Input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div />
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nova senha</label>
            <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confirmar nova senha</label>
            <Input type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button>Atualizar senha</Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PerfilPage() {
  const [nome, setNome] = useState("Sergio");
  const [email, setEmail] = useState("sergio@academia.com");
  const [telefone, setTelefone] = useState("(11) 90000-0000");

  useEffect(() => {
    // Mock data only
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Meu perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize seus dados pessoais
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button>Salvar</Button>
        </div>
      </div>
    </div>
  );
}

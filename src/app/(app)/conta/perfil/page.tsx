"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/shared/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setTenantContextApi } from "@/lib/api/contexto-unidades";
import {
  getPreferredTenantId,
  setPreferredTenantId,
} from "@/lib/api/session";
import { useTenantContext } from "@/hooks/use-session-context";

export default function PerfilPage() {
  const [nome, setNome] = useState("Sergio");
  const [email, setEmail] = useState("sergio@academia.com");
  const [telefone, setTelefone] = useState("(11) 90000-0000");

  const [preferredTenantId, setPreferredTenantIdState] = useState("");
  const [savingTenant, setSavingTenant] = useState(false);
  const [tenantSaved, setTenantSaved] = useState(false);
  const [tenantError, setTenantError] = useState<string | null>(null);
  const tenantContext = useTenantContext();

  useEffect(() => {
    const active = tenantContext.tenants;
    const preferred = getPreferredTenantId();
    const preferredIsValid = preferred && active.some((tenant) => tenant.id === preferred);
    setPreferredTenantIdState(preferredIsValid ? preferred : tenantContext.tenantId);
  }, [tenantContext.tenantId, tenantContext.tenants]);

  async function handleSaveTenant() {
    if (!preferredTenantId) {
      setTenantError("Selecione uma unidade.");
      return;
    }
    setSavingTenant(true);
    setTenantError(null);
    setTenantSaved(false);
    try {
      await setTenantContextApi(preferredTenantId);
      setPreferredTenantId(preferredTenantId);
      setTenantSaved(true);
      setTimeout(() => setTenantSaved(false), 2500);
    } catch {
      setTenantError("Não foi possível alterar a unidade.");
    } finally {
      setSavingTenant(false);
    }
  }

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
            <PhoneInput value={telefone} onChange={setTelefone} className="bg-secondary border-border" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button>Salvar</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">Unidade prioritária</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define qual unidade é aberta automaticamente ao fazer login.
        </p>
        <div className="mt-4 space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Unidade
          </label>
          <Select value={preferredTenantId} onValueChange={setPreferredTenantIdState}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              {tenantContext.tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {tenantError && (
          <p className="mt-2 text-sm text-gym-danger">{tenantError}</p>
        )}
        <div className="mt-4 flex items-center justify-end gap-3">
          {tenantSaved && (
            <span className="text-sm text-gym-teal">Unidade salva!</span>
          )}
          <Button onClick={handleSaveTenant} disabled={savingTenant}>
            {savingTenant ? "Salvando..." : "Salvar unidade"}
          </Button>
        </div>
      </div>
    </div>
  );
}

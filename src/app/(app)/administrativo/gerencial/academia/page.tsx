"use client";

import { useEffect, useState } from "react";
import { getTenant, updateTenant } from "@/lib/mock/services";
import type { Tenant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/shared/masked-input";
import { PhoneInput } from "@/components/shared/phone-input";

export default function AcademiaPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTenant().then(setTenant);
  }, []);

  if (!tenant) return null;

  async function handleSave() {
    if (!tenant) return;
    setSaving(true);
    await updateTenant(tenant);
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Academia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dados básicos da academia
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
          <Input
            value={tenant.nome}
            onChange={(e) => setTenant({ ...tenant, nome: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subdomínio</label>
          <Input
            value={tenant.subdomain ?? ""}
            onChange={(e) => setTenant({ ...tenant, subdomain: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
          <Input
            type="email"
            value={tenant.email ?? ""}
            onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
          <PhoneInput
            value={tenant.telefone ?? ""}
            onChange={(v) => setTenant({ ...tenant, telefone: v })}
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Endereço</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CEP</label>
            <MaskedInput
              mask="cep"
              value={tenant.endereco?.cep ?? ""}
              onChange={(v) =>
                setTenant({
                  ...tenant,
                  endereco: { ...tenant.endereco, cep: v },
                })
              }
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Logradouro</label>
            <Input
              value={tenant.endereco?.logradouro ?? ""}
              onChange={(e) =>
                setTenant({
                  ...tenant,
                  endereco: { ...tenant.endereco, logradouro: e.target.value },
                })
              }
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Número</label>
            <Input
              value={tenant.endereco?.numero ?? ""}
              onChange={(e) =>
                setTenant({
                  ...tenant,
                  endereco: { ...tenant.endereco, numero: e.target.value },
                })
              }
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bairro</label>
            <Input
              value={tenant.endereco?.bairro ?? ""}
              onChange={(e) =>
                setTenant({
                  ...tenant,
                  endereco: { ...tenant.endereco, bairro: e.target.value },
                })
              }
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cidade</label>
            <Input
              value={tenant.endereco?.cidade ?? ""}
              onChange={(e) =>
                setTenant({
                  ...tenant,
                  endereco: { ...tenant.endereco, cidade: e.target.value },
                })
              }
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</label>
            <Input
              value={tenant.endereco?.estado ?? ""}
              onChange={(e) =>
                setTenant({
                  ...tenant,
                  endereco: { ...tenant.endereco, estado: e.target.value },
                })
              }
              className="bg-secondary border-border"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { listTenants, setCurrentTenant, getCurrentTenant } from "@/lib/mock/services";
import type { Tenant } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function AcademiaPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentId, setCurrentId] = useState<string>("");

  async function load() {
    const [list, current] = await Promise.all([listTenants(), getCurrentTenant()]);
    setTenants(list);
    setCurrentId(current.id);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Trocar academia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione a unidade que você está administrando
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tenants.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{t.nome}</p>
            <p className="text-xs text-muted-foreground">{t.endereco?.cidade} · {t.endereco?.estado}</p>
            <div className="mt-3">
              {currentId === t.id ? (
                <span className="inline-flex items-center rounded-full bg-gym-teal/15 px-2.5 py-0.5 text-[11px] font-semibold text-gym-teal">
                  Ativa
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border"
                  onClick={async () => {
                    await setCurrentTenant(t.id);
                    await load();
                  }}
                >
                  Selecionar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

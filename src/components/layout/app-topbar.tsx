"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Menu, Search } from "lucide-react";
import { getCurrentTenant, listTenants, setCurrentTenant } from "@/lib/mock/services";
import type { Tenant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AppTopbarProps = {
  onOpenMenu?: () => void;
};

function AppTopbarComponent({ onOpenMenu }: AppTopbarProps) {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [query, setQuery] = useState("");
  const [savingTenant, setSavingTenant] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function load() {
      const [allTenants, current] = await Promise.all([listTenants(), getCurrentTenant()]);
      const activeTenants = allTenants.filter((t) => t.ativo !== false);
      const currentActive = activeTenants.find((t) => t.id === current.id) ?? activeTenants[0];
      setTenants(activeTenants);
      setTenantId(currentActive?.id ?? "");
    }
    load();
    function handleUpdate() {
      load();
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const currentTenant = useMemo(
    () => tenants.find((t) => t.id === tenantId),
    [tenants, tenantId]
  );

  async function handleChangeTenant(nextId: string) {
    setSavingTenant(true);
    try {
      await setCurrentTenant(nextId);
      const [allTenants, current] = await Promise.all([listTenants(), getCurrentTenant()]);
      const activeTenants = allTenants.filter((t) => t.ativo !== false);
      setTenants(activeTenants);
      setTenantId(current.id);
    } finally {
      setSavingTenant(false);
    }
  }

  function handleSearch() {
    const q = query.trim();
    if (!q) {
      router.push("/clientes");
      return;
    }
    router.push(`/clientes?q=${encodeURIComponent(q)}`);
    setQuery("");
  }

  return (
    <div className="border-b border-border px-3 py-3 md:px-7">
      <div className="mb-3 flex items-center md:hidden">
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={onOpenMenu}>
          <Menu className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center">
          <Building2 className="size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade ativa</p>
            <p className="truncate text-sm font-medium text-foreground">{currentTenant?.nome ?? "Carregando..."}</p>
          </div>
          {mounted && (
            <Select value={tenantId} onValueChange={handleChangeTenant} disabled={savingTenant || tenants.length === 0}>
              <SelectTrigger className="h-8 w-full border-border bg-secondary sm:w-[220px]">
                <SelectValue placeholder="Selecionar unidade" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome ou CPF"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="h-8 border-border bg-secondary"
          />
          <Button type="button" size="sm" onClick={handleSearch} className="sm:w-auto">
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
export const AppTopbar = memo(AppTopbarComponent);

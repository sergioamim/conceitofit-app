"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Menu, Search } from "lucide-react";
import { listAlunosPage, setCurrentTenant } from "@/lib/mock/services";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SuggestionInput, type SuggestionOption } from "@/components/shared/suggestion-input";
import { useTenantContext } from "@/hooks/use-session-context";

type AppTopbarProps = {
  onOpenMenu?: () => void;
};

function AppTopbarComponent({ onOpenMenu }: AppTopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [clienteOptions, setClienteOptions] = useState<SuggestionOption[]>([]);
  const [savingTenant, setSavingTenant] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [clienteOptionsLoadedTenant, setClienteOptionsLoadedTenant] = useState("");
  const { tenant, tenantId, tenants } = useTenantContext();

  useEffect(() => { setMounted(true); }, []);

  const tenantOptions = useMemo(
    () => Array.from(new Map(tenants.map((t) => [t.id, t] as const)).values()),
    [tenants]
  );

  const loadClienteOptions = useCallback(async () => {
    if (!tenantId || clienteOptionsLoadedTenant === tenantId) return;
    try {
      const result = await listAlunosPage({
        page: 0,
        size: 200,
      });
      const mapped = result.items.map((aluno) => ({
        id: aluno.id,
        label: aluno.cpf ? `${aluno.nome} • ${aluno.cpf}` : aluno.nome,
        searchText: [aluno.nome, aluno.cpf, aluno.email, aluno.telefone].filter(Boolean).join(" "),
      }));
      setClienteOptions(mapped);
      setClienteOptionsLoadedTenant(tenantId);
    } catch {
      setClienteOptions([]);
      setClienteOptionsLoadedTenant("");
    }
  }, [tenantId, clienteOptionsLoadedTenant]);

  useEffect(() => {
    if (!tenantId) return;
    if (clienteOptionsLoadedTenant && clienteOptionsLoadedTenant !== tenantId) {
      setClienteOptions([]);
      setClienteOptionsLoadedTenant("");
    }
  }, [tenantId, clienteOptionsLoadedTenant]);

  async function handleChangeTenant(nextId: string) {
    setSavingTenant(true);
    try {
      await setCurrentTenant(nextId);
      setClienteOptions([]);
      setClienteOptionsLoadedTenant("");
    } catch {
      setClienteOptions([]);
      setClienteOptionsLoadedTenant("");
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
            <p className="truncate text-sm font-medium text-foreground">{tenant?.nome ?? "Carregando..."}</p>
          </div>
          {mounted && (
            <Select value={tenantId} onValueChange={handleChangeTenant} disabled={savingTenant || tenantOptions.length === 0}>
              <SelectTrigger className="h-8 w-full border-border bg-secondary sm:w-[220px]">
                <SelectValue placeholder="Selecionar unidade" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {tenantOptions.map((t) => (
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
          <SuggestionInput
            placeholder="Buscar cliente por nome ou CPF"
            value={query}
            onValueChange={setQuery}
              onSelect={(option) => {
                setQuery("");
                router.push(`/clientes/${option.id}`);
              }}
              onFocusOpen={loadClienteOptions}
              options={clienteOptions}
              emptyText="Nenhum cliente encontrado"
              minCharsToSearch={3}
              className="w-full"
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

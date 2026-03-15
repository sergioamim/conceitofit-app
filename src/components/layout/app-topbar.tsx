"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { extractAlunosFromListResponse, listAlunosApi } from "@/lib/api/alunos";
import { Button } from "@/components/ui/button";
import { ActiveTenantSelector } from "@/components/layout/active-tenant-selector";
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
  const [clienteOptionsLoadedTenant, setClienteOptionsLoadedTenant] = useState("");
  const { tenantId, tenantName, tenants, setTenant, loading: tenantLoading } = useTenantContext();

  const loadClienteOptions = useCallback(async () => {
    if (!tenantId || clienteOptionsLoadedTenant === tenantId) return;
    try {
      const result = await listAlunosApi({
        tenantId,
        page: 0,
        size: 200,
      });
      const mapped = extractAlunosFromListResponse(result).map((aluno) => ({
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
      await setTenant(nextId);
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
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          aria-label="Abrir menu principal"
          onClick={onOpenMenu}
        >
          <Menu className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <ActiveTenantSelector
          tenantId={tenantId}
          tenantName={tenantName}
          tenants={tenants}
          disabled={savingTenant || tenantLoading}
          onChange={handleChangeTenant}
        />

        <div
          role="search"
          aria-label="Busca global de clientes"
          className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center"
        >
          <Search className="size-4 text-muted-foreground" />
          <SuggestionInput
            inputAriaLabel="Buscar cliente por nome ou CPF"
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
          <Button type="button" size="sm" onClick={handleSearch} className="sm:w-auto" aria-label="Executar busca de clientes">
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
export const AppTopbar = memo(AppTopbarComponent);

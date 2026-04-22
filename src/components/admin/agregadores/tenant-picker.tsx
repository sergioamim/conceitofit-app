"use client";

import { useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface TenantOption {
  id: string;
  nome: string;
  academiaNome?: string;
  subdomain?: string;
}

export interface TenantPickerProps {
  tenants: TenantOption[];
  loading?: boolean;
  onSelect: (tenantId: string) => void;
}

/**
 * Lista/grid de tenants (unidades) que o admin pode gerenciar.
 *
 * AG-7.7 (ADR-012): quando o usuário não tem `tenantId` na URL, escolhe
 * aqui qual tenant quer configurar. Clique → navega para
 * `/admin/integracoes/agregadores?tenantId={uuid}`.
 */
export function TenantPicker({ tenants, loading, onSelect }: TenantPickerProps) {
  const [busca, setBusca] = useState("");

  const filtered = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return tenants;
    return tenants.filter((t) => {
      const haystack = [t.nome, t.academiaNome, t.subdomain]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [tenants, busca]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar academia..."
          aria-label="Buscar academia"
          className="pl-8"
          data-testid="tenant-picker-search"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando academias...</p>
      ) : tenants.length === 0 ? (
        <EmptyTenants />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma academia encontrada para &quot;{busca}&quot;.
        </p>
      ) : (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="tenant-picker-grid"
        >
          {filtered.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              onClick={() => onSelect(tenant.id)}
              data-testid={`tenant-option-${tenant.id}`}
              className="text-left"
            >
              <Card className="transition-colors hover:border-gym-accent/50 hover:bg-secondary/30">
                <CardContent className="flex items-start gap-3 px-4 py-4">
                  <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-gym-accent/10 text-gym-accent">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{tenant.nome}</p>
                    {tenant.academiaNome ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {tenant.academiaNome}
                      </p>
                    ) : null}
                    {tenant.subdomain ? (
                      <p className="truncate text-[10px] font-mono text-muted-foreground/80">
                        {tenant.subdomain}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyTenants() {
  return (
    <div
      className="rounded-xl border border-dashed border-border px-6 py-8 text-center"
      data-testid="tenant-picker-empty"
    >
      <p className="text-sm font-medium">Sem academias acessíveis.</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Seu perfil não tem tenants disponíveis para gerenciar agregadores.
      </p>
    </div>
  );
}

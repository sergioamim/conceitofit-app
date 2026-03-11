"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listTenants, listarStatusConexaoCatraca } from "@/lib/mock/services";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { Tenant } from "@/lib/types";
import { useAuthAccess } from "@/hooks/use-session-context";

const TODOS_TENANTS_VALUE = "__TODOS_TENANTS__";

type TenantStatusRow = {
  tenantId: string;
  nome: string;
  connectedAgents: number;
};

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  const normalized = normalizeErrorMessage(error);
  return normalized || "Não foi possível carregar o status.";
}

function getTenantName(map: Map<string, string>, tenantId: string): string {
  return map.get(tenantId) ?? tenantId;
}

function getTenantStatusClass(connected: number): string {
  return connected > 0
    ? "bg-gym-teal/15 text-gym-teal border-gym-teal/25"
    : "bg-muted text-muted-foreground border-border";
}

function getTenantStatusLabel(connected: number): string {
  return connected > 0 ? "Online" : "Sem conexão";
}

export default function CatracaStatusPage() {
  const access = useAuthAccess();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState(TODOS_TENANTS_VALUE);
  const [rows, setRows] = useState<TenantStatusRow[]>([]);
  const [totalConnectedAgents, setTotalConnectedAgents] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tenantMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const tenant of tenants) {
      map.set(tenant.id, tenant.nome);
    }
    return map;
  }, [tenants]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = rows;
    if (!term) return list;
    return list.filter((row) => [row.nome, row.tenantId].join(" ").toLowerCase().includes(term));
  }, [rows, search]);

  useEffect(() => {
    void (async () => {
      try {
        const tenantsResponse = await listTenants();
        setTenants(tenantsResponse);
      } catch {
        setTenants([]);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (!access.canAccessElevatedModules) return;
    setLoading(true);
    setError("");
    try {
      const status = await listarStatusConexaoCatraca(
        selectedTenantId === TODOS_TENANTS_VALUE ? undefined : selectedTenantId
      );

      const statusByTenant = new Map<string, number>(
        status.tenants.map((item) => [item.tenantId, item.connectedAgents])
      );

      if (selectedTenantId === TODOS_TENANTS_VALUE) {
        if (tenants.length > 0) {
          setRows(
            tenants
              .map((tenant) => ({
                tenantId: tenant.id,
                nome: tenant.nome,
                connectedAgents: statusByTenant.get(tenant.id) ?? 0,
              }))
              .sort((a, b) => a.nome.localeCompare(b.nome))
          );
          setTotalConnectedAgents(status.totalConnectedAgents);
        } else {
          setRows(
            status.tenants.map((item) => ({
              tenantId: item.tenantId,
              nome: getTenantName(tenantMap, item.tenantId),
              connectedAgents: item.connectedAgents,
            }))
          );
          setTotalConnectedAgents(status.totalConnectedAgents);
        }
        return;
      }

      const item = status.tenants.find((entry) => entry.tenantId === selectedTenantId);
      setRows([
        {
          tenantId: selectedTenantId,
          nome: getTenantName(tenantMap, selectedTenantId),
          connectedAgents: item?.connectedAgents ?? 0,
        },
      ]);
      setTotalConnectedAgents(item?.connectedAgents ?? 0);
    } catch (loadError) {
      setError(formatError(loadError));
      setRows([]);
      setTotalConnectedAgents(0);
    } finally {
      setLoading(false);
    }
  }, [access.canAccessElevatedModules, selectedTenantId, tenants, tenantMap]);

  useEffect(() => {
    if (!access.loading) {
      void load();
    }
  }, [access.loading, load]);

  const tenantsOptions = useMemo(
    () => [
      { id: TODOS_TENANTS_VALUE, label: "Todas as unidades" },
      ...tenants.map((tenant) => ({ id: tenant.id, label: tenant.nome })),
    ],
    [tenants]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administrativo</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Status de conexões Catraca</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitore conexões WebSocket ativas por unidade (tenant).
          </p>
        </div>
        <Button onClick={() => void load()} disabled={!access.canAccessElevatedModules || loading}>
          <RefreshCw className="mr-2 size-4" />
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId} disabled={!access.canAccessElevatedModules || access.loading}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue placeholder="Selecionar unidade" />
            </SelectTrigger>
            <SelectContent>
              {tenantsOptions.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar por nome do tenant"
            className="bg-secondary border-border lg:col-span-1"
          />
          <Input
            value={`Total conectado: ${totalConnectedAgents}`}
            readOnly
            disabled
            className="bg-secondary border-border text-sm text-muted-foreground"
          />
        </div>

        {access.loading ? (
          <p className="text-xs text-muted-foreground">Validando permissão...</p>
        ) : !access.canAccessElevatedModules ? (
          <p className="text-sm text-gym-danger">
            Acesso negado. Apenas usuários com permissão alta podem visualizar esta página.
          </p>
        ) : null}

        {error ? <p className="text-sm text-gym-danger">{error}</p> : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Total de agentes conectados</p>
            <p className="mt-2 text-2xl font-bold text-gym-accent">{totalConnectedAgents}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Conexões monitoradas</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{filteredRows.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Filtro ativo</p>
            <p className="mt-2 truncate text-sm font-medium text-foreground">
              {selectedTenantId === TODOS_TENANTS_VALUE ? "Todas as unidades" : getTenantName(tenantMap, selectedTenantId)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tenant
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tenant ID
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Agentes conectados
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={4}>
                  Nenhuma conexão encontrada para os filtros atuais.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.tenantId} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{row.nome}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-muted-foreground">{row.tenantId}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-medium text-foreground">{row.connectedAgents}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${getTenantStatusClass(row.connectedAgents)}`}
                    >
                      {row.connectedAgents > 0 ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
                      {getTenantStatusLabel(row.connectedAgents)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

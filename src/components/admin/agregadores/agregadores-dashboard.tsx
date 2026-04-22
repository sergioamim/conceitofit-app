"use client";

import Link from "next/link";
import { Activity, ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  AgregadorConfigResponse,
  AgregadorSchemaEntry,
  AgregadorTipo,
} from "@/lib/api/agregadores-admin";
import {
  useAgregadoresConfigs,
  useAgregadoresSchema,
} from "@/lib/query/use-agregadores-admin";
import { AgregadorCard } from "./agregador-card";

export interface AgregadoresDashboardProps {
  tenantId: string;
}

/**
 * Dashboard do tenant — AG-7.8.
 *
 * Faz fetch paralelo de:
 *   - `GET /schema` → metadata dos agregadores suportados
 *   - `GET /config?tenantId=` → configs já presentes no tenant
 *
 * Renderiza 1 card por AgregadorTipo do schema com status correto.
 */
export function AgregadoresDashboard({ tenantId }: AgregadoresDashboardProps) {
  const schemaQuery = useAgregadoresSchema();
  const configsQuery = useAgregadoresConfigs(tenantId);

  const schema = schemaQuery.data;
  const configs = configsQuery.data ?? [];

  const configByTipo = new Map<AgregadorTipo, AgregadorConfigResponse>(
    configs.map((c) => [c.tipo, c]),
  );

  const loading = schemaQuery.isLoading || configsQuery.isLoading;
  const error = schemaQuery.error || configsQuery.error;

  return (
    <div className="flex flex-col gap-4" data-testid="agregadores-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href="/admin/integracoes/agregadores">
            <ArrowLeft className="mr-1 size-4" />
            Trocar academia
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            data-testid="agregadores-link-dashboard"
          >
            <Link
              href={`/admin/integracoes/agregadores/dashboard?tenantId=${encodeURIComponent(tenantId)}`}
            >
              <BarChart3 className="mr-1 size-4" />
              Ver dashboard
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            data-testid="agregadores-link-eventos"
          >
            <Link
              href={`/admin/integracoes/agregadores/eventos?tenantId=${encodeURIComponent(tenantId)}`}
            >
              <Activity className="mr-1 size-4" />
              Ver eventos
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Tenant: <span className="font-mono">{tenantId}</span>
      </p>

      {error ? (
        <div
          className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger"
          role="alert"
        >
          Falha ao carregar dados dos agregadores.{" "}
          {error instanceof Error ? error.message : ""}
        </div>
      ) : null}

      {loading && !schema ? (
        <p className="text-sm text-muted-foreground">
          Carregando agregadores...
        </p>
      ) : null}

      {schema ? (
        <div
          className="grid gap-4 md:grid-cols-2"
          data-testid="agregadores-grid"
        >
          {schema.agregadores.map((entry: AgregadorSchemaEntry) => (
            <AgregadorCard
              key={entry.tipo}
              tenantId={tenantId}
              schema={entry}
              config={configByTipo.get(entry.tipo)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

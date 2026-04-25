"use client";

/**
 * Conteúdo da página /admin/feature-flags (débito 3.29).
 *
 * Permite a usuários PLATAFORMA gerenciar feature flags por tenant. O fluxo:
 *  1. Selecionar um tenant via `useAdminUnidades()`.
 *  2. Listar flags conhecidas (`GET /api/v1/admin/feature-flags`).
 *  3. Alterar via Switch — `PUT /api/v1/admin/feature-flags/{flagName}`.
 *  4. Toast + invalidate na query (admin e consumo) para refletir o novo estado.
 *
 * Degradação graciosa: se o BE estiver indisponível ou retornar erro, o
 * card mostra "Configuração indisponível — usando defaults" e permite retry.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Flag, Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  listAdminFeatureFlagsApi,
  updateFeatureFlagApi,
} from "@/lib/api/feature-flags";
import { ApiRequestError } from "@/lib/api/http";
import type { FlagAdminItem } from "@/lib/shared/types/feature-flag";
import { useAdminUnidades } from "@/backoffice/query";
import { formatDateTime } from "@/lib/shared/formatters";

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

type TenantOption = { id: string; nome: string; subdomain?: string };

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function FeatureFlagsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const unidadesQuery = useAdminUnidades();

  const tenantOptions = useMemo<TenantOption[]>(() => {
    return (unidadesQuery.data ?? []).map((u) => ({
      id: u.id,
      nome: u.nome,
      subdomain: u.subdomain,
    }));
  }, [unidadesQuery.data]);

  const flagsQuery = useQuery<FlagAdminItem[]>({
    queryKey: ["admin-feature-flags", selectedTenantId] as const,
    queryFn: () => listAdminFeatureFlagsApi({ tenantId: selectedTenantId }),
    enabled: Boolean(selectedTenantId),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (input: { flagName: string; enabled: boolean }) =>
      updateFeatureFlagApi({
        tenantId: selectedTenantId,
        flagName: input.flagName,
        enabled: input.enabled,
      }),
    onSuccess: (item) => {
      toast({
        title: "Flag atualizada",
        description: `${item.flagName} agora está ${item.enabled ? "ativa" : "inativa"}.`,
      });
      // Invalida tanto a listagem admin quanto o consumo (`useFeatureFlags`).
      void queryClient.invalidateQueries({
        queryKey: ["admin-feature-flags", selectedTenantId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["feature-flags", selectedTenantId],
      });
    },
    onError: (err) => {
      const description =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erro desconhecido.";
      toast({
        title: "Falha ao atualizar flag",
        description,
        variant: "destructive",
      });
    },
  });

  const updatingFlagName =
    updateMutation.isPending && updateMutation.variables
      ? updateMutation.variables.flagName
      : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gym-accent/10 text-gym-accent">
            <Flag className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Feature flags
            </h1>
            <p className="text-sm text-muted-foreground">
              Habilite ou desabilite features por tenant. Alterações são
              persistidas em DB e refletem após próximo refresh do cliente
              (cache de 5 min via `useFeatureFlags`).
            </p>
          </div>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Voltar para o painel admin
        </Link>
      </header>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tenant
        </h2>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="tenant-select">
            Selecione o tenant para configurar
          </label>
          <Select
            value={selectedTenantId || undefined}
            onValueChange={(value) => setSelectedTenantId(value)}
            disabled={unidadesQuery.isLoading}
          >
            <SelectTrigger id="tenant-select" className="max-w-xl">
              <SelectValue
                placeholder={
                  unidadesQuery.isLoading
                    ? "Carregando unidades..."
                    : "Selecione uma unidade"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {tenantOptions.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome}
                  {t.subdomain ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({t.subdomain})
                    </span>
                  ) : null}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {unidadesQuery.isError ? (
            <p className="text-xs text-gym-danger" role="alert">
              Falha ao carregar unidades. Tente recarregar a página.
            </p>
          ) : null}
        </div>
      </Card>

      {selectedTenantId ? (
        <FlagsTable
          tenantId={selectedTenantId}
          flagsQuery={flagsQuery}
          onToggle={(flagName, enabled) =>
            updateMutation.mutate({ flagName, enabled })
          }
          updatingFlagName={updatingFlagName}
        />
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">
          Selecione um tenant acima para visualizar as flags disponíveis.
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabela
// ---------------------------------------------------------------------------

interface FlagsTableProps {
  tenantId: string;
  flagsQuery: ReturnType<typeof useQuery<FlagAdminItem[]>>;
  onToggle: (flagName: string, enabled: boolean) => void;
  updatingFlagName: string | null;
}

function FlagsTable({
  tenantId,
  flagsQuery,
  onToggle,
  updatingFlagName,
}: FlagsTableProps) {
  const flags = flagsQuery.data ?? [];

  if (flagsQuery.isLoading) {
    return (
      <Card className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando flags do tenant...
      </Card>
    );
  }

  if (flagsQuery.isError) {
    return (
      <Card className="space-y-3 border-gym-danger/40 bg-gym-danger/5 p-6">
        <p className="text-sm font-semibold text-gym-danger">
          Configuração indisponível — usando defaults
        </p>
        <p className="text-xs text-muted-foreground">
          O backend retornou erro ao listar as flags. As features continuam
          funcionando com seus valores padrão. Você pode tentar novamente
          abaixo.
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => flagsQuery.refetch()}
            disabled={flagsQuery.isFetching}
          >
            {flagsQuery.isFetching ? (
              <Loader2 className="mr-2 size-3 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 size-3" />
            )}
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  if (flags.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Nenhuma flag conhecida para este tenant ainda. As flags aparecem
        conforme o backend as expõe.
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Flag</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Atualizado em</TableHead>
            <TableHead>Por (userId)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flags.map((flag) => {
            const isUpdating = updatingFlagName === flag.flagName;
            return (
              <TableRow key={`${tenantId}:${flag.flagName}`}>
                <TableCell className="font-mono text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{flag.flagName}</span>
                    {!flag.knownDefault ? (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        sem default conhecido
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={flag.enabled}
                      disabled={isUpdating}
                      onCheckedChange={(checked) =>
                        onToggle(flag.flagName, checked)
                      }
                      aria-label={`Alternar ${flag.flagName}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {flag.enabled ? "Ativa" : "Inativa"}
                    </span>
                    {isUpdating ? (
                      <Loader2 className="size-3 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      flag.source === "DB"
                        ? "rounded-full bg-gym-accent/10 px-2 py-0.5 text-xs font-semibold text-gym-accent"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    }
                  >
                    {flag.source === "DB" ? "DB" : "DEFAULT"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {flag.updatedAt ? formatDateTime(flag.updatedAt) : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {flag.updatedByUserId ?? "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

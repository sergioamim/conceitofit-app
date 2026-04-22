"use client";

import { useState } from "react";
import { PlugZap } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import type {
  AgregadorConfigResponse,
  AgregadorSchemaEntry,
  AgregadorTipo,
} from "@/lib/api/agregadores-admin";
import {
  useDeleteAgregadorConfig,
  useTestAgregadorConnection,
} from "@/lib/query/use-agregadores-admin";
import { AgregadorConfigSheet } from "./agregador-config-sheet";

// ─── Helpers ───────────────────────────────────────────────────────────────

export type AgregadorCardStatus =
  | "CONFIGURADO"
  | "CONFIGURADO_DESABILITADO"
  | "NAO_CONFIGURADO";

export function resolveAgregadorStatus(
  config: AgregadorConfigResponse | undefined,
): AgregadorCardStatus {
  if (!config) return "NAO_CONFIGURADO";
  return config.enabled ? "CONFIGURADO" : "CONFIGURADO_DESABILITADO";
}

function StatusBadge({ status }: { status: AgregadorCardStatus }) {
  if (status === "CONFIGURADO") {
    return (
      <Badge
        data-testid="agregador-status-badge"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        variant="outline"
      >
        Configurado
      </Badge>
    );
  }
  if (status === "CONFIGURADO_DESABILITADO") {
    return (
      <Badge
        data-testid="agregador-status-badge"
        className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        variant="outline"
      >
        Configurado, desabilitado
      </Badge>
    );
  }
  return (
    <Badge
      data-testid="agregador-status-badge"
      variant="outline"
      className="text-muted-foreground"
    >
      Não configurado
    </Badge>
  );
}

function flagsAtivas(
  flags: Record<string, unknown> | null | undefined,
): string[] {
  if (!flags) return [];
  return Object.entries(flags)
    .filter(([, value]) => value === true)
    .map(([key]) => key);
}

// ─── Card principal ────────────────────────────────────────────────────────

export interface AgregadorCardProps {
  tenantId: string;
  schema: AgregadorSchemaEntry;
  config?: AgregadorConfigResponse;
}

export function AgregadorCard({ tenantId, schema, config }: AgregadorCardProps) {
  const { toast } = useToast();
  const testMutation = useTestAgregadorConnection();
  const deleteMutation = useDeleteAgregadorConfig(tenantId);
  const status = resolveAgregadorStatus(config);
  const tipo: AgregadorTipo = schema.tipo;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const flagsHabilitadas = flagsAtivas(config?.flags);

  function handleTestConnection() {
    testMutation.mutate(
      { tipo, tenantId },
      {
        onSuccess: (result) => {
          toast({
            title: result.success ? "Conexão OK" : "Falha na conexão",
            description: result.message || result.status || undefined,
            variant: result.success ? "default" : "destructive",
          });
        },
        onError: (error) => {
          toast({
            title: "Falha no teste de conexão",
            description: error?.message || "Erro desconhecido",
            variant: "destructive",
          });
        },
      },
    );
  }

  function handleDelete() {
    deleteMutation.mutate(
      { tipo },
      {
        onSuccess: () => {
          toast({
            title: "Integração desabilitada",
            description: `${schema.nome} — secrets apagados. Ação reversível via "Configurar".`,
          });
          setConfirmDelete(false);
        },
        onError: (error) => {
          toast({
            title: "Falha ao desabilitar",
            description: error?.message || "Erro desconhecido",
            variant: "destructive",
          });
        },
      },
    );
  }

  const jaConfigurado = Boolean(config);

  return (
    <>
      <Card data-testid={`agregador-card-${tipo}`} className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <PlugZap className="mt-0.5 size-5 text-gym-accent" />
              <div>
                <CardTitle className="text-base">{schema.nome}</CardTitle>
                <p className="text-xs text-muted-foreground">{tipo}</p>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 text-sm">
          {jaConfigurado ? (
            <dl className="space-y-1.5 text-xs">
              {config?.externalGymId ? (
                <div className="flex items-start gap-2">
                  <dt className="min-w-[120px] font-medium text-muted-foreground">
                    external_gym_id
                  </dt>
                  <dd className="font-mono text-foreground">
                    {config.externalGymId}
                  </dd>
                </div>
              ) : null}
              {config?.siteId ? (
                <div className="flex items-start gap-2">
                  <dt className="min-w-[120px] font-medium text-muted-foreground">
                    site_id
                  </dt>
                  <dd className="font-mono text-foreground">{config.siteId}</dd>
                </div>
              ) : null}
              <div className="flex items-start gap-2">
                <dt className="min-w-[120px] font-medium text-muted-foreground">
                  Secrets
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className={
                      config?.hasToken
                        ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }
                  >
                    access_token: {config?.hasToken ? "sim" : "não"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      config?.hasWebhookSecret
                        ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }
                  >
                    webhook_secret:{" "}
                    {config?.hasWebhookSecret ? "sim" : "não"}
                  </Badge>
                </dd>
              </div>
              {flagsHabilitadas.length > 0 ? (
                <div className="flex items-start gap-2 pt-1">
                  <dt className="min-w-[120px] font-medium text-muted-foreground">
                    Flags ativas
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {flagsHabilitadas.map((flag) => (
                      <Badge
                        key={flag}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {flag}
                      </Badge>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhuma configuração ativa para este agregador neste tenant.
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            <Button
              size="sm"
              variant={jaConfigurado ? "outline" : "default"}
              onClick={() => setSheetOpen(true)}
              data-testid={`agregador-action-${
                jaConfigurado ? "editar" : "configurar"
              }`}
            >
              {jaConfigurado ? "Editar" : "Configurar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestConnection}
              disabled={!jaConfigurado || testMutation.isPending}
              data-testid="agregador-action-test"
            >
              {testMutation.isPending ? "Testando..." : "Testar conexão"}
            </Button>
            {jaConfigurado ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                disabled={deleteMutation.isPending}
                data-testid="agregador-action-desabilitar"
              >
                {deleteMutation.isPending ? "Desabilitando..." : "Desabilitar"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <AgregadorConfigSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tenantId={tenantId}
        schema={schema}
        config={config}
      />

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(next) => {
          if (!deleteMutation.isPending) setConfirmDelete(next);
        }}
      >
        <AlertDialogContent data-testid="agregador-desabilitar-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Desabilitar {schema.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              A integração será desabilitada e os secrets serão apagados.
              Ação reversível via &quot;Configurar&quot; novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
              data-testid="agregador-desabilitar-confirm-action"
            >
              Desabilitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

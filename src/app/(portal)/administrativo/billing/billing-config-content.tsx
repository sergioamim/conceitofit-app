"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTimeBR } from "@/lib/formatters";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { z } from "zod";
import { CheckCircle, Loader2, WifiOff, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTenantContext, useAuthAccess } from "@/lib/tenant/hooks/use-session-context";
import {
  useBillingConfig,
  useSaveBillingConfig,
  useTestBillingConnection,
} from "@/lib/query/use-billing-config";
import { useHydrated } from "@/hooks/use-hydrated";
import type { BillingConfig, ProvedorGateway } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

const PROVEDOR_OPTIONS: { value: ProvedorGateway; label: string }[] = [
  { value: "PAGARME", label: "Pagar.me" },
  { value: "STRIPE", label: "Stripe" },
  { value: "MERCADO_PAGO", label: "Mercado Pago" },
  { value: "ASAAS", label: "Asaas" },
  { value: "CIELO_ECOMMERCE", label: "Cielo E-commerce" },
  { value: "OUTRO", label: "Outro" },
];

const AMBIENTE_OPTIONS: { value: "SANDBOX" | "PRODUCAO"; label: string }[] = [
  { value: "SANDBOX", label: "Sandbox (testes)" },
  { value: "PRODUCAO", label: "Produção" },
];

const billingFormSchema = z.object({
  provedorAtivo: z.enum(["PAGARME", "STRIPE", "MERCADO_PAGO", "CIELO_ECOMMERCE", "ASAAS", "OUTRO"], {
    message: "Selecione o provedor.",
  }),
  chaveApi: requiredTrimmedString("Informe a chave da API."),
  ambiente: z.enum(["SANDBOX", "PRODUCAO"]).default("SANDBOX"),
  ativo: z.boolean().default(false),
});

type BillingFormValues = z.infer<typeof billingFormSchema>;

function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}${"•".repeat(Math.min(key.length - 8, 16))}${key.slice(-4)}`;
}

function toFormValues(config: BillingConfig): BillingFormValues {
  return {
    provedorAtivo: config.provedorAtivo,
    chaveApi: config.chaveApi,
    ambiente: config.ambiente,
    ativo: config.ativo,
  };
}

function ConnectionStatusBadge({ status }: { status: BillingConfig["statusConexao"] }) {
  if (status === "ONLINE") {
    return (
      <Badge className="bg-gym-teal text-white hover:bg-gym-teal/90">
        <CheckCircle className="mr-1 size-3" />
        Online
      </Badge>
    );
  }
  if (status === "OFFLINE") {
    return (
      <Badge variant="destructive">
        <WifiOff className="mr-1 size-3" />
        Offline
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      Não configurado
    </Badge>
  );
}

export function BillingConfigContent() {
  const { toast } = useToast();
  const { tenantId } = useTenantContext();
  const access = useAuthAccess();
  const hydrated = useHydrated();

  const [showKey, setShowKey] = useState(false);

  const { data: config, isLoading: loading, error: queryError } = useBillingConfig({ tenantId });
  const saveMutation = useSaveBillingConfig(tenantId);
  const testMutation = useTestBillingConnection(tenantId);
  const saving = saveMutation.isPending;
  const testing = testMutation.isPending;
  const loadError = queryError ? normalizeErrorMessage(queryError) : null;

  const form = useForm<BillingFormValues>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: {
      provedorAtivo: "ASAAS",
      chaveApi: "",
      ambiente: "SANDBOX",
      ativo: false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (config) {
      form.reset(toFormValues(config));
    }
  }, [config, form]);

  const webhookUrl = useMemo(() => {
    if (!hydrated || !tenantId) return "";
    return `${window.location.origin}/api/webhooks/billing/${tenantId}`;
  }, [hydrated, tenantId]);

  async function handleSave(values: BillingFormValues) {
    if (!tenantId) return;
    try {
      const saved = await saveMutation.mutateAsync({
        provedorAtivo: values.provedorAtivo,
        chaveApi: values.chaveApi,
        ambiente: values.ambiente,
        ativo: values.ativo,
      });
      toast({
        title: "Configuração salva",
        description: `Provedor ${PROVEDOR_OPTIONS.find((p) => p.value === saved.provedorAtivo)?.label ?? saved.provedorAtivo} configurado.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar configuração",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    }
  }

  async function handleTestConnection() {
    if (!tenantId) return;
    try {
      const result = await testMutation.mutateAsync();
      if (result.success) {
        toast({ title: "Conexão OK", description: result.message || "Gateway respondeu com sucesso." });
      } else {
        toast({ title: "Falha na conexão", description: result.message || "Não foi possível conectar ao gateway.", variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Erro ao testar conexão",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    }
  }

  const accessDenied = !access.loading && !access.canAccessElevatedModules;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Carregando configuração...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">Cobrança Recorrente</h1>
        <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">{loadError}</div>
        <Button variant="outline" onClick={() => config ? form.reset(toFormValues(config)) : undefined}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">Cobrança Recorrente</h1>
        <p className="text-sm text-muted-foreground">
          Configure o gateway de pagamento para cobranças automáticas de matrículas e mensalidades.
        </p>
      </header>

      {accessDenied ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          Apenas usuários com permissão elevada podem configurar cobrança recorrente.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status da conexão</p>
          <div className="mt-2">
            <ConnectionStatusBadge status={config?.statusConexao ?? "NAO_CONFIGURADO"} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provedor ativo</p>
          <p className="mt-2 text-lg font-bold text-foreground">
            {config?.provedorAtivo
              ? PROVEDOR_OPTIONS.find((p) => p.value === config.provedorAtivo)?.label ?? config.provedorAtivo
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ambiente</p>
          <p className="mt-2 text-lg font-bold text-foreground">
            {config?.ambiente === "PRODUCAO" ? (
              <Badge variant="outline" className="border-gym-warning text-gym-warning">Produção</Badge>
            ) : (
              <Badge variant="outline">Sandbox</Badge>
            )}
          </p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Configuração do gateway</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Informe as credenciais do provedor de pagamento para habilitar cobranças automáticas.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || saving || accessDenied || !config?.chaveApi}
            >
              {testing ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <Zap className="mr-1 size-3.5" />}
              {testing ? "Testando..." : "Testar conexão"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Provedor *
                </label>
                <Controller
                  control={form.control}
                  name="provedorAtivo"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={accessDenied}>
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue placeholder="Selecione o provedor" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {PROVEDOR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.provedorAtivo ? (
                  <p className="text-xs text-gym-danger">{form.formState.errors.provedorAtivo.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ambiente *
                </label>
                <Controller
                  control={form.control}
                  name="ambiente"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={accessDenied}>
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {AMBIENTE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Chave da API *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    {showKey ? "Ocultar" : "Exibir"}
                  </button>
                </div>
                {showKey ? (
                  <Input
                    {...form.register("chaveApi")}
                    className="border-border bg-secondary font-mono text-sm"
                    placeholder="sk_live_..."
                    disabled={accessDenied}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-muted-foreground">
                      {form.watch("chaveApi") ? maskApiKey(form.watch("chaveApi")) : "Nenhuma chave configurada"}
                    </code>
                  </div>
                )}
                {form.formState.errors.chaveApi ? (
                  <p className="text-xs text-gym-danger">{form.formState.errors.chaveApi.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Webhook URL
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md border border-border bg-secondary/50 px-3 py-2 font-mono text-xs text-muted-foreground">
                    {webhookUrl || "—"}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!webhookUrl}
                    onClick={() => {
                      void navigator.clipboard.writeText(webhookUrl);
                      toast({ title: "URL copiada" });
                    }}
                    className="border-border"
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure esta URL no painel do provedor para receber notificações de pagamento.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    {...form.register("ativo")}
                    disabled={accessDenied}
                  />
                  <span className="font-medium">Ativar cobrança recorrente automática</span>
                </label>
                <p className="mt-1 pl-6 text-xs text-muted-foreground">
                  Quando ativo, novas matrículas com planos recorrentes criarão assinaturas no gateway automaticamente.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => config ? form.reset(toFormValues(config)) : undefined} disabled={saving} className="border-border">
                Descartar alterações
              </Button>
              <Button type="submit" disabled={saving || accessDenied || !form.formState.isValid}>
                {saving ? "Salvando..." : "Salvar configuração"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {config?.ultimoTesteEm ? (
        <p className="text-xs text-muted-foreground">
          Último teste de conexão: {formatDateTimeBR(config.ultimoTesteEm)}
        </p>
      ) : null}
    </div>
  );
}

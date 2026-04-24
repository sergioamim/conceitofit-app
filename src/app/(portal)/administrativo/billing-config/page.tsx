/**
 * Task 477: Página de configuração de billing recorrente por academia.
 *
 * Permite configurar gateway (Pagar.me, Stripe, etc), API keys,
 * ciclo de cobrança, regras de retry e multa por atraso.
 */

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  useBillingConfig,
  useSaveBillingConfig,
  useTestBillingConnection,
} from "@/lib/query/use-billing-config";
import type { ProvedorGateway } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const billingConfigSchema = z.object({
  provedorAtivo: z.enum(["PAGARME", "STRIPE", "MERCADO_PAGO", "ASAAS", "OUTRO", "CIELO_ECOMMERCE"]),
  chaveApi: z.string().min(1, "Chave de API é obrigatória"),
  ambiente: z.enum(["SANDBOX", "PRODUCAO"]),
  ativo: z.boolean(),
  cicloCobranca: z.enum(["MENSAL", "TRIMESTRAL", "ANUAL"]).default("MENSAL"),
  maxTentativas: z.coerce.number().int().min(1).max(10).default(3),
  multaAtraso: z.coerce.number().min(0).max(100).default(2),
});

type BillingConfigForm = z.infer<typeof billingConfigSchema>;

const PROVEDOR_LABELS: Record<ProvedorGateway, string> = {
  PAGARME: "Pagar.me",
  STRIPE: "Stripe",
  MERCADO_PAGO: "Mercado Pago",
  CIELO_ECOMMERCE: "Cielo E-commerce",
  ASAAS: "Asaas",
  OUTRO: "Outro",
};

export default function BillingConfigPage() {
  const { tenantId } = useTenantContext();
  const { toast } = useToast();
  const [configExistente, setConfigExistente] = useState(false);

  // Server state via TanStack Query
  const { data: configData, isLoading: loading } = useBillingConfig({
    tenantId: tenantId ?? undefined,
  });
  const saveMutation = useSaveBillingConfig(tenantId ?? undefined);
  const testMutation = useTestBillingConnection(tenantId ?? undefined);

  const saving = saveMutation.isPending;
  const testing = testMutation.isPending;

  const form = useForm<BillingConfigForm>({
    resolver: zodResolver(billingConfigSchema),
    mode: "onChange",
    defaultValues: {
      provedorAtivo: "PAGARME",
      chaveApi: "",
      ambiente: "SANDBOX",
      ativo: false,
      cicloCobranca: "MENSAL",
      maxTentativas: 3,
      multaAtraso: 2,
    },
  });

  // Populate form when config loads from server
  useEffect(() => {
    if (configData) {
      setConfigExistente(true);
      const provedorValido = ["PAGARME", "STRIPE", "MERCADO_PAGO", "ASAAS", "OUTRO", "CIELO_ECOMMERCE"]
        .includes(configData.provedorAtivo)
        ? (configData.provedorAtivo as BillingConfigForm["provedorAtivo"])
        : "OUTRO";
      form.reset({
        provedorAtivo: provedorValido,
        chaveApi: configData.chaveApi || "",
        ambiente: configData.ambiente as "SANDBOX" | "PRODUCAO" || "SANDBOX",
        ativo: configData.ativo,
        cicloCobranca: "MENSAL",
        maxTentativas: 3,
        multaAtraso: 2,
      });
    }
  }, [configData, form]);

  async function onSubmit(data: BillingConfigForm) {
    if (!tenantId) return;
    try {
      await saveMutation.mutateAsync({
        provedorAtivo: data.provedorAtivo,
        chaveApi: data.chaveApi,
        ambiente: data.ambiente,
        ativo: data.ativo,
      });
      toast({
        title: configExistente ? "Configuração atualizada" : "Configuração criada",
        description: `Gateway ${PROVEDOR_LABELS[data.provedorAtivo]} configurado com sucesso.`,
      });
      setConfigExistente(true);
    } catch (submitError) {
      toast({
        title: "Erro ao salvar configuração",
        description: normalizeErrorMessage(submitError),
        variant: "destructive",
      });
    }
  }

  async function handleTestConnection() {
    if (!tenantId) return;
    try {
      const result = await testMutation.mutateAsync();
      toast({
        title: result.success ? "Conexão bem-sucedida" : "Falha na conexão",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (testError) {
      toast({
        title: "Erro ao testar conexão",
        description: normalizeErrorMessage(testError),
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Carregando configuração de billing...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Configuração de Billing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure o gateway de pagamento para cobranças recorrentes automáticas.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Gateway de Pagamento
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provedor</label>
              <Select
                value={form.watch("provedorAtivo")}
                onValueChange={(v) => form.setValue("provedorAtivo", v as BillingConfigForm["provedorAtivo"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVEDOR_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.provedorAtivo && (
                <p className="text-xs text-gym-danger">{form.formState.errors.provedorAtivo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ambiente</label>
              <Select
                value={form.watch("ambiente")}
                onValueChange={(v) => form.setValue("ambiente", v as "SANDBOX" | "PRODUCAO")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SANDBOX">Sandbox (teste)</SelectItem>
                  <SelectItem value="PRODUCAO">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Chave de API</label>
            <Input
              {...form.register("chaveApi")}
              type="password"
              placeholder="sk_live_..."
              className="bg-secondary border-border"
            />
            {form.formState.errors.chaveApi && (
              <p className="text-xs text-gym-danger">{form.formState.errors.chaveApi.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Billing automatizado</p>
              <p className="text-xs text-muted-foreground">
                Quando ativo, cria assinaturas recorrentes no gateway.
              </p>
            </div>
            <Checkbox
              checked={form.watch("ativo")}
              onCheckedChange={(v) => form.setValue("ativo", Boolean(v))}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Regras de Cobrança
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ciclo de cobrança</label>
              <Select
                value={form.watch("cicloCobranca")}
                onValueChange={(v) => form.setValue("cicloCobranca", v as "MENSAL" | "TRIMESTRAL" | "ANUAL")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MENSAL">Mensal</SelectItem>
                  <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                  <SelectItem value="ANUAL">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Máx. tentativas de retry</label>
              <Input
                {...form.register("maxTentativas", { valueAsNumber: true })}
                type="number"
                min={1}
                max={10}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                Tentativas de cobrança após falha.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Multa por atraso (%)</label>
              <Input
                {...form.register("multaAtraso", { valueAsNumber: true })}
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                Percentual de multa aplicada após vencimento.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || !form.formState.isValid}>
            {saving ? "Salvando..." : configExistente ? "Atualizar configuração" : "Criar configuração"}
          </Button>
          <Button type="button" variant="outline" onClick={handleTestConnection} disabled={testing}>
            {testing ? "Testando..." : "Testar conexão"}
          </Button>
        </div>
      </form>
    </div>
  );
}

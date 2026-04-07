"use client";

import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  whatsAppProviderConfigSchema,
  type WhatsAppProviderConfigValues,
} from "@/lib/forms/whatsapp-schemas";
import type { WhatsAppConfig } from "@/lib/types";
import {
  useSaveWhatsAppConfig,
  useTestWhatsAppConnection,
  useSendWhatsAppMessage,
} from "@/lib/query/use-whatsapp";

interface Props {
  config: WhatsAppConfig | null | undefined;
  tenantId: string;
  isLoading: boolean;
}

export function WhatsAppProviderConfig({ config, tenantId, isLoading }: Props) {
  const { toast } = useToast();
  const saveConfig = useSaveWhatsAppConfig();
  const testConnection = useTestWhatsAppConnection();
  const sendMessage = useSendWhatsAppMessage();
  const [testNumber, setTestNumber] = useState("");

  const form = useForm<WhatsAppProviderConfigValues>({
    resolver: zodResolver(whatsAppProviderConfigSchema),
    values: {
      provedor: config?.provedor ?? "EVOLUTION_API",
      apiUrl: config?.apiUrl ?? "",
      apiKey: config?.apiKey ?? "",
      instanciaId: config?.instanciaId ?? "",
      numeroRemetente: config?.numeroRemetente ?? "",
      ativo: config?.ativo ?? false,
    },
  });

  const handleSave = useCallback(
    async (values: WhatsAppProviderConfigValues) => {
      try {
        await saveConfig.mutateAsync({ tenantId, data: values });
        toast({ title: "Configuração salva" });
      } catch (error) {
        toast({
          title: "Erro ao salvar configuração",
          description: normalizeErrorMessage(error),
          variant: "destructive",
        });
      }
    },
    [saveConfig, tenantId, toast],
  );

  const handleTestConnection = useCallback(async () => {
    try {
      const result = await testConnection.mutateAsync({ tenantId });
      toast({
        title: result.success ? "Conexão OK" : "Falha na conexão",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Erro ao testar conexão",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    }
  }, [testConnection, tenantId, toast]);

  const handleTestSend = useCallback(async () => {
    if (!testNumber.trim()) {
      toast({ title: "Informe o número de teste", variant: "destructive" });
      return;
    }
    try {
      await sendMessage.mutateAsync({
        tenantId,
        data: {
          evento: "CUSTOM",
          destinatario: testNumber,
          destinatarioNome: "Teste",
          variaveis: { NOME: "Teste" },
        },
      });
      toast({ title: "Mensagem de teste enviada" });
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem de teste",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    }
  }, [sendMessage, tenantId, testNumber, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Provedor</Label>
            <Controller
              control={form.control}
              name="provedor"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVOLUTION_API">Evolution API</SelectItem>
                    <SelectItem value="WHATSAPP_BUSINESS">WhatsApp Business API</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-api-url">URL da API</Label>
            <Input
              id="wa-api-url"
              placeholder="https://api.provider.com"
              {...form.register("apiUrl")}
            />
            {form.formState.errors.apiUrl && (
              <p className="text-xs text-gym-danger">{form.formState.errors.apiUrl.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wa-api-key">API Key</Label>
            <Input
              id="wa-api-key"
              type="password"
              placeholder="Chave de autenticação"
              {...form.register("apiKey")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-instancia">ID da Instância</Label>
            <Input
              id="wa-instancia"
              placeholder="instance-id"
              {...form.register("instanciaId")}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wa-numero">Número Remetente</Label>
            <Input
              id="wa-numero"
              placeholder="+5511999999999"
              {...form.register("numeroRemetente")}
            />
          </div>
          <div className="flex items-end pb-1">
            <Controller
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  />
                  <Label>Integração ativa</Label>
                </div>
              )}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saveConfig.isPending}>
            {saveConfig.isPending ? "Salvando..." : "Salvar configuração"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={testConnection.isPending}
          >
            <Wifi className="mr-2 size-4" />
            {testConnection.isPending ? "Testando..." : "Testar conexão"}
          </Button>
        </div>
      </form>

      {/* Envio de teste */}
      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <h3 className="mb-3 text-sm font-semibold">Enviar mensagem de teste</h3>
        <div className="flex gap-2">
          <Input
            placeholder="+5511999999999"
            value={testNumber}
            onChange={(e) => setTestNumber(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            onClick={handleTestSend}
            disabled={sendMessage.isPending}
          >
            <Send className="mr-2 size-4" />
            {sendMessage.isPending ? "Enviando..." : "Enviar teste"}
          </Button>
        </div>
        {sendMessage.isSuccess && (
          <p className="mt-2 flex items-center gap-1 text-sm text-gym-teal">
            <CheckCircle2 className="size-4" /> Mensagem enviada com sucesso
          </p>
        )}
      </div>
    </div>
  );
}

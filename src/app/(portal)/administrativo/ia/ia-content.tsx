"use client";

import { useState } from "react";
import { formatDateTimeBR } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getBotPromptApi, getBotPromptTemplateApi } from "@/lib/api/bot";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useToast } from "@/components/ui/use-toast";
import { useAdminCrud } from "@/lib/query/use-admin-crud";

type BotPromptResponse = { prompt?: string; generatedAt?: string };

export function IaContent() {
  const { toast } = useToast();
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const {
    items: promptItems,
    isLoading: loadingPrompt,
    refetch: loadPrompt,
  } = useAdminCrud<BotPromptResponse>({
    domain: "ia",
    tenantId,
    enabled: Boolean(tenantId),
    listFn: async (tid) => {
      const response = await getBotPromptApi({ tenantId: tid });
      return [response];
    },
  });

  const promptData = promptItems[0];
  const prompt = promptData?.prompt ?? "";
  const generatedAt = promptData?.generatedAt;

  const [template, setTemplate] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  async function loadTemplate() {
    setLoadingTemplate(true);
    try {
      const raw = await getBotPromptTemplateApi();
      setTemplate(raw);
    } catch {
      toast({
        title: "Erro ao carregar template",
        description: "Não foi possível obter o template bruto.",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplate(false);
    }
  }

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      toast({ title: "Prompt copiado" });
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Verifique as permissões do navegador.",
        variant: "destructive",
      });
    }
  }

  const generatedLabel = generatedAt ? formatDateTimeBR(generatedAt) : "—";

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Administrativo &gt; Integração com IA</p>
        <h1 className="text-3xl font-bold leading-tight">Integração com IA</h1>
        <p className="text-sm text-muted-foreground">
          Visualize o prompt gerado para a unidade (tenant) atual e use-o nos agentes de IA.
        </p>
      </header>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg ">Prompt atualizado</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fonte: GET /api/v1/bot/prompt — gerado em {generatedLabel}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCopyPrompt} disabled={!prompt}>
              Copiar prompt
            </Button>
            <Button onClick={() => void loadPrompt()} disabled={loadingPrompt}>
              {loadingPrompt ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </CardHeader>
       <Separator />
       <CardContent>
          <textarea
            value={prompt}
            readOnly
            className="min-h-[360px] w-full rounded-md border border-border bg-secondary p-3 font-mono text-sm"
            placeholder="Nenhum prompt disponível"
          />
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          O prompt considera dados da unidade (tenant) atual. Recarregue para refletir alterações recentes.
        </CardFooter>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Template bruto</CardTitle>
            <p className="text-sm text-muted-foreground">GET /api/v1/bot/prompt/template</p>
          </div>
          <Button variant="outline" onClick={loadTemplate} disabled={loadingTemplate}>
            {loadingTemplate ? "Carregando..." : "Exibir template"}
          </Button>
        </CardHeader>
       <Separator />
       <CardContent>
          <textarea
            value={template ?? ""}
            readOnly
            className="min-h-[220px] w-full rounded-md border border-border bg-secondary p-3 font-mono text-sm"
            placeholder="Clique em Exibir template para carregar."
          />
        </CardContent>
      </Card>
    </div>
  );
}

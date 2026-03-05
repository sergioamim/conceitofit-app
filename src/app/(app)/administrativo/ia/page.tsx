"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getBotPrompt, getBotPromptTemplate } from "@/lib/mock/services";
import { useToast } from "@/components/ui/use-toast";

export default function AdministrativoIaPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string | undefined>(undefined);
  const [template, setTemplate] = useState<string | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const loadPrompt = useCallback(async () => {
    setLoadingPrompt(true);
    try {
      const response = await getBotPrompt();
      setPrompt(response.prompt ?? "");
      setGeneratedAt(response.generatedAt ?? undefined);
    } catch {
      toast({
        title: "Erro ao carregar prompt",
        description: "Não foi possível obter o prompt da API.",
        variant: "destructive",
      });
    } finally {
      setLoadingPrompt(false);
    }
  }, [toast]);

  const loadTemplate = useCallback(async () => {
    setLoadingTemplate(true);
    try {
      const raw = await getBotPromptTemplate();
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
  }, [toast]);

  useEffect(() => {
    void loadPrompt();
  }, [loadPrompt]);

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

  const generatedLabel = generatedAt ? new Date(generatedAt).toLocaleString("pt-BR") : "—";

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Administrativo &gt; Integração com IA</p>
        <h1 className="text-3xl font-display font-bold leading-tight">Integração com IA</h1>
        <p className="text-sm text-muted-foreground">
          Visualize o prompt gerado para a unidade (tenant) atual e use-o nos agentes de IA.
        </p>
      </header>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-display">Prompt atualizado</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fonte: GET /api/v1/bot/prompt — gerado em {generatedLabel}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCopyPrompt} disabled={!prompt}>
              Copiar prompt
            </Button>
            <Button onClick={loadPrompt} disabled={loadingPrompt}>
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
            <CardTitle className="text-base font-display">Template bruto</CardTitle>
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
            placeholder="Clique em “Exibir template” para carregar."
          />
        </CardContent>
      </Card>
    </div>
  );
}

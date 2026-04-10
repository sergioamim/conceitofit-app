"use client";

/**
 * Painel lateral de assistente de IA para conversas do atendimento (Task #542).
 *
 * Expõe 4 ações principais:
 *   - Resumir conversa (POST .../ai/resumir)
 *   - Sugerir resposta (POST .../ai/sugerir-resposta)
 *   - Classificar intenção (POST .../ai/classificar-intencao)
 *   - Sugerir próxima ação (POST .../ai/proxima-acao)
 *
 * Usa TanStack Query para cache em staleTime generoso (IA custa tokens).
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Brain,
  CheckCircle2,
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  classificarIntencaoAiApi,
  proximaAcaoAiApi,
  resumirConversaAiApi,
  sugerirRespostaAiApi,
  type ClassificacaoIntencaoResult,
  type ProximaAcaoResult,
  type ResumoConversaResult,
  type SugestaoRespostaResult,
} from "@/lib/api/atendimento-ai";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export interface AiAssistantPanelProps {
  conversationId: string;
  ultimaMensagem?: string;
  /** Se fornecido, permite usar a sugestão como rascunho do input de resposta */
  onUseSuggestion?: (text: string) => void;
}

function formatConfianca(value: number | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

export function AiAssistantPanel({
  conversationId,
  ultimaMensagem,
  onUseSuggestion,
}: AiAssistantPanelProps) {
  const [error, setError] = useState<string | null>(null);

  const resumo = useMutation<ResumoConversaResult, Error, void>({
    mutationFn: () => resumirConversaAiApi({ conversationId }),
    onError: (e) => setError(normalizeErrorMessage(e)),
  });

  const sugestao = useMutation<SugestaoRespostaResult, Error, void>({
    mutationFn: () => sugerirRespostaAiApi({ conversationId, ultimaMensagem }),
    onError: (e) => setError(normalizeErrorMessage(e)),
  });

  const classificacao = useMutation<ClassificacaoIntencaoResult, Error, void>({
    mutationFn: () => {
      if (!ultimaMensagem?.trim()) {
        throw new Error("Sem mensagem para classificar.");
      }
      return classificarIntencaoAiApi({ conversationId, mensagem: ultimaMensagem });
    },
    onError: (e) => setError(normalizeErrorMessage(e)),
  });

  const proximaAcao = useMutation<ProximaAcaoResult, Error, void>({
    mutationFn: () => proximaAcaoAiApi({ conversationId }),
    onError: (e) => setError(normalizeErrorMessage(e)),
  });

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignora — nem todos os browsers têm clipboard */
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-gym-accent" />
          Assistente IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-2 py-1.5 text-xs text-gym-danger">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-border"
            onClick={() => {
              setError(null);
              resumo.mutate();
            }}
            disabled={resumo.isPending}
          >
            {resumo.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5" />
            )}
            Resumir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-border"
            onClick={() => {
              setError(null);
              sugestao.mutate();
            }}
            disabled={sugestao.isPending}
          >
            {sugestao.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Lightbulb className="size-3.5" />
            )}
            Sugerir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-border"
            onClick={() => {
              setError(null);
              classificacao.mutate();
            }}
            disabled={classificacao.isPending || !ultimaMensagem?.trim()}
          >
            {classificacao.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Brain className="size-3.5" />
            )}
            Classificar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-border"
            onClick={() => {
              setError(null);
              proximaAcao.mutate();
            }}
            disabled={proximaAcao.isPending}
          >
            {proximaAcao.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Target className="size-3.5" />
            )}
            Próxima ação
          </Button>
        </div>

        {/* Resumo */}
        {resumo.data ? (
          <div className="rounded-md border border-border bg-secondary/30 p-2">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Resumo ({resumo.data.totalMensagens} msgs)
              </p>
              <button
                type="button"
                onClick={() => handleCopy(resumo.data!.resumo)}
                className="text-muted-foreground hover:text-foreground"
                title="Copiar"
              >
                <Copy className="size-3" />
              </button>
            </div>
            <p className="whitespace-pre-wrap text-xs leading-relaxed">{resumo.data.resumo}</p>
          </div>
        ) : null}

        {/* Sugestão de resposta */}
        {sugestao.data ? (
          <div className="rounded-md border border-gym-accent/30 bg-gym-accent/5 p-2">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gym-accent">
                Sugestão · confiança {formatConfianca(sugestao.data.confianca)}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(sugestao.data!.sugestao)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Copiar"
                >
                  <Copy className="size-3" />
                </button>
                {onUseSuggestion ? (
                  <button
                    type="button"
                    onClick={() => onUseSuggestion(sugestao.data!.sugestao)}
                    className="text-gym-accent hover:underline"
                    title="Usar como resposta"
                  >
                    <CheckCircle2 className="size-3" />
                  </button>
                ) : null}
              </div>
            </div>
            <p className="whitespace-pre-wrap text-xs leading-relaxed">{sugestao.data.sugestao}</p>
          </div>
        ) : null}

        {/* Classificação de intenção */}
        {classificacao.data ? (
          <div className="rounded-md border border-border bg-secondary/30 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Intenção detectada
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {classificacao.data.intencao}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({formatConfianca(classificacao.data.confianca)})
              </span>
            </p>
            {classificacao.data.todasIntencoes ? (
              <div className="mt-1 space-y-0.5">
                {Object.entries(classificacao.data.todasIntencoes)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{k}</span>
                      <span className="font-mono">{formatConfianca(v)}</span>
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Próxima ação */}
        {proximaAcao.data && proximaAcao.data.acoes.length > 0 ? (
          <div className="rounded-md border border-border bg-secondary/30 p-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Próximas ações recomendadas
            </p>
            <ul className="space-y-1.5">
              {proximaAcao.data.acoes.map((acao, i) => (
                <li key={i} className="border-l-2 border-gym-accent pl-2">
                  <p className="text-xs font-semibold">{acao.acao}</p>
                  <p className="text-[11px] text-muted-foreground">{acao.descricao}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

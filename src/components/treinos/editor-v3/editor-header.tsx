"use client";

/**
 * EditorHeader — barra superior do editor V3 (Wave H.4).
 *
 * Extraído de treino-v3-editor.tsx pra fechar débito de tamanho.
 * Renderiza: voltar (Atribuições/Templates) + título inline editável
 * + meta line + pill do aluno (modo instance) + botões Reset/Preview/
 * Salvar.
 */

import Link from "next/link";
import { ArrowLeft, Save, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TreinoV2EditorSeed } from "@/lib/tenant/treinos/v2-runtime";
import type { Treino } from "@/lib/types";

export interface EditorHeaderProps {
  /** Estado atual do editor (nome / categoria / frequencia / sessoes). */
  editor: TreinoV2EditorSeed;
  /** Treino baseline — usado pra mostrar "↳ baseado em" no instance mode. */
  treino: Treino;
  /** Atualiza o nome do template (editável inline). */
  onNomeChange: (nome: string) => void;
  /** True quando estamos editando overlay por aluno. */
  isInstance: boolean;
  /** Nome do aluno alvo no modo instance. */
  alunoNome?: string;
  /** Quantidade de campos divergentes do template original (modo instance). */
  customCount: number;
  /** Bloqueia botões enquanto salva. */
  saving: boolean;
  /** Reset = volta pra baseline (instance only). */
  onReset: () => void;
  /** Abre modal de pré-visualização. */
  onPreview: () => void;
  /** Persiste template ou overrides. */
  onSave: () => void;
}

export function EditorHeader({
  editor,
  treino,
  onNomeChange,
  isInstance,
  alunoNome,
  customCount,
  saving,
  onReset,
  onPreview,
  onSave,
}: EditorHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-1 items-center gap-3">
        <Button asChild variant="outline" size="sm" className="border-border">
          <Link href={isInstance ? "/treinos/atribuidos" : "/treinos"}>
            <ArrowLeft className="mr-1 size-4" />
            {isInstance ? "Atribuições" : "Templates"}
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          {isInstance && alunoNome ? (
            <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded-full bg-secondary px-2 py-0.5 font-medium">
                {alunoNome}
              </span>
              {customCount > 0 ? (
                <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/20">
                  {customCount} {customCount === 1 ? "custom" : "customs"}
                </Badge>
              ) : null}
            </div>
          ) : null}
          <Input
            value={editor.nome ?? ""}
            onChange={(e) => onNomeChange(e.target.value)}
            className="border-0 bg-transparent px-0 font-display text-xl font-bold focus-visible:ring-0"
            placeholder="Nome do template"
            disabled={isInstance}
          />
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {isInstance ? (
              <span className="text-gym-accent">
                ↳ baseado em &ldquo;{treino.nome ?? "template"}&rdquo;
              </span>
            ) : (
              <span>{editor.categoria ?? "Sem objetivo"}</span>
            )}
            <span>·</span>
            <span>
              {editor.frequenciaSemanal ?? 0}x/sem
              {!isInstance ? (
                <span
                  className="ml-1 italic text-muted-foreground/70"
                  title="Frequência sugerida — pode ser ajustada por aluno na atribuição"
                >
                  (sugerida)
                </span>
              ) : null}
            </span>
            <span>·</span>
            <span>{editor.sessoes.length} sessões</span>
            <Badge variant="outline" className="ml-2 border-gym-accent/30 text-gym-accent">
              Editor V3 {isInstance ? "(instância)" : "(preview)"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {isInstance && customCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={onReset}
          >
            <Trash2 className="mr-2 size-4" />
            Resetar
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="border-border"
          onClick={onPreview}
        >
          <Send className="mr-2 size-4" />
          Pré-visualizar
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          <Save className="mr-2 size-4" />
          {saving
            ? "Salvando..."
            : isInstance
              ? `Salvar para ${alunoNome?.split(" ")[0] ?? "aluno"}`
              : "Salvar template"}
        </Button>
      </div>
    </div>
  );
}

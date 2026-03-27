"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TreinoV2EditorSeed } from "@/lib/treinos/v2-runtime";
import type { Treino } from "@/lib/types";
import { NumberField } from "./shared";

type TreinoFormProps = {
  editor: TreinoV2EditorSeed;
  treino: Treino;
  onUpdateEditor: (updater: (current: TreinoV2EditorSeed) => TreinoV2EditorSeed) => void;
};

export function TreinoForm({ editor, treino, onUpdateEditor }: TreinoFormProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">Shell do editor</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-1.5 xl:col-span-2">
          <Label htmlFor="treino-v2-nome">Nome *</Label>
          <Input
            id="treino-v2-nome"
            value={editor.nome}
            onChange={(event) => onUpdateEditor((current) => ({ ...current, nome: event.target.value }))}
          />
        </div>
        <NumberField
          label="Frequência semanal *"
          value={editor.frequenciaSemanal}
          onChange={(value) =>
            onUpdateEditor((current) => ({
              ...current,
              frequenciaSemanal: value,
            }))
          }
        />
        <NumberField
          label="Total semanas *"
          value={editor.totalSemanas}
          onChange={(value) =>
            onUpdateEditor((current) => ({
              ...current,
              totalSemanas: value,
            }))
          }
        />
        <div className="space-y-1.5">
          <Label htmlFor="treino-v2-categoria">Categoria</Label>
          <Input
            id="treino-v2-categoria"
            value={editor.categoria}
            onChange={(event) => onUpdateEditor((current) => ({ ...current, categoria: event.target.value }))}
            placeholder="Hipertrofia, condicionamento, reabilitação..."
          />
        </div>
        <label className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={editor.versaoSimplificadaHabilitada}
            onChange={(event) =>
              onUpdateEditor((current) => ({
                ...current,
                versaoSimplificadaHabilitada: event.target.checked,
              }))
            }
          />
          Versão simplificada
        </label>

        {editor.mode === "ASSIGNED" ? (
          <>
            <div className="space-y-1.5 xl:col-span-2">
              <Label>Aluno</Label>
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                {treino.alunoNome ?? "Aluno não informado"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                {editor.origem}
              </div>
            </div>
            <div className="space-y-1.5 xl:col-span-3">
              <Label htmlFor="treino-v2-observacoes">Observações do editor</Label>
              <Textarea
                id="treino-v2-observacoes"
                value={editor.observacoes}
                onChange={(event) => onUpdateEditor((current) => ({ ...current, observacoes: event.target.value }))}
                className="min-h-24"
              />
            </div>
          </>
        ) : (
          <div className="space-y-1.5 xl:col-span-6">
            <Label htmlFor="treino-v2-observacoes">Descrição e observações</Label>
            <Textarea
              id="treino-v2-observacoes"
              value={editor.observacoes}
              onChange={(event) => onUpdateEditor((current) => ({ ...current, observacoes: event.target.value }))}
              className="min-h-24"
              placeholder="Contexto técnico, critérios de revisão, notas de publicação, etc."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  getTreino,
  listAlunosPage,
  updateTreino,
} from "@/lib/mock/services";
import type { Aluno, Treino, TreinoItem } from "@/lib/types";

type TreinoEditForm = {
  alunoId: string;
  alunoNome: string;
  vencimento: string;
  observacoes?: string;
  ativo: boolean;
};

function emptyDate(days = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function sortLabelDesc(valueA: string, valueB: string): number {
  return valueB.localeCompare(valueA);
}

export default function TreinoDetalhePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const treinoId = params?.id || "";
  const [treino, setTreino] = useState<Treino | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [form, setForm] = useState<TreinoEditForm | null>(null);
  const [clienteQuery, setClienteQuery] = useState("");

  const loadAlunosOnce = useCallback(async (): Promise<Aluno[]> => {
    // Single, bounded request to evitar múltiplas chamadas.
    const pageSize = 200;
    const result = await listAlunosPage({ page: 0, size: pageSize });
    return result.items;
  }, []);

  const loadData = useCallback(async () => {
    if (!treinoId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [treinoData, alunosData] = await Promise.all([
        getTreino(treinoId),
        loadAlunosOnce(),
      ]);

      if (!treinoData) {
        setNotFound(true);
        setTreino(null);
        setForm(null);
        return;
      }

      const alunoNomeById = new Map(alunosData.map((item) => [item.id, item.nome]));
      const alunoNome =
        treinoData.alunoNome && treinoData.alunoNome !== "Cliente não identificado"
          ? treinoData.alunoNome
          : alunoNomeById.get(treinoData.alunoId) || treinoData.alunoNome;

      const treinoNormalized: Treino = {
        ...treinoData,
        alunoNome,
        atividadeNome: undefined,
        funcionarioNome: treinoData.funcionarioNome,
      };

      setTreino(treinoNormalized);
      setAlunos(alunosData);
      setClienteQuery(alunoNome ?? "");
      setForm({
        alunoId: treinoNormalized.alunoId,
        alunoNome,
        vencimento: treinoNormalized.vencimento || emptyDate(),
        observacoes: treinoNormalized.observacoes,
        ativo: treinoNormalized.ativo,
      });
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [treinoId, loadAlunosOnce]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const alunoOptions = useMemo(
    () =>
      alunos
        .map((aluno) => ({
          id: aluno.id,
          label: aluno.nome,
          searchText: `${aluno.cpf ?? ""} ${aluno.email ?? ""}`.trim(),
        }))
        .sort((a, b) => sortLabelDesc(a.label, b.label)),
    [alunos],
  );

  async function handleSave() {
    if (!form || saving) return;
    if (!form.alunoId) {
      setError("Informe o aluno do treino.");
      return;
    }
    if (!form.vencimento) {
      setError("Informe a data de vencimento.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateTreino(treinoId, {
        alunoId: form.alunoId,
        alunoNome: form.alunoNome,
        vencimento: form.vencimento,
        observacoes: form.observacoes,
        ativo: form.ativo,
      });
      setTreino(updated);
      router.push("/treinos");
    } catch (saveError) {
      setError(normalizeErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  const itensOrdenados = useMemo(
    () => (treino?.itens ? [...treino.itens].sort((a, b) => a.ordem - b.ordem) : []),
    [treino?.itens],
  );

  const itensPorDia = useMemo(() => {
    if (!itensOrdenados.length) return [];
    const groups = new Map<string, TreinoItem[]>();
    const normalizeDia = (dia?: string) => (dia && dia.trim() ? dia.trim().toUpperCase() : "DIA ÚNICO");
    for (const item of itensOrdenados) {
      const dias = item.diasSemana && item.diasSemana.length ? item.diasSemana : [undefined];
      for (const dia of dias) {
        const key = normalizeDia(dia);
        const list = groups.get(key) ?? [];
        list.push(item);
        groups.set(key, list);
      }
    }
    return Array.from(groups.entries()).map(([dia, items]) => ({
      dia,
      items: items.sort((a, b) => a.ordem - b.ordem),
    }));
  }, [itensOrdenados]);

  if (loading) {
    return (
      <div className="space-y-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando treino...
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="space-y-2">
        <Breadcrumb
          items={[
            { label: "Treinos", href: "/treinos" },
            { label: "Treino não encontrado" },
          ]}
        />
        <h1 className="text-xl font-bold">Treino não encontrado</h1>
        <Button variant="outline" onClick={() => router.push("/treinos")}>
          <ArrowLeft className="mr-2 size-4" />
          Voltar para treinos
        </Button>
      </div>
    );
  }

  const canSave = Boolean(form.alunoId && form.vencimento);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Treinos", href: "/treinos" },
          { label: treino?.nome ?? treino?.atividadeNome ?? "Treino" },
        ]}
      />

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">Treino</h1>
        <Button variant="outline" onClick={() => router.push("/treinos")}>
          <ArrowLeft className="mr-2 size-4" />
          Voltar
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Customizar / Alterar treino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Aluno
            </label>
            <SuggestionInput
              value={clienteQuery}
              onValueChange={(value) => {
                setClienteQuery(value);
                if (!value) {
                  setForm((current) =>
                    current ? { ...current, alunoId: "", alunoNome: "" } : null
                  );
                }
              }}
              onSelect={(option) => {
                const selected = alunos.find((a) => a.id === option.id);
                if (!selected || !form) return;
                setClienteQuery(selected.nome);
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        alunoId: selected.id,
                        alunoNome: selected.nome,
                      }
                    : null
                );
              }}
              onFocusOpen={() => {
                setClienteQuery(clienteQuery);
              }}
              options={alunoOptions}
              placeholder="Digite o nome, CPF ou e-mail"
              minCharsToSearch={0}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Professor
              </label>
              <p className="text-sm text-foreground">
                {treino?.funcionarioNome ?? "Professor atual do treino"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vencimento
            </label>
            <Input
              type="date"
              value={form.vencimento}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, vencimento: event.target.value } : current
                )
              }
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </label>
            <textarea
              value={form.observacoes || ""}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, observacoes: event.target.value } : current
                )
              }
              className="min-h-28 w-full rounded-md border border-border bg-secondary p-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, ativo: event.target.checked } : current
                )
              }
            />
            Treino ativo
          </label>

          {error && <p className="text-sm text-gym-danger">{error}</p>}

          <Button onClick={handleSave} disabled={saving || !canSave} className="w-full sm:w-auto">
            <Save className="mr-2 size-4" />
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>

          {!canSave && (
            <p className="text-xs text-gym-warning">
              Selecione um aluno e defina um vencimento para salvar.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Séries e exercícios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {itensOrdenados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum exercício cadastrado para este treino.</p>
          ) : (
            <div className="space-y-5">
              {itensPorDia.map((grupo) => (
                <div key={grupo.dia} className="overflow-hidden rounded-lg border border-border">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-secondary px-4 py-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="rounded-full bg-card px-2 py-1 text-foreground">{grupo.dia}</span>
                      <span>{grupo.items.length} exercício(s)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 bg-card text-sm">
                    <div className="hidden border-b border-border bg-muted px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[2fr,1fr,1fr,1fr,2fr]">
                      <span>Exercício</span>
                      <span>Séries / Reps</span>
                      <span>Carga / Intervalo</span>
                      <span>Tempo</span>
                      <span>Observação</span>
                    </div>
                    {grupo.items.map((item) => (
                      <div
                        key={`${grupo.dia}-${item.id}`}
                        className="border-b border-border px-4 py-3 last:border-b-0 md:grid md:grid-cols-[2fr,1fr,1fr,1fr,2fr] md:items-center md:gap-3"
                      >
                        <div className="text-sm font-semibold text-foreground">
                          #{item.ordem} {item.exercicioNome ?? "Exercício"}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground md:mt-0">
                          Séries: <span className="font-semibold text-foreground">{item.series}</span>
                          {item.repeticoes ? ` · Reps: ${item.repeticoes}` : ""}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground md:mt-0">
                          {item.carga != null ? `Carga: ${item.carga}` : "Carga: -"}
                          {item.intervaloSegundos != null ? ` · Int: ${item.intervaloSegundos}s` : ""}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground md:mt-0">
                          {item.tempoExecucaoSegundos != null ? `Tempo: ${item.tempoExecucaoSegundos}s` : "Tempo: -"}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground md:mt-0">
                          {item.observacao ?? "Sem observações"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

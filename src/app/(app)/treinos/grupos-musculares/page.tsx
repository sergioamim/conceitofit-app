"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListTree, Search } from "lucide-react";
import { useTenantContext } from "@/hooks/use-session-context";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  listTreinoExercicios,
  listTreinoGruposMusculares,
  saveTreinoGrupoMuscular,
  toggleTreinoGrupoMuscular,
} from "@/lib/treinos/workspace";
import type { Exercicio, GrupoMuscular } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";

type FormState = {
  nome: string;
  descricao: string;
  categoria: NonNullable<GrupoMuscular["categoria"]>;
};

const EMPTY_FORM: FormState = {
  nome: "",
  descricao: "",
  categoria: "SUPERIOR",
};

export default function GruposMuscularesPage() {
  const { tenantId, tenantResolved } = useTenantContext();
  const { toast } = useToast();
  const [grupos, setGrupos] = useState<GrupoMuscular[]>([]);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<GrupoMuscular | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      setError(null);
      const [gruposResponse, exerciciosResponse] = await Promise.all([
        listTreinoGruposMusculares({ tenantId }),
        listTreinoExercicios({ tenantId }),
      ]);
      setGrupos(gruposResponse);
      setExercicios(exerciciosResponse);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;
    void load();
  }, [load, tenantId, tenantResolved]);

  const gruposFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return grupos;
    return grupos.filter((item) =>
      `${item.nome} ${item.descricao ?? ""} ${item.categoria ?? ""}`.toLowerCase().includes(term)
    );
  }, [busca, grupos]);

  const exerciciosPorGrupo = useMemo(() => {
    const map = new Map<string, Exercicio[]>();
    exercicios.forEach((item) => {
      if (!item.grupoMuscularId) return;
      const current = map.get(item.grupoMuscularId) ?? [];
      current.push(item);
      map.set(item.grupoMuscularId, current);
    });
    return map;
  }, [exercicios]);

  function startEdit(item: GrupoMuscular) {
    setEditing(item);
    setForm({
      nome: item.nome,
      descricao: item.descricao ?? "",
      categoria: item.categoria ?? "OUTRO",
    });
  }

  function resetForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!tenantId) return;
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome do grupo muscular", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const saved = await saveTreinoGrupoMuscular({
        tenantId,
        id: editing?.id,
        nome: form.nome,
        descricao: form.descricao,
        categoria: form.categoria,
      });
      setGrupos((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      toast({
        title: editing ? "Grupo muscular atualizado" : "Grupo muscular criado",
        description: saved.nome,
      });
      resetForm();
    } catch (saveError) {
      toast({
        title: "Não foi possível salvar o grupo muscular",
        description: normalizeErrorMessage(saveError),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: GrupoMuscular) {
    if (!tenantId) return;
    try {
      const toggled = await toggleTreinoGrupoMuscular({ tenantId, id: item.id });
      setGrupos((current) => current.map((entry) => (entry.id === toggled.id ? toggled : entry)));
      toast({
        title: toggled.ativo ? "Grupo muscular reativado" : "Grupo muscular inativado",
        description: toggled.nome,
      });
    } catch (toggleError) {
      toast({
        title: "Não foi possível alterar o status do grupo",
        description: normalizeErrorMessage(toggleError),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Grupos Musculares</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastro canônico de grupos musculares para o catálogo web de treinos.
        </p>
      </div>

      {error ? (
        <ListErrorState error={error} onRetry={() => void load()} />
      ) : null}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <ListTree className="size-4 text-gym-accent" />
            {editing ? "Editar grupo muscular" : "Novo grupo muscular"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="grupo-muscular-nome">Nome *</Label>
            <Input
              id="grupo-muscular-nome"
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grupo-muscular-categoria">Categoria</Label>
            <select
              id="grupo-muscular-categoria"
              value={form.categoria}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  categoria: event.target.value as FormState["categoria"],
                }))
              }
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
            >
              <option value="SUPERIOR">Superior</option>
              <option value="INFERIOR">Inferior</option>
              <option value="CORE">Core</option>
              <option value="FUNCIONAL">Funcional</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="grupo-muscular-descricao">Descrição</Label>
            <Textarea
              id="grupo-muscular-descricao"
              value={form.descricao}
              onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
              className="min-h-24"
              placeholder="Contexto operacional do grupo, foco biomecânico ou observações do catálogo."
            />
          </div>
          <div className="md:col-span-3 flex flex-wrap justify-end gap-2">
            {editing ? (
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Cancelar edição
              </Button>
            ) : null}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar grupo" : "Criar grupo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="space-y-3">
          <CardTitle className="text-lg font-display">Biblioteca de grupos</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="pl-8"
              placeholder="Buscar grupo muscular"
            />
          </div>
        </CardHeader>
        <CardContent>
          <PaginatedTable<GrupoMuscular>
            columns={[
              { label: "Grupo" },
              { label: "Categoria" },
              { label: "Exercícios" },
              { label: "Status" },
              { label: "Ações" },
            ]}
            items={gruposFiltrados}
            emptyText={loading ? "Carregando..." : "Nenhum grupo muscular encontrado."}
            total={gruposFiltrados.length}
            page={0}
            pageSize={gruposFiltrados.length || 1}
            showPagination={false}
            getRowKey={(item) => item.id}
            renderCells={(item) => {
              const exerciciosDoGrupo = exerciciosPorGrupo.get(item.id) ?? [];
              return (
                <>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{item.nome}</span>
                      <span className="text-xs text-muted-foreground">{item.descricao || "Sem descrição"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.categoria ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {exerciciosDoGrupo.length} cadastrados
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.ativo ? "secondary" : "outline"}>{item.ativo ? "Ativo" : "Inativo"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <DataTableRowActions
                      actions={[
                        {
                          label: "Editar",
                          kind: "edit",
                          onClick: () => startEdit(item),
                        },
                        {
                          label: item.ativo ? "Inativar" : "Reativar",
                          kind: "toggle",
                          onClick: () => void handleToggle(item),
                        },
                      ]}
                    />
                  </td>
                </>
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

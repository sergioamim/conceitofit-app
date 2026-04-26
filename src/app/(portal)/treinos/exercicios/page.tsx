"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Library, Plus, Search } from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { ExercicioModal, type ExercicioForm } from "@/components/shared/exercicio-modal";
import { ImportarDoCatalogoDialog } from "@/components/treinos/editor/importar-do-catalogo-dialog";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useExercicios, useSaveExercicio, useToggleExercicio } from "@/lib/query/use-treinos";
import type { Exercicio } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";

export default function ExerciciosPage() {
  const { tenantId, tenantResolved } = useTenantContext();
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [apenasAtivos, setApenasAtivos] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Exercicio | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading: loading, isError, error: queryError } = useExercicios({
    tenantId,
    tenantResolved,
    apenasAtivos,
  });

  const exercicios = data?.exercicios ?? [];
  const gruposMusculares = data?.gruposMusculares ?? [];
  const error = isError ? normalizeErrorMessage(queryError) : null;

  const saveExercicioMutation = useSaveExercicio();
  const toggleExercicioMutation = useToggleExercicio();

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return exercicios;
    return exercicios.filter((item) => {
      return `${item.nome} ${item.grupoMuscularNome ?? item.grupoMuscular ?? ""} ${item.equipamento ?? ""}`
        .toLowerCase()
        .includes(termo);
    });
  }, [busca, exercicios]);

  async function handleSaveExercicio(payload: ExercicioForm) {
    if (!tenantId) return;
    const saved = await saveExercicioMutation.mutateAsync({
      tenantId,
      id: payload.id,
      nome: payload.nome,
      descricao: payload.descricao,
      grupoMuscularId: payload.grupoMuscularId,
      equipamento: payload.equipamento,
      videoUrl: payload.videoUrl,
      unidade: payload.unidade,
    });
    setModalOpen(false);
    setEditing(null);
    toast({
      title: payload.id ? "Exercício atualizado" : "Exercício criado",
      description: saved.nome,
    });
  }

  async function handleToggle(item: Exercicio) {
    if (!tenantId) return;
    try {
      const toggled = await toggleExercicioMutation.mutateAsync({ tenantId, id: item.id });
      toast({
        title: toggled.ativo ? "Exercício reativado" : "Exercício inativado",
        description: toggled.nome,
      });
    } catch (toggleError) {
      toast({
        title: "Não foi possível alterar o status do exercício",
        description: normalizeErrorMessage(toggleError),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      {tenantId ? (
        <ImportarDoCatalogoDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          tenantId={tenantId}
          onImportSuccess={(_exercicioId, nome) => {
            toast({
              title: "Exercício importado",
              description: `"${nome}" agora aparece na biblioteca.`,
            });
            void queryClient.invalidateQueries({ queryKey: ["exercicios"] });
          }}
        />
      ) : null}

      <ExercicioModal
        key={modalOpen ? editing?.id ?? "novo-exercicio" : "exercicio-closed"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSaveExercicio}
        gruposMusculares={gruposMusculares.filter((item) => item.ativo !== false)}
        initial={editing}
      />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Exercícios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catálogo operacional de exercícios com grupo muscular canônico, equipamento e mídia de apoio.
        </p>
      </div>

      {error ? (
        <ListErrorState error={error} />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            <button
              onClick={() => setApenasAtivos(false)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                !apenasAtivos
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setApenasAtivos(true)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                apenasAtivos
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              Apenas ativos
            </button>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="pl-8"
              placeholder="Buscar exercício, grupo muscular ou equipamento"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tenantId ? (
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
            >
              <Library className="mr-2 size-4" />
              Importar do catálogo
            </Button>
          ) : null}
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo exercício
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-lg">Lista de exercícios</CardTitle>
        </CardHeader>
        <CardContent>
          <PaginatedTable<Exercicio>
            columns={[
              { label: "Nome" },
              { label: "Grupo muscular" },
              { label: "Equipamento" },
              { label: "Status" },
              { label: "Ações" },
            ]}
            items={filtrados}
            emptyText={loading ? "Carregando..." : "Nenhum exercício encontrado"}
            total={filtrados.length}
            page={0}
            pageSize={filtrados.length || 1}
            showPagination={false}
            getRowKey={(item) => item.id}
            renderCells={(item) => (
              <>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.nome}</span>
                    <span className="text-xs text-muted-foreground">{item.descricao ?? "Sem descrição"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {item.grupoMuscularNome ?? item.grupoMuscular ?? "Sem grupo"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{item.equipamento ?? "-"}</td>
                <td className="px-4 py-3">
                  <Badge variant={item.ativo ? "secondary" : "outline"}>{item.ativo ? "Ativo" : "Inativo"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Editar",
                        kind: "edit",
                        onClick: () => {
                          setEditing(item);
                          setModalOpen(true);
                        },
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
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

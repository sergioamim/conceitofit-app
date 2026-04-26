"use client";

import { useState } from "react";
import { Library, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";
import type { TreinoV2DefaultObjective, TreinoV2ExerciseType } from "@/lib/tenant/treinos/v2-domain";
import { SelectField } from "./shared";
import { ImportarDoCatalogoDialog } from "./importar-do-catalogo-dialog";
import {
  type ExerciseDrawerState,
  type GrupoMuscularOption,
  EXERCISE_TYPE_OPTIONS,
  OBJECTIVE_OPTIONS,
  buildExerciseDrawerState,
} from "./types";

type ExercicioSelectorProps = {
  catalog: TreinoV2CatalogExercise[];
  filteredCatalog: TreinoV2CatalogExercise[];
  grupoMuscularOptions: GrupoMuscularOption[];
  catalogSearch: string;
  catalogTipo: "" | TreinoV2ExerciseType;
  catalogObjetivo: "" | TreinoV2DefaultObjective;
  catalogGrupoMuscularId: string;
  canManageCatalog: boolean;
  hasActiveSessao: boolean;
  onCatalogSearchChange: (value: string) => void;
  onCatalogTipoChange: (value: "" | TreinoV2ExerciseType) => void;
  onCatalogObjetivoChange: (value: "" | TreinoV2DefaultObjective) => void;
  onCatalogGrupoMuscularIdChange: (value: string) => void;
  onAddExercise: (exercicio: TreinoV2CatalogExercise) => void;
  onEditExercise: (exercicio: TreinoV2CatalogExercise) => void;
  onNewExercise: () => void;
};

export function ExercicioSelector({
  catalog,
  filteredCatalog,
  grupoMuscularOptions,
  catalogSearch,
  catalogTipo,
  catalogObjetivo,
  catalogGrupoMuscularId,
  canManageCatalog,
  hasActiveSessao,
  onCatalogSearchChange,
  onCatalogTipoChange,
  onCatalogObjetivoChange,
  onCatalogGrupoMuscularIdChange,
  onAddExercise,
  onEditExercise,
  onNewExercise,
}: ExercicioSelectorProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg">Biblioteca lateral</CardTitle>
            <p className="text-sm text-muted-foreground">
              Busca, filtros e inserção rápida no bloco ativo.
            </p>
          </div>
          {canManageCatalog ? (
            <Button variant="outline" size="sm" onClick={onNewExercise}>
              <Plus className="mr-2 size-4" />
              Novo exercício
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={catalogSearch}
            onChange={(event) => onCatalogSearchChange(event.target.value)}
            className="pl-9"
            placeholder="Buscar por nome, código ou grupo"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <SelectField
            label="Tipo"
            value={catalogTipo}
            onChange={(value: string) => onCatalogTipoChange(value as "" | TreinoV2ExerciseType)}
            options={[{ value: "", label: "Todos" }, ...EXERCISE_TYPE_OPTIONS.map((item) => ({ value: item, label: item }))]}
          />
          <SelectField
            label="Objetivo"
            value={catalogObjetivo}
            onChange={(value: string) => onCatalogObjetivoChange(value as "" | TreinoV2DefaultObjective)}
            options={[{ value: "", label: "Todos" }, ...OBJECTIVE_OPTIONS.map((item) => ({ value: item, label: item }))]}
          />
          <SelectField
            label="Grupo muscular"
            value={catalogGrupoMuscularId}
            onChange={onCatalogGrupoMuscularIdChange}
            options={[{ value: "", label: "Todos" }, ...grupoMuscularOptions.map((item) => ({ value: item.id, label: item.nome }))]}
          />
        </div>

        <div className="space-y-2">
          {filteredCatalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum exercício encontrado com os filtros atuais.</p>
          ) : (
            filteredCatalog.slice(0, 12).map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-secondary/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.nome}</p>
                      {item.codigo ? <Badge variant="outline">{item.codigo}</Badge> : null}
                      <Badge variant="outline">{item.tipo}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.grupoMuscularNome ?? "Sem grupo muscular"} · {item.grupoExercicioNome ?? "Sem grupo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.objetivoPadrao ?? "Sem objetivo"} · {item.unidadeCarga ?? "Sem unidade"}
                    </p>
                    {item.similarExerciseIds.length > 0 ? (
                      <p className="text-xs text-muted-foreground">Similares: {item.similarExerciseIds.length}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onAddExercise(item)} disabled={!hasActiveSessao}>
                      <Plus className="mr-1 size-4" />
                      +
                    </Button>
                    {canManageCatalog ? (
                      <Button variant="outline" size="sm" onClick={() => onEditExercise(item)}>
                        Editar
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type ExerciseDrawerDialogProps = {
  drawer: ExerciseDrawerState;
  catalog: TreinoV2CatalogExercise[];
  grupoMuscularOptions: GrupoMuscularOption[];
  saving: boolean;
  tenantId?: string;
  onDrawerChange: (updater: (current: ExerciseDrawerState) => ExerciseDrawerState) => void;
  onClose: () => void;
  onSave: () => void;
  onCatalogImported?: (exercicioId: string, nome: string) => void;
};

export function ExerciseDrawerDialog({
  drawer,
  catalog,
  grupoMuscularOptions,
  saving,
  tenantId,
  onDrawerChange,
  onClose,
  onSave,
  onCatalogImported,
}: ExerciseDrawerDialogProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const canImportFromCatalog = Boolean(tenantId) && !drawer.editingId;

  return (
    <Dialog open={drawer.open} onOpenChange={(open) => onDrawerChange((current) => ({ ...current, open }))}>
      <DialogContent className="border-border bg-card sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="font-display text-lg font-bold">
                {drawer.editingId ? "Editar exercício" : "Novo exercício"}
              </DialogTitle>
              <DialogDescription>
                Cadastro rico de catálogo com mídia, descrição e disponibilidade no app.
              </DialogDescription>
            </div>
            {canImportFromCatalog ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
              >
                <Library className="mr-1.5 size-4" />
                Importar do catálogo
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="drawer-exercicio-nome">Nome *</Label>
            <Input
              id="drawer-exercicio-nome"
              value={drawer.nome}
              onChange={(event) => onDrawerChange((current) => ({ ...current, nome: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drawer-exercicio-codigo">Código</Label>
            <Input
              id="drawer-exercicio-codigo"
              value={drawer.codigo}
              onChange={(event) => onDrawerChange((current) => ({ ...current, codigo: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drawer-exercicio-grupo">Grupo de exercícios</Label>
            <Input
              id="drawer-exercicio-grupo"
              value={drawer.grupoExercicioNome}
              onChange={(event) => onDrawerChange((current) => ({ ...current, grupoExercicioNome: event.target.value }))}
            />
          </div>
          <SelectField
            label="Grupo muscular"
            value={drawer.grupoMuscularId}
            onChange={(value: string) => onDrawerChange((current) => ({ ...current, grupoMuscularId: value }))}
            options={[{ value: "", label: "Selecione" }, ...grupoMuscularOptions.map((item) => ({ value: item.id, label: item.nome }))]}
          />
          <SelectField
            label="Tipo"
            value={drawer.tipo}
            onChange={(value: string) => onDrawerChange((current) => ({ ...current, tipo: value as TreinoV2ExerciseType }))}
            options={EXERCISE_TYPE_OPTIONS.map((item) => ({ value: item, label: item }))}
          />
          <SelectField
            label="Objetivo padrão"
            value={drawer.objetivoPadrao}
            onChange={(value: string) => onDrawerChange((current) => ({ ...current, objetivoPadrao: value as TreinoV2DefaultObjective | "" }))}
            options={[{ value: "", label: "Selecione" }, ...OBJECTIVE_OPTIONS.map((item) => ({ value: item, label: item }))]}
          />
          <div className="space-y-1.5">
            <Label htmlFor="drawer-exercicio-unidade">Unidade de carga</Label>
            <Input
              id="drawer-exercicio-unidade"
              value={drawer.unidadeCarga}
              onChange={(event) => onDrawerChange((current) => ({ ...current, unidadeCarga: event.target.value }))}
            />
          </div>
          <SelectField
            label="Mídia"
            value={drawer.midiaTipo}
            onChange={(value: string) => onDrawerChange((current) => ({ ...current, midiaTipo: value as ExerciseDrawerState["midiaTipo"] }))}
            options={[
              { value: "", label: "Sem mídia" },
              { value: "IMAGEM", label: "Imagem" },
              { value: "GIF", label: "GIF" },
              { value: "VIDEO", label: "Vídeo" },
            ]}
          />
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="drawer-exercicio-midia-url">URL da mídia</Label>
            <Input
              id="drawer-exercicio-midia-url"
              value={drawer.midiaUrl}
              onChange={(event) => onDrawerChange((current) => ({ ...current, midiaUrl: event.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="drawer-exercicio-descricao">Descrição</Label>
            <Textarea
              id="drawer-exercicio-descricao"
              value={drawer.descricao}
              onChange={(event) => onDrawerChange((current) => ({ ...current, descricao: event.target.value }))}
              className="min-h-28"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Exercícios similares</Label>
            <div className="grid max-h-40 gap-2 overflow-y-auto rounded-md border border-border bg-secondary/30 p-3 md:grid-cols-2">
              {catalog
                .filter((item) => item.id !== drawer.editingId)
                .map((item) => {
                  const checked = drawer.similarExerciseIds.includes(item.id);
                  return (
                    <label key={item.id} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          onDrawerChange((current) => ({
                            ...current,
                            similarExerciseIds: event.target.checked
                              ? [...current.similarExerciseIds, item.id]
                              : current.similarExerciseIds.filter((value) => value !== item.id),
                          }))
                        }
                      />
                      {item.nome}
                    </label>
                  );
                })}
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
            <input
              type="checkbox"
              checked={drawer.disponivelNoApp}
              onChange={(event) => onDrawerChange((current) => ({ ...current, disponivelNoApp: event.target.checked }))}
            />
            Exibir no app do cliente
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Salvando..." : drawer.editingId ? "Salvar exercício" : "Criar exercício"}
          </Button>
        </DialogFooter>

        {canImportFromCatalog && tenantId ? (
          <ImportarDoCatalogoDialog
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            tenantId={tenantId}
            onImportSuccess={(exercicioId, nome) => {
              onCatalogImported?.(exercicioId, nome);
              onClose();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

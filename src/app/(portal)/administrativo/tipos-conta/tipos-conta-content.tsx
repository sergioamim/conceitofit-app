"use client";

import { useMemo, useState } from "react";
import {
  createTipoContaPagarApi,
  listTiposContaPagarApi,
  toggleTipoContaPagarApi,
  updateTipoContaPagarApi,
} from "@/lib/api/tipos-conta";
import type { CreateTipoContaPagarApiInput, UpdateTipoContaPagarApiInput } from "@/lib/api/tipos-conta";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { CategoriaContaPagar, GrupoDre, TipoContaPagar } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminCrud } from "@/lib/query/use-admin-crud";

const CATEGORIA_LABEL: Record<CategoriaContaPagar, string> = {
  FOLHA: "Folha",
  ALUGUEL: "Aluguel",
  UTILIDADES: "Utilidades",
  IMPOSTOS: "Impostos",
  MARKETING: "Marketing",
  MANUTENCAO: "Manutenção",
  FORNECEDORES: "Fornecedores",
  OUTROS: "Outros",
};

const GRUPO_DRE_LABEL: Record<GrupoDre, string> = {
  CUSTO_VARIAVEL: "Custo variável",
  DESPESA_OPERACIONAL: "Despesa operacional",
  DESPESA_FINANCEIRA: "Despesa financeira",
  IMPOSTOS: "Impostos",
};

const FORM_DEFAULT = {
  nome: "",
  descricao: "",
  categoriaOperacional: "UTILIDADES" as CategoriaContaPagar,
  grupoDre: "DESPESA_OPERACIONAL" as GrupoDre,
  centroCustoPadrao: "",
};

export function TiposContaContent({ initialData: _initialData }: { initialData: TipoContaPagar[] }) {
  const { tenantId, tenantResolved } = useTenantContext();
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TipoContaPagar | null>(null);
  const [form, setForm] = useState(FORM_DEFAULT);

  const { items: tipos, isLoading: loading, create, update, toggle } = useAdminCrud<
    TipoContaPagar,
    CreateTipoContaPagarApiInput,
    UpdateTipoContaPagarApiInput
  >({
    domain: `tipos-conta:${showAll ? "all" : "active"}`,
    tenantId,
    enabled: tenantResolved && !!tenantId,
    listFn: (tid) => listTiposContaPagarApi({ tenantId: tid, apenasAtivos: !showAll }),
    createFn: (tid, data) => createTipoContaPagarApi({ tenantId: tid, data }),
    updateFn: (tid, id, data) => updateTipoContaPagarApi({ tenantId: tid, id, data }),
    toggleFn: (tid, id) => toggleTipoContaPagarApi({ tenantId: tid, id }),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tipos;
    return tipos.filter((tipo) => {
      return (
        tipo.nome.toLowerCase().includes(term) ||
        (tipo.descricao ?? "").toLowerCase().includes(term) ||
        (tipo.centroCustoPadrao ?? "").toLowerCase().includes(term)
      );
    });
  }, [search, tipos]);

  function openCreate() {
    setEditing(null);
    setForm(FORM_DEFAULT);
    setModalOpen(true);
  }

  function openEdit(tipo: TipoContaPagar) {
    setEditing(tipo);
    setForm({
      nome: tipo.nome,
      descricao: tipo.descricao ?? "",
      categoriaOperacional: tipo.categoriaOperacional,
      grupoDre: tipo.grupoDre,
      centroCustoPadrao: tipo.centroCustoPadrao ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!tenantId || !form.nome.trim()) return;

    const data = {
      nome: form.nome,
      descricao: form.descricao,
      categoriaOperacional: form.categoriaOperacional,
      grupoDre: form.grupoDre,
      centroCustoPadrao: form.centroCustoPadrao,
    };

    if (editing) {
      await update!.mutateAsync({ id: editing.id, data });
    } else {
      await create!.mutateAsync(data);
    }
    setModalOpen(false);
    setEditing(null);
    setForm(FORM_DEFAULT);
  }

  async function handleToggle(id: string) {
    if (!tenantId) return;
    await toggle!.mutateAsync(id);
  }

  const saving = create?.isPending || update?.isPending;

  return (
    <div className="space-y-6">
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editing ? "Editar tipo de conta" : "Novo tipo de conta"}
            </DialogTitle>
            <DialogDescription>
              A classificação DRE é obrigatória e será herdada pelos lançamentos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome
              </label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((v) => ({ ...v, nome: e.target.value }))}
                placeholder="Ex.: Conta de Luz"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categoria operacional
              </label>
              <Select
                value={form.categoriaOperacional}
                onValueChange={(value) =>
                  setForm((v) => ({ ...v, categoriaOperacional: value as CategoriaContaPagar }))
                }
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(CATEGORIA_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Grupo DRE
              </label>
              <Select
                value={form.grupoDre}
                onValueChange={(value) => setForm((v) => ({ ...v, grupoDre: value as GrupoDre }))}
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(GRUPO_DRE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Centro de custo padrão
              </label>
              <Input
                value={form.centroCustoPadrao}
                onChange={(e) => setForm((v) => ({ ...v, centroCustoPadrao: e.target.value }))}
                placeholder="Ex.: Operacional"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm((v) => ({ ...v, descricao: e.target.value }))}
                placeholder="Opcional"
                className="focus-ring-brand h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : editing ? "Salvar alterações" : "Salvar tipo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Tipos de Conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Classifique despesas por unidade e mantenha o DRE consistente.
          </p>
        </div>
        <Button onClick={openCreate}>Novo tipo</Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, descrição ou centro de custo..."
            className="bg-secondary border-border"
          />
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            Mostrar inativos
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Nome</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Categoria</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Grupo DRE</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Centro de custo padrão</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum tipo de conta cadastrado.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((tipo) => (
                <tr key={tipo.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{tipo.nome}</p>
                    {tipo.descricao && (
                      <p className="text-xs text-muted-foreground">{tipo.descricao}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {CATEGORIA_LABEL[tipo.categoriaOperacional]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {GRUPO_DRE_LABEL[tipo.grupoDre]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tipo.centroCustoPadrao || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        tipo.ativo
                          ? "bg-gym-teal/15 text-gym-teal"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tipo.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DataTableRowActions
                      actions={[
                        {
                          label: "Editar",
                          kind: "edit",
                          onClick: () => openEdit(tipo),
                        },
                        {
                          label: tipo.ativo ? "Desativar" : "Ativar",
                          kind: "toggle",
                          onClick: () => handleToggle(tipo.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

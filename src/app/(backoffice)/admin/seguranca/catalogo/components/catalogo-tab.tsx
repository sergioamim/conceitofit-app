"use client";

// CatalogoTab — Client Island for RSC migration
// This component receives initial data but manages its own loading/editing state.
// For Wave 1, we keep the existing implementation and wrap it as a Client Island.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaginatedTable } from "@/components/shared/paginated-table";
import {
  createCatalogoFuncionalidade,
  updateCatalogoFuncionalidade,
  listCatalogoFuncionalidades,
} from "@/backoffice/api/admin-seguranca-avancada";
import type {
  CatalogoFuncionalidade as CatalogoFuncionalidadeType,
  CatalogoFuncionalidadePayload,
  GlobalAdminRiskLevel,
} from "@/lib/types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const RISK_OPTIONS: { value: GlobalAdminRiskLevel; label: string }[] = [
  { value: "BAIXO", label: "Baixo" },
  { value: "MEDIO", label: "Médio" },
  { value: "ALTO", label: "Alto" },
  { value: "CRITICO", label: "Crítico" },
];

type PageSize = 20 | 50 | 100;

interface CatalogoTabProps {
  initialCatalogo: CatalogoFuncionalidadeType[];
}

export function CatalogoTab({ initialCatalogo }: CatalogoTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CatalogoFuncionalidadeType[]>(initialCatalogo);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [riskFilter, setRiskFilter] = useState<GlobalAdminRiskLevel | typeof FILTER_ALL>(FILTER_ALL);
  const [page, setPage] = useState(0);
  const [pageSize] = useState<PageSize>(20);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<CatalogoFuncionalidadePayload>({
    featureKey: "",
    moduleKey: "",
    moduleLabel: "",
    capabilityLabel: "",
    businessLabel: "",
    description: "",
    riskLevel: "BAIXO",
    scopes: ["UNIDADE"],
    requiresAudit: false,
    requiresApproval: false,
    requiresMfa: false,
    active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await listCatalogoFuncionalidades();
      setItems(data);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    let result = items;
    if (riskFilter !== FILTER_ALL) {
      result = result.filter((i) => i.riskLevel === riskFilter);
    }
    const term = busca.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (i) =>
          i.businessLabel.toLowerCase().includes(term) ||
          i.featureKey.toLowerCase().includes(term) ||
          i.moduleLabel.toLowerCase().includes(term)
      );
    }
    return result;
  }, [items, busca, riskFilter]);

  const hasNext = (page + 1) * pageSize < filtered.length;
  const paginaItens = useMemo(
    () => filtered.slice(page * pageSize, page * pageSize + pageSize),
    [filtered, page, pageSize]
  );

  function resetForm() {
    setEditingId(null);
    setForm({
      featureKey: "",
      moduleKey: "",
      moduleLabel: "",
      capabilityLabel: "",
      businessLabel: "",
      description: "",
      riskLevel: "BAIXO",
      scopes: ["UNIDADE"],
      requiresAudit: false,
      requiresApproval: false,
      requiresMfa: false,
      active: true,
    });
  }

  function startEdit(item: CatalogoFuncionalidadeType) {
    setEditingId(item.id);
    setForm({
      featureKey: item.featureKey,
      moduleKey: item.moduleKey,
      moduleLabel: item.moduleLabel,
      capabilityLabel: item.capabilityLabel,
      businessLabel: item.businessLabel,
      description: item.description,
      riskLevel: item.riskLevel,
      scopes: item.scopes,
      requiresAudit: item.requiresAudit,
      requiresApproval: item.requiresApproval,
      requiresMfa: item.requiresMfa,
      active: item.active,
    });
  }

  async function handleSave() {
    if (!form.featureKey.trim() || !form.businessLabel.trim()) {
      toast({ title: "Preencha ao menos a chave e o rótulo", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateCatalogoFuncionalidade(editingId, form);
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        toast({ title: "Funcionalidade atualizada" });
      } else {
        const created = await createCatalogoFuncionalidade(form);
        setItems((prev) => [created, ...prev]);
        toast({ title: "Funcionalidade criada" });
      }
      resetForm();
    } catch (err) {
      toast({ title: "Erro ao salvar", description: normalizeErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading && items.length === 0) {
    return <div className="text-sm text-muted-foreground">Carregando catalogo...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {editingId ? "Editar funcionalidade" : "Nova funcionalidade no catalogo"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Chave (featureKey) *</Label>
              <Input
                value={form.featureKey}
                disabled={saving || !!editingId}
                onChange={(e) => setForm((p) => ({ ...p, featureKey: e.target.value }))}
                placeholder="financeiro.pagamentos"
              />
            </div>
            <div className="space-y-2">
              <Label>Rotulo de negocio *</Label>
              <Input
                value={form.businessLabel}
                disabled={saving}
                onChange={(e) => setForm((p) => ({ ...p, businessLabel: e.target.value }))}
                placeholder="Gestao de Pagamentos"
              />
            </div>
            <div className="space-y-2">
              <Label>Modulo (key)</Label>
              <Input
                value={form.moduleKey}
                disabled={saving}
                onChange={(e) => setForm((p) => ({ ...p, moduleKey: e.target.value }))}
                placeholder="financeiro"
              />
            </div>
            <div className="space-y-2">
              <Label>Modulo (label)</Label>
              <Input
                value={form.moduleLabel}
                disabled={saving}
                onChange={(e) => setForm((p) => ({ ...p, moduleLabel: e.target.value }))}
                placeholder="Financeiro"
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidade</Label>
              <Input
                value={form.capabilityLabel}
                disabled={saving}
                onChange={(e) => setForm((p) => ({ ...p, capabilityLabel: e.target.value }))}
                placeholder="Pagamentos"
              />
            </div>
            <div className="space-y-2">
              <Label>Nivel de risco</Label>
              <Select
                value={form.riskLevel}
                onValueChange={(v) => setForm((p) => ({ ...p, riskLevel: v as GlobalAdminRiskLevel }))}
                disabled={saving}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {RISK_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              disabled={saving}
              rows={2}
              className="bg-secondary border-border"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.requiresAudit}
                onChange={(e) => setForm((p) => ({ ...p, requiresAudit: e.target.checked }))}
                disabled={saving}
              />
              Requer auditoria
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(e) => setForm((p) => ({ ...p, requiresApproval: e.target.checked }))}
                disabled={saving}
              />
              Requer aprovacao
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.requiresMfa}
                onChange={(e) => setForm((p) => ({ ...p, requiresMfa: e.target.checked }))}
                disabled={saving}
              />
              Requer MFA
            </label>
          </div>
          <div className="flex items-center gap-3 justify-end">
            {editingId && (
              <Button variant="outline" size="sm" onClick={resetForm} disabled={saving}>
                Cancelar
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catalogo ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(0); }}
              placeholder="Buscar por chave, rotulo ou modulo"
              className="flex-1 min-w-60"
            />
            <Select
              value={riskFilter}
              onValueChange={(v) => { setRiskFilter(v as GlobalAdminRiskLevel | typeof FILTER_ALL); setPage(0); }}
            >
              <SelectTrigger className="w-36 bg-secondary border-border text-xs">
                <SelectValue placeholder="Risco" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                {RISK_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <PaginatedTable<CatalogoFuncionalidadeType>
            columns={[
              { label: "Funcionalidade" },
              { label: "Modulo" },
              { label: "Risco" },
              { label: "Flags" },
              { label: "" },
            ]}
            items={paginaItens}
            emptyText={loading ? "Carregando catalogo..." : "Nenhuma funcionalidade encontrada."}
            getRowKey={(i) => i.id || `${i.featureKey}:${i.moduleKey ?? ""}`}
            renderCells={(i) => (
              <>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{i.businessLabel}</span>
                    <span className="text-xs text-muted-foreground font-mono">{i.featureKey}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{i.moduleLabel}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    i.riskLevel === "CRITICO" ? "bg-red-500/20 text-red-400" :
                    i.riskLevel === "ALTO" ? "bg-orange-500/20 text-orange-400" :
                    i.riskLevel === "MEDIO" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>
                    {i.riskLevel}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {i.requiresAudit && <span className="rounded bg-secondary px-1.5 py-0.5">Audit</span>}
                    {i.requiresApproval && <span className="rounded bg-secondary px-1.5 py-0.5">Approval</span>}
                    {i.requiresMfa && <span className="rounded bg-secondary px-1.5 py-0.5">MFA</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(i)}>Editar</Button>
                </td>
              </>
            )}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Pagina {page + 1} — {filtered.length} itens
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
                Proximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

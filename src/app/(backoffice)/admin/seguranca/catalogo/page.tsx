"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GlobalSecurityShell, formatSecurityDateTime } from "@/components/security/global-security-shell";
import { SecurityRiskBadge } from "@/components/security/security-badges";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PaginatedTable } from "@/components/shared/paginated-table";
import {
  createCatalogoFuncionalidade,
  createExcecao,
  createPerfilPadrao,
  getPerfilPadraoVersoes,
  listCatalogoFuncionalidades,
  listPerfisPadrao,
  revisarExcecao,
  updateCatalogoFuncionalidade,
} from "@/lib/api/admin-seguranca-avancada";
import { getGlobalSecurityReviewBoard } from "@/lib/backoffice/seguranca";
import type {
  CatalogoFuncionalidade,
  CatalogoFuncionalidadePayload,
  ExcecaoRevisaoDecisao,
  GlobalAdminReviewBoard,
  GlobalAdminReviewBoardItem,
  GlobalAdminRiskLevel,
  PerfilPadrao,
  PerfilPadraoVersao,
  SecurityBusinessScope,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RISK_OPTIONS: { value: GlobalAdminRiskLevel; label: string }[] = [
  { value: "BAIXO", label: "Baixo" },
  { value: "MEDIO", label: "Médio" },
  { value: "ALTO", label: "Alto" },
  { value: "CRITICO", label: "Crítico" },
];

const SCOPE_OPTIONS: { value: SecurityBusinessScope; label: string }[] = [
  { value: "UNIDADE", label: "Unidade" },
  { value: "ACADEMIA", label: "Academia" },
  { value: "REDE", label: "Rede" },
];

const DECISAO_OPTIONS: { value: ExcecaoRevisaoDecisao; label: string }[] = [
  { value: "APROVADA", label: "Aprovar" },
  { value: "REJEITADA", label: "Rejeitar" },
  { value: "RENOVADA", label: "Renovar" },
];

const EMPTY_BOARD: GlobalAdminReviewBoard = {
  pendingReviews: [],
  expiringExceptions: [],
  recentChanges: [],
  broadAccess: [],
  orphanProfiles: [],
};

type PageSize = 20 | 50 | 100;

// ---------------------------------------------------------------------------
// Catálogo de Funcionalidades Tab
// ---------------------------------------------------------------------------

function CatalogoTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CatalogoFuncionalidade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [riskFilter, setRiskFilter] = useState<GlobalAdminRiskLevel | "TODOS">("TODOS");
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
    if (riskFilter !== "TODOS") {
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

  function startEdit(item: CatalogoFuncionalidade) {
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
            {editingId ? "Editar funcionalidade" : "Nova funcionalidade no catálogo"}
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
              <Label>Rótulo de negócio *</Label>
              <Input
                value={form.businessLabel}
                disabled={saving}
                onChange={(e) => setForm((p) => ({ ...p, businessLabel: e.target.value }))}
                placeholder="Gestão de Pagamentos"
              />
            </div>
            <div className="space-y-2">
              <Label>Módulo (key)</Label>
              <Input
                value={form.moduleKey}
                disabled={saving}
                onChange={(e) => setForm((p) => ({ ...p, moduleKey: e.target.value }))}
                placeholder="financeiro"
              />
            </div>
            <div className="space-y-2">
              <Label>Módulo (label)</Label>
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
              <Label>Nível de risco</Label>
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
            <Label>Descrição</Label>
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
              Requer aprovação
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
          <CardTitle className="text-base">Catálogo ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(0); }}
              placeholder="Buscar por chave, rótulo ou módulo"
              className="flex-1 min-w-60"
            />
            <Select
              value={riskFilter}
              onValueChange={(v) => { setRiskFilter(v as GlobalAdminRiskLevel | "TODOS"); setPage(0); }}
            >
              <SelectTrigger className="w-36 bg-secondary border-border text-xs">
                <SelectValue placeholder="Risco" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="TODOS">Todos</SelectItem>
                {RISK_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <PaginatedTable<CatalogoFuncionalidade>
            columns={[
              { label: "Funcionalidade" },
              { label: "Módulo" },
              { label: "Risco" },
              { label: "Flags" },
              { label: "" },
            ]}
            items={paginaItens}
            emptyText={loading ? "Carregando catálogo..." : "Nenhuma funcionalidade encontrada."}
            getRowKey={(i) => i.id}
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
                  <SecurityRiskBadge level={i.riskLevel} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {i.requiresAudit && <span title="Auditoria">AUD</span>}
                    {i.requiresApproval && <span title="Aprovação">APR</span>}
                    {i.requiresMfa && <span title="MFA">MFA</span>}
                    {!i.active && <span className="text-gym-danger">Inativa</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(i)}>
                    Editar
                  </Button>
                </td>
              </>
            )}
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            hasNext={hasNext}
            onPrevious={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            itemLabel="funcionalidades"
            showPagination={filtered.length > pageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Perfis Padrão com Versionamento Tab
// ---------------------------------------------------------------------------

function PerfisPadraoTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [perfis, setPerfis] = useState<PerfilPadrao[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Version viewer
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [versoes, setVersoes] = useState<PerfilPadraoVersao[]>([]);
  const [loadingVersoes, setLoadingVersoes] = useState(false);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    key: "",
    displayName: "",
    description: "",
    objective: "",
    recommendedScope: "UNIDADE" as SecurityBusinessScope,
    riskLevel: "BAIXO" as GlobalAdminRiskLevel,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await listPerfisPadrao();
      setPerfis(data);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSelectPerfil(perfil: PerfilPadrao) {
    setSelectedKey(perfil.key);
    setLoadingVersoes(true);
    try {
      const v = await getPerfilPadraoVersoes(perfil.key);
      setVersoes(v);
    } catch (err) {
      toast({ title: "Erro ao carregar versões", description: normalizeErrorMessage(err), variant: "destructive" });
      setVersoes([]);
    } finally {
      setLoadingVersoes(false);
    }
  }

  async function handleCreate() {
    if (!form.key.trim() || !form.displayName.trim()) {
      toast({ title: "Preencha chave e nome", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const created = await createPerfilPadrao({
        key: form.key.trim(),
        displayName: form.displayName.trim(),
        description: form.description.trim() || undefined,
        objective: form.objective.trim(),
        recommendedScope: form.recommendedScope,
        riskLevel: form.riskLevel,
        grants: [],
      });
      setPerfis((prev) => [created, ...prev]);
      setForm({ key: "", displayName: "", description: "", objective: "", recommendedScope: "UNIDADE", riskLevel: "BAIXO" });
      setShowForm(false);
      toast({ title: "Perfil padrão criado" });
    } catch (err) {
      toast({ title: "Erro ao criar", description: normalizeErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const selectedPerfil = perfis.find((p) => p.key === selectedKey);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Carregando..." : `${perfis.length} perfis padrão cadastrados`}
        </p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo perfil padrão"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Criar perfil padrão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Chave *</Label>
                <Input
                  value={form.key}
                  onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                  disabled={saving}
                  placeholder="recepcao"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                  disabled={saving}
                  placeholder="Recepção"
                />
              </div>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Input
                  value={form.objective}
                  onChange={(e) => setForm((p) => ({ ...p, objective: e.target.value }))}
                  disabled={saving}
                  placeholder="Atendimento e check-in de alunos"
                />
              </div>
              <div className="space-y-2">
                <Label>Escopo recomendado</Label>
                <Select
                  value={form.recommendedScope}
                  onValueChange={(v) => setForm((p) => ({ ...p, recommendedScope: v as SecurityBusinessScope }))}
                  disabled={saving}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {SCOPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de risco</Label>
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
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                disabled={saving}
                rows={2}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Criando..." : "Criar perfil"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Profiles list */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {perfis.length === 0 && !loading && (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum perfil padrão cadastrado.
                  </p>
                )}
                {perfis.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-secondary/40 ${selectedKey === p.key ? "bg-secondary/60" : ""}`}
                    onClick={() => handleSelectPerfil(p)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold">{p.displayName}</span>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">{p.key}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">v{p.versaoAtual}</span>
                        <SecurityRiskBadge level={p.riskLevel} />
                      </div>
                    </div>
                    {p.objective && (
                      <p className="mt-1 text-xs text-muted-foreground">{p.objective}</p>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Version panel */}
        <div className="w-full lg:w-96 shrink-0">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedPerfil ? `Versões — ${selectedPerfil.displayName}` : "Selecione um perfil"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedPerfil ? (
                <p className="text-sm text-muted-foreground">
                  Clique em um perfil para ver o histórico de versões.
                </p>
              ) : loadingVersoes ? (
                <p className="text-sm text-muted-foreground">Carregando versões...</p>
              ) : versoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma versão registrada.</p>
              ) : (
                <div className="space-y-4">
                  {versoes.map((v) => (
                    <div key={v.versao} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Versão {v.versao}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatSecurityDateTime(v.criadoEm)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{v.descricao || "Sem descrição"}</p>
                      {v.criadoPor && (
                        <p className="text-xs text-muted-foreground">Por: {v.criadoPor}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {v.grants.length} permissão{v.grants.length !== 1 ? "ões" : ""} definida{v.grants.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exceções Tab
// ---------------------------------------------------------------------------

function ExcecoesTab() {
  const { toast } = useToast();
  const [board, setBoard] = useState<GlobalAdminReviewBoard>(EMPTY_BOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Create exception form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: "",
    title: "",
    justification: "",
    expiresAt: "",
  });

  // Review form
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    decisao: "APROVADA" as ExcecaoRevisaoDecisao,
    comentario: "",
    novaExpiracao: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await getGlobalSecurityReviewBoard();
      setBoard(data);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const excecoes = board.expiringExceptions;

  async function handleCreateException() {
    if (!createForm.userId.trim() || !createForm.title.trim() || !createForm.justification.trim()) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createExcecao({
        userId: createForm.userId.trim(),
        title: createForm.title.trim(),
        justification: createForm.justification.trim(),
        expiresAt: createForm.expiresAt.trim() || undefined,
      });
      toast({ title: "Exceção criada" });
      setCreateForm({ userId: "", title: "", justification: "", expiresAt: "" });
      setShowCreate(false);
      void load();
    } catch (err) {
      toast({ title: "Erro ao criar exceção", description: normalizeErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleReview() {
    if (!reviewingId || !reviewForm.comentario.trim()) {
      toast({ title: "Informe o comentário da revisão", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await revisarExcecao(reviewingId, {
        decisao: reviewForm.decisao,
        comentario: reviewForm.comentario.trim(),
        novaExpiracao: reviewForm.novaExpiracao.trim() || undefined,
      });
      toast({ title: "Revisão registrada", description: `Exceção ${reviewForm.decisao.toLowerCase()}` });
      setReviewingId(null);
      setReviewForm({ decisao: "APROVADA", comentario: "", novaExpiracao: "" });
      void load();
    } catch (err) {
      toast({ title: "Erro na revisão", description: normalizeErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Carregando..." : `${excecoes.length} exceção(ões) pendente(s) de revisão`}
        </p>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancelar" : "Nova exceção"}
        </Button>
      </div>

      {/* Create exception form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Criar exceção de acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>ID do usuário *</Label>
                <Input
                  value={createForm.userId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, userId: e.target.value }))}
                  disabled={saving}
                  placeholder="UUID do usuário"
                />
              </div>
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  disabled={saving}
                  placeholder="Acesso temporário ao financeiro"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Justificativa *</Label>
              <Textarea
                value={createForm.justification}
                onChange={(e) => setCreateForm((p) => ({ ...p, justification: e.target.value }))}
                disabled={saving}
                rows={2}
                className="bg-secondary border-border"
                placeholder="Motivo da exceção..."
              />
            </div>
            <div className="space-y-2">
              <Label>Expiração (opcional)</Label>
              <Input
                type="datetime-local"
                value={createForm.expiresAt}
                onChange={(e) => setCreateForm((p) => ({ ...p, expiresAt: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateException} disabled={saving}>
                {saving ? "Criando..." : "Criar exceção"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exceptions list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exceções pendentes de revisão</CardTitle>
        </CardHeader>
        <CardContent>
          {excecoes.length === 0 && !loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma exceção pendente de revisão.
            </p>
          ) : (
            <div className="space-y-3">
              {excecoes.map((exc) => (
                <div key={exc.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{exc.title}</p>
                      <p className="text-xs text-muted-foreground">{exc.userName}</p>
                      {exc.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{exc.description}</p>
                      )}
                    </div>
                    <SecurityRiskBadge level={exc.severity} />
                  </div>
                  {exc.dueAt && (
                    <p className="text-xs text-muted-foreground">
                      Expira em: {formatSecurityDateTime(exc.dueAt)}
                    </p>
                  )}

                  {reviewingId === exc.id ? (
                    <div className="space-y-3 border-t border-border pt-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Decisão</Label>
                          <Select
                            value={reviewForm.decisao}
                            onValueChange={(v) => setReviewForm((p) => ({ ...p, decisao: v as ExcecaoRevisaoDecisao }))}
                            disabled={saving}
                          >
                            <SelectTrigger className="bg-secondary border-border text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {DECISAO_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {reviewForm.decisao === "RENOVADA" && (
                          <div className="space-y-2">
                            <Label className="text-xs">Nova expiração</Label>
                            <Input
                              type="datetime-local"
                              value={reviewForm.novaExpiracao}
                              onChange={(e) => setReviewForm((p) => ({ ...p, novaExpiracao: e.target.value }))}
                              disabled={saving}
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Comentário *</Label>
                        <Textarea
                          value={reviewForm.comentario}
                          onChange={(e) => setReviewForm((p) => ({ ...p, comentario: e.target.value }))}
                          disabled={saving}
                          rows={2}
                          className="bg-secondary border-border text-sm"
                          placeholder="Justificativa da decisão..."
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setReviewingId(null)} disabled={saving}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={handleReview} disabled={saving}>
                          {saving ? "Enviando..." : "Enviar revisão"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setReviewingId(exc.id)}>
                      Revisar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminSegurancaCatalogoPage() {
  return (
    <GlobalSecurityShell
      title="Segurança avançada"
      description="Catálogo de funcionalidades, perfis-padrão com versionamento e gestão de exceções."
    >
      <Tabs defaultValue="catalogo" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="catalogo">Catálogo de funcionalidades</TabsTrigger>
          <TabsTrigger value="perfis">Perfis padrão</TabsTrigger>
          <TabsTrigger value="excecoes">Exceções</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo">
          <CatalogoTab />
        </TabsContent>

        <TabsContent value="perfis">
          <PerfisPadraoTab />
        </TabsContent>

        <TabsContent value="excecoes">
          <ExcecoesTab />
        </TabsContent>
      </Tabs>
    </GlobalSecurityShell>
  );
}

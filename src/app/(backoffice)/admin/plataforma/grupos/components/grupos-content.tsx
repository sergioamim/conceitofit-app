"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  listarGrupos,
  criarGrupo,
  adicionarMembroGrupo,
  removerMembroGrupo,
  atualizarFeaturesGrupo,
  listarModulos,
} from "@/lib/api/gestao-acessos";
import type { GrupoTenant, FeatureModule } from "@/lib/api/gestao-acessos.types";

export function GruposContent() {
  const { toast } = useToast();
  const tenant = useRbacTenant();

  const [grupos, setGrupos] = useState<GrupoTenant[]>([]);
  const [addonModules, setAddonModules] = useState<FeatureModule[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected group editing
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoTenant | null>(null);
  const [groupFeatureKeys, setGroupFeatureKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Add member
  const [addTenantId, setAddTenantId] = useState("");

  // Create dialog
  const [criarOpen, setCriarOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoDescricao, setNovoDescricao] = useState("");

  const availableTenants = tenant.availableTenants ?? [];

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [gruposData, modulesData] = await Promise.all([
        listarGrupos(),
        listarModulos(),
      ]);
      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setAddonModules(
        (Array.isArray(modulesData) ? modulesData : []).filter((m) => m.tipo === "ADDON"),
      );
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function handleSelectGrupo(grupo: GrupoTenant) {
    setSelectedGrupo(grupo);
    setGroupFeatureKeys(new Set());
  }

  function toggleFeature(key: string) {
    setGroupFeatureKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleSaveFeatures() {
    if (!selectedGrupo) return;
    setSaving(true);
    try {
      await atualizarFeaturesGrupo(selectedGrupo.id, Array.from(groupFeatureKeys));
      toast({ title: "Features do grupo atualizadas" });
    } catch (err) {
      toast({
        title: "Erro ao salvar features",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMembro() {
    if (!selectedGrupo || !addTenantId) return;
    try {
      await adicionarMembroGrupo(selectedGrupo.id, addTenantId);
      toast({ title: "Tenant adicionado ao grupo" });
      setAddTenantId("");
    } catch (err) {
      toast({
        title: "Erro ao adicionar membro",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    }
  }

  async function handleRemoveMembro(tenantId: string) {
    if (!selectedGrupo) return;
    try {
      await removerMembroGrupo(selectedGrupo.id, tenantId);
      toast({ title: "Tenant removido do grupo" });
    } catch (err) {
      toast({
        title: "Erro ao remover membro",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    }
  }

  async function handleCriar() {
    if (!novoNome.trim()) return;
    setSaving(true);
    try {
      await criarGrupo({
        nome: novoNome.trim(),
        descricao: novoDescricao.trim() || undefined,
      });
      toast({ title: "Grupo criado", description: novoNome });
      setCriarOpen(false);
      setNovoNome("");
      setNovoDescricao("");
      await reload();
    } catch (err) {
      toast({
        title: "Erro ao criar grupo",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Grupos de Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie grupos para distribuicao de features (beta testers, parceiros, etc.).
          </p>
        </div>
        <Dialog open={criarOpen} onOpenChange={setCriarOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo grupo</DialogTitle>
              <DialogDescription>
                Crie um grupo para agrupar tenants com features compartilhadas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="grupo-nome">Nome</Label>
                <Input
                  id="grupo-nome"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="beta-testers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grupo-descricao">Descricao</Label>
                <Input
                  id="grupo-descricao"
                  value={novoDescricao}
                  onChange={(e) => setNovoDescricao(e.target.value)}
                  placeholder="Grupo para testes de novas features"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-border" onClick={() => setCriarOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriar} disabled={saving || !novoNome.trim()}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="px-5 py-8 text-center text-sm text-muted-foreground">
            Carregando grupos...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grupos ({grupos.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {grupos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum grupo criado.</p>
              ) : (
                grupos.map((grupo) => (
                  <button
                    key={grupo.id}
                    type="button"
                    onClick={() => handleSelectGrupo(grupo)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                      selectedGrupo?.id === grupo.id
                        ? "border-gym-accent/40 bg-gym-accent/5"
                        : "border-border bg-background hover:bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{grupo.nome}</p>
                        {grupo.descricao && (
                          <p className="text-xs text-muted-foreground">{grupo.descricao}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedGrupo
                    ? `Membros: ${selectedGrupo.nome}`
                    : "Selecione um grupo"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedGrupo ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Select value={addTenantId} onValueChange={setAddTenantId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecionar tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTenants.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nome || t.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAddMembro}
                        disabled={!addTenantId}
                        size="sm"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Membros sao gerenciados via API. Adicione tenants acima.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Selecione um grupo para gerenciar membros.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedGrupo
                    ? `Features: ${selectedGrupo.nome}`
                    : "Features do grupo"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedGrupo ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {addonModules.map((mod) => (
                        <label
                          key={mod.key}
                          className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-secondary/30 transition-colors"
                        >
                          <Checkbox
                            checked={groupFeatureKeys.has(mod.key)}
                            onCheckedChange={() => toggleFeature(mod.key)}
                          />
                          <div>
                            <p className="text-sm font-medium">{mod.nome}</p>
                            <p className="text-xs text-muted-foreground">{mod.key}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <Button onClick={handleSaveFeatures} disabled={saving}>
                      <Save className="mr-2 size-4" />
                      Salvar features
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Selecione um grupo para editar features.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

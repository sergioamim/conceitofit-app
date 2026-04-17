"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Plus, Save } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  listarPlanos,
  obterPlano,
  criarPlano,
  atualizarFeaturesPlano,
  listarModulos,
} from "@/lib/api/gestao-acessos";
import type { PlanoSaas, PlanoSaasDetalhe, FeatureModule } from "@/lib/api/gestao-acessos.types";

export function PlanosContent() {
  const { toast } = useToast();

  const [planos, setPlanos] = useState<PlanoSaas[]>([]);
  const [addonModules, setAddonModules] = useState<FeatureModule[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [selectedPlano, setSelectedPlano] = useState<PlanoSaasDetalhe | null>(null);
  const [editFeatureKeys, setEditFeatureKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Create dialog
  const [criarOpen, setCriarOpen] = useState(false);
  const [novoId, setNovoId] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoDescricao, setNovoDescricao] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [planosData, modulesData] = await Promise.all([
        listarPlanos(),
        listarModulos(),
      ]);
      setPlanos(Array.isArray(planosData) ? planosData : []);
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

  async function handleSelectPlano(plano: PlanoSaas) {
    setEditLoading(true);
    try {
      const detalhe = await obterPlano(plano.id);
      setSelectedPlano(detalhe);
      setEditFeatureKeys(new Set(detalhe.featureKeys));
    } catch {
      toast({
        title: "Erro ao carregar plano",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  }

  function toggleFeature(key: string) {
    setEditFeatureKeys((prev) => {
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
    if (!selectedPlano) return;
    setSaving(true);
    try {
      await atualizarFeaturesPlano(selectedPlano.id, Array.from(editFeatureKeys));
      toast({ title: "Features do plano atualizadas" });
      // Refresh
      const detalhe = await obterPlano(selectedPlano.id);
      setSelectedPlano(detalhe);
      setEditFeatureKeys(new Set(detalhe.featureKeys));
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCriar() {
    if (!novoId.trim() || !novoNome.trim()) return;
    setSaving(true);
    try {
      await criarPlano({
        id: novoId.trim(),
        nome: novoNome.trim(),
        descricao: novoDescricao.trim() || undefined,
      });
      toast({ title: "Plano criado", description: novoNome });
      setCriarOpen(false);
      setNovoId("");
      setNovoNome("");
      setNovoDescricao("");
      await reload();
    } catch (err) {
      toast({
        title: "Erro ao criar plano",
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
          <h1 className="text-2xl font-display font-bold">Planos SaaS</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie planos e suas features incluidas.
          </p>
        </div>
        <Dialog open={criarOpen} onOpenChange={setCriarOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo plano SaaS</DialogTitle>
              <DialogDescription>
                Crie um plano que define features incluidas para tenants.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plano-id">ID (slug)</Label>
                <Input
                  id="plano-id"
                  value={novoId}
                  onChange={(e) => setNovoId(e.target.value)}
                  placeholder="premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plano-nome">Nome</Label>
                <Input
                  id="plano-nome"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plano-descricao">Descricao</Label>
                <Input
                  id="plano-descricao"
                  value={novoDescricao}
                  onChange={(e) => setNovoDescricao(e.target.value)}
                  placeholder="Plano completo"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-border" onClick={() => setCriarOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriar} disabled={saving || !novoId.trim() || !novoNome.trim()}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="px-5 py-8 text-center text-sm text-muted-foreground">
            Carregando planos...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planos ({planos.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {planos.map((plano) => (
                <button
                  key={plano.id}
                  type="button"
                  onClick={() => handleSelectPlano(plano)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                    selectedPlano?.id === plano.id
                      ? "border-gym-accent/40 bg-gym-accent/5"
                      : "border-border bg-background hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{plano.nome}</p>
                      <p className="text-xs text-muted-foreground">{plano.id}</p>
                    </div>
                  </div>
                  {plano.descricao && (
                    <p className="text-xs text-muted-foreground mt-1">{plano.descricao}</p>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedPlano
                  ? `Features do plano: ${selectedPlano.nome}`
                  : "Selecione um plano"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : selectedPlano ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {addonModules.map((mod) => (
                      <label
                        key={mod.key}
                        className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-secondary/30 transition-colors"
                      >
                        <Checkbox
                          checked={editFeatureKeys.has(mod.key)}
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
                  Selecione um plano para editar suas features.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

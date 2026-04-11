"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { listPerfisPadrao } from "@/backoffice/api/admin-seguranca-avancada";
import type { PerfilPadrao, SecurityBusinessScope } from "@/lib/types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const SCOPE_OPTIONS: { value: SecurityBusinessScope; label: string }[] = [
  { value: "UNIDADE", label: "Unidade" },
  { value: "ACADEMIA", label: "Academia" },
  { value: "REDE", label: "Rede" },
];

interface PerfisTabProps {
  initialPerfis: PerfilPadrao[];
}

export function PerfisPadraoTab({ initialPerfis }: PerfisTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PerfilPadrao[]>(initialPerfis);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [scopeFilter, setScopeFilter] = useState<SecurityBusinessScope | typeof FILTER_ALL>(FILTER_ALL);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await listPerfisPadrao();
      setItems(data);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = items.filter((p) => {
    if (scopeFilter !== FILTER_ALL && p.recommendedScope !== scopeFilter) return false;
    if (busca) {
      const term = busca.toLowerCase();
      return p.key.toLowerCase().includes(term) || p.displayName.toLowerCase().includes(term);
    }
    return true;
  });

  async function handleCreate() {
    toast({ title: "Criacao de perfis via formulario avancado — use a aba de edicao", variant: "default" });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      )}

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo perfil padrao</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Chave *</Label>
              <Input value={formKey} onChange={(e) => setFormKey(e.target.value)} placeholder="gerente_loja" disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label>Rotulo *</Label>
              <Input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Gerente de Loja" disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label>Escopo</Label>
              <Select value={formScopes[0]} onValueChange={(v) => setFormScopes([v as SecurityBusinessScope])} disabled={saving}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {SCOPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Salvando..." : "Criar perfil"}</Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfis padrao ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar perfil..." className="flex-1 min-w-60" />
            <Select value={scopeFilter} onValueChange={(v) => setScopeFilter(v as SecurityBusinessScope | typeof FILTER_ALL)}>
              <SelectTrigger className="w-36 bg-secondary border-border text-xs"><SelectValue placeholder="Escopo" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                {SCOPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <PaginatedTable<PerfilPadrao>
            columns={[{ label: "Chave" }, { label: "Display Name" }, { label: "Escopo" }, { label: "Versoes" }]}
            items={filtered}
            emptyText={loading ? "Carregando perfis..." : "Nenhum perfil encontrado."}
            getRowKey={(p) => p.key}
            renderCells={(p) => (
              <>
                <td className="px-4 py-3 font-mono text-sm">{p.key}</td>
                <td className="px-4 py-3 text-sm">{p.displayName}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">{p.recommendedScope}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{p.versaoAtual}</td>
              </>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

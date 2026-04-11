"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { listPerfisPadrao, getPerfilPadraoVersoes } from "@/backoffice/api/admin-seguranca-avancada";
import type { PerfilPadrao, SecurityBusinessScope, PerfilPadraoVersao } from "@/lib/types";
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
  const [selectedPerfil, setSelectedPerfil] = useState<PerfilPadrao | null>(null);
  const [versions, setVersions] = useState<PerfilPadraoVersao[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

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

  async function handleSelectPerfil(perfil: PerfilPadrao) {
    setSelectedPerfil(perfil);
    setLoadingVersions(true);
    try {
      const versoes = await getPerfilPadraoVersoes(perfil.key);
      setVersions(versoes);
    } catch (err) {
      toast({ title: "Erro ao carregar versoes", description: normalizeErrorMessage(err), variant: "destructive" });
    } finally {
      setLoadingVersions(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      )}

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
            columns={[{ label: "Chave" }, { label: "Display Name" }, { label: "Escopo" }, { label: "Risco" }, { label: "Versoes" }]}
            items={filtered}
            emptyText={loading ? "Carregando perfis..." : "Nenhum perfil encontrado."}
            getRowKey={(p) => p.key}
            renderCells={(p) => (
              <>
                <td className="px-4 py-3 font-mono text-sm cursor-pointer hover:text-gym-teal" onClick={() => handleSelectPerfil(p)}>{p.key}</td>
                <td className="px-4 py-3 text-sm">{p.displayName}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">{p.recommendedScope}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    p.riskLevel === "CRITICO" ? "bg-red-500/20 text-red-400" :
                    p.riskLevel === "ALTO" ? "bg-orange-500/20 text-orange-400" :
                    p.riskLevel === "MEDIO" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>{p.riskLevel}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{p.versaoAtual}</td>
              </>
            )}
          />
        </CardContent>
      </Card>

      {/* Version History */}
      {selectedPerfil && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Versoes — {selectedPerfil.displayName} ({selectedPerfil.key})</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVersions ? (
              <p className="text-sm text-muted-foreground">Carregando versoes...</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma versao registrada.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {versions.map((v) => (
                  <li key={v.versao} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                    <div>
                      <span className="font-mono text-xs">v{v.versao}</span>
                      <span className="ml-2 text-muted-foreground">{v.descricao ?? "—"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{v.criadoEm ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, User, Briefcase, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminBusca } from "@/backoffice/query";
import type { GlobalSearchPersonType, GlobalSearchResult } from "@/lib/types";
import { ListErrorState, EmptyState } from "@/components/shared/list-states";
import { formatCpf } from "@/lib/formatters";

const TIPO_CONFIG: Record<GlobalSearchPersonType, { label: string; icon: typeof User; badgeClass: string }> = {
  ALUNO: { label: "Alunos", icon: User, badgeClass: "border-gym-teal/40 bg-gym-teal/10 text-gym-teal" },
  FUNCIONARIO: { label: "Funcionários", icon: Briefcase, badgeClass: "border-gym-accent/40 bg-gym-accent/10 text-gym-accent" },
  ADMIN: { label: "Administradores", icon: Shield, badgeClass: "border-gym-warning/40 bg-gym-warning/10 text-gym-warning" },
};

const TIPO_ORDER: GlobalSearchPersonType[] = ["ALUNO", "FUNCIONARIO", "ADMIN"];

function groupByTipo(items: GlobalSearchResult[]): Record<GlobalSearchPersonType, GlobalSearchResult[]> {
  const groups: Record<GlobalSearchPersonType, GlobalSearchResult[]> = {
    ALUNO: [],
    FUNCIONARIO: [],
    ADMIN: [],
  };
  for (const item of items) {
    const tipo = item.tipo in groups ? item.tipo : "ALUNO";
    groups[tipo].push(item);
  }
  return groups;
}

export default function BuscaGlobalPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const buscaQuery = useAdminBusca(debouncedQuery, 50);

  const results = buscaQuery.data?.items ?? [];
  const total = buscaQuery.data?.total ?? 0;
  const loading = buscaQuery.isFetching;
  const error = buscaQuery.error
    ? (buscaQuery.error instanceof Error ? buscaQuery.error.message : "Erro ao buscar. Tente novamente.")
    : null;
  const searched = debouncedQuery.trim().length >= 2;

  const grouped = groupByTipo(results);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Busca Global</p>
        <h1 className="font-display text-3xl font-bold leading-tight">Busca Global de Pessoas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Encontre qualquer aluno, funcionário ou administrador em qualquer academia e unidade.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, CPF ou e-mail..."
          className="h-12 border-border bg-card pl-11 text-base"
          autoFocus
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="size-5 animate-spin rounded-full border-2 border-gym-accent border-t-transparent" />
          </div>
        )}
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void buscaQuery.refetch()} /> : null}

      {searched && !error && results.length === 0 && (
        <EmptyState variant="search" message={`Nenhum resultado encontrado para "${query.trim()}".`} />
      )}

      {searched && results.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {total} resultado{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
        </p>
      )}

      {TIPO_ORDER.map((tipo) => {
        const items = grouped[tipo];
        if (items.length === 0) return null;
        const config = TIPO_CONFIG[tipo];
        const Icon = config.icon;

        return (
          <Card key={tipo} className="border-border/70 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="size-4" />
                {config.label}
                <Badge variant="outline" className={config.badgeClass}>
                  {items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-0">
              {items.map((item) => (
                <Link
                  key={`${item.tipo}-${item.id}`}
                  href={item.href ?? "#"}
                  className="flex items-center justify-between gap-4 border-t border-border px-6 py-3 transition-colors hover:bg-secondary/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.nome}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {item.cpf ? <span>CPF: {formatCpf(item.cpf)}</span> : null}
                      {item.email ? <span>{item.email}</span> : null}
                      {item.telefone ? <span>{item.telefone}</span> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    {item.academiaNome ? (
                      <span className="text-xs font-medium">{item.academiaNome}</span>
                    ) : null}
                    {item.unidadeNome ? (
                      <span className="text-xs text-muted-foreground">{item.unidadeNome}</span>
                    ) : null}
                    {item.status ? (
                      <Badge variant="outline" className="text-[10px]">
                        {item.status}
                      </Badge>
                    ) : null}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

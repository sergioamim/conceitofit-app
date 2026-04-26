"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, History, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { listarAuditoria } from "../api/client";
import type {
  CategoriaAuditoria,
  Dominio,
  RangeAuditoria,
} from "../api/types";
import { AvatarIniciais } from "../components/avatar-iniciais";

interface AuditProps {
  dominio: Dominio;
  tenantId?: string;
}

const CATEGORIAS: { id: CategoriaAuditoria | ""; label: string; color: string }[] = [
  { id: "", label: "Tudo", color: "var(--gym-accent)" },
  { id: "usuario", label: "Usuários", color: "#0ea5e9" },
  { id: "papel", label: "Papéis", color: "#7c5cbf" },
  { id: "permissao", label: "Permissões", color: "#6b8c1a" },
  { id: "seguranca", label: "Segurança", color: "#dc3545" },
  { id: "alerta", label: "Alertas", color: "#e09020" },
  { id: "dados", label: "Dados", color: "#1ea06a" },
];

export function RbacAudit({ dominio, tenantId }: AuditProps) {
  const [q, setQ] = useState("");
  const [range, setRange] = useState<RangeAuditoria>("7d");
  const [categoria, setCategoria] = useState<CategoriaAuditoria | "">("");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const enabled = dominio === "PLATAFORMA" || Boolean(tenantId);

  const auditQ = useQuery({
    queryKey: ["rbac", "auditoria", dominio, tenantId ?? null, q, range, categoria],
    queryFn: () =>
      listarAuditoria({
        dominio,
        tenantId,
        q: q || undefined,
        range,
        categoria: categoria || undefined,
        size: 100,
      }),
    enabled,
    staleTime: 15_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Gestão de Acesso / Auditoria
          </p>
          <h1 className="text-2xl font-display font-bold mt-1">Auditoria</h1>
          <p className="text-sm text-muted-foreground">
            Registro imutável de mudanças de acesso, permissões e segurança. Retenção: 18 meses.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por autor, alvo ou ação…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeAuditoria)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((c) => (
          <button
            key={c.id || "all"}
            onClick={() => setCategoria(c.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              categoria === c.id
                ? "border-current"
                : "border-border bg-muted text-muted-foreground hover:bg-secondary",
            )}
            style={
              categoria === c.id
                ? {
                    background: `color-mix(in oklab, ${c.color} 15%, transparent)`,
                    color: c.color,
                    borderColor: `color-mix(in oklab, ${c.color} 30%, transparent)`,
                  }
                : undefined
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {auditQ.isLoading && (
            <div className="space-y-2 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {!auditQ.isLoading && (auditQ.data?.content.length ?? 0) === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              <History className="mx-auto mb-3 size-8 opacity-30" />
              Nenhum evento. Ajuste filtros ou range.
            </div>
          )}
          {!auditQ.isLoading && auditQ.data && auditQ.data.content.length > 0 && (
            <ul className="divide-y divide-border">
              {auditQ.data.content.map((ev) => (
                <li
                  key={ev.id}
                  className="grid grid-cols-[80px_1fr_auto] items-start gap-4 px-5 py-3"
                >
                  <p className="text-xs text-muted-foreground">
                    {hydrated
                      ? new Date(ev.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ev.createdAt.slice(0, 16).replace("T", " ")}
                  </p>
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarIniciais nome={ev.autorEmail} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <b>{ev.autorEmail}</b>{" "}
                        <span className="text-muted-foreground">{ev.action}</span>{" "}
                        {ev.resourceKey && (
                          <span className="font-mono text-xs">{ev.resourceKey}</span>
                        )}
                      </p>
                      {ev.details && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {ev.details}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {ev.critico && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gym-danger/30 bg-gym-danger/10 px-2 py-0.5 text-[10px] font-bold text-gym-danger">
                        <AlertTriangle className="size-3" />
                        crítica
                      </span>
                    )}
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                      {ev.categoria}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {auditQ.data && (
        <p className="text-xs text-muted-foreground">
          Mostrando {auditQ.data.content.length} de {auditQ.data.totalElements} evento(s).
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  CreditCard,
  LayoutDashboard,
  Loader2,
  Search,
  ShoppingCart,
  UserPlus,
  Users,
} from "lucide-react";
import { useTenantContext } from "@/hooks/use-session-context";
import { searchAlunosApi } from "@/lib/api/alunos";
import { listProspectsApi } from "@/lib/api/crm";
import { listPlanosApi } from "@/lib/api/comercial-catalogo";
import { allNavItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import { MOTION_CLASSNAMES } from "@/lib/ui-motion";

type SearchResult = {
  id: string;
  label: string;
  description?: string;
  href: string;
  group: "clientes" | "prospects" | "planos" | "navegacao";
};

const ITEM_CLASS =
  "focus-ring-brand flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-secondary aria-selected:text-gym-accent";

const GROUP_HEADING_CLASS =
  "px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [entityResults, setEntityResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const { tenantId } = useTenantContext();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setEntityResults([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = search.trim();
    if (query.length < 2 || !tenantId) {
      setEntityResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void searchEntities(tenantId, query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tenantId]);

  async function searchEntities(tid: string, query: string) {
    const lowerQuery = query.toLowerCase();

    try {
      const [alunos, prospects, planos] = await Promise.allSettled([
        searchAlunosApi({ tenantId: tid, search: query, size: 5 }),
        listProspectsApi({ tenantId: tid }),
        listPlanosApi({ tenantId: tid }),
      ]);

      const results: SearchResult[] = [];

      if (alunos.status === "fulfilled") {
        for (const aluno of alunos.value.slice(0, 5)) {
          results.push({
            id: `aluno-${aluno.id}`,
            label: aluno.nome,
            description: aluno.email || aluno.cpf || undefined,
            href: `/clientes/${aluno.id}`,
            group: "clientes",
          });
        }
      }

      if (prospects.status === "fulfilled") {
        const filtered = prospects.value
          .filter(
            (p) =>
              p.nome.toLowerCase().includes(lowerQuery) ||
              p.email?.toLowerCase().includes(lowerQuery) ||
              p.telefone?.includes(query),
          )
          .slice(0, 5);
        for (const prospect of filtered) {
          results.push({
            id: `prospect-${prospect.id}`,
            label: prospect.nome,
            description: prospect.email || prospect.telefone || undefined,
            href: `/prospects`,
            group: "prospects",
          });
        }
      }

      if (planos.status === "fulfilled") {
        const filtered = planos.value
          .filter((p) => p.nome.toLowerCase().includes(lowerQuery))
          .slice(0, 5);
        for (const plano of filtered) {
          results.push({
            id: `plano-${plano.id}`,
            label: plano.nome,
            description: `${plano.tipo} · R$ ${plano.valor.toFixed(2)}`,
            href: `/planos`,
            group: "planos",
          });
        }
      }

      setEntityResults(results);
    } catch {
      setEntityResults([]);
    } finally {
      setLoading(false);
    }
  }

  const onSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const clienteResults = useMemo(() => entityResults.filter((r) => r.group === "clientes"), [entityResults]);
  const prospectResults = useMemo(() => entityResults.filter((r) => r.group === "prospects"), [entityResults]);
  const planoResults = useMemo(() => entityResults.filter((r) => r.group === "planos"), [entityResults]);

  const hasEntityResults = entityResults.length > 0;
  const isSearching = search.trim().length >= 2;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Palette"
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center pt-[20vh]",
        MOTION_CLASSNAMES.fadeInOverlay,
      )}
      shouldFilter={!isSearching}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl",
          MOTION_CLASSNAMES.panelEnter,
        )}
      >
        <div className="flex items-center border-b border-border px-4">
          <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
          <Command.Input
            placeholder="Buscar clientes, prospects, planos, páginas..."
            value={search}
            onValueChange={setSearch}
            className="focus-ring-brand flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <div className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </div>
          )}
        </div>

        <Command.List className="max-h-[360px] overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="px-4 py-6 text-center text-sm text-muted-foreground">
            {loading ? "Buscando..." : "Nenhum resultado encontrado."}
          </Command.Empty>

          {!isSearching && (
            <Command.Group
              heading="Ações Rápidas"
              className={GROUP_HEADING_CLASS}
            >
              <Command.Item
                onSelect={() => onSelect("/dashboard")}
                className={ITEM_CLASS}
              >
                <LayoutDashboard className="size-4" />
                <span>Dashboard Principal</span>
              </Command.Item>
              <Command.Item
                onSelect={() => onSelect("/vendas/nova")}
                className={ITEM_CLASS}
              >
                <ShoppingCart className="size-4" />
                <span>Nova Venda</span>
              </Command.Item>
            </Command.Group>
          )}

          {clienteResults.length > 0 && (
            <>
              <Command.Separator className="my-2 h-px bg-border" />
              <Command.Group heading="Clientes" className={GROUP_HEADING_CLASS}>
                {clienteResults.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => onSelect(item.href)}
                    className={ITEM_CLASS}
                  >
                    <Users className="size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            </>
          )}

          {prospectResults.length > 0 && (
            <>
              <Command.Separator className="my-2 h-px bg-border" />
              <Command.Group
                heading="Prospects"
                className={GROUP_HEADING_CLASS}
              >
                {prospectResults.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => onSelect(item.href)}
                    className={ITEM_CLASS}
                  >
                    <UserPlus className="size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            </>
          )}

          {planoResults.length > 0 && (
            <>
              <Command.Separator className="my-2 h-px bg-border" />
              <Command.Group heading="Planos" className={GROUP_HEADING_CLASS}>
                {planoResults.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => onSelect(item.href)}
                    className={ITEM_CLASS}
                  >
                    <CreditCard className="size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            </>
          )}

          {isSearching && hasEntityResults && (
            <Command.Separator className="my-2 h-px bg-border" />
          )}

          <Command.Group heading="Navegação" className={GROUP_HEADING_CLASS}>
            {allNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Command.Item
                  key={item.href}
                  onSelect={() => onSelect(item.href)}
                  className={ITEM_CLASS}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="rounded border border-border bg-card px-1 py-0.5">
                ↑↓
              </span>{" "}
              Navegar
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="rounded border border-border bg-card px-1 py-0.5">
                ↵
              </span>{" "}
              Selecionar
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Academia App <span className="text-gym-accent">v1.0</span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}

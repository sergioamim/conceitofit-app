"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Command } from "cmdk";
import {
  ArrowRightLeft,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Search,
  ShoppingCart,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { ApiRequestError } from "@/lib/api/http";
import { searchAlunosApi } from "@/lib/api/alunos";
import { migrarClienteParaUnidadeService } from "@/lib/tenant/comercial/runtime";
import { formatDate } from "@/lib/formatters";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";
import { listProspectsApi } from "@/lib/api/crm";
import { listPlanosApi } from "@/lib/api/comercial-catalogo";
import { allNavItems } from "@/lib/tenant/nav-items";
import { cn } from "@/lib/utils";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { MOTION_CLASSNAMES } from "@/lib/ui-motion";

type SearchResult = {
  id: string;
  label: string;
  description?: string;
  href: string;
  group: "clientes" | "prospects" | "planos" | "navegacao";
  tenantId?: string;
  tenantName?: string;
  status?: string;
  planoAtivo?: string;
  contratoFim?: string;
};

type MigrationBlockedBy = {
  code: string;
  message: string;
};

const crossUnitMigrationSchema = z.object({
  justificativa: requiredTrimmedString("Informe a justificativa da migração."),
});

type CrossUnitMigrationFormValues = z.infer<typeof crossUnitMigrationSchema>;

const ITEM_CLASS =
  "focus-ring-brand flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-secondary aria-selected:text-gym-accent";

const GROUP_HEADING_CLASS =
  "px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

function normalizeForSearch(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function commandFilter(value: string, search: string): number {
  const normalizedValue = normalizeForSearch(value);
  const normalizedSearch = normalizeForSearch(search);
  if (normalizedValue.includes(normalizedSearch)) return 1;
  // Match each word of the search independently
  const words = normalizedSearch.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => normalizedValue.includes(w))) return 1;
  return 0;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [entityResults, setEntityResults] = useState<SearchResult[]>([]);
  const [crossUnitCliente, setCrossUnitCliente] = useState<SearchResult | null>(null);
  const [migrationError, setMigrationError] = useState("");
  const [migrationBlockedBy, setMigrationBlockedBy] = useState<MigrationBlockedBy[]>([]);
  const [migratingCliente, setMigratingCliente] = useState(false);
  const router = useRouter();
  const { tenantId, tenantName, tenants } = useTenantContext();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const migrationForm = useForm<CrossUnitMigrationFormValues>({
    resolver: zodResolver(crossUnitMigrationSchema),
    defaultValues: {
      justificativa: "",
    },
  });
  const tenantCatalog = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, tenant.nome] as const)),
    [tenants],
  );

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
            tenantId: aluno.tenantId,
            tenantName: tenantCatalog.get(aluno.tenantId),
            status: aluno.status,
            planoAtivo: aluno.estadoAtual?.descricaoContratoAtual,
            contratoFim: aluno.estadoAtual?.dataFimContratoAtual,
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

  function parseMigracaoErro(error: unknown): { message: string; blockedBy: MigrationBlockedBy[] } {
    if (error instanceof ApiRequestError) {
      let blockedBy: MigrationBlockedBy[] = [];
      if (error.responseBody) {
        try {
          const parsed = JSON.parse(error.responseBody) as { blockedBy?: MigrationBlockedBy[] };
          if (Array.isArray(parsed.blockedBy)) {
            blockedBy = parsed.blockedBy.filter(
              (item): item is MigrationBlockedBy =>
                typeof item?.code === "string" && typeof item?.message === "string",
            );
          }
        } catch {
          blockedBy = [];
        }
      }

      if (error.status === 403) {
        return { message: "Seu perfil não possui permissão para migrar a unidade-base do cliente.", blockedBy };
      }
      if (error.status === 409) {
        return {
          message: blockedBy[0]?.message ?? "A migração foi bloqueada pelas regras estruturais do cliente.",
          blockedBy,
        };
      }
      if (error.status === 422) {
        return { message: "Revise a justificativa antes de confirmar a migração.", blockedBy };
      }
    }

    return { message: normalizeErrorMessage(error), blockedBy: [] };
  }

  function closeCrossUnitDialog() {
    setCrossUnitCliente(null);
    setMigrationError("");
    setMigrationBlockedBy([]);
    migrationForm.reset();
  }

  function handleClienteSelect(item: SearchResult) {
    if (!item.tenantId || !tenantId || item.tenantId === tenantId) {
      onSelect(item.href);
      return;
    }

    setOpen(false);
    setMigrationError("");
    setMigrationBlockedBy([]);
    migrationForm.reset({ justificativa: "" });
    setCrossUnitCliente(item);
  }

  async function handleCrossUnitMigration(values: CrossUnitMigrationFormValues) {
    if (!crossUnitCliente?.tenantId || !tenantId) return;

    setMigratingCliente(true);
    setMigrationError("");
    setMigrationBlockedBy([]);
    try {
      await migrarClienteParaUnidadeService({
        tenantId: crossUnitCliente.tenantId,
        id: crossUnitCliente.id.replace(/^aluno-/, ""),
        tenantDestinoId: tenantId,
        justificativa: values.justificativa,
        preservarContextoComercial: true,
      });
      const href = crossUnitCliente.href;
      closeCrossUnitDialog();
      router.push(href);
    } catch (error) {
      const parsed = parseMigracaoErro(error);
      setMigrationError(parsed.message);
      setMigrationBlockedBy(parsed.blockedBy);
    } finally {
      setMigratingCliente(false);
    }
  }

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
      filter={commandFilter}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <DialogTitle className="sr-only">Paleta global de comandos</DialogTitle>
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
                    value={`${search} ${item.label}`}
                    onSelect={() => handleClienteSelect(item)}
                    className={ITEM_CLASS}
                  >
                    <Users className="size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{item.label}</span>
                        {item.tenantId && tenantId && item.tenantId !== tenantId ? (
                          <Badge variant="outline" className="border-amber-400/40 text-[10px] text-amber-300">
                            outra unidade
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {item.description ? <span>{item.description}</span> : null}
                        {item.tenantName ? <span>{item.tenantName}</span> : null}
                      </div>
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
                    value={`${search} ${item.label}`}
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
                    value={`${search} ${item.label}`}
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
              const searchValue = [item.label, item.description, item.href.replace(/\//g, " ")]
                .filter(Boolean)
                .join(" ");
              return (
                <Command.Item
                  key={item.href}
                  value={searchValue}
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

      <Dialog
        open={crossUnitCliente != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeCrossUnitDialog();
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Cliente localizado em outra unidade
            </DialogTitle>
            <DialogDescription>
              A unidade ativa permanece inalterada. Revise o contexto do cliente e, se fizer sentido, migre-o para {tenantName || "a unidade ativa"}.
            </DialogDescription>
          </DialogHeader>

          {crossUnitCliente ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{crossUnitCliente.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {crossUnitCliente.description || "Sem contato principal informado"}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-amber-400/40 text-amber-300">
                    outra unidade
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Unidade atual do cliente
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {crossUnitCliente.tenantName || tenantCatalog.get(crossUnitCliente.tenantId ?? "") || crossUnitCliente.tenantId}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Unidade ativa da recepção
                    </p>
                    <p className="mt-1 text-sm text-foreground">{tenantName || tenantCatalog.get(tenantId ?? "") || tenantId}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status do cliente
                    </p>
                    <p className="mt-1 text-sm text-foreground">{crossUnitCliente.status || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Plano ativo
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {crossUnitCliente.planoAtivo || "Sem plano ativo identificado"}
                    </p>
                    {crossUnitCliente.contratoFim ? (
                      <p className="text-xs text-muted-foreground">
                        Vigência até {formatDate(crossUnitCliente.contratoFim)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <form
                onSubmit={migrationForm.handleSubmit((values) => {
                  void handleCrossUnitMigration(values);
                })}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Justificativa da migração
                  </label>
                  <Textarea
                    {...migrationForm.register("justificativa")}
                    rows={4}
                    maxLength={500}
                    className="border-border bg-secondary"
                    placeholder="Explique por que o cliente deve ser migrado para a unidade ativa."
                  />
                  {migrationForm.formState.errors.justificativa ? (
                    <p className="text-xs text-gym-danger">
                      {migrationForm.formState.errors.justificativa.message}
                    </p>
                  ) : null}
                </div>

                {migrationError ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    <p>{migrationError}</p>
                    {migrationBlockedBy.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs">
                        {migrationBlockedBy.map((item) => (
                          <li key={item.code}>{item.message}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeCrossUnitDialog} disabled={migratingCliente}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={migratingCliente}>
                    {migratingCliente ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Migrando...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="mr-2 size-4" />
                        Migrar para unidade ativa
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Command.Dialog>
  );
}

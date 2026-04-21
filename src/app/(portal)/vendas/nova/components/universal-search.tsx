"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Command } from "cmdk";
import {
  Loader2,
  Package,
  ScanLine,
  Search,
  User,
  UserPlus,
  Zap,
} from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { searchAlunosApi } from "@/lib/api/alunos";
import {
  listPlanosApi,
  listProdutosApi,
} from "@/lib/api/comercial-catalogo";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Aluno, Plano, Produto } from "@/lib/types";

import { useBarcodeScanner } from "../hooks/use-barcode-scanner";

/**
 * Busca universal do cockpit de venda (VUN-2.1).
 *
 * Client Island montado no slot `headerCenter` do `CockpitShell`. Abre com
 * Cmd+K/Ctrl+K (ou clique no trigger) e fecha com Esc. A busca debounced
 * (300ms, ≥3 chars) dispara em paralelo contra os 3 endpoints existentes do
 * backend. Planos e produtos são filtrados no cliente pois seus endpoints não
 * aceitam `?q=` — adaptação documentada no final da story.
 *
 * O scanner inline reaproveita `use-barcode-scanner.ts` sem alterá-lo: ao
 * detectar um código, procura por `codigoBarras`/`sku` exato em `produtos` e
 * chama `onSelectProduto`.
 *
 * Todas as ações ocorrem via callbacks — o componente não muta o carrinho
 * diretamente, respeitando a separação do `use-venda-workspace`.
 */

const MIN_QUERY_CHARS = 3;
const DEBOUNCE_MS = 300;
const RESULT_LIMIT = 5;

const ITEM_CLASS =
  "focus-ring-brand flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-secondary aria-selected:text-gym-accent";

const GROUP_HEADING_CLASS =
  "px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

export interface UniversalSearchProps {
  onSelectCliente?: (cliente: Aluno) => void;
  onSelectPlano?: (plano: Plano) => void;
  onSelectProduto?: (produto: Produto) => void;
  /**
   * Placeholder da ação "Criar prospect rápido" (AC9). A execução real chega
   * em VUN-2.4; por ora apenas registra o callback para integração progressiva.
   */
  onCreateProspect?: (cpfOuTermo: string) => void;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesQuery(candidate: string, query: string): boolean {
  const haystack = normalizeText(candidate);
  const needle = normalizeText(query);
  if (!needle) return false;
  if (haystack.includes(needle)) return true;
  const words = needle.split(/\s+/).filter(Boolean);
  return words.length > 1 && words.every((w) => haystack.includes(w));
}

function looksLikeCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11;
}

interface SearchState {
  clientes: Aluno[];
  planos: Plano[];
  produtos: Produto[];
}

const EMPTY_RESULTS: SearchState = {
  clientes: [],
  planos: [],
  produtos: [],
};

export function UniversalSearch(props: UniversalSearchProps) {
  const {
    onSelectCliente,
    onSelectPlano,
    onSelectProduto,
    onCreateProspect,
  } = props;
  const { tenantId } = useTenantContext();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchState>(EMPTY_RESULTS);
  const [scannerMode, setScannerMode] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const produtosCacheRef = useRef<Produto[] | null>(null);
  const requestIdRef = useRef(0);

  /** Resolve produto via barcode/SKU usando cache carregado da última busca
   * OU buscando a lista completa se o cache ainda não tiver sido populado. */
  const handleScannerDetect = useCallback(
    (code: string): boolean => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return false;

      const pool =
        produtosCacheRef.current && produtosCacheRef.current.length > 0
          ? produtosCacheRef.current
          : results.produtos;

      const match = pool.find((p) => {
        const cb = p.codigoBarras?.trim().toUpperCase();
        const sku = p.sku?.trim().toUpperCase();
        return cb === normalized || sku === normalized;
      });

      if (!match) return false;
      onSelectProduto?.(match);
      setOpen(false);
      setScannerMode(false);
      return true;
    },
    [onSelectProduto, results.produtos]
  );

  const scanner = useBarcodeScanner(handleScannerDetect);
  const {
    scannerOpen,
    setScannerOpen,
    videoRef,
    scannerError,
    manualCode,
    setManualCode,
  } = scanner;

  // Atalho global Cmd+K / Ctrl+K (AC2)
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Reset ao fechar
  useEffect(() => {
    if (open) return;
    setQuery("");
    setResults(EMPTY_RESULTS);
    setLoading(false);
    setScannerMode(false);
    setScannerOpen(false);
    setManualCode("");
  }, [open, setScannerOpen, setManualCode]);

  // Sincroniza modo scanner com hook de câmera
  useEffect(() => {
    setScannerOpen(scannerMode);
  }, [scannerMode, setScannerOpen]);

  // Busca debounced nos 3 endpoints quando query ≥ 3 chars (AC3)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_CHARS || !tenantId || scannerMode) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    debounceRef.current = setTimeout(async () => {
      const [alunosRes, planosRes, produtosRes] = await Promise.allSettled([
        searchAlunosApi({ tenantId, search: trimmed, size: RESULT_LIMIT }),
        listPlanosApi({ tenantId, apenasAtivos: true }),
        listProdutosApi(true),
      ]);

      // Evita race condition: ignora resposta se outra busca começou
      if (requestIdRef.current !== currentRequestId) return;

      const clientes =
        alunosRes.status === "fulfilled"
          ? alunosRes.value.slice(0, RESULT_LIMIT)
          : [];

      const planos =
        planosRes.status === "fulfilled"
          ? planosRes.value
              .filter(
                (p) => matchesQuery(p.nome, trimmed) && p.ativo !== false
              )
              .slice(0, RESULT_LIMIT)
          : [];

      const produtosAll =
        produtosRes.status === "fulfilled" ? produtosRes.value : [];
      produtosCacheRef.current = produtosAll;
      const produtos = produtosAll
        .filter(
          (p) =>
            matchesQuery(p.nome, trimmed) ||
            (p.sku && matchesQuery(p.sku, trimmed)) ||
            (p.codigoBarras && matchesQuery(p.codigoBarras, trimmed))
        )
        .slice(0, RESULT_LIMIT);

      setResults({ clientes, planos, produtos });
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tenantId, scannerMode]);

  const hasAnyResult = useMemo(
    () =>
      results.clientes.length +
        results.planos.length +
        results.produtos.length >
      0,
    [results]
  );

  const showProspectPlaceholder =
    !loading &&
    !scannerMode &&
    query.trim().length >= MIN_QUERY_CHARS &&
    results.clientes.length === 0 &&
    looksLikeCpf(query);

  const handleClienteSelect = useCallback(
    (cliente: Aluno) => {
      onSelectCliente?.(cliente);
      setOpen(false);
    },
    [onSelectCliente]
  );

  const handlePlanoSelect = useCallback(
    (plano: Plano) => {
      onSelectPlano?.(plano);
      setOpen(false);
    },
    [onSelectPlano]
  );

  const handleProdutoSelect = useCallback(
    (produto: Produto) => {
      onSelectProduto?.(produto);
      setOpen(false);
    },
    [onSelectProduto]
  );

  const handleProspectClick = useCallback(() => {
    onCreateProspect?.(query.trim());
  }, [onCreateProspect, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir busca universal (Cmd+K)"
        data-testid="universal-search-trigger"
        className={cn(
          "flex h-9 w-full max-w-[520px] items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-left text-sm text-[color:oklch(0.85_0_0)] transition",
          "hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gym-accent"
        )}
      >
        <Search className="size-4 shrink-0 opacity-70" aria-hidden />
        <span className="flex-1 truncate text-[13px]">
          Buscar cliente, plano ou produto...
        </span>
        <kbd className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
          ⌘K
        </kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Busca universal"
        data-testid="universal-search-dialog"
        className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <DialogTitle className="sr-only">Busca universal do cockpit</DialogTitle>
        <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <Command.Input
              placeholder={
                scannerMode
                  ? "Scanner ativo — aponte a câmera ou digite o código"
                  : "Buscar cliente (nome/CPF), plano ou produto... (mínimo 3 caracteres)"
              }
              value={query}
              onValueChange={setQuery}
              autoFocus
              aria-label="Termo de busca"
              className="focus-ring-brand flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading ? (
              <Loader2
                className="size-4 shrink-0 animate-spin text-muted-foreground"
                aria-label="Carregando"
              />
            ) : null}
            <button
              type="button"
              onClick={() => setScannerMode((prev) => !prev)}
              aria-pressed={scannerMode}
              aria-label={
                scannerMode ? "Desativar scanner" : "Ativar scanner de código"
              }
              data-testid="universal-search-scanner-toggle"
              className={cn(
                "ml-1 flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition",
                "hover:bg-secondary hover:text-foreground",
                scannerMode &&
                  "border-gym-accent bg-gym-accent/10 text-gym-accent"
              )}
            >
              <ScanLine className="size-4" aria-hidden />
            </button>
          </div>

          {scannerMode ? (
            <div
              className="space-y-3 border-b border-border p-4"
              data-testid="universal-search-scanner-panel"
            >
              <p className="text-xs text-muted-foreground">
                Aponte a câmera para o código de barras ou informe manualmente.
              </p>
              <video
                ref={videoRef}
                className="h-40 w-full rounded-md border border-border bg-black/80 object-cover"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  placeholder="Código de barras ou SKU"
                  aria-label="Código manual"
                  className="flex h-9 flex-1 rounded-md border border-border bg-secondary px-3 text-sm outline-none focus-ring-brand"
                />
                <button
                  type="button"
                  onClick={() => handleScannerDetect(manualCode)}
                  className="h-9 rounded-md bg-gym-accent px-3 text-sm font-medium text-gym-accent-foreground hover:opacity-90"
                >
                  Buscar código
                </button>
              </div>
              {scannerError ? (
                <p className="text-xs text-gym-danger">{scannerError}</p>
              ) : null}
              {!scannerOpen ? (
                <p className="text-[11px] text-muted-foreground">
                  Acesso à câmera opcional — o campo manual continua disponível.
                </p>
              ) : null}
            </div>
          ) : null}

          <Command.List
            className="max-h-[360px] overflow-y-auto p-2 scrollbar-thin"
            aria-label="Resultados da busca"
          >
            {!scannerMode ? (
              <Command.Empty
                className="px-4 py-6 text-center text-sm text-muted-foreground"
                data-testid="universal-search-empty"
              >
                {query.trim().length < MIN_QUERY_CHARS
                  ? `Digite pelo menos ${MIN_QUERY_CHARS} caracteres para buscar.`
                  : loading
                    ? "Buscando..."
                    : "Nenhum resultado encontrado."}
              </Command.Empty>
            ) : null}

            {!scannerMode && results.clientes.length > 0 ? (
              <Command.Group
                heading="Clientes"
                className={GROUP_HEADING_CLASS}
                data-testid="universal-search-group-clientes"
              >
                {results.clientes.map((cliente) => (
                  <Command.Item
                    key={`cliente-${cliente.id}`}
                    value={`cliente ${cliente.nome} ${cliente.cpf} ${cliente.email ?? ""}`}
                    onSelect={() => handleClienteSelect(cliente)}
                    className={ITEM_CLASS}
                  >
                    <User className="size-4 shrink-0" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{cliente.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        CPF {cliente.cpf}
                        {cliente.email ? ` · ${cliente.email}` : ""}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            {!scannerMode && results.planos.length > 0 ? (
              <>
                <Command.Separator className="my-2 h-px bg-border" />
                <Command.Group
                  heading="Planos"
                  className={GROUP_HEADING_CLASS}
                  data-testid="universal-search-group-planos"
                >
                  {results.planos.map((plano) => (
                    <Command.Item
                      key={`plano-${plano.id}`}
                      value={`plano ${plano.nome} ${plano.tipo}`}
                      onSelect={() => handlePlanoSelect(plano)}
                      className={ITEM_CLASS}
                    >
                      <Zap className="size-4 shrink-0" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{plano.nome}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {plano.tipo} · {formatBRL(Number(plano.valor ?? 0))}
                        </p>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              </>
            ) : null}

            {!scannerMode && results.produtos.length > 0 ? (
              <>
                <Command.Separator className="my-2 h-px bg-border" />
                <Command.Group
                  heading="Produtos"
                  className={GROUP_HEADING_CLASS}
                  data-testid="universal-search-group-produtos"
                >
                  {results.produtos.map((produto) => (
                    <Command.Item
                      key={`produto-${produto.id}`}
                      value={`produto ${produto.nome} ${produto.sku ?? ""} ${produto.codigoBarras ?? ""}`}
                      onSelect={() => handleProdutoSelect(produto)}
                      className={ITEM_CLASS}
                    >
                      <Package className="size-4 shrink-0" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{produto.nome}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {produto.sku ?? "SEM SKU"} ·{" "}
                          {formatBRL(Number(produto.valorVenda ?? 0))}
                        </p>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              </>
            ) : null}

            {showProspectPlaceholder ? (
              <>
                {hasAnyResult ? (
                  <Command.Separator className="my-2 h-px bg-border" />
                ) : null}
                <Command.Group
                  heading="Ações"
                  className={GROUP_HEADING_CLASS}
                  data-testid="universal-search-group-prospect"
                >
                  <Command.Item
                    value={`criar-prospect ${query}`}
                    onSelect={handleProspectClick}
                    className={ITEM_CLASS}
                    data-testid="universal-search-create-prospect"
                  >
                    <UserPlus className="size-4 shrink-0" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        Criar prospect rápido
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        CPF {query.trim()} não encontrado — cadastro inline
                        disponível em VUN-2.4.
                      </p>
                    </div>
                  </Command.Item>
                </Command.Group>
              </>
            ) : null}
          </Command.List>

          <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-card px-1 py-0.5">
                  ↑↓
                </kbd>
                Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-card px-1 py-0.5">
                  ↵
                </kbd>
                Selecionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-card px-1 py-0.5">
                  Esc
                </kbd>
                Fechar
              </span>
            </div>
            <span className="text-gym-accent">VUN-2.1 · busca universal</span>
          </div>
        </div>
      </Command.Dialog>
    </>
  );
}

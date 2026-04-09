"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  DollarSign,
  Link2,
  MoreHorizontal,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  getDunningDashboardApi,
  listDunningIntervencoesApi,
  gerarLinkPagamentoDunningApi,
  regularizarDunningApi,
  suspenderDunningApi,
  tentarOutroGatewayDunningApi,
  regularizarEmLoteDunningApi,
  type DunningDashboard,
  type DunningIntervencaoItem,
  type FormaPagamentoDunning,
} from "@/lib/api/dunning";
import { formatBRL, formatDate } from "@/lib/formatters";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const dunningKeys = {
  dashboard: (tenantId: string) => ["dunning", "dashboard", tenantId] as const,
  intervencoes: (tenantId: string, filters: Record<string, unknown>) =>
    ["dunning", "intervencoes", tenantId, filters] as const,
};

// ---------------------------------------------------------------------------
// Metric Card (glass-card pattern)
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "accent",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  tone?: "accent" | "teal" | "warning" | "danger";
}) {
  const tones = {
    accent: "text-gym-accent border-gym-accent/20 bg-gym-accent/10",
    teal: "text-gym-teal border-gym-teal/20 bg-gym-teal/10",
    warning: "text-gym-warning border-gym-warning/20 bg-gym-warning/10",
    danger: "text-gym-danger border-gym-danger/20 bg-gym-danger/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="glass-card group relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-xl hover:shadow-primary/5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-transform group-hover:scale-110 ${tones[tone]}`}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
              {label}
            </p>
            <h3 className="font-display text-2xl font-extrabold tracking-tight">
              {value}
            </h3>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DunningContent() {
  const { tenantId } = useTenantContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Filters
  const [busca, setBusca] = useState("");
  const [dataVencimentoDe, setDataVencimentoDe] = useState("");
  const [dataVencimentoAte, setDataVencimentoAte] = useState("");
  const [valorMinimo, setValorMinimo] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Gateway dialog
  const [gatewayDialog, setGatewayDialog] = useState<{
    open: boolean;
    contaReceberId: string;
    gateways: string[];
  }>({ open: false, contaReceberId: "", gateways: [] });
  const [selectedGateway, setSelectedGateway] = useState("");
  const [gatewayLoading, setGatewayLoading] = useState(false);

  // Action loading state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      busca: busca.trim() || undefined,
      dataVencimentoDe: dataVencimentoDe || undefined,
      dataVencimentoAte: dataVencimentoAte || undefined,
      valorMinimo: valorMinimo ? Number(valorMinimo) : undefined,
    }),
    [busca, dataVencimentoDe, dataVencimentoAte, valorMinimo],
  );

  // ── Queries ──────────────────────────────────────────────────────────

  const {
    data: dashboard,
    isLoading: dashboardLoading,
  } = useQuery<DunningDashboard>({
    queryKey: dunningKeys.dashboard(tenantId ?? ""),
    queryFn: () => getDunningDashboardApi({ tenantId: tenantId! }),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
  });

  const {
    data: intervencoes = [],
    isLoading: listLoading,
  } = useQuery<DunningIntervencaoItem[]>({
    queryKey: dunningKeys.intervencoes(tenantId ?? "", filters),
    queryFn: () =>
      listDunningIntervencoesApi({
        tenantId: tenantId!,
        ...filters,
      }),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
  });

  // ── Helpers ──────────────────────────────────────────────────────────

  const invalidate = useCallback(() => {
    if (!tenantId) return;
    void queryClient.invalidateQueries({
      queryKey: dunningKeys.dashboard(tenantId),
    });
    void queryClient.invalidateQueries({
      queryKey: ["dunning", "intervencoes", tenantId],
    });
  }, [queryClient, tenantId]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === intervencoes.length
        ? new Set()
        : new Set(intervencoes.map((i) => i.contaReceberId)),
    );
  }, [intervencoes]);

  // ── Actions ──────────────────────────────────────────────────────────

  async function handleGerarLink(
    contaReceberId: string,
    formaPagamento: FormaPagamentoDunning,
  ) {
    if (!tenantId) return;
    setActionLoading(contaReceberId);
    try {
      const result = await gerarLinkPagamentoDunningApi({
        tenantId,
        contaReceberId,
        formaPagamento,
      });
      if (result.sucesso && result.link) {
        await navigator.clipboard.writeText(result.link);
        alert(`Link copiado para a area de transferencia:\n${result.link}`);
      }
    } catch (err) {
      alert(`Erro ao gerar link: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    } finally {
      setActionLoading(null);
    }
  }

  function handleRegularizar(contaReceberId: string) {
    if (!tenantId) return;
    confirm(
      "Deseja marcar esta conta como regularizada?",
      async () => {
        await regularizarDunningApi({ tenantId, contaReceberId });
        invalidate();
      },
      { title: "Regularizar conta", confirmLabel: "Regularizar", variant: "default" },
    );
  }

  function handleSuspender(contaReceberId: string) {
    if (!tenantId) return;
    confirm(
      "Tem certeza que deseja suspender esta matricula por inadimplencia? Essa acao bloqueara o acesso do aluno.",
      async () => {
        await suspenderDunningApi({ tenantId, contaReceberId });
        invalidate();
      },
      { title: "Suspender matricula", confirmLabel: "Suspender", variant: "destructive" },
    );
  }

  function handleTrocarGateway(item: DunningIntervencaoItem) {
    setGatewayDialog({
      open: true,
      contaReceberId: item.contaReceberId,
      gateways: item.gatewaysDisponiveis,
    });
    setSelectedGateway(item.gatewaysDisponiveis[0] ?? "");
  }

  async function confirmTrocarGateway() {
    if (!tenantId || !selectedGateway) return;
    setGatewayLoading(true);
    try {
      await tentarOutroGatewayDunningApi({
        tenantId,
        contaReceberId: gatewayDialog.contaReceberId,
        gatewayId: selectedGateway,
      });
      invalidate();
      setGatewayDialog({ open: false, contaReceberId: "", gateways: [] });
    } catch (err) {
      alert(`Erro: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    } finally {
      setGatewayLoading(false);
    }
  }

  function handleRegularizarLote() {
    if (!tenantId || selectedIds.size === 0) return;
    confirm(
      `Deseja regularizar ${selectedIds.size} conta(s) selecionada(s)?`,
      async () => {
        await regularizarEmLoteDunningApi({
          tenantId,
          contaReceberIds: Array.from(selectedIds),
        });
        setSelectedIds(new Set());
        invalidate();
      },
      { title: "Regularizar em lote", confirmLabel: "Regularizar", variant: "default" },
    );
  }

  // ── Render ───────────────────────────────────────────────────────────

  const loading = dashboardLoading || listLoading;

  return (
    <div className="space-y-6">
      {ConfirmDialog}

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Cobranca & Dunning
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sistema de recuperacao de inadimplencia e intervencao manual em cobranças falhas.
        </p>
      </div>

      {/* Dashboard metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Aguardando intervencao"
          value={String(dashboard?.totalAguardandoIntervencao ?? 0)}
          icon={Clock}
          tone="warning"
        />
        <MetricCard
          label="Inadimplentes"
          value={String(dashboard?.totalInadimplente ?? 0)}
          icon={Users}
          tone="danger"
        />
        <MetricCard
          label="Valor pendente"
          value={formatBRL(dashboard?.valorTotalPendente ?? 0)}
          icon={DollarSign}
          tone="danger"
        />
        <MetricCard
          label="Em risco (7 dias)"
          value={String(dashboard?.matriculasEmRisco7Dias ?? 0)}
          icon={AlertTriangle}
          tone="warning"
        />
        <MetricCard
          label="Para suspensao"
          value={String(dashboard?.matriculasParaSuspensao ?? 0)}
          icon={Ban}
          tone="danger"
        />
        <MetricCard
          label="Tolerancia (dias)"
          value={String(dashboard?.diasToleranciaConfigurado ?? 0)}
          icon={Shield}
          tone="teal"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px_170px_140px]">
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por aluno, matricula..."
            className="bg-secondary border-border"
          />
          <Input
            type="date"
            value={dataVencimentoDe}
            onChange={(e) => setDataVencimentoDe(e.target.value)}
            placeholder="Vencimento de"
            className="bg-secondary border-border"
          />
          <Input
            type="date"
            value={dataVencimentoAte}
            onChange={(e) => setDataVencimentoAte(e.target.value)}
            placeholder="Vencimento ate"
            className="bg-secondary border-border"
          />
          <Input
            type="number"
            value={valorMinimo}
            onChange={(e) => setValorMinimo(e.target.value)}
            placeholder="Valor min."
            className="bg-secondary border-border"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            className="border-border"
            onClick={() => {
              setBusca("");
              setDataVencimentoDe("");
              setDataVencimentoAte("");
              setValorMinimo("");
            }}
          >
            Limpar filtros
          </Button>
          {selectedIds.size > 0 && (
            <Button onClick={handleRegularizarLote} className="bg-gym-accent text-black hover:bg-gym-accent/90">
              <CheckCircle2 size={16} className="mr-1.5" />
              Regularizar {selectedIds.size} selecionado(s)
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="w-10 px-3 py-3 text-center">
                <Checkbox
                  checked={
                    intervencoes.length > 0 && selectedIds.size === intervencoes.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Aluno</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Valor</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Vencimento</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Falhas</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Ultimo motivo</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Prev. suspensao</th>
              <th scope="col" className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && intervencoes.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nenhuma intervencao pendente para o filtro.
                </td>
              </tr>
            )}
            {!loading &&
              intervencoes.map((item) => (
                <tr
                  key={item.contaReceberId}
                  className="transition-colors hover:bg-secondary/30"
                >
                  <td className="px-3 py-3 text-center">
                    <Checkbox
                      checked={selectedIds.has(item.contaReceberId)}
                      onCheckedChange={() => toggleSelect(item.contaReceberId)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.alunoId}</p>
                    <p className="text-xs text-muted-foreground">{item.matriculaId}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gym-accent">
                    {formatBRL(item.valor)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(item.vencimento)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        item.numeroDeFalhas >= 3
                          ? "bg-gym-danger/15 text-gym-danger"
                          : item.numeroDeFalhas >= 2
                            ? "bg-gym-warning/15 text-gym-warning"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.numeroDeFalhas}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                    {item.ultimoMotivo ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.dataPrevistaSuspensao
                      ? formatDate(item.dataPrevistaSuspensao)
                      : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={actionLoading === item.contaReceberId}
                        >
                          {actionLoading === item.contaReceberId ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <MoreHorizontal size={14} />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem
                          onClick={() =>
                            void handleGerarLink(item.contaReceberId, "PIX")
                          }
                        >
                          <Link2 size={14} className="mr-2" />
                          Gerar link PIX
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            void handleGerarLink(item.contaReceberId, "BOLETO")
                          }
                        >
                          <Link2 size={14} className="mr-2" />
                          Gerar link Boleto
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRegularizar(item.contaReceberId)}
                        >
                          <CheckCircle2 size={14} className="mr-2" />
                          Regularizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-gym-danger focus:text-gym-danger"
                          onClick={() => handleSuspender(item.contaReceberId)}
                        >
                          <Ban size={14} className="mr-2" />
                          Suspender
                        </DropdownMenuItem>
                        {item.gatewaysDisponiveis.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleTrocarGateway(item)}
                            >
                              <RefreshCw size={14} className="mr-2" />
                              Trocar gateway
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Gateway dialog */}
      <Dialog
        open={gatewayDialog.open}
        onOpenChange={(open) => {
          if (!gatewayLoading) {
            setGatewayDialog((prev) => ({ ...prev, open }));
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar gateway de pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Selecione um gateway alternativo para retentar a cobranca.
            </p>
            <Select value={selectedGateway} onValueChange={setSelectedGateway}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Selecione o gateway" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {gatewayDialog.gateways.map((gw) => (
                  <SelectItem key={gw} value={gw}>
                    {gw}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={() =>
                setGatewayDialog({ open: false, contaReceberId: "", gateways: [] })
              }
              disabled={gatewayLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void confirmTrocarGateway()}
              disabled={gatewayLoading || !selectedGateway}
              className="bg-gym-accent text-black hover:bg-gym-accent/90"
            >
              {gatewayLoading ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

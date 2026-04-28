"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import * as z from "zod";
import { Award, Gift, Loader2, Plus, RefreshCcw, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeCapabilityError } from "@/lib/api/backend-capability";
import { formatDate, formatDateTime } from "@/lib/formatters";
import type {
  FidelizacaoCampanha,
  IndicacaoStatus,
  LancamentoExtrato,
  SaldoResumo,
} from "@/lib/api/fidelizacao";
import {
  useCampanhasFidelizacao,
  useCreateCampanhaFidelizacao,
  useUpdateCampanhaFidelizacao,
  useIndicacoesFidelizacao,
  useCreateIndicacao,
  useConverterIndicacao,
  useSaldosFidelizacao,
  useSaldoDetalheFidelizacao,
  useResgatarPontos,
} from "@/lib/query/use-fidelizacao";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const campanhaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  descricao: z.string().optional(),
  pontosIndicacao: z.coerce.number().int().min(0, "Mínimo 0"),
  pontosConversao: z.coerce.number().int().min(0, "Mínimo 0"),
  ativo: z.boolean().default(true),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});
type CampanhaFormData = z.infer<typeof campanhaSchema>;

const indicacaoSchema = z.object({
  campanhaId: z.string().min(1, "Selecione uma campanha"),
  indicadorAlunoId: z.string().min(1, "ID do aluno indicador obrigatório"),
  indicadoNome: z.string().min(1, "Nome do indicado obrigatório"),
  indicadoEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  indicadoTelefone: z.string().optional(),
  prospectId: z.string().optional(),
  observacoes: z.string().optional(),
});
type IndicacaoFormData = z.infer<typeof indicacaoSchema>;

const resgateSchema = z.object({
  pontos: z.coerce.number().int().min(1, "Mínimo 1 ponto"),
  descricao: z.string().optional(),
});
type ResgateFormData = z.infer<typeof resgateSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: IndicacaoStatus) {
  const map: Record<IndicacaoStatus, string> = {
    PENDENTE: "bg-gym-warning/15 text-gym-warning",
    CONVERTIDA: "bg-gym-teal/15 text-gym-teal",
    CANCELADA: "bg-gym-danger/15 text-gym-danger",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

function motivoLabel(motivo: string) {
  const map: Record<string, string> = {
    INDICACAO_CADASTRADA: "Indicação cadastrada",
    INDICACAO_CONVERTIDA: "Indicação convertida",
    RESGATE: "Resgate",
    AJUSTE_MANUAL: "Ajuste manual",
  };
  return map[motivo] ?? motivo;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FidelizacaoContent() {
  const { tenantId: rawTenantId, tenantName } = useTenantContext();
  const tenantId = rawTenantId ?? "";
  const { toast } = useToast();

  // --- Tab state ---
  const [tab, setTab] = useState("campanhas");

  // ========================================================================
  // TAB 1 — Campanhas
  // ========================================================================

  const campanhasQuery = useCampanhasFidelizacao({ tenantId: tenantId || undefined });
  const createCampanha = useCreateCampanhaFidelizacao();
  const updateCampanha = useUpdateCampanhaFidelizacao();

  const [campanhaModalOpen, setCampanhaModalOpen] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<FidelizacaoCampanha | null>(null);

  const campanhaForm = useForm<CampanhaFormData>({
    resolver: zodResolver(campanhaSchema),
    mode: "onTouched",
    defaultValues: {
      nome: "",
      descricao: "",
      pontosIndicacao: 10,
      pontosConversao: 50,
      ativo: true,
      dataInicio: "",
      dataFim: "",
    },
  });

  // Manual watch do required: nome. Pontos têm default e aceitam 0.
  const watchedCampanhaNome = useWatch({ control: campanhaForm.control, name: "nome" }) ?? "";
  const canSaveCampanhaForm = Boolean(watchedCampanhaNome?.trim());

  function openCreateCampanha() {
    setEditingCampanha(null);
    campanhaForm.reset({
      nome: "",
      descricao: "",
      pontosIndicacao: 10,
      pontosConversao: 50,
      ativo: true,
      dataInicio: "",
      dataFim: "",
    });
    setCampanhaModalOpen(true);
  }

  function openEditCampanha(c: FidelizacaoCampanha) {
    setEditingCampanha(c);
    campanhaForm.reset({
      nome: c.nome,
      descricao: c.descricao ?? "",
      pontosIndicacao: c.pontosIndicacao,
      pontosConversao: c.pontosConversao,
      ativo: c.ativo,
      dataInicio: c.dataInicio ?? "",
      dataFim: c.dataFim ?? "",
    });
    setCampanhaModalOpen(true);
  }

  async function handleSaveCampanha(data: CampanhaFormData) {
    if (!tenantId) return;
    try {
      const payload = {
        nome: data.nome.trim(),
        descricao: data.descricao?.trim() || undefined,
        pontosIndicacao: data.pontosIndicacao,
        pontosConversao: data.pontosConversao,
        ativo: data.ativo,
        dataInicio: data.dataInicio || undefined,
        dataFim: data.dataFim || undefined,
      };
      if (editingCampanha) {
        await updateCampanha.mutateAsync({ tenantId, id: editingCampanha.id, data: payload });
        toast({ title: "Campanha atualizada" });
      } else {
        await createCampanha.mutateAsync({ tenantId, data: payload });
        toast({ title: "Campanha criada" });
      }
      setCampanhaModalOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: normalizeCapabilityError(err, "Falha ao salvar campanha."), variant: "destructive" });
    }
  }

  async function handleToggleAtivo(c: FidelizacaoCampanha) {
    if (!tenantId) return;
    try {
      await updateCampanha.mutateAsync({ tenantId, id: c.id, data: { ativo: !c.ativo } });
      toast({ title: c.ativo ? "Campanha desativada" : "Campanha ativada" });
    } catch (err) {
      toast({ title: "Erro", description: normalizeCapabilityError(err, "Falha ao alterar status."), variant: "destructive" });
    }
  }

  // ========================================================================
  // TAB 2 — Indicacoes
  // ========================================================================

  const [indicacaoStatusFilter, setIndicacaoStatusFilter] = useState<"TODAS" | IndicacaoStatus>("TODAS");

  const indicacoesQuery = useIndicacoesFidelizacao({
    tenantId: tenantId || undefined,
    status: indicacaoStatusFilter === "TODAS" ? undefined : indicacaoStatusFilter,
  });
  const createIndicacao = useCreateIndicacao();
  const converterIndicacao = useConverterIndicacao();

  const [indicacaoModalOpen, setIndicacaoModalOpen] = useState(false);

  const indicacaoForm = useForm<IndicacaoFormData>({
    resolver: zodResolver(indicacaoSchema),
    mode: "onTouched",
    defaultValues: {
      campanhaId: "",
      indicadorAlunoId: "",
      indicadoNome: "",
      indicadoEmail: "",
      indicadoTelefone: "",
      prospectId: "",
      observacoes: "",
    },
  });

  // Manual watch dos required fields do formulário de indicação.
  const watchedIndicacaoCampanhaId = useWatch({ control: indicacaoForm.control, name: "campanhaId" }) ?? "";
  const watchedIndicacaoIndicador = useWatch({ control: indicacaoForm.control, name: "indicadorAlunoId" }) ?? "";
  const watchedIndicacaoIndicadoNome = useWatch({ control: indicacaoForm.control, name: "indicadoNome" }) ?? "";
  const canSaveIndicacaoForm =
    Boolean(watchedIndicacaoCampanhaId?.trim()) &&
    Boolean(watchedIndicacaoIndicador?.trim()) &&
    Boolean(watchedIndicacaoIndicadoNome?.trim());

  function openCreateIndicacao() {
    indicacaoForm.reset();
    setIndicacaoModalOpen(true);
  }

  async function handleSaveIndicacao(data: IndicacaoFormData) {
    if (!tenantId) return;
    try {
      await createIndicacao.mutateAsync({
        tenantId,
        data: {
          campanhaId: data.campanhaId,
          indicadorAlunoId: data.indicadorAlunoId,
          indicadoNome: data.indicadoNome.trim(),
          indicadoEmail: data.indicadoEmail?.trim() || undefined,
          indicadoTelefone: data.indicadoTelefone?.trim() || undefined,
          prospectId: data.prospectId?.trim() || undefined,
          observacoes: data.observacoes?.trim() || undefined,
        },
      });
      toast({ title: "Indicação registrada" });
      setIndicacaoModalOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: normalizeCapabilityError(err, "Falha ao registrar indicação."), variant: "destructive" });
    }
  }

  async function handleConverter(id: string) {
    if (!tenantId) return;
    try {
      await converterIndicacao.mutateAsync({ tenantId, id, data: {} });
      toast({ title: "Indicação convertida" });
    } catch (err) {
      toast({ title: "Erro", description: normalizeCapabilityError(err, "Falha ao converter indicação."), variant: "destructive" });
    }
  }

  // ========================================================================
  // TAB 3 — Saldos / Extrato
  // ========================================================================

  const saldosQuery = useSaldosFidelizacao({ tenantId: tenantId || undefined });
  const resgatarPontos = useResgatarPontos();

  const [extratoAlunoId, setExtratoAlunoId] = useState<string | null>(null);
  const [extratoAlunoNome, setExtratoAlunoNome] = useState("");
  const [resgateModalOpen, setResgateModalOpen] = useState(false);
  const [resgateAlunoId, setResgateAlunoId] = useState("");

  const extratoQuery = useSaldoDetalheFidelizacao({
    tenantId: tenantId || undefined,
    alunoId: extratoAlunoId ?? undefined,
  });

  const resgateForm = useForm<ResgateFormData>({
    resolver: zodResolver(resgateSchema),
    mode: "onTouched",
    defaultValues: { pontos: 0, descricao: "" },
  });

  // Manual watch do required: pontos (>=1). z.coerce faz string→number.
  const watchedResgatePontos = useWatch({ control: resgateForm.control, name: "pontos" });
  const canSaveResgateForm = Number(watchedResgatePontos) >= 1;

  function openExtrato(row: SaldoResumo) {
    setExtratoAlunoId(row.alunoId);
    setExtratoAlunoNome(row.alunoNome);
  }

  function openResgate(alunoId: string) {
    setResgateAlunoId(alunoId);
    resgateForm.reset({ pontos: 0, descricao: "" });
    setResgateModalOpen(true);
  }

  async function handleResgate(data: ResgateFormData) {
    if (!tenantId || !resgateAlunoId) return;
    try {
      await resgatarPontos.mutateAsync({
        tenantId,
        alunoId: resgateAlunoId,
        data: { pontos: data.pontos, descricao: data.descricao?.trim() || undefined },
      });
      toast({ title: "Pontos resgatados" });
      setResgateModalOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: normalizeCapabilityError(err, "Falha ao resgatar pontos."), variant: "destructive" });
    }
  }

  // ========================================================================
  // Render
  // ========================================================================

  const campanhas = campanhasQuery.data ?? [];
  const indicacoes = indicacoesQuery.data ?? [];
  const saldos = saldosQuery.data ?? [];
  const extrato = extratoQuery.data?.extrato ?? [];

  const savingCampanha = createCampanha.isPending || updateCampanha.isPending;
  const savingIndicacao = createIndicacao.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Fidelização</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Programa de indicações e recompensas da unidade{" "}
          <span className="font-semibold text-foreground">{tenantName ?? "atual"}</span>.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="border-border bg-secondary">
          <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
          <TabsTrigger value="indicacoes">Indicações</TabsTrigger>
          <TabsTrigger value="saldos">Saldos / Extrato</TabsTrigger>
        </TabsList>

        {/* ================================================================
            TAB 1 — Campanhas
        ================================================================ */}
        <TabsContent value="campanhas" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {campanhas.length} campanha{campanhas.length !== 1 ? "s" : ""}
            </p>
            <Button onClick={openCreateCampanha} size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Nova campanha
            </Button>
          </div>

          {campanhasQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando campanhas...
            </div>
          ) : campanhas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground">
              <Gift className="mb-3 h-10 w-10 opacity-40" />
              Nenhuma campanha cadastrada
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campanhas.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold">{c.nome}</h3>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        c.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  {c.descricao && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.descricao}</p>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Pts indicação:</span>{" "}
                      <span className="font-semibold">{c.pontosIndicacao}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pts conversão:</span>{" "}
                      <span className="font-semibold">{c.pontosConversao}</span>
                    </div>
                  </div>
                  {(c.dataInicio || c.dataFim) && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {c.dataInicio ? `Início: ${formatDate(c.dataInicio)}` : ""}
                      {c.dataInicio && c.dataFim ? " — " : ""}
                      {c.dataFim ? `Fim: ${formatDate(c.dataFim)}` : ""}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="border-border" onClick={() => openEditCampanha(c)}>
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={() => handleToggleAtivo(c)}
                      disabled={updateCampanha.isPending}
                    >
                      {c.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ================================================================
            TAB 2 — Indicacoes
        ================================================================ */}
        <TabsContent value="indicacoes" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select
              value={indicacaoStatusFilter}
              onValueChange={(v) => setIndicacaoStatusFilter(v as "TODAS" | IndicacaoStatus)}
            >
              <SelectTrigger className="w-[170px] border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="TODAS">Todos os status</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="CONVERTIDA">Convertida</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openCreateIndicacao} size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Nova indicação
            </Button>
          </div>

          {indicacoesQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando indicações...
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Indicador</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Indicado</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pontos</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {indicacoes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        Nenhuma indicação encontrada
                      </td>
                    </tr>
                  ) : (
                    indicacoes.map((ind) => (
                      <tr key={ind.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-3 text-sm">{ind.indicadorNome}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{ind.indicadoNome}</p>
                          {ind.indicadoEmail && (
                            <p className="text-xs text-muted-foreground">{ind.indicadoEmail}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">{statusBadge(ind.status)}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{ind.pontosEmitidos}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(ind.dataCriacao)}</td>
                        <td className="px-4 py-3">
                          {ind.status === "PENDENTE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border"
                              onClick={() => handleConverter(ind.id)}
                              disabled={converterIndicacao.isPending}
                            >
                              <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Converter
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ================================================================
            TAB 3 — Saldos / Extrato
        ================================================================ */}
        <TabsContent value="saldos" className="space-y-4">
          {saldosQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando saldos...
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Aluno</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Créditos</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Débitos</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {saldos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        Nenhum saldo encontrado
                      </td>
                    </tr>
                  ) : (
                    saldos.map((s) => (
                      <tr
                        key={s.alunoId}
                        className="cursor-pointer transition-colors hover:bg-secondary/30"
                        onClick={() => openExtrato(s)}
                      >
                        <td className="px-4 py-3 text-sm font-medium">{s.alunoNome}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gym-accent">{s.saldoPontos}</td>
                        <td className="px-4 py-3 text-right text-sm text-gym-teal">{s.totalCreditos}</td>
                        <td className="px-4 py-3 text-right text-sm text-gym-danger">{s.totalDebitos}</td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border"
                            onClick={(e) => {
                              e.stopPropagation();
                              openResgate(s.alunoId);
                            }}
                            disabled={s.saldoPontos <= 0}
                          >
                            Resgatar
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ================================================================
          DIALOG — Extrato do aluno
      ================================================================ */}
      <Dialog open={Boolean(extratoAlunoId)} onOpenChange={(open) => { if (!open) setExtratoAlunoId(null); }}>
        <DialogContent className="border-border bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Extrato — {extratoAlunoNome}
            </DialogTitle>
          </DialogHeader>

          {extratoQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando extrato...
            </div>
          ) : extrato.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum lançamento encontrado</p>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-left">Motivo</th>
                    <th className="px-3 py-2 text-right">Pontos</th>
                    <th className="px-3 py-2 text-right">Saldo após</th>
                    <th className="px-3 py-2 text-left">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {extrato.map((l) => (
                    <tr key={l.id} className="hover:bg-secondary/30">
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            l.tipo === "CREDITO" ? "bg-gym-teal/15 text-gym-teal" : "bg-gym-danger/15 text-gym-danger"
                          }`}
                        >
                          {l.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{motivoLabel(l.motivo)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${l.tipo === "CREDITO" ? "text-gym-teal" : "text-gym-danger"}`}>
                        {l.tipo === "CREDITO" ? "+" : "-"}{l.pontos}
                      </td>
                      <td className="px-3 py-2 text-right">{l.saldoApos}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{formatDateTime(l.dataCriacao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setExtratoAlunoId(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================
          DIALOG — Campanha form
      ================================================================ */}
      <Dialog open={campanhaModalOpen} onOpenChange={setCampanhaModalOpen}>
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingCampanha ? "Editar campanha" : "Nova campanha"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={campanhaForm.handleSubmit(handleSaveCampanha)} className="grid gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome <span className="text-gym-danger">*</span>
              </label>
              <Input
                {...campanhaForm.register("nome")}
                aria-invalid={campanhaForm.formState.errors.nome ? "true" : "false"}
                className="border-border bg-secondary"
              />
              {campanhaForm.formState.errors.nome && (
                <p className="text-xs text-gym-danger">{campanhaForm.formState.errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input {...campanhaForm.register("descricao")} className="border-border bg-secondary" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pts Indicação</label>
                <Input type="number" {...campanhaForm.register("pontosIndicacao")} className="border-border bg-secondary" />
                {campanhaForm.formState.errors.pontosIndicacao && (
                  <p className="text-xs text-gym-danger">{campanhaForm.formState.errors.pontosIndicacao.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pts Conversão</label>
                <Input type="number" {...campanhaForm.register("pontosConversao")} className="border-border bg-secondary" />
                {campanhaForm.formState.errors.pontosConversao && (
                  <p className="text-xs text-gym-danger">{campanhaForm.formState.errors.pontosConversao.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data início</label>
                <Input type="date" {...campanhaForm.register("dataInicio")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data fim</label>
                <Input type="date" {...campanhaForm.register("dataFim")} className="border-border bg-secondary" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="campanha-ativo"
                {...campanhaForm.register("ativo")}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="campanha-ativo" className="text-sm text-muted-foreground">
                Campanha ativa
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="border-border" onClick={() => setCampanhaModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingCampanha || !canSaveCampanhaForm}>
                {savingCampanha ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================================================================
          DIALOG — Nova indicacao
      ================================================================ */}
      <Dialog open={indicacaoModalOpen} onOpenChange={setIndicacaoModalOpen}>
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Nova indicação</DialogTitle>
          </DialogHeader>

          <form onSubmit={indicacaoForm.handleSubmit(handleSaveIndicacao)} className="grid gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Campanha <span className="text-gym-danger">*</span>
              </label>
              <select
                {...indicacaoForm.register("campanhaId")}
                aria-invalid={indicacaoForm.formState.errors.campanhaId ? "true" : "false"}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {campanhas.filter((c) => c.ativo).map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {indicacaoForm.formState.errors.campanhaId && (
                <p className="text-xs text-gym-danger">{indicacaoForm.formState.errors.campanhaId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                ID Aluno Indicador <span className="text-gym-danger">*</span>
              </label>
              <Input
                {...indicacaoForm.register("indicadorAlunoId")}
                aria-invalid={indicacaoForm.formState.errors.indicadorAlunoId ? "true" : "false"}
                className="border-border bg-secondary"
                placeholder="UUID do aluno"
              />
              {indicacaoForm.formState.errors.indicadorAlunoId && (
                <p className="text-xs text-gym-danger">{indicacaoForm.formState.errors.indicadorAlunoId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome do indicado <span className="text-gym-danger">*</span>
              </label>
              <Input
                {...indicacaoForm.register("indicadoNome")}
                aria-invalid={indicacaoForm.formState.errors.indicadoNome ? "true" : "false"}
                className="border-border bg-secondary"
              />
              {indicacaoForm.formState.errors.indicadoNome && (
                <p className="text-xs text-gym-danger">{indicacaoForm.formState.errors.indicadoNome.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
                <Input {...indicacaoForm.register("indicadoEmail")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
                <Input {...indicacaoForm.register("indicadoTelefone")} className="border-border bg-secondary" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
              <Input {...indicacaoForm.register("observacoes")} className="border-border bg-secondary" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="border-border" onClick={() => setIndicacaoModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingIndicacao || !canSaveIndicacaoForm}>
                {savingIndicacao ? "Registrando..." : "Registrar indicação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================================================================
          DIALOG — Resgatar pontos
      ================================================================ */}
      <Dialog open={resgateModalOpen} onOpenChange={setResgateModalOpen}>
        <DialogContent className="border-border bg-card sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Resgatar pontos</DialogTitle>
          </DialogHeader>

          <form onSubmit={resgateForm.handleSubmit(handleResgate)} className="grid gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quantidade de pontos <span className="text-gym-danger">*</span>
              </label>
              <Input
                type="number"
                {...resgateForm.register("pontos")}
                aria-invalid={resgateForm.formState.errors.pontos ? "true" : "false"}
                className="border-border bg-secondary"
              />
              {resgateForm.formState.errors.pontos && (
                <p className="text-xs text-gym-danger">{resgateForm.formState.errors.pontos.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input {...resgateForm.register("descricao")} className="border-border bg-secondary" placeholder="Ex: Desconto de R$20 na mensalidade" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="border-border" onClick={() => setResgateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={resgatarPontos.isPending || !canSaveResgateForm}>
                {resgatarPontos.isPending ? "Resgatando..." : "Resgatar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

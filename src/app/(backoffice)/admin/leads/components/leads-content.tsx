"use client";

import { useMemo, useState } from "react";
import { Search, StickyNote, ArrowRightLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { SuggestionInput, type SuggestionOption } from "@/components/shared/suggestion-input";
import {
  getAdminLead,
  updateAdminLeadNotas,
  updateAdminLeadStatus,
} from "@/backoffice/api/admin-leads";
import { useAdminLeads, useAdminLeadStats } from "@/backoffice/query";
import { queryKeys } from "@/lib/query/keys";
import type { LeadB2b, LeadB2bStats, StatusLeadB2b } from "@/lib/shared/types/lead-b2b";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatDateTime } from "@/lib/formatters";

const STATUS_OPTIONS: { value: StatusLeadB2b; label: string }[] = [
  { value: "NOVO", label: "Novo" },
  { value: "CONTATADO", label: "Contatado" },
  { value: "QUALIFICADO", label: "Qualificado" },
  { value: "NEGOCIANDO", label: "Negociando" },
  { value: "CONVERTIDO", label: "Convertido" },
  { value: "PERDIDO", label: "Perdido" },
];

const STATUS_COLORS: Record<StatusLeadB2b, string> = {
  NOVO: "text-gym-accent",
  CONTATADO: "text-blue-400",
  QUALIFICADO: "text-gym-teal",
  NEGOCIANDO: "text-gym-warning",
  CONVERTIDO: "text-emerald-400",
  PERDIDO: "text-gym-danger",
};

type PageSize = 20 | 50 | 100 | 200;

interface LeadsContentProps {
  initialLeads: LeadB2b[];
  initialStats: LeadB2bStats | null;
}

export function LeadsContent({ initialLeads, initialStats }: LeadsContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const leadsQuery = useAdminLeads();
  const statsQuery = useAdminLeadStats();

  const leads = leadsQuery.data ?? initialLeads;
  const stats = statsQuery.data ?? initialStats;
  const loading = (leadsQuery.isLoading && !initialLeads.length) || (statsQuery.isLoading && !initialStats);
  const error = leadsQuery.error || statsQuery.error
    ? normalizeErrorMessage(leadsQuery.error ?? statsQuery.error)
    : null;

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusLeadB2b | typeof FILTER_ALL>(FILTER_ALL);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  // Detail panel state
  const [selectedLead, setSelectedLead] = useState<LeadB2b | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notas, setNotas] = useState("");
  const [savingNotas, setSavingNotas] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const leadOptions = useMemo<SuggestionOption[]>(
    () =>
      leads.map((l) => ({
        id: l.id,
        label: l.nome,
        searchText: `${l.nome} ${l.email} ${l.telefone} ${l.nomeAcademia ?? ""}`,
      })),
    [leads]
  );

  const leadsFiltrados = useMemo(() => {
    let filtered = leads;

    if (filtroStatus !== FILTER_ALL) {
      filtered = filtered.filter((l) => l.status === filtroStatus);
    }

    const term = busca.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((l) => {
        const nome = l.nome.toLowerCase();
        const email = l.email.toLowerCase();
        const telefone = l.telefone.toLowerCase();
        const academia = (l.nomeAcademia ?? "").toLowerCase();
        return nome.includes(term) || email.includes(term) || telefone.includes(term) || academia.includes(term);
      });
    }

    return filtered;
  }, [leads, busca, filtroStatus]);

  const hasNext = (page + 1) * pageSize < leadsFiltrados.length;
  const paginaItens = useMemo(
    () => leadsFiltrados.slice(page * pageSize, page * pageSize + pageSize),
    [leadsFiltrados, page, pageSize]
  );

  function handleSearchChange(nextValue: string) {
    setBusca(nextValue);
    setPage(0);
  }

  async function handleSelectLead(lead: LeadB2b) {
    setDetailLoading(true);
    try {
      const full = await getAdminLead(lead.id);
      setSelectedLead(full);
      setNotas(full.notas ?? "");
    } catch (err) {
      toast({
        title: "Erro ao carregar detalhes",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSaveNotas() {
    if (!selectedLead) return;
    setSavingNotas(true);
    try {
      const updated = await updateAdminLeadNotas(selectedLead.id, notas);
      setSelectedLead(updated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.leads.all() });
      toast({ title: "Notas salvas" });
    } catch (err) {
      toast({
        title: "Erro ao salvar notas",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSavingNotas(false);
    }
  }

  async function handleChangeStatus(newStatus: StatusLeadB2b) {
    if (!selectedLead || newStatus === selectedLead.status) return;
    setSavingStatus(true);
    try {
      const updated = await updateAdminLeadStatus(selectedLead.id, newStatus);
      setSelectedLead(updated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.leads.all() });
      toast({ title: "Status atualizado", description: `Lead movido para ${newStatus}` });
    } catch (err) {
      toast({
        title: "Erro ao atualizar status",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Leads B2B</p>
        <h1 className="text-3xl font-display font-bold">Gestão de Leads B2B</h1>
        <p className="text-sm text-muted-foreground">
          Leads capturados pelo formulário B2B. Qualifique, adicione notas e acompanhe a conversão.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      {/* Stats cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de leads</p>
          <p className="mt-2 text-2xl font-bold text-gym-accent">{loading ? "\u2026" : stats?.total ?? leads.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Novos</p>
          <p className="mt-2 text-2xl font-bold text-gym-accent">{loading ? "\u2026" : stats?.novos ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qualificados</p>
          <p className="mt-2 text-2xl font-bold text-gym-teal">{loading ? "\u2026" : stats?.qualificados ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Convertidos</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{loading ? "\u2026" : stats?.convertidos ?? 0}</p>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Table column */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads capturados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <SuggestionInput
                    value={busca}
                    onValueChange={handleSearchChange}
                    onSelect={(option) => {
                      setBusca(option.label);
                      setPage(0);
                    }}
                    options={leadOptions}
                    placeholder="Buscar por nome, email, telefone ou academia"
                    minCharsToSearch={1}
                    className="pl-8"
                  />
                </div>
                <div className="w-full max-w-44">
                  <Select
                    value={filtroStatus}
                    onValueChange={(v) => {
                      setFiltroStatus(v as StatusLeadB2b | typeof FILTER_ALL);
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="w-full bg-secondary border-border text-xs">
                      <SelectValue placeholder="Filtrar status" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value={FILTER_ALL}>Todos os status</SelectItem>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full max-w-44">
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v) as PageSize);
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="w-full bg-secondary border-border text-xs">
                      <SelectValue placeholder="Itens por página" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="20">20 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                      <SelectItem value="100">100 por página</SelectItem>
                      <SelectItem value="200">200 por página</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {busca && (
                  <Button variant="outline" size="sm" onClick={() => handleSearchChange("")}>
                    Limpar
                  </Button>
                )}
              </div>

              <PaginatedTable<LeadB2b>
                columns={[
                  { label: "Nome / Academia" },
                  { label: "Contato" },
                  { label: "Origem" },
                  { label: "Status" },
                  { label: "Data" },
                ]}
                items={paginaItens}
                emptyText={loading ? "Carregando leads..." : "Nenhum lead encontrado."}
                getRowKey={(l) => l.id}
                onRowClick={handleSelectLead}
                rowClassName={(l) =>
                  `cursor-pointer transition-colors hover:bg-secondary/40 ${selectedLead?.id === l.id ? "bg-secondary/60" : ""}`
                }
                renderCells={(l) => (
                  <>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{l.nome}</span>
                        <span className="text-xs text-muted-foreground">{l.nomeAcademia || "Sem academia"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">{l.email}</span>
                        <span className="text-xs text-muted-foreground">{l.telefone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{l.origem}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${STATUS_COLORS[l.status]}`}>
                        {STATUS_OPTIONS.find((o) => o.value === l.status)?.label ?? l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.dataCriacao ? formatDateTime(l.dataCriacao) : "\u2014"}</td>
                  </>
                )}
                page={page}
                pageSize={pageSize}
                total={leadsFiltrados.length}
                hasNext={hasNext}
                onPrevious={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => p + 1)}
                itemLabel="leads"
                showPagination={leadsFiltrados.length > pageSize}
              />

              {leadsFiltrados.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {leadsFiltrados.length} resultado{leadsFiltrados.length === 1 ? "" : "s"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail panel */}
        <div className="w-full lg:w-96 shrink-0">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedLead ? "Detalhes do Lead" : "Selecione um lead"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detailLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : !selectedLead ? (
                <p className="text-sm text-muted-foreground">
                  Clique em um lead na tabela para ver seus detalhes e gerenciá-lo.
                </p>
              ) : (
                <div className="space-y-5">
                  {/* Lead info */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{selectedLead.nome}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{selectedLead.email}</p>
                      <p>{selectedLead.telefone}</p>
                      {selectedLead.nomeAcademia && (
                        <p>Academia: <span className="text-foreground">{selectedLead.nomeAcademia}</span></p>
                      )}
                      {selectedLead.quantidadeAlunos != null && (
                        <p>Alunos: <span className="text-foreground">{selectedLead.quantidadeAlunos}</span></p>
                      )}
                      {selectedLead.cidade && (
                        <p>
                          Local: <span className="text-foreground">{selectedLead.cidade}{selectedLead.estado ? `/${selectedLead.estado}` : ""}</span>
                        </p>
                      )}
                      <p>Origem: <span className="text-foreground">{selectedLead.origem}</span></p>
                      {selectedLead.utmSource && (
                        <p className="text-xs">
                          UTM: {selectedLead.utmSource}
                          {selectedLead.utmMedium ? ` / ${selectedLead.utmMedium}` : ""}
                          {selectedLead.utmCampaign ? ` / ${selectedLead.utmCampaign}` : ""}
                        </p>
                      )}
                      <p className="text-xs">Criado em: {selectedLead.dataCriacao ? formatDateTime(selectedLead.dataCriacao) : "\u2014"}</p>
                      {selectedLead.dataAtualizacao && (
                        <p className="text-xs">Atualizado em: {selectedLead.dataAtualizacao ? formatDateTime(selectedLead.dataAtualizacao) : "\u2014"}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Change status */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <ArrowRightLeft className="size-3.5" />
                      Alterar status
                    </Label>
                    <Select
                      value={selectedLead.status}
                      onValueChange={(v) => handleChangeStatus(v as StatusLeadB2b)}
                      disabled={savingStatus}
                    >
                      <SelectTrigger className="w-full bg-secondary border-border text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {savingStatus && <p className="text-xs text-muted-foreground">Salvando...</p>}
                  </div>

                  <Separator />

                  {/* Notas */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <StickyNote className="size-3.5" />
                      Notas
                    </Label>
                    <Textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Adicione observações sobre este lead..."
                      rows={4}
                      disabled={savingNotas}
                      className="bg-secondary border-border text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSaveNotas}
                        disabled={savingNotas || notas === (selectedLead.notas ?? "")}
                      >
                        {savingNotas ? "Salvando..." : "Salvar notas"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

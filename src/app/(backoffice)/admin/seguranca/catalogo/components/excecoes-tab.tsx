"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { revisarExcecao, createExcecao } from "@/backoffice/api/admin-seguranca-avancada";
import type { GlobalAdminReviewBoard, ExcecaoRevisaoDecisao } from "@/lib/types";
import type { GlobalAdminReviewBoardItem } from "@/lib/shared/types/tenant";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const DECISAO_OPTIONS: { value: ExcecaoRevisaoDecisao; label: string }[] = [
  { value: "APROVADA", label: "Aprovar" },
  { value: "REJEITADA", label: "Rejeitar" },
  { value: "RENOVADA", label: "Renovar" },
];

interface ExcecoesTabProps {
  initialBoard: GlobalAdminReviewBoard;
}

export function ExcecoesTab({ initialBoard }: ExcecoesTabProps) {
  const { toast } = useToast();
  const [board, setBoard] = useState<GlobalAdminReviewBoard>(initialBoard);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<GlobalAdminReviewBoardItem | null>(null);
  const [decisao, setDecisao] = useState<ExcecaoRevisaoDecisao>("APROVADA");
  const [justificativa, setJustificativa] = useState("");
  const [novaExpiracao, setNovaExpiracao] = useState("");
  const [saving, setSaving] = useState(false);

  // Create exception form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createExpiresAt, setCreateExpiresAt] = useState("");
  const [createSaving, setCreateSaving] = useState(false);

  async function handleRevisar() {
    if (!selectedReview) return;
    if (!justificativa.trim()) {
      toast({ title: "Informe a justificativa", variant: "destructive" });
      return;
    }
    if (decisao === "RENOVADA" && !novaExpiracao.trim()) {
      toast({ title: "Informe a nova data de expiracao para renovacao", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await revisarExcecao(selectedReview.id, { decisao, comentario: justificativa, novaExpiracao: decisao === "RENOVADA" ? novaExpiracao : undefined });
      setBoard((prev) => ({
        ...prev,
        pendingReviews: prev.pendingReviews.filter((r) => r.id !== selectedReview.id),
      }));
      setSelectedReview(null);
      setJustificativa("");
      setNovaExpiracao("");
      toast({ title: `Excecao ${decisao.toLowerCase()} com sucesso` });
    } catch (err) {
      toast({ title: "Erro ao revisar excecao", description: normalizeErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateException() {
    if (!createTitle.trim()) {
      toast({ title: "Informe o titulo da excecao", variant: "destructive" });
      return;
    }
    setCreateSaving(true);
    try {
      await createExcecao({
        userId: "system", // Will be resolved by backend from session
        title: createTitle,
        justification: createDescription || createTitle,
        expiresAt: createExpiresAt || undefined,
      });
      setCreateTitle("");
      setCreateDescription("");
      setCreateExpiresAt("");
      setShowCreateForm(false);
      toast({ title: "Excecao criada com sucesso" });
    } catch (err) {
      toast({ title: "Erro ao criar excecao", description: normalizeErrorMessage(err), variant: "destructive" });
    } finally {
      setCreateSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      )}

      {/* Create Exception Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancelar" : "Nova excecao"}
        </Button>
      </div>

      {/* Create Exception Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova excecao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Titulo *</Label>
              <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="Excecao para acesso especial" disabled={createSaving} />
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} disabled={createSaving} rows={2} className="bg-secondary border-border" placeholder="Motivo da excecao..." />
            </div>
            <div className="space-y-2">
              <Label>Expira em</Label>
              <Input type="datetime-local" value={createExpiresAt} onChange={(e) => setCreateExpiresAt(e.target.value)} disabled={createSaving} className="bg-secondary border-border" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateException} disabled={createSaving}>{createSaving ? "Salvando..." : "Criar excecao"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revisoes pendentes ({board.pendingReviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {board.pendingReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhuma revisao pendente.</p>
          ) : (
            <PaginatedTable<GlobalAdminReviewBoardItem>
              columns={[{ label: "Item" }, { label: "Severidade" }, { label: "Solicitante" }, { label: "" }]}
              items={board.pendingReviews}
              emptyText="Nenhuma revisao pendente."
              getRowKey={(r) => r.id}
              renderCells={(r) => (
                <>
                  <td className="px-4 py-3 text-sm">{r.description ?? r.title}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.severity === "CRITICO" ? "bg-red-500/20 text-red-400" :
                      r.severity === "ALTO" ? "bg-orange-500/20 text-orange-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>{r.severity}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.userName ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedReview(r)}>Revisar</Button>
                  </td>
                </>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      {selectedReview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisar excecao — {selectedReview.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Decisao</Label>
              <Select value={decisao} onValueChange={(v) => setDecisao(v as ExcecaoRevisaoDecisao)} disabled={saving}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {DECISAO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {decisao === "RENOVADA" && (
              <div className="space-y-2">
                <Label>Nova expiracao *</Label>
                <Input type="datetime-local" value={novaExpiracao} onChange={(e) => setNovaExpiracao(e.target.value)} disabled={saving} className="bg-secondary border-border" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Justificativa *</Label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                disabled={saving}
                rows={3}
                placeholder="Motivo da decisao..."
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSelectedReview(null)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleRevisar} disabled={saving}>{saving ? "Salvando..." : "Confirmar"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Exceptions */}
      {board.expiringExceptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Excecoes expirando em breve ({board.expiringExceptions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {board.expiringExceptions.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span>{e.description ?? e.title}</span>
                  <span className="text-xs text-muted-foreground">Expira: {e.dueAt ?? "—"}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Orphan Profiles */}
      {board.orphanProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfis orfaos ({board.orphanProfiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {board.orphanProfiles.map((p) => (
                <li key={p.id}>{p.title ?? p.id}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

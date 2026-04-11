"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GlobalSecurityShell, formatSecurityDateTime } from "@/backoffice/components/security/global-security-shell";
import { SecurityRiskBadge } from "@/components/security/security-badges";
import { SecurityEmptyState, SecuritySectionFeedback } from "@/components/security/security-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAdminSecurityOverview, useAdminSecurityReviewBoard } from "@/backoffice/query";
import type { GlobalAdminReviewBoard, GlobalAdminReviewBoardItem, GlobalAdminSecurityOverview } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const EMPTY_BOARD: GlobalAdminReviewBoard = {
  pendingReviews: [],
  expiringExceptions: [],
  recentChanges: [],
  broadAccess: [],
  orphanProfiles: [],
};

const EMPTY_OVERVIEW: GlobalAdminSecurityOverview = {
  totalUsers: 0,
  activeMemberships: 0,
  defaultUnitsConfigured: 0,
  eligibleForNewUnits: 0,
  broadAccessUsers: 0,
  expiringExceptions: 0,
  pendingReviews: 0,
  rolloutPercentage: 0,
  compatibilityModeUsers: 0,
};

export default function AdminSegurancaRevisoesPage() {
  const { toast } = useToast();
  const boardQuery = useAdminSecurityReviewBoard();
  const overviewQuery = useAdminSecurityOverview();

  const loading = boardQuery.isLoading || overviewQuery.isLoading;
  const [boardOverride, setBoardOverride] = useState<GlobalAdminReviewBoard | null>(null);
  const [overviewOverride, setOverviewOverride] = useState<GlobalAdminSecurityOverview | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APROVADA" | "REJEITADA">("APROVADA");
  const [reviewComment, setReviewComment] = useState("");
  const error = boardQuery.error || overviewQuery.error
    ? normalizeErrorMessage(boardQuery.error ?? overviewQuery.error)
    : null;
  const board = boardOverride ?? boardQuery.data ?? EMPTY_BOARD;
  const overview = useMemo(
    () => ({ ...EMPTY_OVERVIEW, ...(overviewOverride ?? overviewQuery.data ?? {}) }),
    [overviewOverride, overviewQuery.data]
  );

  const tabs = useMemo(
    () => [
      { value: "revisoes", label: "Revisões pendentes", items: board.pendingReviews },
      { value: "excecoes", label: "Exceções vencendo", items: board.expiringExceptions },
      { value: "mudancas", label: "Mudanças recentes", items: board.recentChanges },
      { value: "amplo", label: "Acessos amplos", items: board.broadAccess },
      { value: "orfos", label: "Perfis sem dono", items: board.orphanProfiles },
    ],
    [board]
  );

  function startReview(item: GlobalAdminReviewBoardItem, decision: "APROVADA" | "REJEITADA") {
    setReviewingId(item.id);
    setReviewDecision(decision);
    setReviewComment("");
  }

  function cancelReview() {
    setReviewingId(null);
    setReviewDecision("APROVADA");
    setReviewComment("");
  }

  function submitReview(item: GlobalAdminReviewBoardItem) {
    const comment = reviewComment.trim();
    if (!comment) {
      toast({
        title: "Adicione um comentário",
        description: "A revisão precisa registrar a justificativa da decisão.",
        variant: "destructive",
      });
      return;
    }

    setBoardOverride((current) => {
      const baseBoard = current ?? boardQuery.data ?? EMPTY_BOARD;
      return {
        ...baseBoard,
        pendingReviews: (baseBoard.pendingReviews ?? []).filter((entry) => entry.id !== item.id),
        recentChanges: [
          {
            ...item,
            title: `${reviewDecision === "APROVADA" ? "Revisão aprovada" : "Revisão negada"} · ${item.title}`,
            description: comment,
            category: "MUDANCA_RECENTE",
          },
          ...(baseBoard.recentChanges ?? []),
        ],
      };
    });
    setOverviewOverride((current) => {
      const baseOverview = { ...EMPTY_OVERVIEW, ...(current ?? overviewQuery.data ?? {}) };
      return {
        ...baseOverview,
        pendingReviews: Math.max(0, (baseOverview.pendingReviews ?? 0) - 1),
      };
    });
    toast({
      title: reviewDecision === "APROVADA" ? "Revisão aprovada" : "Revisão negada",
      description: item.userName,
    });
    cancelReview();
  }

  return (
    <GlobalSecurityShell
      title="Revisões e auditoria"
      description="Priorize o que precisa de recertificação, o que está perto de expirar e o que ampliou alcance além do esperado."
      actions={
        <Button asChild variant="outline" className="border-border">
          <Link href="/admin/seguranca/usuarios">Abrir usuários e acessos</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Revisões pendentes" value={loading ? "…" : String(overview.pendingReviews ?? 0)} />
        <SummaryCard title="Exceções vencendo" value={loading ? "…" : String(overview.expiringExceptions ?? 0)} />
        <SummaryCard title="Acessos amplos" value={loading ? "…" : String(overview.broadAccessUsers ?? 0)} />
      </div>

      <SecuritySectionFeedback loading={loading} error={error} />

      <Tabs defaultValue="revisoes" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">{tab.label}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Itens ordenados para apoiar recertificação, follow-up e saneamento do rollout.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {tab.items.length === 0 ? (
                  <SecurityEmptyState text={`Nenhum item em "${tab.label}" no momento.`} />
                ) : (
                  tab.items.map((item) => (
                    <ReviewBoardItemCard
                      key={`${tab.value}-${item.id}`}
                      item={item}
                      canReview={tab.value === "revisoes"}
                      isReviewing={reviewingId === item.id}
                      reviewDecision={reviewDecision}
                      reviewComment={reviewComment}
                      onApprove={() => startReview(item, "APROVADA")}
                      onReject={() => startReview(item, "REJEITADA")}
                      onComment={() => startReview(item, reviewDecision)}
                      onDecisionChange={setReviewDecision}
                      onCommentChange={setReviewComment}
                      onCancelReview={cancelReview}
                      onSubmitReview={() => submitReview(item)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </GlobalSecurityShell>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-display font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ReviewBoardItemCard({
  item,
  canReview,
  isReviewing,
  reviewDecision,
  reviewComment,
  onApprove,
  onReject,
  onComment,
  onDecisionChange,
  onCommentChange,
  onCancelReview,
  onSubmitReview,
}: {
  item: GlobalAdminReviewBoardItem;
  canReview: boolean;
  isReviewing: boolean;
  reviewDecision: "APROVADA" | "REJEITADA";
  reviewComment: string;
  onApprove: () => void;
  onReject: () => void;
  onComment: () => void;
  onDecisionChange: (value: "APROVADA" | "REJEITADA") => void;
  onCommentChange: (value: string) => void;
  onCancelReview: () => void;
  onSubmitReview: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{item.title}</p>
            <SecurityRiskBadge level={item.severity} />
          </div>
          <p className="text-sm text-muted-foreground">{item.description || "Sem descrição adicional."}</p>
          <p className="text-xs text-muted-foreground">
            {item.userName}
            {item.dueAt ? ` · prazo ${formatSecurityDateTime(item.dueAt)}` : ""}
          </p>
        </div>
        {item.userId ? (
          <div className="flex flex-wrap items-center gap-2">
            {canReview && !isReviewing ? (
              <>
                <Button type="button" size="sm" onClick={onApprove}>
                  Aprovar
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-border" onClick={onReject}>
                  Negar
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={onComment}>
                  Comentar
                </Button>
              </>
            ) : null}
            <Button asChild size="sm" variant="outline" className="border-border">
              <Link href={`/admin/seguranca/usuarios/${item.userId}`}>Abrir pessoa</Link>
            </Button>
          </div>
        ) : null}
      </div>
      {canReview && isReviewing ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={reviewDecision === "APROVADA" ? "default" : "outline"}
              onClick={() => onDecisionChange("APROVADA")}
            >
              Aprovar
            </Button>
            <Button
              type="button"
              size="sm"
              variant={reviewDecision === "REJEITADA" ? "default" : "outline"}
              className={reviewDecision === "REJEITADA" ? "" : "border-border"}
              onClick={() => onDecisionChange("REJEITADA")}
            >
              Negar
            </Button>
          </div>
          <Textarea
            value={reviewComment}
            onChange={(event) => onCommentChange(event.target.value)}
            placeholder="Explique a decisão da revisão."
            rows={3}
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" className="border-border" onClick={onCancelReview}>
              Cancelar
            </Button>
            <Button type="button" onClick={onSubmitReview}>
              Registrar revisão
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

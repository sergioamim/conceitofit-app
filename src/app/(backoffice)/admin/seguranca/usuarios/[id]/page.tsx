"use client";

import Link from "next/link";
import {
  GlobalSecurityShell,
  formatSecurityDateTime,
} from "@/backoffice/components/security/global-security-shell";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUserDetailWorkspace } from "./use-user-detail-workspace";
import {
  MetricCard,
  ResumoTab,
  AcessosTab,
  ExcecoesTab,
  GovernancaTab,
  HistoricoTab,
} from "./user-detail-tabs";

export default function AdminSegurancaUsuarioDetalhePage() {
  const ws = useUserDetailWorkspace();

  return (
    <GlobalSecurityShell
      title={ws.detail ? ws.detail.fullName || ws.detail.name : "Governança de acesso"}
      description="Separe operação cotidiana, exceções e política ampla de novas unidades para reduzir ambiguidade na gestão de acesso."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => ws.setImpersonationDialogOpen(true)}
            disabled={ws.loading || ws.saving || !ws.detail?.active}
          >
            Entrar como este usuário
          </Button>
          <Button asChild variant="outline" className="border-border">
            <Link href="/admin/seguranca/usuarios">Voltar à lista</Link>
          </Button>
        </div>
      }
      highlight={
        ws.detail ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Acessos ativos" value={String(ws.detail.memberships.filter((m) => m.active).length)} />
            <MetricCard title="Exceções ativas" value={String(ws.mergedExceptions.filter((item) => item.active).length)} />
            <MetricCard title="Mudanças recentes" value={String(ws.detail.recentChanges.length)} />
            <MetricCard title="Último acesso" value={formatSecurityDateTime(ws.detail.lastLoginAt)} compact />
          </div>
        ) : null
      }
    >
      {/* Impersonation dialog */}
      <ImpersonationDialog ws={ws} />

      <SecuritySectionFeedback loading={ws.loading} error={ws.error} />

      {ws.detail ? (
        <Tabs defaultValue="resumo" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="resumo">Resumo efetivo</TabsTrigger>
            <TabsTrigger value="acessos">Escopos e acessos</TabsTrigger>
            <TabsTrigger value="excecoes">Exceções</TabsTrigger>
            <TabsTrigger value="governanca">Novas unidades</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <ResumoTab
            detail={ws.detail}
            mergedExceptions={ws.mergedExceptions}
            riskFlags={ws.riskFlags}
          />

          <AcessosTab
            detail={ws.detail}
            saving={ws.saving}
            newTenantId={ws.newTenantId}
            setNewTenantId={ws.setNewTenantId}
            newMembershipDefault={ws.newMembershipDefault}
            setNewMembershipDefault={ws.setNewMembershipDefault}
            newMembershipProfileId={ws.newMembershipProfileId}
            setNewMembershipProfileId={ws.setNewMembershipProfileId}
            newMembershipProfiles={ws.newMembershipProfiles}
            loadingNewMembershipProfiles={ws.loadingNewMembershipProfiles}
            availableTenants={ws.availableTenants}
            academias={ws.academias}
            selectedNewTenant={ws.selectedNewTenant}
            selectedNewTenantAcademia={ws.selectedNewTenantAcademia}
            selectedNewMembershipProfile={ws.selectedNewMembershipProfile}
            sortedMemberships={ws.sortedMemberships}
            profileSelection={ws.profileSelection}
            setProfileSelection={ws.setProfileSelection}
            handleCreateMembership={ws.handleCreateMembership}
            runMutation={ws.runMutation}
            availableProfilesForMembership={ws.availableProfilesForMembership}
          />

          <ExcecoesTab
            detail={ws.detail}
            saving={ws.saving}
            sortedMemberships={ws.sortedMemberships}
            mergedExceptions={ws.mergedExceptions}
            exceptionTitle={ws.exceptionTitle}
            setExceptionTitle={ws.setExceptionTitle}
            exceptionMembershipId={ws.exceptionMembershipId}
            setExceptionMembershipId={ws.setExceptionMembershipId}
            exceptionScopeLabel={ws.exceptionScopeLabel}
            setExceptionScopeLabel={ws.setExceptionScopeLabel}
            exceptionJustification={ws.exceptionJustification}
            setExceptionJustification={ws.setExceptionJustification}
            exceptionExpiresAt={ws.exceptionExpiresAt}
            setExceptionExpiresAt={ws.setExceptionExpiresAt}
            handleCreateException={ws.handleCreateException}
            handleRemoveException={ws.handleRemoveException}
            resetExceptionForm={() => {
              ws.setExceptionTitle("");
              ws.setExceptionMembershipId("");
              ws.setExceptionScopeLabel("");
              ws.setExceptionJustification("");
              ws.setExceptionExpiresAt("");
            }}
          />

          <GovernancaTab
            detail={ws.detail}
            saving={ws.saving}
            policyEnabled={ws.policyEnabled}
            setPolicyEnabled={ws.setPolicyEnabled}
            policyScope={ws.policyScope}
            setPolicyScope={ws.setPolicyScope}
            policyRationale={ws.policyRationale}
            setPolicyRationale={ws.setPolicyRationale}
            handleSavePolicy={ws.handleSavePolicy}
          />

          <HistoricoTab detail={ws.detail} />
        </Tabs>
      ) : null}
    </GlobalSecurityShell>
  );
}

// ---------------------------------------------------------------------------
// Impersonation dialog (kept in page.tsx for simplicity)
// ---------------------------------------------------------------------------

function ImpersonationDialog({ ws }: { ws: ReturnType<typeof useUserDetailWorkspace> }) {
  return (
    <Dialog
      open={ws.impersonationDialogOpen}
      onOpenChange={(open) => {
        if (!open && !ws.impersonating) {
          ws.resetImpersonationDialog();
          return;
        }
        ws.setImpersonationDialogOpen(open);
      }}
    >
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle>Entrar como este usuário</DialogTitle>
          <DialogDescription>
            A impersonação troca temporariamente a sua sessão administrativa pela visão operacional de{" "}
            {ws.detail?.fullName || ws.detail?.name || "este usuário"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
            Use apenas para suporte, diagnóstico e reprodução de contexto. O início e o encerramento serão registrados no audit log.
          </div>
          <div className="space-y-2">
            <Label htmlFor="impersonation-justification">Justificativa obrigatória</Label>
            <Textarea
              id="impersonation-justification"
              {...ws.impersonationForm.register("justification")}
              placeholder="Explique por que você precisa operar temporariamente com a visão desta pessoa."
              className="min-h-28"
            />
            {ws.impersonationForm.formState.errors.justification?.message ? (
              <p className="text-xs text-gym-danger">{ws.impersonationForm.formState.errors.justification.message}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="border-border" onClick={ws.resetImpersonationDialog} disabled={ws.impersonating}>
            Cancelar
          </Button>
          <Button type="button" onClick={ws.impersonationForm.handleSubmit(ws.handleStartImpersonation)} disabled={ws.impersonating}>
            {ws.impersonating ? "Entrando..." : "Confirmar e entrar como usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

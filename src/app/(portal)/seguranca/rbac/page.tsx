"use client";

import { RbacTabPerfis } from "./rbac-tab-perfis";
import { RbacTabUsuarios } from "./rbac-tab-usuarios";
import { RbacTabGrants } from "./rbac-tab-grants";
import { RbacTabAuditoria } from "./rbac-tab-auditoria";
import { useRbacPageState } from "./use-rbac-page-state";

export default function RbacPage() {
  const state = useRbacPageState();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Segurança</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">Perfis e Funcionalidades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Base técnica da segurança para governar perfis, vínculos e auditoria do tenant atual:
          <span className="font-semibold text-foreground"> {state.tenant.tenantName}</span>
        </p>
      </div>

      {state.access.loading ? (
        <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Validando permissões de acesso...
        </div>
      ) : null}

      {state.access.error ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {state.access.error}
        </div>
      ) : null}

      {state.tenant.error ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {state.tenant.error}
        </div>
      ) : null}

      {!state.access.loading && !state.access.canAccessElevatedModules ? (
        <div className="rounded-md border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          Acesso negado. Apenas perfis administrativos podem gerenciar a base técnica de perfis e funcionalidades.
        </div>
      ) : null}

      {!state.access.loading && state.access.canAccessElevatedModules ? (
        <>
      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
        {state.tabButtons.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-semibold ${
              state.activeTab === tab.id
                ? "bg-gym-accent text-white"
                : "bg-transparent text-muted-foreground hover:bg-secondary"
            }`}
            onClick={() => state.setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {state.feedback.hasMessage ? (
        <div className={`rounded-md border px-4 py-3 text-sm ${state.feedback.className}`}>{state.feedback.message}</div>
      ) : null}

      {state.activeTab === "perfis" && (
        <RbacTabPerfis
          perfilForm={state.perfilForm}
          perfilFormValues={state.perfilFormValues}
          perfis={state.perfis}
          perfisLoading={state.perfisLoading}
          perfilActionLoading={state.perfilActionLoading}
          perfisError={state.perfisError}
          perfisPage={state.perfisPage}
          perfisPageSize={state.perfisPageSize}
          perfisTotal={state.perfisTotal}
          perfisHasNext={state.perfisHasNext}
          isActionLoading={state.isActionLoading}
          tenantId={state.tenantId}
          onSubmitPerfil={state.submitPerfil}
          onClearPerfilForm={state.clearPerfilForm}
          onEditPerfil={state.editPerfil}
          onDesativarPerfil={state.desativarPerfil}
          onNextPage={state.nextPerfisPage}
          onPreviousPage={state.previousPerfisPage}
        />
      )}

      {state.activeTab === "usuarios" && (
        <RbacTabUsuarios
          tenantUserForm={state.tenantUserForm}
          tenantUserFormValues={state.tenantUserFormValues}
          assignPerfilForm={state.assignPerfilForm}
          perfilToAssign={state.perfilToAssign}
          users={state.users}
          selectedUser={state.selectedUser}
          selectedUserId={state.selectedUserId}
          setSelectedUserId={state.setSelectedUserId}
          userPerfis={state.userPerfis}
          activePerfis={state.activePerfis}
          loadingUsers={state.loadingUsers}
          loadingPerfis={state.loadingPerfis}
          userSaving={state.userSaving}
          usuariosError={state.usuariosError}
          isActionLoading={state.isActionLoading}
          tenantId={state.tenantId}
          tenantName={state.tenant.tenantName}
          networkName={state.tenant.networkName}
          networkSubdomain={state.tenant.networkSubdomain}
          tenantScopeOptions={state.tenantScopeOptions}
          userQuery={state.userQuery}
          setUserQuery={state.setUserQuery}
          onSubmitTenantUser={state.submitTenantUser}
          onToggleTenantUserTenant={state.toggleTenantUserTenant}
          onToggleTenantUserPerfil={state.toggleTenantUserPerfil}
          onAssignPerfilToUser={state.assignPerfilToUser}
          onRemoveUserPerfil={state.removeUserPerfil}
        />
      )}

      {state.activeTab === "grants" && (
        <RbacTabGrants
          grantForm={state.grantForm}
          grantFormValues={state.grantFormValues}
          features={state.features}
          grants={state.grants}
          activePerfis={state.activePerfis}
          grantsLoading={state.grantsLoading}
          grantActionLoading={state.grantActionLoading}
          grantsError={state.grantsError}
          isActionLoading={state.isActionLoading}
          tenantName={state.tenant.tenantName}
          onSubmitGrant={state.submitGrant}
          onSubmitFeatureConfig={state.submitFeatureConfig}
        />
      )}

      {state.activeTab === "auditoria" && (
        <RbacTabAuditoria
          logs={state.filteredLogs}
          action={state.action}
          resourceType={state.resourceType}
          limit={state.limit}
          logsLoading={state.logsLoading}
          logsError={state.logsError}
          setAction={state.setAction}
          setResourceType={state.setResourceType}
          setLimit={state.setLimit}
        />
      )}

      {state.isActionLoading ? <p className="text-xs text-muted-foreground">Processando...</p> : null}
        </>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bug, ChevronDown, ChevronUp, ShieldCheck, User, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { meApi } from "@/lib/api/auth";
import {
  AUTH_SESSION_UPDATED_EVENT,
  getAccessToken,
  getAccessTokenType,
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  getRefreshToken,
  hasActiveSession,
  type TenantAccess,
} from "@/lib/api/session";
import { hasElevatedAccess, normalizeRoles } from "@/lib/access-control";
import {
  getOptimisticTenantContextSnapshot,
  TENANT_CONTEXT_UPDATED_EVENT,
  type TenantContextSnapshot,
} from "@/lib/tenant/tenant-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";
import { isDevSessionDebugEnabled } from "./config";

type DebugUserState = {
  nome: string;
  email: string;
  roles: string[];
  loading: boolean;
  error: string | null;
};

type SessionMetadata = {
  sessionActive: boolean;
  tokenPresent: boolean;
  refreshTokenPresent: boolean;
  tokenType: string;
  activeTenantId: string;
  availableTenants: TenantAccess[];
};

function buildSessionMetadata(): SessionMetadata {
  return {
    sessionActive: hasActiveSession(),
    tokenPresent: Boolean(getAccessToken()),
    refreshTokenPresent: Boolean(getRefreshToken()),
    tokenType: getAccessTokenType() ?? "-",
    activeTenantId: getActiveTenantIdFromSession() ?? "",
    availableTenants: getAvailableTenantsFromSession(),
  };
}

function buildAcademiaName(snapshot: TenantContextSnapshot): string {
  return snapshot.tenant?.razaoSocial?.trim() || snapshot.tenant?.nome?.trim() || "Academia";
}

function resolveTenantLabel(tenantId: string, snapshot: TenantContextSnapshot): string {
  if (!tenantId) return "-";
  const tenant = snapshot.tenants.find((item) => item.id === tenantId);
  return tenant?.nome ?? tenantId;
}

function Field({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-sm text-foreground",
          multiline ? "whitespace-pre-wrap break-words" : "truncate"
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export function DevSessionPanel() {
  const pathname = usePathname();
  const enabled = isDevSessionDebugEnabled();
  const [open, setOpen] = useState(false);
  const [tenantSnapshot, setTenantSnapshot] = useState<TenantContextSnapshot>(() =>
    getOptimisticTenantContextSnapshot()
  );
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata>(() => buildSessionMetadata());
  const [user, setUser] = useState<DebugUserState>({
    nome: "-",
    email: "-",
    roles: [],
    loading: true,
    error: null,
  });

  const syncContext = useCallback(() => {
    setTenantSnapshot(getOptimisticTenantContextSnapshot());
    setSessionMetadata(buildSessionMetadata());
  }, []);

  const syncUser = useCallback(async () => {
    setUser((current) => ({ ...current, loading: true, error: null }));
    try {
      const currentUser = await meApi();
      setUser({
        nome: currentUser?.nome?.trim() || "-",
        email: currentUser?.email?.trim() || "-",
        roles: normalizeRoles(currentUser?.roles),
        loading: false,
        error: null,
      });
    } catch (error) {
      setUser({
        nome: "-",
        email: "-",
        roles: [],
        loading: false,
        error: normalizeErrorMessage(error),
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const kickoffId = window.setTimeout(() => {
      syncContext();
      void syncUser();
    }, 0);

    function handleStoreUpdate() {
      syncContext();
    }

    function handleSessionUpdate() {
      syncContext();
      void syncUser();
    }

    window.addEventListener(TENANT_CONTEXT_UPDATED_EVENT, handleStoreUpdate);
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
    window.addEventListener("storage", handleSessionUpdate);

    return () => {
      window.clearTimeout(kickoffId);
      window.removeEventListener(TENANT_CONTEXT_UPDATED_EVENT, handleStoreUpdate);
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
      window.removeEventListener("storage", handleSessionUpdate);
    };
  }, [enabled, syncContext, syncUser]);

  const tenantAccessList = useMemo(
    () =>
      sessionMetadata.availableTenants.map((item) => ({
        id: item.tenantId,
        nome: resolveTenantLabel(item.tenantId, tenantSnapshot),
        defaultTenant: item.defaultTenant,
        current: item.tenantId === (sessionMetadata.activeTenantId || tenantSnapshot.tenantId),
      })),
    [sessionMetadata.activeTenantId, sessionMetadata.availableTenants, tenantSnapshot]
  );

  const academiaName = useMemo(() => buildAcademiaName(tenantSnapshot), [tenantSnapshot]);
  const tenantDisplayName = tenantSnapshot.tenant?.nome ?? tenantSnapshot.tenantName ?? "-";
  const roleList = user.roles.length ? user.roles.join(", ") : "-";
  const accessLevel = hasElevatedAccess(user.roles) ? "Elevado" : "Padrao";

  if (!enabled) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {open ? (
        <Card className="pointer-events-auto w-[420px] max-w-[calc(100vw-2rem)] border-border bg-card/95 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Bug className="size-4 text-gym-accent" />
                  Debug de sessao
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Painel local para inspecionar contexto autenticado em desenvolvimento.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setOpen(false)}
                  aria-label="Recolher painel"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar painel"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">API real</Badge>
              <Badge variant="outline">{pathname || "/"}</Badge>
              <Badge variant={sessionMetadata.sessionActive ? "secondary" : "destructive"}>
                {sessionMetadata.sessionActive ? "Sessão ativa" : "Sessão ausente"}
              </Badge>
              <Badge variant={hasElevatedAccess(user.roles) ? "secondary" : "outline"}>
                {accessLevel}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Academia" value={academiaName} />
              <Field label="Unidade ativa" value={tenantDisplayName} />
              <Field label="Tenant atual" value={tenantSnapshot.tenantId || "-"} />
              <Field label="Tenant na sessao" value={sessionMetadata.activeTenantId || "-"} />
              <Field label="Usuario" value={user.loading ? "Carregando..." : user.nome} />
              <Field label="Email" value={user.loading ? "Carregando..." : user.email} />
              <Field label="Perfis" value={user.loading ? "Carregando..." : roleList} multiline />
              <Field label="Tipo do token" value={sessionMetadata.tokenType} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-secondary/50 p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-gym-accent" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Estado
                  </p>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tenant resolvido</span>
                    <span>{tenantSnapshot.tenantResolved ? "Sim" : "Nao"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Refresh token</span>
                    <span>{sessionMetadata.refreshTokenPresent ? "Presente" : "Ausente"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Unidades no contexto</span>
                    <span>{tenantSnapshot.tenants.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Unidades na sessao</span>
                    <span>{tenantAccessList.length}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary/50 p-3">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-gym-accent" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Observacoes
                  </p>
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>Este painel so renderiza fora de producao.</p>
                  <p>Ative com `NEXT_PUBLIC_DEBUG_SESSION_PANEL=true`.</p>
                  {user.error ? <p className="text-gym-danger">authMe: {user.error}</p> : null}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Unidades com acesso
                </p>
                <Badge variant="outline">{tenantAccessList.length}</Badge>
              </div>

              <div className="max-h-56 space-y-2 overflow-auto pr-1">
                {tenantAccessList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                    Nenhuma unidade encontrada no payload da sessao.
                  </div>
                ) : (
                  tenantAccessList.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-secondary/40 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{item.nome}</span>
                        {item.current ? <Badge variant="secondary">Atual</Badge> : null}
                        {item.defaultTenant ? <Badge variant="outline">Padrao</Badge> : null}
                      </div>
                      <p className="mt-1 break-all text-xs text-muted-foreground">{item.id}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        className="pointer-events-auto rounded-full shadow-lg"
        onClick={() => setOpen((current) => !current)}
        aria-label="Abrir debug de sessao"
      >
        {open ? <ChevronUp className="size-5" /> : <Bug className="size-5" />}
      </Button>
    </div>
  );
}

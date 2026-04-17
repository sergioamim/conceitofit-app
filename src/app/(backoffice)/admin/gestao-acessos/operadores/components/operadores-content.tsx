"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { listUsersApi } from "@/lib/api/rbac";
import {
  listarPerfis,
  atribuirPerfil,
  obterPerfilUsuarioTenant,
  obterCapacidadesEfetivas,
} from "@/lib/api/gestao-acessos";
import type { RbacUser } from "@/lib/types";
import type { PerfilAcesso, UsuarioPerfilDetalhe } from "@/lib/api/gestao-acessos.types";

interface OperadorRow {
  user: RbacUser;
  perfilId: string | null;
  perfilNome: string | null;
}

export function OperadoresContent() {
  const { toast } = useToast();
  const tenant = useRbacTenant();

  const [operadores, setOperadores] = useState<OperadorRow[]>([]);
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal detalhes
  const [detalheOpen, setDetalheOpen] = useState(false);
  const [detalheUser, setDetalheUser] = useState<RbacUser | null>(null);
  const [detalheData, setDetalheData] = useState<UsuarioPerfilDetalhe | null>(null);
  const [detalheCapacidades, setDetalheCapacidades] = useState<string[]>([]);
  const [detalheLoading, setDetalheLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!tenant.tenantId) return;
    setLoading(true);
    try {
      setError(null);
      const [usersData, perfisData] = await Promise.all([
        listUsersApi({ tenantId: tenant.tenantId }),
        listarPerfis("ACADEMIA", tenant.tenantId),
      ]);
      setPerfis(Array.isArray(perfisData) ? perfisData : []);

      // Build operador rows — for now, perfil info isn't in the user list,
      // so we set null and the user can assign via dropdown
      const rows: OperadorRow[] = usersData.map((u) => ({
        user: u,
        perfilId: null,
        perfilNome: null,
      }));
      setOperadores(rows);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenant.tenantId]);

  useEffect(() => {
    if (tenant.tenantId) void reload();
  }, [reload, tenant.tenantId]);

  async function handleAtribuirPerfil(userId: string, perfilId: string) {
    if (!tenant.tenantId) return;
    try {
      const result = await atribuirPerfil(Number(userId), tenant.tenantId, perfilId);
      setOperadores((prev) =>
        prev.map((op) =>
          op.user.id === userId
            ? { ...op, perfilId: result.perfilId, perfilNome: result.perfilNome }
            : op,
        ),
      );
      toast({ title: "Perfil atribuído" });
    } catch (err) {
      toast({
        title: "Erro ao atribuir perfil",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    }
  }

  async function handleOpenDetalhes(user: RbacUser) {
    if (!tenant.tenantId) return;
    setDetalheUser(user);
    setDetalheOpen(true);
    setDetalheLoading(true);
    setDetalheData(null);
    setDetalheCapacidades([]);
    try {
      const [perfilData, capsData] = await Promise.all([
        obterPerfilUsuarioTenant(Number(user.id), tenant.tenantId).catch(() => null),
        obterCapacidadesEfetivas(Number(user.id), tenant.tenantId).catch(() => [] as string[]),
      ]);
      setDetalheData(perfilData);
      setDetalheCapacidades(Array.isArray(capsData) ? capsData : []);
    } catch {
      // Errors handled individually above
    } finally {
      setDetalheLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Operadores</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie perfis de acesso dos operadores.
          </p>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="px-5 py-5 text-sm text-gym-danger">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="px-5 py-8 text-center text-sm text-muted-foreground">
            Carregando operadores...
          </CardContent>
        </Card>
      ) : operadores.length === 0 ? (
        <Card>
          <CardContent className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhum operador encontrado nesta unidade.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" />
              {operadores.length} operador(es)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {operadores.map((op) => (
                <div
                  key={op.user.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {op.user.fullName || op.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {op.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={op.perfilId ?? ""}
                      onValueChange={(value) => handleAtribuirPerfil(op.user.id, value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecionar perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {perfis.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-border shrink-0"
                      onClick={() => handleOpenDetalhes(op.user)}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={detalheOpen} onOpenChange={setDetalheOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Detalhes de {detalheUser?.fullName || detalheUser?.name}
            </DialogTitle>
          </DialogHeader>
          {detalheLoading ? (
            <p className="text-sm text-muted-foreground py-4">Carregando...</p>
          ) : (
            <div className="space-y-4 py-2">
              {detalheData ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Perfil:</span>{" "}
                    {detalheData.perfilNome || "Sem perfil"}
                  </p>
                  {detalheData.overrides.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Overrides:</p>
                      <div className="space-y-1">
                        {detalheData.overrides.map((ov) => (
                          <div
                            key={ov.capacidadeKey}
                            className="rounded-lg border border-border px-3 py-2 text-xs"
                          >
                            <span
                              className={`font-semibold ${
                                ov.tipo === "GRANT" ? "text-gym-success" : "text-gym-danger"
                              }`}
                            >
                              {ov.tipo}
                            </span>{" "}
                            {ov.capacidadeKey}
                            {ov.motivo && (
                              <span className="text-muted-foreground"> — {ov.motivo}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum perfil atribuido nesta unidade.
                </p>
              )}

              {detalheCapacidades.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Capacidades efetivas ({detalheCapacidades.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {detalheCapacidades.map((cap) => (
                      <span
                        key={cap}
                        className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

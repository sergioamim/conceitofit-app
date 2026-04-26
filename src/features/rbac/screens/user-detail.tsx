"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Edit, KeyRound, Lock, RotateCcw, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  adicionarOverride,
  atribuirPerfil,
  listarCapacidades,
  listarPerfisUsuario,
  obterCapacidadesEfetivas,
  obterPerfilUsuarioTenant,
  removerOverride,
} from "@/lib/api/gestao-acessos";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";

import {
  alterarStatusUsuario,
  listarAuditoria,
  listarPerfisContexto,
  obterUsuario,
  resetarSenhaUsuario,
} from "../api/client";
import type { Dominio } from "../api/types";
import { AvatarIniciais } from "../components/avatar-iniciais";
import { RoleChip } from "../components/role-chip";
import { StatusChip } from "../components/status-chip";
import { useRbacHref } from "../context";

interface UserDetailProps {
  dominio: Dominio;
  tenantId?: string;
  userId: number;
  /** Pré-população via query string da lista — fallback enquanto o GET /usuarios/{id} carrega. */
  initialNome?: string;
  initialEmail?: string;
}

export function RbacUserDetail({
  dominio,
  tenantId,
  userId,
  initialNome,
  initialEmail,
}: UserDetailProps) {
  const href = useRbacHref();
  const { toast } = useToast();
  const qc = useQueryClient();
  const enabled = dominio === "PLATAFORMA" || Boolean(tenantId);

  // Detalhe completo do usuário (substitui o query-string fallback).
  const usuarioQ = useQuery({
    queryKey: ["rbac", "user", userId],
    queryFn: () => obterUsuario(userId),
    enabled,
  });
  const u = usuarioQ.data;
  const nome = u?.nome || initialNome || `Usuário #${userId}`;
  const email = u?.email || initialEmail || "";
  const tid = (u?.tenantId ?? tenantId) ?? "";

  const capacidadesEfetivasQ = useQuery({
    queryKey: ["rbac", "user-caps", userId, tid],
    queryFn: () => obterCapacidadesEfetivas(userId, tid),
    enabled: enabled && Boolean(tid),
  });

  const perfilUserDetalheQ = useQuery({
    queryKey: ["rbac", "user-perfil-detalhe", userId, tid],
    queryFn: () => obterPerfilUsuarioTenant(userId, tid),
    enabled: enabled && Boolean(tid),
  });

  const capacidadesGrupoQ = useQuery({
    queryKey: ["rbac", "caps-by-grupo", dominio],
    queryFn: () => listarCapacidades(dominio),
    enabled,
    staleTime: 60_000,
  });

  const outrasRedesQ = useQuery({
    queryKey: ["rbac", "user-perfis-all", userId],
    queryFn: () => listarPerfisUsuario(userId),
    enabled: enabled && dominio === "ACADEMIA",
  });

  const atividadeQ = useQuery({
    queryKey: ["rbac", "user-atividade", userId, tid, email],
    queryFn: () =>
      listarAuditoria({
        dominio,
        tenantId,
        q: email || undefined,
        size: 20,
      }),
    enabled: enabled && Boolean(email),
  });

  const papeisQ = useQuery({
    queryKey: ["rbac", "perfis", dominio, tid],
    queryFn: () => listarPerfisContexto(dominio, tid || undefined),
    enabled,
    staleTime: 60_000,
  });

  // ===== Mutations =====
  const alterarPapelMut = useMutation({
    mutationFn: (perfilId: string) => atribuirPerfil(userId, tid, perfilId),
    onSuccess: () => {
      toast({ title: "Papel atualizado" });
      qc.invalidateQueries({ queryKey: ["rbac"] });
      setAlterarPapelOpen(false);
      setNovoPapelId("");
    },
    onError: (err) =>
      toast({
        title: "Falha ao alterar papel",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  const suspenderMut = useMutation({
    mutationFn: (ativo: boolean) =>
      alterarStatusUsuario(userId, { ativo, motivo: motivoSuspensao || undefined }),
    onSuccess: (data) => {
      toast({
        title: data.enabled ? "Usuário reativado" : "Usuário suspenso",
      });
      qc.invalidateQueries({ queryKey: ["rbac"] });
      setSuspenderOpen(false);
      setMotivoSuspensao("");
    },
    onError: (err) =>
      toast({
        title: "Falha ao alterar status",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  const resetarSenhaMut = useMutation({
    mutationFn: () => resetarSenhaUsuario(userId),
    onSuccess: (data) => {
      setSenhaTemp(data.senhaTemporaria);
      qc.invalidateQueries({ queryKey: ["rbac"] });
    },
    onError: (err) =>
      toast({
        title: "Falha ao resetar senha",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  const adicionarOverrideMut = useMutation({
    mutationFn: (payload: { capKey: string; tipo: "GRANT" | "DENY"; motivo?: string }) =>
      adicionarOverride(userId, tid, payload.capKey, payload.tipo, payload.motivo),
    onSuccess: () => {
      toast({ title: "Override adicionado" });
      qc.invalidateQueries({ queryKey: ["rbac"] });
      setOverrideOpen(false);
      setOverrideCap("");
      setOverrideTipo("GRANT");
      setOverrideMotivo("");
    },
    onError: (err) =>
      toast({
        title: "Falha ao adicionar override",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  const removerOverrideMut = useMutation({
    mutationFn: (capKey: string) => removerOverride(userId, tid, capKey),
    onSuccess: () => {
      toast({ title: "Override removido" });
      qc.invalidateQueries({ queryKey: ["rbac"] });
    },
    onError: (err) =>
      toast({
        title: "Falha ao remover override",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  // ===== Modal state =====
  const [alterarPapelOpen, setAlterarPapelOpen] = useState(false);
  const [novoPapelId, setNovoPapelId] = useState<string>("");
  const [suspenderOpen, setSuspenderOpen] = useState(false);
  const [motivoSuspensao, setMotivoSuspensao] = useState("");
  const [resetarOpen, setResetarOpen] = useState(false);
  const [senhaTemp, setSenhaTemp] = useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideCap, setOverrideCap] = useState("");
  const [overrideTipo, setOverrideTipo] = useState<"GRANT" | "DENY">("GRANT");
  const [overrideMotivo, setOverrideMotivo] = useState("");

  useEffect(() => {
    if (u?.papel) setNovoPapelId(u.papel.id);
  }, [u?.papel]);

  const efetivas = new Set<string>(capacidadesEfetivasQ.data ?? []);
  const totalCaps = Object.values(capacidadesGrupoQ.data ?? {}).reduce(
    (a, c) => a + c.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-auto p-0">
          <Link href={href("/usuarios")}>
            <ArrowLeft className="mr-1 size-3" /> Usuários
          </Link>
        </Button>
        <span>/</span>
        <span>{nome}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center">
                <AvatarIniciais nome={nome} cor={u?.papel?.cor} size="lg" />
              </div>
              <p className="mt-3 text-lg font-bold">{nome}</p>
              {email && <p className="text-xs text-muted-foreground">{email}</p>}

              <div className="mt-3 flex justify-center">
                {u?.status && <StatusChip status={u.status} />}
              </div>

              <div className="my-5 h-px bg-border" />

              <div className="space-y-3 text-left">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Papel
                  </p>
                  {usuarioQ.isLoading ? (
                    <Skeleton className="mt-1 h-6 w-24" />
                  ) : u?.papel ? (
                    <div className="mt-1">
                      <RoleChip nome={u.papel.nome} cor={u.papel.cor} />
                    </div>
                  ) : (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      Sem papel atribuído
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Resumo de permissões
                  </p>
                  <p className="text-sm">
                    <b>{efetivas.size}</b> de {totalCaps} permissões concedidas
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gym-accent"
                      style={{
                        width:
                          totalCaps > 0 ? `${(efetivas.size / totalCaps) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button variant="outline" disabled className="justify-start" title="Em breve">
              <Edit className="mr-2 size-4" /> Editar perfil
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => setAlterarPapelOpen(true)}
              disabled={!tid}
            >
              <KeyRound className="mr-2 size-4" /> Alterar papel
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => setResetarOpen(true)}
            >
              <Lock className="mr-2 size-4" /> Resetar senha
            </Button>
            {u?.enabled === false ? (
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => suspenderMut.mutate(true)}
                disabled={suspenderMut.isPending}
              >
                <RotateCcw className="mr-2 size-4" /> Reativar acesso
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="justify-start"
                onClick={() => setSuspenderOpen(true)}
              >
                <X className="mr-2 size-4" /> Suspender acesso
              </Button>
            )}
          </div>
        </div>

        <div>
          <Tabs defaultValue="permissoes">
            <TabsList>
              <TabsTrigger value="permissoes">Permissões efetivas</TabsTrigger>
              <TabsTrigger value="sessoes">Sessões ativas</TabsTrigger>
              <TabsTrigger value="atividade">Atividade</TabsTrigger>
              {dominio === "ACADEMIA" && (
                <TabsTrigger value="redes">Outras redes</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="permissoes" className="mt-4">
              <Card>
                <CardContent className="p-5">
                  {capacidadesGrupoQ.isLoading || capacidadesEfetivasQ.isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(capacidadesGrupoQ.data ?? {}).map(
                        ([grupo, caps]) => {
                          const granted = caps.filter((c) => efetivas.has(c.key)).length;
                          return (
                            <div
                              key={grupo}
                              className="rounded-xl border border-border p-3"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <b>{grupo}</b>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {granted}/{caps.length}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {caps.map((c) => {
                                  const has = efetivas.has(c.key);
                                  return (
                                    <span
                                      key={c.key}
                                      className={cn(
                                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                                        has
                                          ? "border-gym-accent/30 bg-gym-accent/10 text-gym-accent"
                                          : "border-border bg-muted text-muted-foreground/70",
                                      )}
                                    >
                                      {has && <Check className="size-2.5" />}
                                      {c.nome}
                                      {c.critica && (
                                        <span className="ml-0.5 text-gym-danger">!</span>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Overrides individuais (GRANT/DENY) */}
              <Card className="mt-4">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Overrides individuais</p>
                      <p className="text-xs text-muted-foreground">
                        Concessões ou bloqueios específicos pra este usuário, além do que
                        o papel concede.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOverrideOpen(true)}
                      disabled={!tid}
                    >
                      Adicionar override
                    </Button>
                  </div>
                  {(perfilUserDetalheQ.data?.overrides?.length ?? 0) === 0 ? (
                    <p className="text-xs italic text-muted-foreground">
                      Nenhum override ativo.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {perfilUserDetalheQ.data?.overrides?.map((o) => (
                        <li
                          key={o.capacidadeKey}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm">
                              <span
                                className={cn(
                                  "mr-2 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                  o.tipo === "GRANT"
                                    ? "border-gym-accent/30 bg-gym-accent/10 text-gym-accent"
                                    : "border-gym-danger/30 bg-gym-danger/10 text-gym-danger",
                                )}
                              >
                                {o.tipo}
                              </span>
                              <span className="font-mono text-xs">
                                {o.capacidadeKey}
                              </span>
                            </p>
                            {o.motivo && (
                              <p className="text-xs text-muted-foreground">
                                {o.motivo}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removerOverrideMut.mutate(o.capacidadeKey)}
                            disabled={removerOverrideMut.isPending}
                          >
                            <X className="size-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessoes" className="mt-4">
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Visualização de sessões ativas indisponível nesta versão.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="atividade" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {atividadeQ.isLoading ? (
                    <div className="space-y-2 p-5">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (atividadeQ.data?.content.length ?? 0) === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Nenhuma atividade registrada nos últimos 7 dias.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {atividadeQ.data?.content.map((ev) => (
                        <li key={ev.id} className="px-5 py-3 text-sm">
                          <p>
                            <b>{ev.action}</b>{" "}
                            {ev.resourceKey && (
                              <span className="font-mono text-xs">{ev.resourceKey}</span>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {ev.categoria} · {new Date(ev.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {dominio === "ACADEMIA" && (
              <TabsContent value="redes" className="mt-4">
                <Card>
                  <CardContent className="p-5">
                    {outrasRedesQ.isLoading ? (
                      <Skeleton className="h-12 w-full" />
                    ) : (outrasRedesQ.data?.length ?? 0) === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Sem acesso a outras redes.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {outrasRedesQ.data?.map((p) => (
                          <li
                            key={`${p.userId}-${p.tenantId}`}
                            className="flex items-center justify-between py-3"
                          >
                            <div>
                              <p className="text-sm font-semibold">{p.perfilNome ?? "—"}</p>
                              <p className="font-mono text-xs text-muted-foreground">
                                tenant {p.tenantId}
                              </p>
                            </div>
                            {p.tenantId === tid && (
                              <span className="rounded-full bg-gym-accent/15 px-2 py-0.5 text-[10px] font-semibold text-gym-accent">
                                esta rede
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* ===== Alterar papel ===== */}
      <Dialog open={alterarPapelOpen} onOpenChange={setAlterarPapelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar papel de {nome}</DialogTitle>
            <DialogDescription>
              Mudança aplica imediatamente. Permissões antigas só caem na próxima sessão do
              usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Novo papel</Label>
            <Select value={novoPapelId} onValueChange={setNovoPapelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um papel" />
              </SelectTrigger>
              <SelectContent>
                {papeisQ.data?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAlterarPapelOpen(false)}
              disabled={alterarPapelMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              disabled={
                !novoPapelId ||
                alterarPapelMut.isPending ||
                novoPapelId === u?.papel?.id
              }
              onClick={() => alterarPapelMut.mutate(novoPapelId)}
            >
              {alterarPapelMut.isPending ? "Aplicando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Suspender ===== */}
      <Dialog open={suspenderOpen} onOpenChange={setSuspenderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender acesso de {nome}</DialogTitle>
            <DialogDescription>
              O usuário não conseguirá fazer login enquanto suspenso. Sessões ativas continuam
              válidas até expirarem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Input
              id="motivo"
              value={motivoSuspensao}
              onChange={(e) => setMotivoSuspensao(e.target.value)}
              placeholder="Ex: solicitação RH, suspeita de uso indevido…"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspenderOpen(false)}
              disabled={suspenderMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => suspenderMut.mutate(false)}
              disabled={suspenderMut.isPending}
            >
              {suspenderMut.isPending ? "Suspendendo…" : "Suspender"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Resetar senha ===== */}
      <AlertDialog open={resetarOpen} onOpenChange={setResetarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha de {nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Uma senha temporária será gerada. O usuário precisará trocá-la no próximo
              login. <b>A senha aparece uma única vez na próxima tela</b> — copie e
              entregue por canal seguro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetarSenhaMut.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                resetarSenhaMut.mutate();
              }}
              disabled={resetarSenhaMut.isPending}
            >
              {resetarSenhaMut.isPending ? "Resetando…" : "Resetar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adicionar override */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar override</DialogTitle>
            <DialogDescription>
              Override sobrescreve o papel. Use com critério — fica registrado na auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label>Permissão</Label>
              <Select value={overrideCap} onValueChange={setOverrideCap}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma permissão" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(capacidadesGrupoQ.data ?? {}).flatMap(([grupo, caps]) =>
                    caps.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {grupo} · {c.nome}
                        {c.critica && (
                          <span className="ml-1 text-gym-danger">!</span>
                        )}
                      </SelectItem>
                    )),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={overrideTipo}
                onValueChange={(v) => setOverrideTipo(v as "GRANT" | "DENY")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRANT">GRANT — conceder</SelectItem>
                  <SelectItem value="DENY">DENY — bloquear</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motivo-override">Motivo (recomendado)</Label>
              <Input
                id="motivo-override"
                placeholder="Ex: substituição temporária, restrição preventiva…"
                value={overrideMotivo}
                onChange={(e) => setOverrideMotivo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOverrideOpen(false)}
              disabled={adicionarOverrideMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              disabled={!overrideCap || adicionarOverrideMut.isPending}
              onClick={() =>
                adicionarOverrideMut.mutate({
                  capKey: overrideCap,
                  tipo: overrideTipo,
                  motivo: overrideMotivo || undefined,
                })
              }
            >
              {adicionarOverrideMut.isPending ? "Salvando…" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Senha temporária — mostra após reset bem-sucedido. Só limpa em close real
          pra evitar perda acidental por focus/blur events. */}
      <Dialog
        open={senhaTemp != null}
        onOpenChange={(open) => {
          if (!open) setSenhaTemp(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Senha temporária gerada</DialogTitle>
            <DialogDescription>
              Copie agora. Esta senha não será mostrada novamente. O usuário será forçado a
              trocá-la no próximo login.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/40 p-4 font-mono text-lg tracking-wider text-center select-all">
            {senhaTemp}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (senhaTemp) {
                  navigator.clipboard.writeText(senhaTemp);
                  toast({ title: "Senha copiada para a área de transferência" });
                }
              }}
              variant="outline"
            >
              Copiar
            </Button>
            <Button
              onClick={() => {
                setResetarOpen(false);
                setSenhaTemp(null);
              }}
            >
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

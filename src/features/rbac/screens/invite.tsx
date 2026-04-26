"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";

import { criarConvites, listarPerfisContexto } from "../api/client";
import type { Dominio } from "../api/types";
import { useRbacHref } from "../context";

interface InviteProps {
  dominio: Dominio;
  tenantId?: string;
}

export function RbacInvite({ dominio, tenantId }: InviteProps) {
  const router = useRouter();
  const { toast } = useToast();
  const href = useRbacHref();

  const [emails, setEmails] = useState("");
  const [papelId, setPapelId] = useState<string>("");
  const [scope, setScope] = useState<"todas" | "selecionar">("todas");
  const [mensagem, setMensagem] = useState("");

  const enabled = dominio === "PLATAFORMA" || Boolean(tenantId);

  const papeisQ = useQuery({
    queryKey: ["rbac", "perfis", dominio, tenantId ?? null],
    queryFn: () => listarPerfisContexto(dominio, tenantId),
    enabled,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: () =>
      criarConvites({
        dominio,
        tenantId,
        emails: parseEmails(emails),
        papelId,
        mensagem: mensagem || undefined,
      }),
    onSuccess: (res) => {
      toast({
        title: `${res.criados.length} convite(s) criado(s)`,
        description:
          res.jaExistentesEmOutraRede.length > 0
            ? `${res.jaExistentesEmOutraRede.length} usuário(s) já tinha(m) acesso a outra rede e ganhou(aram) vínculo nesta.`
            : undefined,
      });
      router.push(href("/usuarios"));
    },
    onError: (err: unknown) => {
      toast({
        title: "Erro ao criar convites",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  const parsedEmails = parseEmails(emails);
  const papelSelecionado = papeisQ.data?.find((p) => p.id === papelId);
  const canSubmit =
    parsedEmails.length > 0 && Boolean(papelId) && !mutation.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-auto p-0">
          <Link href={href("/usuarios")}>
            <ArrowLeft className="mr-1 size-3" /> Usuários
          </Link>
        </Button>
        <span>/</span>
        <span>Convidar</span>
      </div>

      <div>
        <h1 className="text-2xl font-display font-bold">Convidar pessoas</h1>
        <p className="text-sm text-muted-foreground">
          Crie um vínculo de acesso e envie um convite para entrar
          {dominio === "ACADEMIA" ? " na rede" : " na plataforma"}.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <Section title="1. Para quem">
            <Textarea
              rows={4}
              placeholder="email@conceito.fit, outro@conceito.fit&#10;Cole vários separados por vírgula ou quebra de linha."
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
            {parsedEmails.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {parsedEmails.length} email(s) detectado(s).
              </p>
            )}
          </Section>

          <Section title="2. Papel">
            {papeisQ.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {papeisQ.data?.map((p) => {
                  const selected = papelId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPapelId(p.id)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        selected
                          ? "border-gym-accent bg-gym-accent/10 ring-1 ring-gym-accent/30"
                          : "border-border hover:border-muted-foreground/40 hover:bg-secondary/50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: p.cor ?? "#6b8c1a" }}
                        />
                        <b className="text-sm">{p.nome}</b>
                        {p.tipo === "CUSTOMIZADO" && (
                          <span className="ml-auto rounded-full bg-secondary px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground">
                            custom
                          </span>
                        )}
                      </div>
                      {p.descricao && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                          {p.descricao}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Section>

          {dominio === "ACADEMIA" && (
            <Section title="3. Escopo de unidades">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={scope === "todas" ? "default" : "outline"}
                  onClick={() => setScope("todas")}
                >
                  Todas as unidades
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={scope === "selecionar" ? "default" : "outline"}
                  onClick={() => setScope("selecionar")}
                  disabled
                  title="Seleção por unidade ainda não disponível — convite garante acesso a todas."
                >
                  Selecionar unidades
                </Button>
              </div>
            </Section>
          )}

          <Section title={dominio === "ACADEMIA" ? "4. Mensagem opcional" : "3. Mensagem opcional"}>
            <Textarea
              rows={3}
              placeholder="Bem-vinda(o) à Conceito Fit! Aqui está seu acesso…"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
          </Section>

          <div className="my-2 h-px bg-border" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Pré-visualização: convite com papel{" "}
              <b style={{ color: papelSelecionado?.cor ?? undefined }}>
                {papelSelecionado?.nome ?? "—"}
              </b>{" "}
              para {parsedEmails.length} pessoa(s)
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={href("/usuarios")}>Cancelar</Link>
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={!canSubmit}
              >
                <Send className="mr-2 size-4" />
                {mutation.isPending ? "Enviando…" : "Enviar convite"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[,\n;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 3 && s.includes("@"));
}

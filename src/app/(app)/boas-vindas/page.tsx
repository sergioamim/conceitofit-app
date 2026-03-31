"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Compass,
  HeartHandshake,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenantContext } from "@/hooks/use-session-context";
import { extractWelcomeFlags, shouldShowWelcome } from "@/lib/welcome";

function resolveUserGreeting(name?: string) {
  const trimmed = name?.trim();
  return trimmed ? `Olá, ${trimmed}!` : "Olá!";
}

function resolveAcademiaName(networkName?: string, fallbackName?: string) {
  const name = networkName?.trim() || fallbackName?.trim();
  return name || "sua academia";
}

export default function BoasVindasPage() {
  const router = useRouter();
  const { authUser, brandingSnapshot, networkName, academia, loading } = useTenantContext();

  const welcomeFlags = useMemo(() => extractWelcomeFlags(authUser), [authUser]);
  const canShowWelcome = useMemo(() => shouldShowWelcome(welcomeFlags), [welcomeFlags]);

  useEffect(() => {
    if (loading) return;
    if (!canShowWelcome) {
      router.replace("/dashboard");
    }
  }, [canShowWelcome, loading, router]);

  const handleStart = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  if (loading || !canShowWelcome) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card/70 p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Preparando sua experiência de boas-vindas...</p>
        </div>
      </div>
    );
  }

  const logoUrl = brandingSnapshot?.logoUrl;
  const academyName = resolveAcademiaName(networkName, academia?.nome);
  const greeting = resolveUserGreeting(authUser?.displayName ?? authUser?.nome);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#0f172a12,transparent_60%),radial-gradient(circle_at_bottom_right,#10b98118,transparent_55%)]" />
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gym-accent">Boas-vindas</p>
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {greeting}
            </h1>
            <p className="text-lg text-muted-foreground">
              Bem-vindo(a) à {academyName}. Seu acesso está pronto e vamos te guiar pelos próximos passos.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/80 bg-card/70">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">Explore o painel</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Encontre métricas, alertas e atalhos para organizar seu dia.
                  </p>
                </div>
                <Sparkles className="mt-1 size-5 text-gym-accent" />
              </CardHeader>
            </Card>

            <Card className="border-border/80 bg-card/70">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">Configure sua unidade</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ajuste planos, horários e integrações para deixar tudo pronto.
                  </p>
                </div>
                <Compass className="mt-1 size-5 text-gym-accent" />
              </CardHeader>
            </Card>
          </div>

          <Card className="border-border/80 bg-card/70">
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <div className="flex gap-3">
                <div className="rounded-full border border-border/60 bg-secondary p-2 text-muted-foreground">
                  <HeartHandshake className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Equipe e atendimento</p>
                  <p className="text-sm text-muted-foreground">
                    Cadastre colaboradores e defina rotinas para atendimento impecável.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="rounded-full border border-border/60 bg-secondary p-2 text-muted-foreground">
                  <Rocket className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Operação em movimento</p>
                  <p className="text-sm text-muted-foreground">
                    Use alertas inteligentes para acompanhar vendas, matrículas e resultados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={handleStart}>
              Começar configuração
            </Button>
            <p className="text-xs text-muted-foreground">
              Você poderá revisar esta visão sempre que quiser em ajustes da conta.
            </p>
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <Card className="border-border/80 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Sua identidade visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoUrl ? (
                <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-background p-6">
                  <Image
                    src={logoUrl}
                    alt={`Logo da ${academyName}`}
                    width={180}
                    height={72}
                    className="max-h-16 w-auto object-contain"
                    loading="eager"
                    unoptimized
                    loader={({ src }) => src}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum logotipo configurado ainda. Vamos ajustar isso em seguida.
                  </p>
                </div>
              )}
              <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Próximo passo</p>
                <p className="mt-2 text-sm text-foreground">
                  Revise o perfil da unidade e confirme canais de contato para começar a operar.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

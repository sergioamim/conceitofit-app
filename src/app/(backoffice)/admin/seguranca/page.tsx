"use client";

import Link from "next/link";
import { Users, Key, ChevronRight } from "lucide-react";
import { GlobalSecurityShell } from "@/backoffice/components/security/global-security-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminSecurityOverview } from "@/backoffice/query";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSegurancaPage() {
  const { data: overview, isLoading } = useAdminSecurityOverview();

  return (
    <GlobalSecurityShell
      title="Gestão de Acessos"
      description="Central unificada para gerenciar sua equipe, nível de permissões e segurança operativa."
    >
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* Gestão de Usuários */}
        <Link href="/admin/seguranca/usuarios" className="group">
          <Card className="h-full border-border/50 bg-card transition-colors duration-150 hover:border-gym-accent/50">
            <CardHeader>
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-gym-accent/10 text-gym-accent group-hover:scale-110 transition-transform">
                <Users className="size-6" />
              </div>
              <CardTitle className="flex items-center justify-between text-xl font-display">
                Usuários da Plataforma
                <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardTitle>
              <CardDescription>
                Gerencie administradores, operadores B2B e membros que possuem acesso aos tenants institucionais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-white/5 bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Membros Ativos (SaaS)</span>
                  {isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <span className="text-lg font-bold">{overview?.totalUsers ?? 0}</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-sm font-medium text-muted-foreground">Revisões Pendentes</span>
                  {isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <span className="text-lg font-bold text-gym-accent">{overview?.pendingReviews ?? 0}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Gestão de Perfis (Roles) */}
        <Link href="/admin/seguranca/perfis" className="group">
          <Card className="h-full border-border/50 bg-card transition-colors duration-150 hover:border-gym-accent/50">
            <CardHeader>
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-gym-accent/10 text-gym-accent group-hover:scale-110 transition-transform">
                <Key className="size-6" />
              </div>
              <CardTitle className="flex items-center justify-between text-xl font-display">
                Perfis e Segurança (Roles)
                <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardTitle>
              <CardDescription>
                Configure os níveis de permissão. Crie papéis customizados e defina exatamente o que a equipe pode acessar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-white/5 bg-secondary/30 p-4">
                 <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Permissões Especiais / Exceções</span>
                  {isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <span className="text-lg font-bold text-gym-danger">{overview?.expiringExceptions ?? 0} vencendo</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

      </div>
    </GlobalSecurityShell>
  );
}

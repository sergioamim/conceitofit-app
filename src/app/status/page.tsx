import Link from "next/link";
import type { Metadata } from "next";
import { Activity, Database, HardDrive, RefreshCw, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatHealthTimestamp,
  formatResponseTime,
  loadSystemHealthSnapshot,
  type HealthCardSnapshot,
} from "@/lib/status/system-health";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status do sistema",
  description: "Página pública com a saúde do frontend, backend, banco de dados e storage.",
  robots: {
    index: false,
    follow: false,
  },
};

const ICON_BY_CARD_ID: Record<HealthCardSnapshot["id"], typeof Activity> = {
  frontend: Activity,
  backend: Server,
  database: Database,
  storage: HardDrive,
};

function resolveStatusClass(status: HealthCardSnapshot["status"]): string {
  return status === "UP"
    ? "border-gym-teal/25 bg-gym-teal/10 text-gym-teal"
    : "border-gym-danger/25 bg-gym-danger/10 text-gym-danger";
}

function HealthStatusCard({ card }: { card: HealthCardSnapshot }) {
  const IconComponent = ICON_BY_CARD_ID[card.id];

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{card.label}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </div>
          <div className="rounded-full border border-border bg-secondary p-2 text-muted-foreground">
            <IconComponent className="size-4" />
          </div>
        </div>
        <Badge variant="outline" className={resolveStatusClass(card.status)}>
          {card.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Latência</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{formatResponseTime(card.latencyMs)}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Última checagem</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{formatHealthTimestamp(card.checkedAt)}</p>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-border px-3 py-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Origem</p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">{card.source}</p>
        </div>

        {card.detail ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Detalhe</p>
            <p className="mt-1 text-sm text-foreground">{card.detail}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function StatusPage() {
  const snapshot = await loadSystemHealthSnapshot();

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:px-8">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gym-accent">Página pública</p>
              <h1 className="font-display text-4xl font-bold tracking-tight">Status do sistema</h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Visão rápida para suporte e acompanhamento operacional do frontend, backend e serviços dependentes.
              </p>
            </div>

            <Button asChild variant="outline" className="border-border">
              <Link href="/status">
                <RefreshCw className="size-4" />
                Atualizar
              </Link>
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card/80 px-4 py-3 text-sm text-muted-foreground">
            Atualizado em <span className="font-semibold text-foreground">{formatHealthTimestamp(snapshot.checkedAt)}</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.cards.map((card) => (
            <HealthStatusCard key={card.id} card={card} />
          ))}
        </section>
      </div>
    </main>
  );
}

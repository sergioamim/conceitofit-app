"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  GLOBAL_SECURITY_LEGACY_LINKS,
  GLOBAL_SECURITY_SECTIONS,
  isGlobalSecurityIaEnabled,
} from "@/lib/backoffice/seguranca-navigation";

export function formatSecurityDateTime(value?: string, fallback = "Não informado") {
  if (!value) return fallback;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  if (hour && minute) {
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }
  return `${day}/${month}/${year}`;
}

export function formatSecurityDateTimeInput(value?: string) {
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return match ? `${match[1]}T${match[2]}` : value.slice(0, 16);
}

export function GlobalSecurityShell({
  title,
  description,
  eyebrow = "Admin > Segurança",
  children,
  actions,
  highlight,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
  highlight?: ReactNode;
}) {
  const pathname = usePathname();
  const iaEnabled = isGlobalSecurityIaEnabled();

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gym-accent">{eyebrow}</p>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-display font-bold">{title}</h1>
              <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        </div>

        <Card className="border-border/80 bg-card/80 shadow-sm">
          <CardContent className="grid gap-4 px-5 py-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {GLOBAL_SECURITY_SECTIONS.map((section) => {
                  const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
                  return (
                    <Link
                      key={section.href}
                      href={section.href}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                        active
                          ? "border-gym-accent/40 bg-gym-accent/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-gym-accent/30 hover:text-foreground"
                      )}
                    >
                      {section.label}
                    </Link>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                A navegação já usa linguagem de negócio. Os fluxos antigos seguem disponíveis enquanto a rede conclui a
                migração para a nova segurança.
              </p>
              {!iaEnabled ? (
                <div className="rounded-xl border border-amber-400/30 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  A nova arquitetura está em modo controlado por flag. Use os links legados para suporte técnico.
                </div>
              ) : null}
            </div>
            <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Trilhas legadas
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mantidas para suporte fino enquanto a camada de produto ganha cobertura completa.
                </p>
              </div>
              <div className="space-y-2">
                {GLOBAL_SECURITY_LEGACY_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-gym-accent/30"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {highlight}
      </header>

      {children}
    </div>
  );
}


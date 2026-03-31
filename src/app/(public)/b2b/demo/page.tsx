import type { Metadata } from "next";
import Link from "next/link";
import { Dumbbell, Sparkles } from "lucide-react";
import { DemoForm } from "./demo-form";

export const metadata: Metadata = {
  title: "Experimentar Gratis - Conceito Fit",
  description:
    "Crie uma conta demo gratuita e experimente o Conceito Fit por 7 dias. Sem cartao de credito.",
  openGraph: {
    title: "Experimente o Conceito Fit gratuitamente",
    description:
      "Crie sua conta demo em segundos e explore o sistema completo de gestao para academias.",
    type: "website",
    locale: "pt_BR",
    siteName: "Conceito Fit",
  },
  twitter: {
    card: "summary",
    title: "Experimente o Conceito Fit gratuitamente",
    description:
      "Conta demo gratuita por 7 dias. Sem cartao de credito.",
  },
  robots: { index: true, follow: true },
};

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/b2b" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gym-accent">
              <Dumbbell className="h-4 w-4 text-background" />
            </div>
            <span className="font-display text-lg font-bold">conceito.fit</span>
          </Link>
          <Link
            href="/b2b#contato"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Agendar demonstracao
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Icon + heading */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gym-accent">
              <Dumbbell className="h-7 w-7 text-background" />
            </div>
            <h1 className="font-display text-2xl font-bold">
              Crie sua conta demo
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore o sistema completo por 7 dias. Sem compromisso.
            </p>
          </div>

          {/* Demo benefits */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1">
              <Sparkles className="h-3 w-3 text-gym-accent" />
              Dados de exemplo inclusos
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1">
              <Sparkles className="h-3 w-3 text-gym-accent" />
              7 dias gratis
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1">
              <Sparkles className="h-3 w-3 text-gym-accent" />
              Sem cartao de credito
            </span>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
            <DemoForm />
          </div>

          {/* Links */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Ja tem uma conta? </span>
            <Link
              href="/login"
              className="font-medium text-gym-accent transition-opacity hover:opacity-80"
            >
              Entrar
            </Link>
          </div>
          <div className="text-center">
            <Link
              href="/b2b"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              &larr; Voltar para a pagina inicial
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

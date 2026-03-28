import type { Metadata } from "next";
import Link from "next/link";
import { Dumbbell } from "lucide-react";

export const metadata: Metadata = {
  title: "Experimentar Gratis - Conceito Fit",
  description: "Crie uma conta demo e experimente o Conceito Fit gratuitamente.",
};

export default function DemoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gym-accent">
          <Dumbbell className="h-7 w-7 text-background" />
        </div>
        <h1 className="font-display text-2xl font-bold">Conta Demo</h1>
        <p className="text-muted-foreground">
          O fluxo de criacao de conta demo sera implementado em breve.
          Enquanto isso, agende uma demonstracao com nosso time.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/b2b#contato"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gym-accent px-6 font-semibold text-background transition-opacity hover:opacity-90"
          >
            Agendar demonstracao
          </Link>
          <Link
            href="/b2b"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar para a pagina inicial
          </Link>
        </div>
      </div>
    </div>
  );
}

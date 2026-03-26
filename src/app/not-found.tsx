import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card/80 p-8 text-center shadow-lg">
        <div className="mb-6 inline-flex size-16 items-center justify-center rounded-3xl bg-secondary text-gym-accent shadow-sm ring-1 ring-border">
          <FileQuestion className="size-8" />
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tight">Página não encontrada</h2>
        <p className="mx-auto mb-8 max-w-sm text-sm text-muted-foreground">
          O link que você tentou acessar está quebrado, ou a página foi movida para outro endereço.
        </p>
        <Button asChild size="lg" className="gap-2 rounded-full px-8 font-semibold shadow-md">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Voltar para o Início
          </Link>
        </Button>
      </div>
    </div>
  );
}

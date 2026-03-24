import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-secondary text-gym-accent shadow-sm ring-1 ring-border">
        <FileQuestion className="size-8" />
      </div>
      <h2 className="mb-3 text-2xl font-bold tracking-tight">Página não encontrada</h2>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        O link que você tentou acessar está quebrado, ou a página foi movida para outro endereço.
      </p>
      <Button asChild size="lg" className="rounded-full shadow-md font-semibold px-8 gap-2">
        <Link href="/dashboard">
          <ArrowLeft className="size-4" />
          Voltar para o Início
        </Link>
      </Button>
    </div>
  );
}

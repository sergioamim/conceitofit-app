import { Wallet } from "lucide-react";

export default function MeusPagamentosPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
        <Wallet className="size-8 text-gym-accent" />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Meus Pagamentos
      </h1>
      <p className="text-sm text-muted-foreground">
        Seu histórico de pagamentos e faturas aparecerá aqui.
      </p>
    </div>
  );
}

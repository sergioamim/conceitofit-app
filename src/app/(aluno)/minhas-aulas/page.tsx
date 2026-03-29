"use client";

import { CalendarDays } from "lucide-react";

export default function MinhasAulasPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
        <CalendarDays className="size-8 text-gym-accent" />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Minhas Aulas
      </h1>
      <p className="text-sm text-muted-foreground">
        Suas aulas agendadas e disponíveis aparecerão aqui.
      </p>
    </div>
  );
}

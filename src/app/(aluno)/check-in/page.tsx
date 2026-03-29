"use client";

import { QrCode } from "lucide-react";

export default function CheckInPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
        <QrCode className="size-8 text-gym-accent" />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Check-in
      </h1>
      <p className="text-sm text-muted-foreground">
        Faça check-in na academia usando QR Code ou código manual.
      </p>
    </div>
  );
}

"use client";

export function SecuritySectionFeedback({
  loading,
  error,
}: {
  loading: boolean;
  error?: string | null;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Carregando dados de segurança...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
        {error}
      </div>
    );
  }

  return null;
}

export function SecurityEmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export function SecurityContextNote({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

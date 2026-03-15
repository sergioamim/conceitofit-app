"use client";

export function SecuritySectionFeedback({
  loading,
  error,
}: {
  loading: boolean;
  error?: string | null;
}) {
  if (loading) {
    return <p className="text-xs text-muted-foreground">Carregando...</p>;
  }

  if (error) {
    return <p className="text-sm text-gym-danger">{error}</p>;
  }

  return null;
}

export function SecurityEmptyState({ text }: { text: string }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

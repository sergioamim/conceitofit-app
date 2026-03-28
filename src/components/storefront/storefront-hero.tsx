import type { StorefrontTheme } from "@/lib/types";

export function StorefrontHero({
  theme,
  tenantSlug,
}: {
  theme: StorefrontTheme | null;
  tenantSlug: string;
}) {
  const title = theme?.heroTitle || `Bem-vindo à ${tenantSlug}`;
  const subtitle = theme?.heroSubtitle || "Conheça nossos planos e comece sua jornada fitness.";
  const hasImage = Boolean(theme?.heroImageUrl);

  return (
    <section
      className="relative flex min-h-[420px] items-center justify-center overflow-hidden"
      style={
        hasImage
          ? {
              backgroundImage: `url(${theme!.heroImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {/* Overlay */}
      {hasImage && <div className="absolute inset-0 bg-black/60" />}

      {/* Gradient fallback when no image */}
      {!hasImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-gym-accent/10 via-background to-background" />
      )}

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
          {subtitle}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a
            href="#planos"
            className="inline-flex items-center rounded-lg bg-gym-accent px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-gym-accent/90"
          >
            Ver planos
          </a>
          <a
            href="#unidades"
            className="inline-flex items-center rounded-lg border border-border bg-card/80 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
          >
            Unidades
          </a>
        </div>
      </div>
    </section>
  );
}

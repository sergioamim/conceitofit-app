import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Storefront não encontrada",
  robots: { index: false },
};

export default function StorefrontNotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Storefront não encontrada
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço informado não corresponde a nenhuma academia cadastrada.
        </p>
      </div>
    </div>
  );
}

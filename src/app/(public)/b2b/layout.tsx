import type { ReactNode } from "react";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Conceito Fit",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Plataforma completa para gestao de academias: financeiro, matriculas, CRM, treinos, controle de acesso e mais.",
  offers: {
    "@type": "Offer",
    category: "SaaS",
    availability: "https://schema.org/InStock",
  },
  creator: {
    "@type": "Organization",
    name: "Conceito Fit",
    url: "https://conceito.fit",
  },
};

export default function B2BLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {children}
    </>
  );
}

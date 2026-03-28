import type { ReactNode } from "react";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Conceito Fit",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Gym Management Software",
  operatingSystem: "Web",
  description:
    "Plataforma completa para gestao de academias: financeiro, matriculas, CRM, treinos, controle de acesso e mais.",
  url: "https://conceito.fit",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "BRL",
    category: "SaaS",
    availability: "https://schema.org/InStock",
    offerCount: 3,
  },
  creator: {
    "@type": "Organization",
    name: "Conceito Fit",
    url: "https://conceito.fit",
  },
  featureList: [
    "Dashboard em tempo real",
    "Financeiro completo",
    "CRM e funil de vendas",
    "Treinos personalizados",
    "Grade de aulas e reservas",
    "Controle de acesso (catraca)",
    "Site white-label",
    "Multi-unidade e rede",
  ],
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

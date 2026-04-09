import type { ReactNode } from "react";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Conceito Fit",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Gym Management Software",
  operatingSystem: "Web",
  description:
    "Plataforma completa para gestão de academias: financeiro, matrículas, CRM, treinos, controle de acesso e mais. Usado por 500+ academias no Brasil.",
  url: "https://conceito.fit",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "BRL",
    lowPrice: "197",
    highPrice: "697",
    category: "SaaS",
    availability: "https://schema.org/InStock",
    offerCount: 3,
  },
  creator: {
    "@type": "Organization",
    name: "Conceito Fit",
    url: "https://conceito.fit",
    logo: "https://conceito.fit/icon.svg",
  },
  featureList: [
    "Dashboard em tempo real",
    "Financeiro completo com DRE",
    "CRM e funil de vendas",
    "Treinos personalizados",
    "Grade de aulas e reservas",
    "Controle de acesso (catraca)",
    "App do aluno white-label",
    "Multi-unidade e rede",
    "Conformidade LGPD",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "312",
    bestRating: "5",
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

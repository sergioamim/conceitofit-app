import { createTenantLoader } from "@/lib/shared/create-tenant-loader";
import type { Atividade } from "@/lib/types";
import { AtividadesContent } from "./atividades-content";

export default createTenantLoader<Atividade[]>(
  {
    url: "/api/v1/administrativo/atividades",
    query: { apenasAtivas: true },
    passTenantId: true,
    fallbackMessage: "Carregando atividades...",
    logModule: "AtividadesPage",
  },
  AtividadesContent,
);

import { createTenantLoader } from "@/lib/shared/create-tenant-loader";
import type { Servico } from "@/lib/types";
import { ServicosContent } from "./servicos-content";

export default createTenantLoader<Servico[]>(
  {
    url: "/api/v1/comercial/servicos",
    query: { apenasAtivos: false },
    logModule: "ServicosPage",
  },
  ServicosContent,
);

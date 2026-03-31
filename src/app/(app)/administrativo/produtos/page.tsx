import { createTenantLoader } from "@/lib/shared/create-tenant-loader";
import type { Produto } from "@/lib/types";
import { ProdutosContent } from "./produtos-content";

export default createTenantLoader<Produto[]>(
  {
    url: "/api/v1/comercial/produtos",
    query: { apenasAtivos: false },
    logModule: "ProdutosPage",
  },
  ProdutosContent,
);

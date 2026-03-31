import { createTenantLoader } from "@/lib/shared/create-tenant-loader";
import type { TipoContaPagar } from "@/lib/types";
import { TiposContaContent } from "./tipos-conta-content";

export default createTenantLoader<TipoContaPagar[]>(
  {
    url: "/api/v1/gerencial/financeiro/tipos-conta-pagar",
    query: { apenasAtivos: true },
    logModule: "TiposContaPage",
  },
  TiposContaContent,
);

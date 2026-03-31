import { createTenantLoader } from "@/lib/shared/create-tenant-loader";
import type { FormaPagamento } from "@/lib/types";
import { FormasPagamentoContent } from "./formas-pagamento-content";

export default createTenantLoader<FormaPagamento[]>(
  {
    url: "/api/v1/gerencial/financeiro/formas-pagamento",
    query: { apenasAtivas: false },
    logModule: "FormasPagamentoPage",
  },
  FormasPagamentoContent,
);

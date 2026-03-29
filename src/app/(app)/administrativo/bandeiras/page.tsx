import { createTenantLoader } from "@/lib/shared/create-tenant-loader";
import type { BandeiraCartao } from "@/lib/types";
import { BandeirasContent } from "./bandeiras-content";

export default createTenantLoader<BandeiraCartao[]>(
  {
    url: "/api/v1/comercial/bandeiras-cartao",
    query: { apenasAtivas: false },
    logModule: "BandeirasPage",
  },
  BandeirasContent,
);

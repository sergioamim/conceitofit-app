import { createTenantLoader } from "@/lib/shared/create-tenant-loader";
import type { Sala } from "@/lib/types";
import { SalasContent } from "./salas-content";

export default createTenantLoader<Sala[]>(
  {
    url: "/api/v1/administrativo/salas",
    query: { apenasAtivas: false },
    logModule: "SalasPage",
  },
  SalasContent,
);

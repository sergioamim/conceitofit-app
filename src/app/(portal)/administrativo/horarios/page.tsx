import { createTenantLoader } from "@/lib/shared/create-tenant-loader";
import type { HorarioFuncionamento } from "@/lib/types";
import { HorariosContent } from "./horarios-content";

export default createTenantLoader<HorarioFuncionamento[]>(
  {
    url: "/api/v1/administrativo/horarios",
    logModule: "HorariosPage",
  },
  HorariosContent,
);

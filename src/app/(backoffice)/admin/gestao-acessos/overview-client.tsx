"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacOverview } from "@/features/rbac/screens/overview";

const BASE_PATH = "/admin/gestao-acessos";

export function RbacOverviewClient() {
  return (
    <RbacProvider basePath={BASE_PATH} dominio="PLATAFORMA">
      <RbacOverview dominio="PLATAFORMA" />
    </RbacProvider>
  );
}

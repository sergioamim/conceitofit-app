"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogoTab } from "./catalogo-tab";
import { PerfisPadraoTab } from "./perfis-tab";
import { ExcecoesTab } from "./excecoes-tab";
import type { CatalogoFuncionalidade, PerfilPadrao, GlobalAdminReviewBoard } from "@/lib/types";

interface CatalogoContentProps {
  initialCatalogo: CatalogoFuncionalidade[];
  initialPerfis: PerfilPadrao[];
  initialBoard: GlobalAdminReviewBoard;
}

export function CatalogoContent({ initialCatalogo, initialPerfis, initialBoard }: CatalogoContentProps) {
  return (
    <Tabs defaultValue="catalogo" className="space-y-6">
      <TabsList className="bg-secondary">
        <TabsTrigger value="catalogo">Catálogo de funcionalidades</TabsTrigger>
        <TabsTrigger value="perfis">Perfis padrão</TabsTrigger>
        <TabsTrigger value="excecoes">Exceções</TabsTrigger>
      </TabsList>

      <TabsContent value="catalogo">
        <CatalogoTab initialCatalogo={initialCatalogo} />
      </TabsContent>

      <TabsContent value="perfis">
        <PerfisPadraoTab initialPerfis={initialPerfis} />
      </TabsContent>

      <TabsContent value="excecoes">
        <ExcecoesTab initialBoard={initialBoard} />
      </TabsContent>
    </Tabs>
  );
}

"use client";

import { Folder } from "lucide-react";
import { ClienteTabPlaceholder } from "./cliente-tab-placeholder";

/**
 * Aba "Documentos" do cliente (Perfil v3 — Wave 4, AC4.1).
 * Repositório de arquivos por cliente (contratos assinados, termos LGPD,
 * anexos) ainda não está integrado via API.
 */
export function ClienteTabDocumentos() {
  return (
    <ClienteTabPlaceholder
      icon={Folder}
      titulo="Documentos do cliente"
      descricao="Contratos assinados, termos LGPD e anexos do cliente aparecerão aqui quando o repositório de arquivos estiver integrado."
      hint="Storage de documentos pendente"
    />
  );
}

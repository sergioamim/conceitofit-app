"use client";

import { useState } from "react";
import { ApiRequestError } from "@/lib/api/http";
import { migrarClienteParaUnidadeService } from "@/lib/tenant/comercial/runtime";
import type { Aluno, ClienteExclusaoBlockedBy, ClienteMigracaoUnidadeResult } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export type MigrationAuditSummary = {
  auditId?: string;
  tenantOrigemNome?: string;
  tenantDestinoNome?: string;
  message?: string;
};

function parseMigracaoErro(error: unknown): { message: string; blockedBy: ClienteExclusaoBlockedBy[] } {
  if (error instanceof ApiRequestError) {
    let blockedBy: ClienteExclusaoBlockedBy[] = [];
    if (error.responseBody) {
      try {
        const parsed = JSON.parse(error.responseBody) as { blockedBy?: ClienteExclusaoBlockedBy[] };
        if (Array.isArray(parsed.blockedBy)) {
          blockedBy = parsed.blockedBy.filter(
            (item): item is ClienteExclusaoBlockedBy =>
              typeof item?.code === "string" && typeof item?.message === "string",
          );
        }
      } catch { /* ignore parse error */ }
    }
    if (error.status === 403) return { message: "Seu perfil não possui permissão para migrar a unidade-base do cliente.", blockedBy };
    if (error.status === 409) return { message: blockedBy[0]?.message ?? "A migração foi bloqueada pelas regras estruturais do cliente.", blockedBy };
    if (error.status === 422) return { message: "Revise destino e justificativa antes de confirmar a migração.", blockedBy };
  }
  return { message: normalizeErrorMessage(error), blockedBy: [] };
}

export function useClienteMigracao(deps: {
  baseTenantNomeAtual: string;
  opcoesMigracao: { id: string; nome: string }[];
  tenantId: string | undefined;
  setTenant: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}) {
  const [migracaoOpen, setMigracaoOpen] = useState(false);
  const [migracaoTenantDestinoId, setMigracaoTenantDestinoId] = useState("");
  const [migracaoJustificativa, setMigracaoJustificativa] = useState("");
  const [migracaoPreservaContexto, setMigracaoPreservaContexto] = useState(true);
  const [migrandoCliente, setMigrandoCliente] = useState(false);
  const [migracaoErro, setMigracaoErro] = useState("");
  const [migracaoBlockedBy, setMigracaoBlockedBy] = useState<ClienteExclusaoBlockedBy[]>([]);
  const [migracaoResumo, setMigracaoResumo] = useState<MigrationAuditSummary | null>(null);

  function closeMigracaoModal() {
    setMigracaoOpen(false);
    setMigracaoTenantDestinoId("");
    setMigracaoJustificativa("");
    setMigracaoPreservaContexto(true);
    setMigracaoErro("");
    setMigracaoBlockedBy([]);
  }

  function openMigracao() {
    setMigracaoErro("");
    setMigracaoBlockedBy([]);
    setMigracaoTenantDestinoId(deps.opcoesMigracao[0]?.id ?? "");
    setMigracaoJustificativa("");
    setMigracaoPreservaContexto(true);
    setMigracaoOpen(true);
  }

  async function handleMigracao(aluno: Aluno) {
    if (!migracaoTenantDestinoId) {
      setMigracaoErro("Selecione a unidade destino.");
      return;
    }
    const justificativa = migracaoJustificativa.trim();
    if (!justificativa) {
      setMigracaoErro("Justificativa é obrigatória.");
      return;
    }
    setMigrandoCliente(true);
    setMigracaoErro("");
    try {
      const result: ClienteMigracaoUnidadeResult = await migrarClienteParaUnidadeService({
        tenantId: aluno.tenantId,
        id: aluno.id,
        tenantDestinoId: migracaoTenantDestinoId,
        justificativa,
        preservarContextoComercial: migracaoPreservaContexto,
      });
      setMigracaoResumo({
        auditId: result.auditId,
        tenantOrigemNome: result.tenantOrigemNome ?? deps.baseTenantNomeAtual,
        tenantDestinoNome:
          result.tenantDestinoNome
          ?? deps.opcoesMigracao.find((t) => t.id === migracaoTenantDestinoId)?.nome,
        message: result.message,
      });
      closeMigracaoModal();
      if (result.suggestedActiveTenantId && result.suggestedActiveTenantId !== deps.tenantId) {
        await deps.setTenant(result.suggestedActiveTenantId);
      }
      await deps.reload();
    } catch (error) {
      const parsed = parseMigracaoErro(error);
      setMigracaoErro(parsed.message);
      setMigracaoBlockedBy(parsed.blockedBy);
    } finally {
      setMigrandoCliente(false);
    }
  }

  return {
    migracaoOpen, setMigracaoOpen,
    migracaoTenantDestinoId, setMigracaoTenantDestinoId,
    migracaoJustificativa, setMigracaoJustificativa,
    migracaoPreservaContexto, setMigracaoPreservaContexto,
    migrandoCliente,
    migracaoErro, setMigracaoErro,
    migracaoBlockedBy, setMigracaoBlockedBy,
    migracaoResumo,
    closeMigracaoModal,
    openMigracao,
    handleMigracao,
  };
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError } from "@/lib/api/http";
import { excluirAlunoService } from "@/lib/tenant/comercial/runtime";
import type { Aluno, ClienteExclusaoBlockedBy } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

function parseExcluirErro(error: unknown): { message: string; blockedBy: ClienteExclusaoBlockedBy[] } {
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
    if (error.status === 403) return { message: "Seu perfil não possui permissão para excluir clientes.", blockedBy };
    if (error.status === 409) return { message: blockedBy[0]?.message ?? "O cliente possui dependências que impedem a exclusão.", blockedBy };
    if (error.status === 422) return { message: "Informe uma justificativa válida para excluir o cliente.", blockedBy };
  }
  return { message: normalizeErrorMessage(error), blockedBy: [] };
}

export function useClienteExclusao() {
  const router = useRouter();
  const [excluirOpen, setExcluirOpen] = useState(false);
  const [excluirJustificativa, setExcluirJustificativa] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [excluirErro, setExcluirErro] = useState("");
  const [excluirBlockedBy, setExcluirBlockedBy] = useState<ClienteExclusaoBlockedBy[]>([]);

  function closeExcluirModal() {
    setExcluirOpen(false);
    setExcluirJustificativa("");
    setExcluirErro("");
    setExcluirBlockedBy([]);
  }

  function openExcluir() {
    setExcluirErro("");
    setExcluirBlockedBy([]);
    setExcluirJustificativa("");
    setExcluirOpen(true);
  }

  async function handleExcluir(aluno: Aluno) {
    const justificativa = excluirJustificativa.trim();
    if (!justificativa) {
      setExcluirErro("Justificativa é obrigatória.");
      return;
    }
    setExcluindo(true);
    setExcluirErro("");
    try {
      await excluirAlunoService({
        tenantId: aluno.tenantId,
        id: aluno.id,
        justificativa,
        issuedBy: "frontend",
      });
      closeExcluirModal();
      router.push("/clientes?deleted=1");
    } catch (error) {
      const parsed = parseExcluirErro(error);
      setExcluirErro(parsed.message);
      setExcluirBlockedBy(parsed.blockedBy);
    } finally {
      setExcluindo(false);
    }
  }

  return {
    excluirOpen, setExcluirOpen,
    excluirJustificativa, setExcluirJustificativa,
    excluindo,
    excluirErro, setExcluirErro,
    excluirBlockedBy, setExcluirBlockedBy,
    closeExcluirModal,
    openExcluir,
    handleExcluir,
  };
}

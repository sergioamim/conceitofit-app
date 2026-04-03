"use client";

import { useState } from "react";
import { liberarAcessoCatracaService } from "@/lib/tenant/comercial/runtime";
import type { Aluno } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export function useClienteLiberarAcesso() {
  const [liberarAcessoOpen, setLiberarAcessoOpen] = useState(false);
  const [liberarAcessoJustificativa, setLiberarAcessoJustificativa] = useState("");
  const [liberandoAcesso, setLiberandoAcesso] = useState(false);
  const [liberarAcessoErro, setLiberarAcessoErro] = useState("");
  const [liberarAcessoInfo, setLiberarAcessoInfo] = useState<string | null>(null);

  function openLiberarAcesso() {
    setLiberarAcessoErro("");
    setLiberarAcessoInfo(null);
    setLiberarAcessoJustificativa("");
    setLiberarAcessoOpen(true);
  }

  async function handleLiberarAcesso(aluno: Aluno) {
    const reason = liberarAcessoJustificativa.trim();
    if (!reason) {
      setLiberarAcessoErro("Justificativa é obrigatória.");
      return;
    }
    setLiberarAcessoErro("");
    setLiberandoAcesso(true);
    try {
      const requestId = await liberarAcessoCatracaService({
        tenantId: aluno.tenantId,
        alunoId: aluno.id,
        justificativa: reason,
        issuedBy: "frontend",
      });
      setLiberarAcessoOpen(false);
      setLiberarAcessoJustificativa("");
      setLiberarAcessoInfo(`Comando de liberação enviado com sucesso (requestId: ${requestId}).`);
    } catch (error) {
      setLiberarAcessoErro(normalizeErrorMessage(error));
    } finally {
      setLiberandoAcesso(false);
    }
  }

  return {
    liberarAcessoOpen, setLiberarAcessoOpen,
    liberarAcessoJustificativa, setLiberarAcessoJustificativa,
    liberandoAcesso,
    liberarAcessoErro, setLiberarAcessoErro,
    liberarAcessoInfo, setLiberarAcessoInfo,
    openLiberarAcesso,
    handleLiberarAcesso,
  };
}

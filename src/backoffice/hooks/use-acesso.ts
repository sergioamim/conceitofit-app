"use client";

import { useCallback, useEffect, useState } from "react";
import { obterMeuAcesso, type MeuAcessoResponse } from "@/lib/api/gestao-acessos";

/**
 * Mapeamento de rota do menu → capacidade(s) e/ou feature module requerido.
 * Se a rota não está aqui, é mostrada pra todo mundo (sem filtro).
 */
const ROUTE_REQUIREMENTS: Record<string, { capacidades?: string[]; feature?: string }> = {
  // Caixa
  "/admin/caixas": { capacidades: ["caixa.dashboard"] },
  // CRM
  "/admin/crm": { feature: "crm" },
  // WhatsApp
  "/admin/whatsapp": { feature: "whatsapp" },
  // NFS-e
  "/admin/nfse": { feature: "nfse" },
  // Catraca
  "/admin/catraca": { feature: "catraca" },
  // Configurações de operadores
  "/admin/gestao-acessos/perfis": { capacidades: ["config.perfis"] },
  "/admin/gestao-acessos/operadores": { capacidades: ["config.operadores"] },
  // Segurança (antiga)
  "/admin/seguranca": { capacidades: ["config.academia"] },
  // Plataforma (só PLATAFORMA vê — bypass garante)
  "/admin/plataforma/features": { capacidades: ["tenant.feature.gerenciar"] },
  "/admin/plataforma/planos": { capacidades: ["plano.gerenciar"] },
  "/admin/plataforma/grupos": { capacidades: ["grupo.gerenciar"] },
  // Importação
  "/admin/importacao-evo": { capacidades: ["importacao.executar"] },
  "/admin/importacao-evo-p0": { capacidades: ["importacao.executar"] },
};

interface AcessoState {
  loaded: boolean;
  bypass: boolean;
  userKind: string;
  capacidades: Set<string>;
  featuresHabilitadas: Set<string>;
  featuresDesabilitadasGlobal: Set<string>;
  perfilNome: string | null;
}

const INITIAL_STATE: AcessoState = {
  loaded: false,
  bypass: false,
  userKind: "OPERADOR",
  capacidades: new Set(),
  featuresHabilitadas: new Set(),
  featuresDesabilitadasGlobal: new Set(),
  perfilNome: null,
};

/**
 * Hook que carrega as capacidades e features do user logado.
 * Usado pela sidebar pra filtrar menu dinamicamente.
 */
export function useAcesso() {
  const [state, setState] = useState<AcessoState>(INITIAL_STATE);

  const reload = useCallback(async () => {
    try {
      const data = await obterMeuAcesso();
      setState({
        loaded: true,
        bypass: data.bypass,
        userKind: data.userKind,
        capacidades: new Set(data.capacidades),
        featuresHabilitadas: new Set(data.featuresHabilitadas),
        featuresDesabilitadasGlobal: new Set(data.featuresDesabilitadasGlobal),
        perfilNome: data.perfilNome,
      });
    } catch {
      // Se falhar (user sem perfil, endpoint não existe em prod antiga), mostra tudo
      setState({
        ...INITIAL_STATE,
        loaded: true,
        bypass: true, // fallback: mostra tudo
      });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /**
   * Verifica se o user pode ver uma rota do menu.
   * - PLATAFORMA (bypass=true): sempre true, mesmo features OFF global
   * - OPERADOR: verifica capacidades + features
   * - Rota sem requisito: sempre visível
   */
  function podeVerRota(href: string): boolean {
    if (!state.loaded) return false; // não renderiza antes de carregar
    if (state.bypass) return true;   // PLATAFORMA vê tudo

    const req = ROUTE_REQUIREMENTS[href];
    if (!req) return true; // sem requisito = visível pra todos

    // Feature module check
    if (req.feature && !state.featuresHabilitadas.has(req.feature)) {
      return false;
    }

    // Capacidade check (qualquer uma basta)
    if (req.capacidades && req.capacidades.length > 0) {
      return req.capacidades.some((cap) => state.capacidades.has(cap));
    }

    return true;
  }

  /**
   * Feature está desabilitada globalmente? (pra mostrar badge "Preview" pro PLATAFORMA)
   */
  function isDesabilitadaGlobal(featureKey: string): boolean {
    return state.featuresDesabilitadasGlobal.has(featureKey);
  }

  return {
    ...state,
    podeVerRota,
    isDesabilitadaGlobal,
    reload,
  };
}

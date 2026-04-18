"use client";

import { useCallback, useEffect, useState } from "react";
import { obterMeuAcesso, type MeuAcessoResponse } from "@/lib/api/gestao-acessos";

/**
 * Mapeamento de rota do menu → feature module requerido.
 *
 * APENAS features de módulos add-on (CRM, WhatsApp, NFS-e, Catraca).
 * Se o tenant não tem o módulo habilitado E o user não tem bypass,
 * a rota some do menu.
 *
 * Rotas sem mapeamento aqui = sempre visíveis (protegidas por auth genérico).
 * Capacidades granulares (quem pode cada ação) serão implementadas
 * nos endpoints/telas individualmente, não no menu.
 */
const ROUTE_REQUIREMENTS: Record<string, { feature?: string }> = {
  "/admin/crm": { feature: "crm" },
  "/admin/whatsapp": { feature: "whatsapp" },
  "/admin/nfse": { feature: "nfse" },
  "/admin/catraca": { feature: "catraca" },
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
    if (!state.loaded) return true;  // antes de carregar: mostra tudo (não esconder menu enquanto loading)
    if (state.bypass) return true;   // PLATAFORMA/SUPER_ADMIN vê tudo

    const req = ROUTE_REQUIREMENTS[href];
    if (!req) return true; // sem requisito = visível pra todos

    // Feature module check — esconde rota se módulo desabilitado pro tenant
    if (req.feature && !state.featuresHabilitadas.has(req.feature)) {
      return false;
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

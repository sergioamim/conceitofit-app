/**
 * API client para funcionalidades de IA do atendimento (Task #542).
 * Consome AiConversationController do backend Java:
 * /api/v1/atendimento/conversas/{conversationId}/ai/*
 *
 * Endpoints disponíveis no BE:
 *   POST /resumir              - Resumo da conversa
 *   POST /sugerir-resposta     - Sugestão de resposta à última mensagem
 *   POST /classificar-intencao - Classifica intenção da mensagem
 *   POST /proxima-acao         - Sugere próximas ações operacionais
 *   POST /sugerir-roteamento   - Sugere fila/departamento para roteamento
 */
import { apiRequest } from "./http";

export interface ResumoConversaResult {
  conversationId: string;
  resumo: string;
  totalMensagens: number;
  geradoComSucesso?: boolean;
}

export interface SugestaoRespostaResult {
  conversationId: string;
  sugestao: string;
  confianca: number;
  geradoComSucesso: boolean;
}

export interface ClassificacaoIntencaoResult {
  intencao: string;
  confianca: number;
  todasIntencoes?: Record<string, number>;
  geradoComSucesso: boolean;
}

export interface AcaoSugerida {
  acao: string;
  descricao: string;
  relevancia: number;
  metadados?: Record<string, unknown>;
}

export interface ProximaAcaoResult {
  conversationId: string;
  acoes: AcaoSugerida[];
  geradoComSucesso: boolean;
}

export interface SugestaoRoteamentoResult {
  conversationId: string;
  filaSugerida?: string;
  departamentoSugerido?: string;
  confianca: number;
  geradoComSucesso: boolean;
  motivo?: string;
}

function basePath(conversationId: string): string {
  return `/api/v1/atendimento/conversas/${conversationId}/ai`;
}

export async function resumirConversaAiApi(input: {
  conversationId: string;
}): Promise<ResumoConversaResult> {
  return apiRequest<ResumoConversaResult>({
    path: `${basePath(input.conversationId)}/resumir`,
    method: "POST",
  });
}

export async function sugerirRespostaAiApi(input: {
  conversationId: string;
  ultimaMensagem?: string;
}): Promise<SugestaoRespostaResult> {
  return apiRequest<SugestaoRespostaResult>({
    path: `${basePath(input.conversationId)}/sugerir-resposta`,
    method: "POST",
    body: input.ultimaMensagem ? { ultimaMensagem: input.ultimaMensagem } : undefined,
  });
}

export async function classificarIntencaoAiApi(input: {
  conversationId: string;
  mensagem: string;
}): Promise<ClassificacaoIntencaoResult> {
  return apiRequest<ClassificacaoIntencaoResult>({
    path: `${basePath(input.conversationId)}/classificar-intencao`,
    method: "POST",
    body: { mensagem: input.mensagem },
  });
}

export async function proximaAcaoAiApi(input: {
  conversationId: string;
}): Promise<ProximaAcaoResult> {
  return apiRequest<ProximaAcaoResult>({
    path: `${basePath(input.conversationId)}/proxima-acao`,
    method: "POST",
  });
}

export async function sugerirRoteamentoAiApi(input: {
  conversationId: string;
}): Promise<SugestaoRoteamentoResult> {
  return apiRequest<SugestaoRoteamentoResult>({
    path: `${basePath(input.conversationId)}/sugerir-roteamento`,
    method: "POST",
  });
}

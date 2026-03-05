import { apiRequest } from "./http";

export interface BotPromptResponse {
  prompt: string;
  generatedAt?: string;
}

export async function getBotPromptApi(input?: { tenantId?: string }): Promise<BotPromptResponse> {
  return apiRequest<BotPromptResponse>({
    path: "/api/v1/bot/prompt",
    query: { tenantId: input?.tenantId },
  });
}

export async function getBotPromptTemplateApi(): Promise<string> {
  return apiRequest<string>({
    path: "/api/v1/bot/prompt/template",
  });
}

/**
 * Push Notification Registration — servico silencioso.
 *
 * Roda no mount do layout cliente. Registra o device token no backend
 * quando push notifications sao suportadas e o usuario concedeu permissao.
 * Remove o token no unmount / logout.
 */

import {
  registrarDeviceTokenApi,
  removerDeviceTokenApi,
} from "@/lib/api/app-cliente";

const STORAGE_KEY = "push-device-token";

function getPlatform(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "web";
}

function getDeviceInfo(): Record<string, string> {
  if (typeof navigator === "undefined") return {};
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
  };
}

/**
 * Tenta registrar o device token para push notifications.
 * Silenciosamente ignora erros — push e opcional.
 */
export async function registerPushToken(tenantId: string): Promise<void> {
  try {
    // Verifica suporte
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    // Verifica permissao (nao solicita — apenas usa se ja concedida)
    if (Notification.permission !== "granted") {
      return;
    }

    // Verifica se ja registrou nesta sessao
    const existingToken = sessionStorage.getItem(STORAGE_KEY);
    if (existingToken) return;

    // Obtem service worker registration
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return;

    const token = JSON.stringify(subscription.toJSON());

    await registrarDeviceTokenApi({
      tenantId,
      token,
      plataforma: getPlatform(),
      deviceInfo: getDeviceInfo(),
    });

    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Silenciosamente ignora — push e opcional
  }
}

/**
 * Remove o device token registrado.
 * Chamado no unmount do layout ou logout.
 */
export async function unregisterPushToken(tenantId: string): Promise<void> {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY);
    if (!token) return;

    await removerDeviceTokenApi({ tenantId, token });
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silenciosamente ignora
  }
}

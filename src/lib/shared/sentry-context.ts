import * as Sentry from "@sentry/nextjs";

/**
 * Atualiza o contexto do Sentry com informações do tenant e usuário.
 * Deve ser chamado quando o contexto do tenant muda (login, tenant switch).
 */
export function setSentryUserContext(params: {
  userId?: string;
  email?: string;
  displayName?: string;
  tenantId?: string;
  tenantName?: string;
  networkId?: string;
  networkSubdomain?: string;
}) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.setUser(
    params.userId
      ? {
          id: params.userId,
          email: params.email,
          username: params.displayName,
        }
      : null,
  );

  Sentry.setTags({
    tenantId: params.tenantId ?? "",
    tenantName: params.tenantName ?? "",
    networkId: params.networkId ?? "",
    networkSubdomain: params.networkSubdomain ?? "",
  });
}

/**
 * Limpa o contexto do Sentry (logout).
 */
export function clearSentryContext() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.setUser(null);
  Sentry.setTags({
    tenantId: "",
    tenantName: "",
    networkId: "",
    networkSubdomain: "",
  });
}

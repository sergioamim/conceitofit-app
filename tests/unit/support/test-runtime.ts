type MockFetchCall = {
  url: string;
  method: string;
  headers: Headers;
  body?: string | null;
};

type MockFetchResponse =
  | Response
  | {
      body: unknown;
      status?: number;
      headers?: HeadersInit;
    }
  | ((call: MockFetchCall) => Response | Promise<Response>);

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

/**
 * Cookie jar realista para o mock browser. Em browser real, `document.cookie`
 * é um setter que *acumula* (não sobrescreve) — cada atribuição adiciona um
 * par `name=value` e a leitura retorna o documento inteiro. Essa classe
 * simula esse comportamento para testes unit de módulos que fazem
 * `document.cookie = "name=..."` múltiplas vezes.
 */
class MockCookieJar {
  private readonly store = new Map<string, string>();

  toString(): string {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  /** Processa uma atribuição `name=value; Path=/; Max-Age=0` no mesmo formato
   *  que o browser espera. Atributos `Max-Age<=0` ou `Expires` no passado
   *  removem a entrada. */
  assign(input: string): void {
    const [head, ...attrs] = input.split(";").map((part) => part.trim());
    if (!head) return;
    const eq = head.indexOf("=");
    if (eq < 0) return;
    const name = head.slice(0, eq).trim();
    if (!name) return;
    const value = head.slice(eq + 1);
    const removing = attrs.some((attr) => {
      const lower = attr.toLowerCase();
      if (lower.startsWith("max-age=")) {
        const age = Number(lower.slice("max-age=".length).trim());
        return Number.isFinite(age) && age <= 0;
      }
      if (lower.startsWith("expires=")) {
        const when = new Date(attr.slice("expires=".length).trim()).getTime();
        return Number.isFinite(when) && when <= Date.now();
      }
      return false;
    });
    if (removing) {
      this.store.delete(name);
      return;
    }
    this.store.set(name, value);
  }

  clear(): void {
    this.store.clear();
  }
}

export function installMockBrowser() {
  const globalRef = globalThis as typeof globalThis & {
    window?: Window & typeof globalThis;
    document?: Document;
  };
  const previousWindow = globalRef.window;
  const previousDocument = globalRef.document;
  const target = new EventTarget();
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const cookieJar = new MockCookieJar();

  const documentRef = {} as Document;
  Object.defineProperty(documentRef, "cookie", {
    configurable: true,
    get(): string {
      return cookieJar.toString();
    },
    set(assignment: string) {
      cookieJar.assign(assignment);
    },
  });

  globalRef.window = {
    localStorage,
    sessionStorage,
    location: { protocol: "https:" } as Location,
    document: documentRef,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
  } as unknown as Window & typeof globalThis;
  globalRef.document = documentRef;

  return {
    localStorage,
    sessionStorage,
    cookieJar,
    restore() {
      if (previousDocument === undefined) {
        Reflect.deleteProperty(globalRef, "document");
      } else {
        globalRef.document = previousDocument;
      }
      if (previousWindow === undefined) {
        Reflect.deleteProperty(globalRef, "window");
        return;
      }
      globalRef.window = previousWindow;
    },
  };
}

/**
 * Semeia cookies de sessão no mock browser — substituto para `saveAuthSession`
 * nos testes após a migração Task 458 (cookies HttpOnly setados pelo backend).
 *
 * Escreve os mesmos cookies que o backend setaria via `Set-Cookie`:
 *   - `fc_access_token`, `fc_refresh_token` quando fornecidos
 *   - `fc_session_active=true` quando há token
 *   - `fc_session_claims` com o JSON serializado dos claims fornecidos
 *
 * Tests que usam esse helper passam a validar o comportamento pós-Task 458
 * (sem localStorage e sem header Authorization quando o backend emite cookies
 * HttpOnly) e mantêm os getters de sessão funcionando.
 */
export interface SeedTestSessionInput {
  token?: string;
  refreshToken?: string;
  userId?: string;
  userKind?: string;
  displayName?: string;
  networkId?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  networkName?: string;
  activeTenantId?: string;
  baseTenantId?: string;
  availableScopes?: string[];
  broadAccess?: boolean;
  forcePasswordChangeRequired?: boolean;
  sessionMode?: string;
  contextOrigin?: string;
}

export function seedTestSession(input: SeedTestSessionInput): void {
  const doc = (globalThis as { document?: Document }).document;
  if (!doc) {
    throw new Error("seedTestSession requires installMockBrowser() to be called first");
  }
  if (input.token) {
    doc.cookie = `fc_access_token=${encodeURIComponent(input.token)}; Path=/; SameSite=Lax`;
    doc.cookie = `fc_session_active=true; Path=/; SameSite=Lax`;
  }
  if (input.refreshToken) {
    doc.cookie = `fc_refresh_token=${encodeURIComponent(input.refreshToken)}; Path=/; SameSite=Lax`;
  }
  const claims: Record<string, unknown> = {};
  const assignIfDefined = (key: string, value: unknown) => {
    if (value !== undefined) claims[key] = value;
  };
  assignIfDefined("userId", input.userId);
  assignIfDefined("userKind", input.userKind);
  assignIfDefined("displayName", input.displayName);
  assignIfDefined("networkId", input.networkId);
  assignIfDefined("networkSubdomain", input.networkSubdomain);
  assignIfDefined("networkSlug", input.networkSlug);
  assignIfDefined("networkName", input.networkName);
  assignIfDefined("activeTenantId", input.activeTenantId);
  assignIfDefined("baseTenantId", input.baseTenantId);
  assignIfDefined("availableScopes", input.availableScopes);
  assignIfDefined("broadAccess", input.broadAccess);
  assignIfDefined("forcePasswordChangeRequired", input.forcePasswordChangeRequired);
  assignIfDefined("sessionMode", input.sessionMode);
  assignIfDefined("contextOrigin", input.contextOrigin);
  if (Object.keys(claims).length > 0) {
    doc.cookie = `fc_session_claims=${encodeURIComponent(JSON.stringify(claims))}; Path=/; SameSite=Lax`;
  }
}

/** Limpa todos os cookies de sessão no mock (equivalente ao `Set-Cookie` de logout do backend). */
export function clearTestSession(): void {
  const doc = (globalThis as { document?: Document }).document;
  if (!doc) return;
  const expire = "Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  for (const name of ["fc_access_token", "fc_refresh_token", "fc_session_active", "fc_session_claims"]) {
    doc.cookie = `${name}=; ${expire}`;
  }
}

export function mockFetchWithSequence(responses: MockFetchResponse[]) {
  const calls: MockFetchCall[] = [];
  const previousFetch = global.fetch;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: MockFetchCall = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: init?.body ? String(init.body) : null,
    };
    calls.push(call);

    const next = responses[calls.length - 1];
    if (!next) {
      throw new Error(`Unexpected fetch ${call.method} ${call.url}`);
    }

    if (next instanceof Response) {
      return next;
    }

    if (typeof next === "function") {
      return next(call);
    }

    return new Response(JSON.stringify(next.body), {
      status: next.status ?? 200,
      headers: {
        "Content-Type": "application/json",
        ...(next.headers ?? {}),
      },
    });
  }) as typeof global.fetch;

  return {
    calls,
    restore() {
      global.fetch = previousFetch;
    },
  };
}

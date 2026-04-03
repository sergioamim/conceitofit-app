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
  const documentRef = { cookie: "" } as Document;

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

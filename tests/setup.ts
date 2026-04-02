import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";
import * as matchers from "vitest-axe/matchers";

expect.extend(matchers);

// Cleanup DOM between tests (happy-dom does not auto-cleanup)
afterEach(() => {
  cleanup();
});

// Node 22+ ships a native `localStorage` that is a limited Proxy.
// happy-dom/jsdom provide their own, but the native one can shadow it.
// Ensure `window.localStorage` has the full Storage API.
if (typeof window !== "undefined") {
  const happyDomWindow = window as Window & {
    happyDOM?: {
      settings: {
        disableCSSFileLoading: boolean;
        disableIframePageLoading: boolean;
        disableJavaScriptFileLoading: boolean;
      };
    };
  };
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
  Object.defineProperty(window, "localStorage", {
    value: storage,
    writable: true,
    configurable: true,
  });

  // Avoid resource fetches triggered by DOM nodes such as <link> and <iframe>.
  happyDomWindow.happyDOM!.settings.disableCSSFileLoading = true;
  happyDomWindow.happyDOM!.settings.disableIframePageLoading = true;
  happyDomWindow.happyDOM!.settings.disableJavaScriptFileLoading = true;
}

const TEST_FETCH_RESPONSE_HEADERS = { "content-type": "application/json" };

function resolveFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function shouldMockExternalFetch(url: string): boolean {
  if (!url) return false;

  if (url.startsWith("/")) return true;

  try {
    const parsed = new URL(url, "http://localhost:3000");
    return ["localhost", "127.0.0.1", "::1", "evil.com"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

async function defaultTestFetch(input: RequestInfo | URL): Promise<Response> {
  const url = resolveFetchUrl(input);

  if (shouldMockExternalFetch(url)) {
    if (url.endsWith(".css")) {
      return new Response("", {
        status: 200,
        headers: { "content-type": "text/css" },
      });
    }

    return new Response("{}", {
      status: 200,
      headers: TEST_FETCH_RESPONSE_HEADERS,
    });
  }

  throw new Error(`Unexpected external fetch in test environment: ${url}`);
}

Object.defineProperty(globalThis, "fetch", {
  value: defaultTestFetch,
  writable: true,
  configurable: true,
});

if (typeof window !== "undefined") {
  Object.defineProperty(window, "fetch", {
    value: defaultTestFetch,
    writable: true,
    configurable: true,
  });
}

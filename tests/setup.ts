import "@testing-library/jest-dom/vitest";

// Node 22+ ships a native `localStorage` that is a limited Proxy.
// happy-dom/jsdom provide their own, but the native one can shadow it.
// Ensure `window.localStorage` has the full Storage API.
if (typeof window !== "undefined") {
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
}

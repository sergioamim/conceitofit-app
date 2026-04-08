const STORAGE_KEY = "idempotency_keys_atendimento";
const TTL_MS = 30_000;

interface StoredKey {
  key: string;
  createdAt: number;
}

type KeyMap = Record<string, StoredKey>;

function loadKeys(): KeyMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as KeyMap) : {};
  } catch {
    return {};
  }
}

function saveKeys(keys: KeyMap) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // sessionStorage full or unavailable
  }
}

export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

class IdempotencyKeyStoreImpl {
  private static instance: IdempotencyKeyStoreImpl;

  static getInstance(): IdempotencyKeyStoreImpl {
    if (!IdempotencyKeyStoreImpl.instance) {
      IdempotencyKeyStoreImpl.instance = new IdempotencyKeyStoreImpl();
    }
    return IdempotencyKeyStoreImpl.instance;
  }

  acquireKey(operationId: string): string {
    const keys = loadKeys();
    this.cleanupExpired(keys);

    const existing = keys[operationId];
    if (existing && Date.now() - existing.createdAt < TTL_MS) {
      return existing.key;
    }

    const key = generateIdempotencyKey();
    keys[operationId] = { key, createdAt: Date.now() };
    saveKeys(keys);
    return key;
  }

  releaseKey(operationId: string): void {
    const keys = loadKeys();
    delete keys[operationId];
    saveKeys(keys);
  }

  cleanup(): void {
    const keys = loadKeys();
    this.cleanupExpired(keys);
    saveKeys(keys);
  }

  private cleanupExpired(keys: KeyMap): void {
    const now = Date.now();
    for (const id of Object.keys(keys)) {
      if (now - keys[id].createdAt > TTL_MS) {
        delete keys[id];
      }
    }
  }
}

export const IdempotencyKeyStore = IdempotencyKeyStoreImpl.getInstance();

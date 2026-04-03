# Padrão RSC – React Server Components

Guia de uso de Server Components e Client Components no projeto Academia App.

## Arquitetura

```
Browser ──▶ Next.js (App Router) ──▶ Backend Java
                │
                ├─ Server Component  → fetch direto via BACKEND_PROXY_TARGET
                └─ Client Component  → fetch via /backend/* rewrite (http.ts)
```

| Camada | Onde roda | Acesso ao backend | Helper |
|--------|-----------|-------------------|--------|
| Server Component | Node.js (build/request time) | `BACKEND_PROXY_TARGET` direto | `serverFetch()` em `src/lib/shared/server-fetch.ts` |
| Client Component | Browser | `/backend/*` rewrite do Next.js | `apiRequest()` em `src/lib/api/http.ts` |

## Quando usar cada um

### Server Component (padrão no App Router)

Use quando a página:
- Apenas exibe dados (sem interatividade)
- Precisa de SEO / streaming
- Não usa hooks (`useState`, `useEffect`, `usePathname`, etc.)

### Client Component (`"use client"`)

Use quando a página:
- Tem formulários, modais, filtros interativos
- Usa hooks do React ou do Next.js (`useRouter`, `useSearchParams`)
- Precisa de estado local ou event handlers

## Padrão recomendado: Server Component + Client Islands

Mantenha a **page** como Server Component e extraia a interatividade para **Client Components filhos**.

```
app/(portal)/exemplo/page.tsx        ← Server Component (fetch de dados)
  └─ components/exemplo-table.tsx ← Client Component (tabela interativa)
```

### Exemplo prático

#### 1. Page (Server Component)

```tsx
// app/(portal)/exemplo/page.tsx
// SEM "use client" – é Server Component por padrão

import { serverFetch } from "@/lib/shared/server-fetch";
import type { Aluno } from "@/lib/shared/types";
import { ExemploTable } from "./components/exemplo-table";

export default async function ExemploPage() {
  const alunos = await serverFetch<Aluno[]>("/api/v1/alunos", {
    tenantId: "550e8400-e29b-41d4-a716-446655440000",
    next: { revalidate: 60 },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-white">Alunos</h1>
      {/* Client island recebe dados como props */}
      <ExemploTable alunos={alunos} />
    </div>
  );
}
```

#### 2. Client Island (Client Component)

```tsx
// app/(portal)/exemplo/components/exemplo-table.tsx
"use client";

import { useState } from "react";
import type { Aluno } from "@/lib/shared/types";

interface Props {
  alunos: Aluno[];
}

export function ExemploTable({ alunos }: Props) {
  const [search, setSearch] = useState("");

  const filtered = alunos.filter((a) =>
    a.nomeCompleto.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar aluno..."
        className="rounded-md bg-surface2 px-3 py-2 text-white"
      />
      <ul className="mt-4 space-y-2">
        {filtered.map((a) => (
          <li key={a.id} className="text-gray-300">{a.nomeCompleto}</li>
        ))}
      </ul>
    </div>
  );
}
```

## `serverFetch` – API

```ts
import { serverFetch } from "@/lib/shared/server-fetch";

const data = await serverFetch<T>(path, options?);
```

### Parâmetros

| Param | Tipo | Descrição |
|-------|------|-----------|
| `path` | `string` | Caminho da API (ex: `/api/v1/alunos`) |
| `options.query` | `Record<string, string \| number \| boolean>` | Query params |
| `options.method` | `string` | HTTP method (default `GET`) |
| `options.body` | `unknown` | JSON body |
| `options.tenantId` | `string` | Adicionado como query param `tenantId` |
| `options.next` | `NextFetchRequestConfig` | Cache/revalidate do Next.js |
| `options.headers` | `Record<string, string>` | Headers extras |

### Comportamento

- Resolve URL usando `BACKEND_PROXY_TARGET` (env, default `http://localhost:8080`)
- Injeta `Authorization: Bearer <token>` a partir do cookie `academia-access-token`
- Lança `ServerFetchRequestError` em caso de erro HTTP
- Retorna `undefined` para `204 No Content`

## Regras do projeto

1. **Novas páginas read-only** devem ser Server Components usando `serverFetch`.
2. **Páginas interativas** continuam como Client Components usando `apiRequest` de `http.ts`.
3. **Migração gradual** – não é necessário converter páginas existentes.
4. Para **streaming/Suspense**, envolva o fetch em um componente async e use `<Suspense>` no layout ou page pai.

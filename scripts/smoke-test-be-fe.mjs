#!/usr/bin/env node

/**
 * Smoke test BE↔FE — Task #552 (Wave 0.3 de saneamento)
 *
 * Extrai todos os endpoints consumidos por src/lib/api/*.ts via TypeScript AST
 * e opcionalmente bate contra o backend em staging (BACKEND_PROXY_TARGET)
 * gerando uma matriz endpoint→status em docs/SMOKE_TEST_BE_FE_MATRIX.md.
 *
 * Serve como exit-gate das Waves 1-4: antes de começar uma task que depende
 * de endpoints específicos, rodar este script e garantir que eles respondem
 * 2xx no ambiente alvo.
 *
 * Filtra GET por padrão para evitar side effects em staging. Endpoints com
 * path params dinâmicos ({id}, ${foo}) são reportados mas não executados
 * (precisariam de fixture de dados).
 *
 * Usage:
 *
 *   node scripts/smoke-test-be-fe.mjs --dry-run
 *     Só lista os endpoints extraídos, não chama nenhum (usar sem rede)
 *
 *   BACKEND_PROXY_TARGET=https://staging.example.com \
 *   SMOKE_TENANT_ID=550e8400-... \
 *   SMOKE_AUTH_TOKEN=eyJhbGciOi... \
 *   node scripts/smoke-test-be-fe.mjs
 *     Bate em cada endpoint GET estático e gera a matriz
 *
 *   node scripts/smoke-test-be-fe.mjs --filter=dashboard
 *     Roda só os endpoints cujo path contém "dashboard"
 *
 *   node scripts/smoke-test-be-fe.mjs --out=docs/SMOKE_TEST_BE_FE_MATRIX.md
 *     Salva a matriz no arquivo especificado (default: stdout)
 *
 * @see docs/adr/ADR-001-modulos-fe-fantasma.md
 * @see docs/API_AUDIT_BACKEND_VS_FRONTEND.md
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";

const require = createRequire(import.meta.url);
const ts = require("typescript");

// ─── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const filterArg = args.find((a) => a.startsWith("--filter="))?.split("=")[1];
const outArg = args.find((a) => a.startsWith("--out="))?.split("=")[1];
const verbose = args.includes("--verbose");

const repoRoot = process.cwd();
const apiDir = path.join(repoRoot, "src/lib/api");
const backendTarget = process.env.BACKEND_PROXY_TARGET;
const tenantId = process.env.SMOKE_TENANT_ID ?? "550e8400-e29b-41d4-a716-446655440000";
const authToken = process.env.SMOKE_AUTH_TOKEN;
const requestTimeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? "10000", 10);

// Fantasmas conhecidos (ADR-001) — documentar mas não chamar
const PHANTOM_MODULES = new Set([
  "billing.ts",
  "whatsapp.ts",
  "reservas.ts",
  "crm-cadencias.ts",
]);
// financial.ts tem paths divergentes documentados no ADR, mas a maioria
// funciona — não é fantasma completo
const PARTIAL_MODULES = new Set(["financial.ts"]);

// Endpoints que exigem query params adicionais além de tenantId OU
// dependem de um X-Context-Id de sessao registrado pelo fluxo de login.
// O smoke generico nao consegue simular isso — seriam falsos positivos.
// Lista explicita pulada no modo runtime (vira "⏭️ skip-params").
//
// Nao confundir com bugs do FE: o caller real ja passa os params
// corretos e/ou tem a sessao context ativa.
const ENDPOINTS_REQUIRING_EXTRA_PARAMS = new Map([
  ["/api/v1/notificacoes/preferencias", "alunoId"],
  ["/api/v1/comercial/matriculas/dashboard-mensal", "mes"],
  ["/api/v1/nfse/solicitacoes", "unidadeId"],
  ["/api/v1/conversas", "filtros especificos"],
  ["/api/v1/administrativo/vouchers", "depende de context-id + filtros"],
  ["/api/v1/administrativo/vouchers/usage-counts", "depende de context-id + filtros"],
  ["/api/v1/gerencial/catraca/acessos/dashboard", "data range obrigatorio"],
  ["/api/v1/academia/dashboard", "filtros especificos"],
  ["/api/v1/storefront/theme", "context-id + tenantId no caller real"],
  // 3 ultimos descobertos na segunda iteracao:
  ["/api/v1/academia", "depende de X-Context-Id de sessao registrada"],
  ["/api/v1/onboarding/status", "depende de X-Context-Id de sessao registrada"],
]);

if (!fs.existsSync(apiDir)) {
  console.error(`Missing API directory: ${apiDir}`);
  process.exit(1);
}

if (!dryRun && !backendTarget) {
  console.error("BACKEND_PROXY_TARGET não definido e --dry-run não foi passado.");
  console.error("Use --dry-run para só listar os endpoints sem bater no backend.");
  process.exit(1);
}

// ─── AST extraction (similar to audit-api-clients.mjs) ───────────────────

function normalizePath(value) {
  return value.replace(/\{[^}]+\}/g, "{param}").replace(/\$\{[^}]+\}/g, "{param}");
}

/**
 * Coleta helpers locais que retornam string literals/templates simples.
 * Ex.: `function basePath(conversationId: string): string { return
 * `/api/v1/atendimento/conversas/${conversationId}/ai`; }`
 *
 * Isso permite que renderPathLiteral resolva chamadas como
 * `${basePath(id)}/resumir` para o path completo em vez de "{param}/resumir".
 */
function collectStringHelpers(sourceFile) {
  const helpers = new Map();

  function visit(node) {
    // function declaration: function name(...) { return ...; }
    if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      const ret = findReturnStringLiteral(node.body);
      if (ret) helpers.set(node.name.text, ret);
    }
    // const name = (...) => ...; OR const name = function(...) { return ... }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
        if (
          ts.isArrowFunction(decl.initializer) ||
          ts.isFunctionExpression(decl.initializer)
        ) {
          const body = decl.initializer.body;
          if (!body) continue;
          if (ts.isBlock(body)) {
            const ret = findReturnStringLiteral(body);
            if (ret) helpers.set(decl.name.text, ret);
          } else {
            // arrow concise body
            const ret = stringLiteralFromExpression(body);
            if (ret) helpers.set(decl.name.text, ret);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  function findReturnStringLiteral(block) {
    let result;
    function walk(n) {
      if (result) return;
      if (ts.isReturnStatement(n) && n.expression) {
        const lit = stringLiteralFromExpression(n.expression);
        if (lit) result = lit;
      } else {
        ts.forEachChild(n, walk);
      }
    }
    walk(block);
    return result;
  }

  function stringLiteralFromExpression(expr) {
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
      return { value: expr.text, dynamic: false };
    }
    if (ts.isTemplateExpression(expr)) {
      let value = expr.head.text;
      for (const span of expr.templateSpans) {
        value += "{param}";
        value += span.literal.text;
      }
      return { value, dynamic: true };
    }
    return undefined;
  }

  visit(sourceFile);
  return helpers;
}

function renderPathLiteral(node, sourceFile, helpers = new Map()) {
  if (!node) return { value: undefined, dynamic: false };

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return { value: node.text, dynamic: false };
  }

  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    let dynamic = false;
    for (const span of node.templateSpans) {
      const expr = span.expression;
      // Tenta resolver chamada de helper local: ${basePath(arg)}/resumir
      if (
        ts.isCallExpression(expr) &&
        ts.isIdentifier(expr.expression) &&
        helpers.has(expr.expression.text)
      ) {
        const helperResolved = helpers.get(expr.expression.text);
        value += helperResolved.value;
        dynamic = dynamic || helperResolved.dynamic;
      } else {
        value += "{param}";
        dynamic = true;
      }
      value += span.literal.text;
    }
    return { value, dynamic };
  }

  if (ts.isParenthesizedExpression(node)) {
    return renderPathLiteral(node.expression, sourceFile, helpers);
  }

  // Identificador simples que aponta para um helper que retorna string
  if (ts.isIdentifier(node) && helpers.has(node.text)) {
    return helpers.get(node.text);
  }

  return { value: undefined, dynamic: true };
}

function extractCallsFromFile(source) {
  const sourceFile = ts.createSourceFile(
    source.fullPath,
    source.content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  // Coleta helpers locais antes de visitar — permite resolver
  // basePath() em template literals (ver atendimento-ai.ts).
  const helpers = collectStringHelpers(sourceFile);

  const calls = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "apiRequest"
    ) {
      const [argument] = node.arguments;
      if (argument && ts.isObjectLiteralExpression(argument)) {
        let method = "GET";
        let pathInfo = { value: undefined, dynamic: false };
        let hasQuery = false;

        for (const property of argument.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const name =
            ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
              ? property.name.text
              : undefined;
          if (!name) continue;

          if (name === "method") {
            const rendered = renderPathLiteral(property.initializer, sourceFile, helpers);
            if (rendered.value) method = rendered.value.toUpperCase();
          }
          if (name === "path") {
            pathInfo = renderPathLiteral(property.initializer, sourceFile, helpers);
          }
          if (name === "query") {
            hasQuery = true;
          }
        }

        if (pathInfo.value) {
          calls.push({
            file: source.file,
            method,
            rawPath: pathInfo.value,
            normalizedPath: normalizePath(pathInfo.value),
            dynamicPath: pathInfo.dynamic,
            hasQuery,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return calls;
}

function loadAllCalls() {
  const files = fs
    .readdirSync(apiDir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .sort();

  const allCalls = [];
  for (const file of files) {
    const fullPath = path.join(apiDir, file);
    const content = fs.readFileSync(fullPath, "utf8");
    allCalls.push(...extractCallsFromFile({ file, fullPath, content }));
  }
  return allCalls;
}

// ─── Runtime calls ────────────────────────────────────────────────────────

// Nota: X-Context-Id e um UUID de sessao registrado pelo backend em
// fluxos complexos de login. Nao podemos injetar um UUID aleatorio
// porque o BE cascade falha na resolucao. O tenantId e resolvido
// via JWT claim + X-Tenant-Id header + tenantId query param, que ja
// cobrem 80% dos casos.
async function callEndpoint(call) {
  const url = new URL(call.rawPath, backendTarget);
  if (call.hasQuery) url.searchParams.set("tenantId", tenantId);

  const headers = {
    Accept: "application/json",
    "X-Tenant-Id": tenantId,
    "X-Request-Id": randomUUID(),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  const started = Date.now();

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    return {
      status: response.status,
      elapsedMs: Date.now() - started,
      ok: response.ok,
      note: response.ok ? "" : response.statusText,
    };
  } catch (error) {
    return {
      status: 0,
      elapsedMs: Date.now() - started,
      ok: false,
      note: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Reporting ────────────────────────────────────────────────────────────

function classify(call, result) {
  if (PHANTOM_MODULES.has(call.file)) return "🚫 phantom";
  if (ENDPOINTS_REQUIRING_EXTRA_PARAMS.has(call.rawPath)) {
    // Classifica como ok se foi executado e deu 2xx, senao como skip-params
    if (result?.ok) return "✅ ok";
    return "⏭️ skip-params";
  }
  if (PARTIAL_MODULES.has(call.file)) {
    if (result?.ok) return "✅ ok";
    return "⚠️ partial";
  }
  if (!result) return "⏸️ skipped";
  if (result.ok) return "✅ ok";
  if (result.status === 0) return "💥 network";
  if (result.status === 401 || result.status === 403) return "🔒 auth";
  if (result.status === 404) return "❌ 404";
  if (result.status >= 500) return "🔥 5xx";
  return `⚠️ ${result.status}`;
}

function renderMarkdown(calls, results, meta) {
  const lines = [];
  const date = new Date().toISOString().split("T")[0];
  lines.push("# Smoke Test BE↔FE — Matriz endpoint → status");
  lines.push("");
  lines.push(`**Data:** ${date}`);
  lines.push(`**Gerado por:** \`scripts/smoke-test-be-fe.mjs\` (Task #552)`);
  lines.push(`**Modo:** ${meta.dryRun ? "dry-run (sem chamadas HTTP)" : `runtime contra \`${backendTarget}\``}`);
  if (meta.filter) lines.push(`**Filtro:** \`${meta.filter}\``);
  lines.push("");
  lines.push("## Sumário");
  lines.push("");
  lines.push(`- Total de endpoints extraídos (via AST): \`${calls.length}\``);
  lines.push(`- Apenas GET estáticos executáveis: \`${meta.executableCount}\``);
  lines.push(`- Paths dinâmicos (com path params): \`${meta.dynamicCount}\` — reportados mas não executados`);
  lines.push(`- Endpoints em módulos fantasmas (ADR-001): \`${meta.phantomCount}\` — pulados`);
  lines.push(`- Endpoints em módulos parciais: \`${meta.partialCount}\``);
  lines.push(`- Endpoints com params obrigatórios extras (skip-list): \`${meta.extraParamsCount}\` — pulados`);
  if (!meta.dryRun) {
    lines.push(`- Sucessos (2xx): \`${meta.okCount}\``);
    lines.push(`- Falhas: \`${meta.failCount}\``);
  }
  lines.push("");
  lines.push("## Como rodar");
  lines.push("");
  lines.push("```bash");
  lines.push("# Listagem sem bater no backend (dry-run)");
  lines.push("node scripts/smoke-test-be-fe.mjs --dry-run --out=docs/SMOKE_TEST_BE_FE_MATRIX.md");
  lines.push("");
  lines.push("# Execução real contra staging");
  lines.push("BACKEND_PROXY_TARGET=https://staging.example.com \\");
  lines.push("SMOKE_TENANT_ID=550e8400-... \\");
  lines.push("SMOKE_AUTH_TOKEN=eyJhbGciOi... \\");
  lines.push("  node scripts/smoke-test-be-fe.mjs --out=docs/SMOKE_TEST_BE_FE_MATRIX.md");
  lines.push("");
  lines.push("# Subset por filtro (regex sobre o path)");
  lines.push("node scripts/smoke-test-be-fe.mjs --filter=dashboard");
  lines.push("```");
  lines.push("");
  lines.push("## Exit criteria para as Waves de execução");
  lines.push("");
  lines.push("Antes de iniciar qualquer task das Waves 1-4, rodar este script com filtro dos endpoints da wave e garantir:");
  lines.push("");
  lines.push("- **Nenhum endpoint da wave em `🔥 5xx` ou `💥 network`**");
  lines.push("- **Nenhum endpoint da wave em `❌ 404`** (exceto se conhecido como módulo fantasma)");
  lines.push("- **`🔒 auth`** aceitável se o token de teste não tiver escopo suficiente — revalidar com escopo pleno");
  lines.push("");
  lines.push("## Matriz completa");
  lines.push("");
  lines.push("| Status | Método | Path | Arquivo | Tempo (ms) | Nota |");
  lines.push("| --- | --- | --- | --- | ---: | --- |");

  for (let i = 0; i < calls.length; i += 1) {
    const call = calls[i];
    const result = results[i];
    const status = classify(call, result);
    const elapsed = result ? result.elapsedMs : "-";
    const extraParamsReason = ENDPOINTS_REQUIRING_EXTRA_PARAMS.get(call.rawPath);
    const note =
      result?.note ||
      (call.dynamicPath ? "path dinâmico (skip runtime)" : "") ||
      (PHANTOM_MODULES.has(call.file) ? "módulo fantasma (ADR-001)" : "") ||
      (extraParamsReason ? `requer: ${extraParamsReason}` : "") ||
      "";
    lines.push(
      `| ${status} | ${call.method} | \`${call.rawPath}\` | \`${call.file}\` | ${elapsed} | ${note} |`
    );
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("_Gerado automaticamente. Não editar manualmente — rodar o script para atualizar._");
  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const allCalls = loadAllCalls();

  // Apply filter
  const filtered = filterArg
    ? allCalls.filter((c) => new RegExp(filterArg).test(c.rawPath))
    : allCalls;

  if (verbose) {
    console.error(`Extracted ${allCalls.length} calls, ${filtered.length} after filter`);
  }

  // Sort by file then path for deterministic output
  filtered.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.rawPath.localeCompare(b.rawPath);
  });

  const results = new Array(filtered.length).fill(null);
  let executableCount = 0;
  let dynamicCount = 0;
  let phantomCount = 0;
  let partialCount = 0;
  let extraParamsCount = 0;
  let okCount = 0;
  let failCount = 0;

  for (let i = 0; i < filtered.length; i += 1) {
    const call = filtered[i];
    const isPhantom = PHANTOM_MODULES.has(call.file);
    const isPartial = PARTIAL_MODULES.has(call.file);
    const needsExtraParams = ENDPOINTS_REQUIRING_EXTRA_PARAMS.has(call.rawPath);
    if (isPhantom) phantomCount += 1;
    if (isPartial) partialCount += 1;
    if (needsExtraParams) extraParamsCount += 1;

    const executable =
      call.method === "GET" &&
      !call.dynamicPath &&
      !isPhantom &&
      !needsExtraParams;

    if (call.dynamicPath) dynamicCount += 1;
    if (executable) executableCount += 1;

    if (executable && !dryRun) {
      const result = await callEndpoint(call);
      results[i] = result;
      if (result.ok) okCount += 1;
      else failCount += 1;
      if (verbose) {
        console.error(
          `  [${result.ok ? "OK" : "FAIL"} ${result.status}] ${call.method} ${call.rawPath} (${result.elapsedMs}ms)`
        );
      }
    }
  }

  const markdown = renderMarkdown(filtered, results, {
    dryRun,
    filter: filterArg,
    executableCount,
    dynamicCount,
    phantomCount,
    partialCount,
    extraParamsCount,
    okCount,
    failCount,
  });

  if (outArg) {
    const outPath = path.resolve(repoRoot, outArg);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, markdown + "\n", "utf8");
    console.error(`Wrote ${outPath}`);
  } else {
    console.log(markdown);
  }

  // Exit non-zero if there were failures in runtime mode (for CI gating)
  if (!dryRun && failCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});

#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const repoRoot = process.cwd();
const apiDir = path.join(repoRoot, "src/lib/api");
const defaultSpecPath =
  "/Users/sergioamim/dev/pessoal/academia-java/modulo-app/src/main/resources/static/openapi.yaml";
const specPath = process.env.ACADEMIA_OPENAPI_PATH ?? defaultSpecPath;
const outputJson = process.argv.includes("--json");

if (!fs.existsSync(apiDir)) {
  console.error(`Missing API directory: ${apiDir}`);
  process.exit(1);
}

if (!fs.existsSync(specPath)) {
  console.error(`Missing OpenAPI source: ${specPath}`);
  process.exit(1);
}

function normalizePath(value) {
  return value.replace(/\{[^}]+\}/g, "{param}").replace(/\$\{[^}]+\}/g, "{param}");
}

function readSourceFiles(directory) {
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".ts"))
    .sort()
    .map((file) => ({
      file,
      fullPath: path.join(directory, file),
      content: fs.readFileSync(path.join(directory, file), "utf8"),
    }));
}

function parseOpenApiSpec(content) {
  const lines = content.split(/\r?\n/);
  const operations = [];
  let inPaths = false;
  let currentPath = null;
  let currentMethod = null;
  let currentHasTenantQuery = false;
  let currentBlock = [];

  const flushOperation = () => {
    if (currentPath && currentMethod) {
      operations.push({
        method: currentMethod,
        path: currentPath,
        normalizedPath: normalizePath(currentPath),
        hasTenantQuery: currentHasTenantQuery,
        block: currentBlock.join("\n"),
      });
    }
    currentMethod = null;
    currentHasTenantQuery = false;
    currentBlock = [];
  };

  for (const line of lines) {
    if (/^paths:\s*$/.test(line)) {
      inPaths = true;
      continue;
    }

    if (/^components:\s*$/.test(line)) {
      flushOperation();
      inPaths = false;
      currentPath = null;
      continue;
    }

    if (!inPaths) continue;

    const pathMatch = line.match(/^  (\/[^:]+):\s*$/);
    if (pathMatch) {
      flushOperation();
      currentPath = pathMatch[1];
      continue;
    }

    const methodMatch = line.match(/^    (get|post|put|patch|delete):\s*$/);
    if (methodMatch) {
      flushOperation();
      currentMethod = methodMatch[1].toUpperCase();
      continue;
    }

    if (!currentMethod) continue;
    currentBlock.push(line);
    if (line.includes("#/components/parameters/TenantIdQuery")) {
      currentHasTenantQuery = true;
    }
  }

  flushOperation();
  return operations;
}

function renderPathLiteral(node, sourceFile, scope) {
  if (!node) {
    return { value: undefined, dynamic: false };
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return { value: node.text, dynamic: false };
  }

  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    for (const span of node.templateSpans) {
      value += "{param}";
      value += span.literal.text;
    }
    return { value, dynamic: false };
  }

  if (ts.isParenthesizedExpression(node)) {
    return renderPathLiteral(node.expression, sourceFile, scope);
  }

  if (ts.isBinaryExpression(node) && ["||", "??"].includes(node.operatorToken.getText(sourceFile))) {
    const left = renderPathLiteral(node.left, sourceFile, scope);
    const right = renderPathLiteral(node.right, sourceFile, scope);
    if (right.value) {
      return {
        value: right.value,
        dynamic: true,
      };
    }
    return {
      value: left.value,
      dynamic: left.dynamic || right.dynamic,
    };
  }

  if (ts.isIdentifier(node) && scope) {
    const resolved = resolveIdentifierLiteral(node.text, scope, sourceFile);
    if (resolved) return resolved;
  }

  return { value: undefined, dynamic: true };
}

function resolveIdentifierLiteral(name, scope, sourceFile) {
  let resolved;

  function walk(node) {
    if (resolved) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name &&
      node.initializer
    ) {
      resolved = renderPathLiteral(node.initializer, sourceFile, scope);
      return;
    }
    ts.forEachChild(node, walk);
  }

  walk(scope);
  return resolved;
}

function extractObjectKeys(node) {
  if (!node || !ts.isObjectLiteralExpression(node)) return [];
  const keys = [];

  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) {
      keys.push(property.name.text);
    }
  }

  return keys;
}

function findApiCallsInFunction(fn, sourceFile) {
  const calls = [];

  function walk(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "apiRequest") {
      const [argument] = node.arguments;
      if (argument && ts.isObjectLiteralExpression(argument)) {
        let method = "GET";
        let pathInfo = { value: undefined, dynamic: false };
        let queryKeys = [];
        let includesTenant = false;
        let includesContextHeader = false;

        for (const property of argument.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const name =
            ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
              ? property.name.text
              : undefined;
          if (!name) continue;

          if (name === "method") {
            const rendered = renderPathLiteral(property.initializer, sourceFile, fn.body);
            if (rendered.value) method = rendered.value;
          }

          if (name === "path") {
            pathInfo = renderPathLiteral(property.initializer, sourceFile, fn.body);
          }

          if (name === "query") {
            queryKeys = extractObjectKeys(property.initializer);
            includesTenant =
              queryKeys.includes("tenantId") ||
              property.initializer.getText(sourceFile).includes("tenantId");
          }

          if (name === "headers") {
            includesTenant =
              includesTenant || property.initializer.getText(sourceFile).includes("tenantId");
          }

          if (name === "includeContextHeader") {
            includesContextHeader = property.initializer.getText(sourceFile) !== "false";
          }
        }

        calls.push({
          functionName: fn.name?.text ?? "anonymous",
          method,
          path: pathInfo.value,
          normalizedPath: pathInfo.value ? normalizePath(pathInfo.value) : undefined,
          dynamicPath: pathInfo.dynamic,
          queryKeys,
          includesTenant,
          includesContextHeader,
        });
      }
    }

    ts.forEachChild(node, walk);
  }

  if (fn.body) walk(fn.body);
  return calls;
}

function classifyCoverageGroups(specOperations, matchedKeys) {
  const groups = [
    {
      key: "auth-rbac",
      test: (pathname) => pathname.startsWith("/api/v1/auth"),
    },
    {
      key: "contexto-academia",
      test: (pathname) =>
        pathname.startsWith("/api/v1/context") ||
        pathname.startsWith("/api/v1/unidades") ||
        pathname === "/api/v1/academia" ||
        pathname === "/api/v1/dashboard",
    },
    {
      key: "financeiro",
      test: (pathname) =>
        pathname.startsWith("/api/v1/gerencial/financeiro") ||
        pathname.startsWith("/api/v1/financeiro"),
    },
    {
      key: "crm",
      test: (pathname) => pathname.startsWith("/api/v1/crm"),
    },
    {
      key: "comercial",
      test: (pathname) => pathname.startsWith("/api/v1/comercial"),
    },
    {
      key: "treinos",
      test: (pathname) =>
        pathname.startsWith("/api/v1/treinos") ||
        pathname.startsWith("/api/v1/exercicios") ||
        pathname.startsWith("/api/v1/grupos-musculares"),
    },
    {
      key: "administrativo",
      test: (pathname) => pathname.startsWith("/api/v1/administrativo"),
    },
    {
      key: "integracoes",
      test: (pathname) =>
        pathname.startsWith("/api/v1/integracoes") ||
        pathname.startsWith("/api/v1/admin/integracoes"),
    },
    {
      key: "app-cliente-grade-pagamentos",
      test: (pathname) =>
        pathname.startsWith("/api/v1/app-cliente") ||
        pathname.startsWith("/api/v1/grade") ||
        pathname.startsWith("/api/v1/pagamentos") ||
        pathname.startsWith("/api/v1/nfse"),
    },
  ];

  return groups.map((group) => {
    const groupOperations = specOperations.filter((operation) => group.test(operation.path));
    const wrapped = groupOperations.filter((operation) =>
      matchedKeys.has(`${operation.method} ${operation.normalizedPath}`)
    );
    const missing = groupOperations.filter(
      (operation) => !matchedKeys.has(`${operation.method} ${operation.normalizedPath}`)
    );

    return {
      key: group.key,
      specCount: groupOperations.length,
      wrappedCount: wrapped.length,
      missingCount: missing.length,
      sampleMissing: missing.slice(0, 6).map((operation) => `${operation.method} ${operation.path}`),
    };
  });
}

const specContent = fs.readFileSync(specPath, "utf8");
const specOperations = parseOpenApiSpec(specContent);
const specOperationByKey = new Map(
  specOperations.map((operation) => [`${operation.method} ${operation.normalizedPath}`, operation])
);

const files = readSourceFiles(apiDir);
const fileReports = [];
const allStaticMatchedKeys = new Set();
const unmatchedOperations = [];
const dynamicPathOperations = [];
const tenantIssues = [];

let totalAsyncServices = 0;
let totalContracts = 0;
let totalNormalizers = 0;
let staticOperations = 0;

for (const source of files) {
  const sourceFile = ts.createSourceFile(
    source.fullPath,
    source.content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const asyncFunctions = [];
  const contracts = [];
  const normalizers = [];

  sourceFile.forEachChild((node) => {
    if (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      /(ApiResponse|ApiRequest)$/.test(node.name.text)
    ) {
      contracts.push(node.name.text);
    }

    if (ts.isFunctionDeclaration(node) && node.name && /^normalize[A-Z]/.test(node.name.text)) {
      normalizers.push(node.name.text);
    }

    if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
    ) {
      asyncFunctions.push(node);
    }
  });

  const operations = asyncFunctions.flatMap((fn) => findApiCallsInFunction(fn, sourceFile));
  const staticFileOperations = [];
  const fileUnmatched = [];
  const fileTenantIssues = [];
  const fileDynamic = [];

  for (const operation of operations) {
    if (!operation.path) {
      fileDynamic.push(operation);
      dynamicPathOperations.push({
        file: source.file,
        ...operation,
      });
      continue;
    }

    staticOperations += 1;
    staticFileOperations.push(operation);

    const key = `${operation.method} ${operation.normalizedPath}`;
    const specOperation = specOperationByKey.get(key);
    if (!specOperation) {
      const report = {
        file: source.file,
        ...operation,
      };
      fileUnmatched.push(report);
      unmatchedOperations.push(report);
      continue;
    }

    allStaticMatchedKeys.add(key);
    if (specOperation.hasTenantQuery && !operation.includesTenant) {
      const issue = {
        file: source.file,
        ...operation,
      };
      fileTenantIssues.push(issue);
      tenantIssues.push(issue);
    }
  }

  totalAsyncServices += asyncFunctions.length;
  totalContracts += contracts.length;
  totalNormalizers += normalizers.length;

  fileReports.push({
    file: source.file,
    asyncServices: asyncFunctions.length,
    staticOperations: staticFileOperations.length,
    dynamicOperations: fileDynamic.length,
    contracts: contracts.length,
    normalizers: normalizers.length,
    unmatched: fileUnmatched,
    tenantIssues: fileTenantIssues,
    classification:
      contracts.length > 0 || normalizers.length > 0 ? "typed-adapter" : "thin-wrapper",
  });
}

const coverageGroups = classifyCoverageGroups(specOperations, allStaticMatchedKeys);

const summary = {
  specPath,
  sourceFiles: files.length,
  totalAsyncServices,
  totalContracts,
  totalNormalizers,
  totalSpecOperations: specOperations.length,
  staticOperations,
  dynamicPathOperations: dynamicPathOperations.length,
  matchedStaticOperations: staticOperations - unmatchedOperations.length,
  unmatchedStaticOperations: unmatchedOperations.length,
  tenantIssues: tenantIssues.length,
};

const report = {
  summary,
  unmatchedOperations,
  dynamicPathOperations,
  tenantIssues,
  coverageGroups,
  files: fileReports,
};

if (outputJson) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

function renderMarkdown() {
  const lines = [];
  lines.push("# API Client Audit");
  lines.push("");
  lines.push(`- OpenAPI source: \`${specPath}\``);
  lines.push(`- Files audited: \`${summary.sourceFiles}\``);
  lines.push(`- Exported async services: \`${summary.totalAsyncServices}\``);
  lines.push(`- Local ApiRequest/ApiResponse contracts: \`${summary.totalContracts}\``);
  lines.push(`- Local normalize helpers: \`${summary.totalNormalizers}\``);
  lines.push(
    `- Static path operations matched to OpenAPI: \`${summary.matchedStaticOperations}/${summary.staticOperations}\``
  );
  lines.push(`- Dynamic path operations: \`${summary.dynamicPathOperations}\``);
  lines.push(`- Tenant propagation gaps against spec: \`${summary.tenantIssues}\``);
  lines.push("");
  lines.push("## Coverage by Domain");
  lines.push("");
  lines.push("| Domain | OpenAPI ops | Wrapped | Missing |");
  lines.push("| --- | ---: | ---: | ---: |");
  for (const group of coverageGroups) {
    lines.push(
      `| ${group.key} | ${group.specCount} | ${group.wrappedCount} | ${group.missingCount} |`
    );
  }

  lines.push("");
  lines.push("## Static Endpoint Mismatches");
  lines.push("");
  if (unmatchedOperations.length === 0) {
    lines.push("- none");
  } else {
    for (const issue of unmatchedOperations) {
      lines.push(`- \`${issue.file}\` -> \`${issue.functionName}\`: \`${issue.method} ${issue.path}\``);
    }
  }

  lines.push("");
  lines.push("## Tenant Query Gaps");
  lines.push("");
  if (tenantIssues.length === 0) {
    lines.push("- none");
  } else {
    const hotspots = [...fileReports]
      .map((file) => ({
        file: file.file,
        count: file.tenantIssues.length,
      }))
      .filter((file) => file.count > 0)
      .sort((left, right) => right.count - left.count);

    for (const hotspot of hotspots) {
      lines.push(`- \`${hotspot.file}\`: ${hotspot.count}`);
    }
  }

  lines.push("");
  lines.push("## File Inventory");
  lines.push("");
  lines.push("| File | Services | Static ops | Dynamic ops | Contracts | Normalizers | Mismatches | Tenant gaps | Class |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const file of fileReports) {
    lines.push(
      `| ${file.file} | ${file.asyncServices} | ${file.staticOperations} | ${file.dynamicOperations} | ${file.contracts} | ${file.normalizers} | ${file.unmatched.length} | ${file.tenantIssues.length} | ${file.classification} |`
    );
  }

  return lines.join("\n");
}

console.log(renderMarkdown());

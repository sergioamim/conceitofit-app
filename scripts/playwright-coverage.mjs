import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "src");
const RAW_ROOT = path.join(ROOT, ".coverage", "raw");
const REPORT_ROOT = path.join(ROOT, "coverage");
const BASELINE_JSON_PATH = path.join(ROOT, "docs", "TEST_COVERAGE_BASELINE.json");
const BASELINE_MD_PATH = path.join(ROOT, "docs", "TEST_COVERAGE_BASELINE.md");
const CORE_JSON_PATH = path.join(ROOT, "docs", "TEST_COVERAGE_CORE.json");
const CORE_MD_PATH = path.join(ROOT, "docs", "TEST_COVERAGE_CORE.md");
const CORE_HISTORY_PATH = path.join(ROOT, "docs", "TEST_COVERAGE_HISTORY_CORE.json");

const SMOKE_E2E_SPECS = [
  "tests/e2e/sessao-multiunidade.spec.ts",
  "tests/e2e/comercial-fluxo.spec.ts",
  "tests/e2e/admin-financeiro-integracoes.spec.ts",
  "tests/e2e/backoffice-global.spec.ts",
  "tests/e2e/adesao-publica.spec.ts",
  "tests/e2e/treinos-template-list.spec.ts",
  "tests/e2e/treinos-v2-editor.spec.ts",
  // Lote 1 — alto impacto (Task 291)
  "tests/e2e/financeiro-admin.spec.ts",
  "tests/e2e/reservas-aulas.spec.ts",
  "tests/e2e/crm-operacional.spec.ts",
  "tests/e2e/rbac.spec.ts",
  "tests/e2e/bi-operacional.spec.ts",
];

const EXECUTABLE_LINE_COMMENT_PATTERNS = [/^\/\//, /^\/\*/, /^\*+$/, /^\*+\//];

const COVERAGE_PROFILES = {
  core: {
    id: "core",
    label: "Core",
    title: "Coverage Core",
    sourceRoots: [path.join(SOURCE_ROOT, "lib")],
    scope: "src/lib/**/*.{ts,tsx}",
    docsJsonPath: CORE_JSON_PATH,
    docsMdPath: CORE_MD_PATH,
    historyPath: CORE_HISTORY_PATH,
    artifactPrefix: "core",
    thresholds: {
      lines: 60,
      statements: 60,
      functions: 60,
      branches: 60,
      changedFilesLines: 40,
    },
    milestones: [
      {
        name: "M1",
        targetPct: 20,
        focus: "infra compartilhada, src/lib/api, sessao e tenant/contexto",
      },
      {
        name: "M2",
        targetPct: 35,
        focus: "comercial, financeiro e seguranca",
      },
      {
        name: "M3",
        targetPct: 50,
        focus: "CRM, treinos, reservas, jornada publica e backoffice",
      },
      {
        name: "M4",
        targetPct: 60,
        focus: "camadas core estabilizadas com cenarios de erro e borda",
      },
    ],
    policy: [
      "Task 26 fecha a meta de 60% sobre o runtime core compartilhado em src/lib, onde a instrumentacao Node/V8 ja e confiavel.",
      "UI e bundle client-only permanecem fora deste gate ate existir instrumentacao dedicada no navegador; o controle funcional segue pela suite smoke.",
      "Task 27 promove esses thresholds a gate de merge, publica artefatos e adiciona piso inicial por arquivo alterado no core.",
      "Os scripts padrao de report, baseline e gate operam no perfil core; o perfil full segue como baseline informacional do repositorio.",
    ],
    notes: [
      "A cobertura core mede o runtime compartilhado em src/lib executado em processos Node pelas suites Playwright unit e smoke E2E.",
      "Componentes e paginas client-only nao entram neste gate porque a baseline atual ainda nao instrumenta o bundle do navegador.",
      "Branch coverage e derivada de estruturas explicitas do AST TypeScript; nao replica exatamente a semantica de Istanbul.",
    ],
    exclusions: [
      "**/*.d.ts",
      "arquivos fora de src/lib/",
      "artefatos gerados em .next/, out/ e build/",
    ],
  },
  full: {
    id: "full",
    label: "Full",
    title: "Coverage Baseline",
    sourceRoots: [SOURCE_ROOT],
    scope: "src/**/*.{ts,tsx}",
    docsJsonPath: BASELINE_JSON_PATH,
    docsMdPath: BASELINE_MD_PATH,
    historyPath: null,
    artifactPrefix: "full",
    thresholds: {
      lines: 9,
      statements: 13,
      functions: 11,
      branches: 16,
      changedFilesLines: 0,
    },
    milestones: [
      {
        name: "M1",
        targetPct: 20,
        focus: "infra compartilhada, src/lib/api, sessao e tenant/contexto",
      },
      {
        name: "M2",
        targetPct: 35,
        focus: "comercial, financeiro e seguranca",
      },
      {
        name: "M3",
        targetPct: 50,
        focus: "CRM, treinos, reservas, jornada publica e backoffice",
      },
      {
        name: "M4",
        targetPct: 60,
        focus: "fechamento da meta global com cenarios de erro e borda",
      },
    ],
    policy: [
      "O perfil full continua como baseline informacional do repositorio inteiro e nao substitui o gate obrigatorio do perfil core.",
      "A meta de 60% fica formalmente aplicada ao perfil core em src/lib, onde a instrumentacao Node/V8 e confiavel para gate de merge.",
      "Os thresholds do full permanecem como piso documental para acompanhar tendencia global sem bloquear areas ainda nao instrumentadas no bundle cliente.",
    ],
    notes: [
      "A cobertura atual mede arquivos do src executados em processos Node durante as suites Playwright unit e smoke E2E.",
      "A trilha smoke E2E cobre fluxos hermeticos de autenticacao/contexto, comercial, admin financeiro, backoffice, adesao publica e treinos V2.",
      "Suites que ainda dependem de backend externo, health checks reais ou dados nao deterministas ficam fora deste lote de coverage e seguem validadas separadamente.",
      "Branch coverage e derivada de estruturas explicitas do AST TypeScript; nao replica exatamente a semantica de Istanbul.",
      "Client code executado exclusivamente no bundle do navegador ainda nao possui instrumentacao dedicada nesta baseline.",
    ],
    exclusions: [
      "**/*.d.ts",
      "arquivos fora de src/",
      "artefatos gerados em .next/, out/ e build/",
    ],
  },
};

const ALL_COVERAGE_SUITES = ["unit", "smoke"];
let activeProfile = COVERAGE_PROFILES.core;
let activeSuites = [...ALL_COVERAGE_SUITES];

function main() {
  const command = process.argv[2] ?? "baseline";
  const cliOptions = parseCliOptions(process.argv.slice(3));

  activeProfile = resolveCoverageProfile(cliOptions.profile);
  activeSuites = resolveCoverageSuites(cliOptions.suites);

  switch (command) {
    case "clean":
      cleanCoverageArtifacts();
      console.log("Coverage artifacts limpos.");
      return;
    case "unit":
      ensureDir(path.join(RAW_ROOT, "unit"));
      runPlaywrightCoverage("unit", ["--config=playwright.unit.config.ts"], path.join(RAW_ROOT, "unit"));
      return;
    case "smoke":
      ensureDir(path.join(RAW_ROOT, "smoke"));
      runPlaywrightCoverage(
        "smoke",
        [...SMOKE_E2E_SPECS, "--project=chromium", "--workers=1"],
        path.join(RAW_ROOT, "smoke"),
      );
      return;
    case "report":
      writeCoverageReports();
      return;
    case "baseline":
      cleanCoverageArtifacts();
      runSelectedCoverageSuites(activeSuites);
      writeCoverageReports();
      return;
    case "gate":
      runCoverageGate(cliOptions.changedFiles);
      return;
    default:
      console.error(`Comando desconhecido: ${command}`);
      process.exit(1);
  }
}

function parseCliOptions(args) {
  const options = {
    profile: "core",
    suites: [...ALL_COVERAGE_SUITES],
    changedFiles: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith("--profile=")) {
      options.profile = arg.split("=")[1] || options.profile;
      continue;
    }
    if (arg === "--profile") {
      options.profile = args[index + 1] || options.profile;
      index += 1;
      continue;
    }
    if (arg.startsWith("--suites=")) {
      options.suites = arg.split("=")[1]?.split(",").map((item) => item.trim()).filter(Boolean) || options.suites;
      continue;
    }
    if (arg === "--suites") {
      options.suites = args[index + 1]?.split(",").map((item) => item.trim()).filter(Boolean) || options.suites;
      index += 1;
      continue;
    }
    if (arg.startsWith("--changed-file=")) {
      options.changedFiles.push(arg.split("=")[1]);
      continue;
    }
    if (arg === "--changed-file") {
      const changedFile = args[index + 1];
      if (changedFile) {
        options.changedFiles.push(changedFile);
        index += 1;
      }
      continue;
    }
  }

  const envChangedFiles = process.env.COVERAGE_CHANGED_FILES
    ?.split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

  options.changedFiles.push(...envChangedFiles);
  options.changedFiles = [...new Set(options.changedFiles)];
  return options;
}

function resolveCoverageProfile(profileId) {
  return COVERAGE_PROFILES[profileId] ?? COVERAGE_PROFILES.core;
}

function resolveCoverageSuites(inputSuites) {
  const suites = inputSuites.filter((suite) => ALL_COVERAGE_SUITES.includes(suite));
  return suites.length > 0 ? suites : [...ALL_COVERAGE_SUITES];
}

function runSelectedCoverageSuites(suites) {
  for (const suite of suites) {
    ensureDir(path.join(RAW_ROOT, suite));
    if (suite === "unit") {
      runPlaywrightCoverage("unit", ["--config=playwright.unit.config.ts"], path.join(RAW_ROOT, "unit"));
      continue;
    }

    if (suite === "smoke") {
      runPlaywrightCoverage(
        "smoke",
        [...SMOKE_E2E_SPECS, "--project=chromium", "--workers=1"],
        path.join(RAW_ROOT, "smoke"),
      );
    }
  }
}

function cleanCoverageArtifacts() {
  fs.rmSync(RAW_ROOT, { recursive: true, force: true });
  fs.rmSync(REPORT_ROOT, { recursive: true, force: true });
}

function runPlaywrightCoverage(label, args, coverageDir) {
  ensureDir(coverageDir);
  console.log(`\n[coverage] executando suite ${label}...`);
  const result = spawnSync("npx", ["playwright", "test", ...args], {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_V8_COVERAGE: coverageDir,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function writeCoverageReports() {
  const summary = buildCoverageSummary();
  const filesToWrite = getCoverageArtifactPaths();
  const history = updateCoverageHistory(summary);

  ensureDir(REPORT_ROOT);
  for (const summaryPath of filesToWrite.summary) {
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  }
  for (const lcovPath of filesToWrite.lcov) {
    fs.writeFileSync(lcovPath, renderLcov(summary));
  }
  for (const htmlPath of filesToWrite.html) {
    fs.writeFileSync(htmlPath, renderHtml(summary, history));
  }
  fs.writeFileSync(activeProfile.docsJsonPath, JSON.stringify(summary, null, 2));
  fs.writeFileSync(activeProfile.docsMdPath, renderMarkdown(summary, history));

  console.log("\n[coverage] relatorios gerados:");
  for (const artifactPath of [
    ...filesToWrite.summary,
    ...filesToWrite.lcov,
    ...filesToWrite.html,
    activeProfile.docsJsonPath,
    activeProfile.docsMdPath,
    ...(activeProfile.historyPath ? [activeProfile.historyPath] : []),
  ]) {
    console.log(`- ${path.relative(ROOT, artifactPath)}`);
  }
  console.log(
    `[coverage] ${activeProfile.id} atual: lines ${formatPct(summary.summary.lines.pct)} | ` +
      `statements ${formatPct(summary.summary.statements.pct)} | ` +
      `functions ${formatPct(summary.summary.functions.pct)} | ` +
      `branches ${formatPct(summary.summary.branches.pct)}`,
  );
}

function buildCoverageSummary() {
  const rawCoverage = loadRawCoverage(activeSuites);
  const sourceFiles = listSourceFiles(activeProfile.sourceRoots);
  const suiteVolumes = {
    unit: getPlaywrightListSummary(["--config=playwright.unit.config.ts"]),
    e2e: getPlaywrightListSummary([]),
    smoke: {
      specs: SMOKE_E2E_SPECS,
      files: SMOKE_E2E_SPECS.length,
    },
  };

  const fileSummaries = sourceFiles.map((filePath) => summarizeFileCoverage(filePath, rawCoverage.get(filePath) ?? []));
  const coveredFiles = fileSummaries.filter((file) => file.lines.total > 0 || file.functions.total > 0);
  const groupSummaries = summarizeGroups(coveredFiles);
  const totals = rollupMetrics(coveredFiles);

  return {
    generatedAt: new Date().toISOString(),
    profile: activeProfile.id,
    methodology: {
      runtime: "V8 coverage nativo via NODE_V8_COVERAGE",
      scope: activeProfile.scope,
      notes: activeProfile.notes,
      exclusions: activeProfile.exclusions,
    },
    baseline: {
      suitesExecutadas: activeSuites,
      playwright: {
        totalTests: suiteVolumes.unit.tests + suiteVolumes.e2e.tests,
        totalFiles: suiteVolumes.unit.files + suiteVolumes.e2e.files,
        unit: suiteVolumes.unit,
        e2e: suiteVolumes.e2e,
      },
      smoke: suiteVolumes.smoke,
      rawCoverageDirectories: activeSuites.map((suite) => path.relative(ROOT, path.join(RAW_ROOT, suite))),
    },
    targets: buildCoverageTargets(totals),
    summary: totals,
    groups: groupSummaries,
    files: coveredFiles.sort((left, right) => left.path.localeCompare(right.path)),
    topGaps: coveredFiles
      .slice()
      .sort((left, right) => {
        if (left.lines.pct !== right.lines.pct) return left.lines.pct - right.lines.pct;
        return right.lines.total - left.lines.total;
      })
      .slice(0, 15),
  };
}

function buildCoverageTargets(totals) {
  return {
    globalGoalPct: 60,
    activeGates: {
      lines: activeProfile.thresholds.lines,
      statements: activeProfile.thresholds.statements,
      functions: activeProfile.thresholds.functions,
      branches: activeProfile.thresholds.branches,
    },
    changedFilesLinesPct: activeProfile.thresholds.changedFilesLines,
    snapshotPct: {
      lines: Math.floor(totals.lines.pct),
      statements: Math.floor(totals.statements.pct),
      functions: Math.floor(totals.functions.pct),
      branches: Math.floor(totals.branches.pct),
    },
    milestones: activeProfile.milestones,
    policy: activeProfile.policy,
  };
}

function getCoverageArtifactPaths() {
  const prefix = activeProfile.artifactPrefix;
  return {
    summary: uniquePaths([
      path.join(REPORT_ROOT, "summary.json"),
      path.join(REPORT_ROOT, `summary.${prefix}.json`),
    ]),
    lcov: uniquePaths([
      path.join(REPORT_ROOT, "lcov.info"),
      path.join(REPORT_ROOT, `lcov.${prefix}.info`),
    ]),
    html: uniquePaths([
      path.join(REPORT_ROOT, "index.html"),
      path.join(REPORT_ROOT, `index.${prefix}.html`),
    ]),
  };
}

function uniquePaths(paths) {
  return [...new Set(paths)];
}

function updateCoverageHistory(summary) {
  if (!activeProfile.historyPath) return [];

  const current = fs.existsSync(activeProfile.historyPath)
    ? JSON.parse(fs.readFileSync(activeProfile.historyPath, "utf8"))
    : [];
  const history = (Array.isArray(current) ? current : []).filter(
    (entry) =>
      entry &&
      typeof entry.generatedAt === "string" &&
      typeof entry.profile === "string" &&
      Number.isFinite(entry.lines) &&
      Number.isFinite(entry.statements) &&
      Number.isFinite(entry.functions) &&
      Number.isFinite(entry.branches),
  );
  history.push({
    generatedAt: summary.generatedAt,
    profile: summary.profile,
    suitesExecutadas: summary.baseline.suitesExecutadas,
    lines: toRoundedPct(summary.summary.lines.pct),
    statements: toRoundedPct(summary.summary.statements.pct),
    functions: toRoundedPct(summary.summary.functions.pct),
    branches: toRoundedPct(summary.summary.branches.pct),
  });
  const trimmed = history.slice(-20);
  fs.writeFileSync(activeProfile.historyPath, JSON.stringify(trimmed, null, 2));
  return trimmed;
}

function runCoverageGate(changedFiles) {
  const summaryPaths = getCoverageArtifactPaths().summary;
  const summaryPath = summaryPaths[summaryPaths.length - 1];
  if (!fs.existsSync(summaryPath)) {
    console.error(`[coverage] resumo nao encontrado em ${path.relative(ROOT, summaryPath)}. Rode coverage:report antes do gate.`);
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  const globalFailures = [];

  for (const metric of ["lines", "statements", "functions", "branches"]) {
    const actual = summary.summary?.[metric]?.pct ?? 0;
    const expected = activeProfile.thresholds[metric];
    if (actual < expected) {
      globalFailures.push(`${metric}: ${formatPct(actual)} < ${formatPct(expected)}`);
    }
  }

  const changedFilesInScope = changedFiles
    .map((filePath) => normalizeRelativeFilePath(filePath))
    .filter(Boolean)
    .filter((filePath) => isPathInScope(path.join(ROOT, filePath)));

  const changedFileFailures = [];
  if (activeProfile.thresholds.changedFilesLines > 0) {
    for (const filePath of changedFilesInScope) {
      const fileSummary = summary.files.find((item) => item.path === filePath);
      const actual = fileSummary?.lines?.pct ?? 0;
      if (actual < activeProfile.thresholds.changedFilesLines) {
        changedFileFailures.push(
          `${filePath}: ${formatPct(actual)} < ${formatPct(activeProfile.thresholds.changedFilesLines)}`
        );
      }
    }
  }

  if (globalFailures.length === 0 && changedFileFailures.length === 0) {
    console.log(
      `[coverage] gate ${activeProfile.id} aprovado: lines ${formatPct(summary.summary.lines.pct)} | ` +
        `statements ${formatPct(summary.summary.statements.pct)} | ` +
        `functions ${formatPct(summary.summary.functions.pct)} | ` +
        `branches ${formatPct(summary.summary.branches.pct)}`
    );
    if (changedFilesInScope.length > 0) {
      console.log(`[coverage] arquivos alterados avaliados: ${changedFilesInScope.join(", ")}`);
    }
    return;
  }

  if (globalFailures.length > 0) {
    console.error(`[coverage] gate global falhou (${activeProfile.id}):`);
    for (const failure of globalFailures) {
      console.error(`- ${failure}`);
    }
  }

  if (changedFileFailures.length > 0) {
    console.error(`[coverage] gate por arquivo alterado falhou (${activeProfile.id}):`);
    for (const failure of changedFileFailures) {
      console.error(`- ${failure}`);
    }
  }

  process.exit(1);
}

function normalizeRelativeFilePath(filePath) {
  if (typeof filePath !== "string" || !filePath.trim()) return null;
  const normalized = filePath.trim();
  if (path.isAbsolute(normalized)) {
    return path.relative(ROOT, normalized);
  }
  return normalized;
}

function getPlaywrightListSummary(args) {
  const result = spawnSync("npx", ["playwright", "test", ...args, "--list"], {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
  });

  if (result.status !== 0) {
    console.warn(`[coverage] aviso: playwright --list falhou (args: ${args.join(" ")}), usando zeros.`);
    return { tests: 0, files: 0 };
  }

  const output = `${result.stdout}\n${result.stderr}`;
  const match = output.match(/Total:\s+(\d+)\s+tests?\s+in\s+(\d+)\s+files?/m);
  if (!match) {
    console.warn("[coverage] aviso: nao foi possivel extrair totais da listagem do Playwright, usando zeros.");
    return { tests: 0, files: 0 };
  }

  return {
    tests: Number(match[1]),
    files: Number(match[2]),
  };
}

function loadRawCoverage(suites = ALL_COVERAGE_SUITES) {
  const grouped = new Map();
  const jsonFiles = suites.flatMap((suite) => listJsonFiles(path.join(RAW_ROOT, suite)));

  for (const file of jsonFiles) {
    const payload = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const entry of payload.result ?? []) {
      const filePath = normalizeCoverageUrl(entry.url);
      if (!filePath || !fs.existsSync(filePath)) continue;

      const source = fs.readFileSync(filePath, "utf8");
      const intervals = collectCoveredIntervals(entry, source.length);
      if (intervals.length === 0) continue;

      const current = grouped.get(filePath) ?? [];
      current.push(...intervals);
      grouped.set(filePath, current);
    }
  }

  for (const [filePath, intervals] of grouped.entries()) {
    grouped.set(filePath, mergeIntervals(intervals));
  }

  return grouped;
}

function collectCoveredIntervals(entry, sourceLength) {
  const intervals = [];

  for (const fn of entry.functions ?? []) {
    const topRange = fn.ranges?.[0];
    const isWrapper =
      fn.functionName === "" &&
      topRange &&
      topRange.startOffset === 0 &&
      topRange.endOffset >= Math.max(0, sourceLength - 1);

    const ranges = isWrapper ? fn.ranges.slice(1) : fn.ranges ?? [];
    for (const range of ranges) {
      if ((range.count ?? 0) > 0) {
        intervals.push([range.startOffset, range.endOffset]);
      }
    }
  }

  return intervals;
}

function summarizeFileCoverage(filePath, coveredIntervals) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const lineStarts = sourceFile.getLineStarts();
  const meaningfulLines = collectMeaningfulLines(sourceText);
  const metrics = {
    functions: [],
    statements: [],
    branches: [],
  };

  visitSourceFile(sourceFile, metrics);

  const executableLines = new Set();
  for (const entity of [...metrics.statements, ...metrics.functions, ...metrics.branches]) {
    for (const line of linesForSpan(entity.start, entity.end, lineStarts, meaningfulLines)) {
      executableLines.add(line);
    }
  }

  const coveredLineMap = new Map();
  for (const line of executableLines) {
    const span = lineSpan(line, lineStarts, sourceText.length);
    coveredLineMap.set(line, overlapsAny(span.start, span.end, coveredIntervals) ? 1 : 0);
  }

  const lineSummary = {
    covered: sumMapValues(coveredLineMap),
    total: executableLines.size,
  };
  const functionSummary = summarizeEntities(metrics.functions, coveredIntervals);
  const statementSummary = summarizeEntities(metrics.statements, coveredIntervals);
  const branchSummary = summarizeEntities(metrics.branches, coveredIntervals);

  return {
    path: path.relative(ROOT, filePath).replaceAll(path.sep, "/"),
    lines: withPct(lineSummary),
    statements: withPct(statementSummary),
    functions: withPct(functionSummary),
    branches: withPct(branchSummary),
    lineHits: Object.fromEntries(
      [...coveredLineMap.entries()]
        .sort((left, right) => left[0] - right[0])
        .map(([line, hits]) => [String(line), hits]),
    ),
    functionHits: metrics.functions.map((entity) => ({
      name: entity.name,
      line: entity.line,
      hits: overlapsAny(entity.start, entity.end, coveredIntervals) ? 1 : 0,
    })),
    branchHits: metrics.branches.map((entity, index) => ({
      id: index,
      line: entity.line,
      hits: overlapsAny(entity.start, entity.end, coveredIntervals) ? 1 : 0,
    })),
  };
}

function visitSourceFile(sourceFile, metrics) {
  function visit(node) {
    const functionEntity = toFunctionEntity(node, sourceFile);
    if (functionEntity) metrics.functions.push(functionEntity);

    const statementEntity = toStatementEntity(node, sourceFile);
    if (statementEntity) metrics.statements.push(statementEntity);

    const branches = toBranchEntities(node, sourceFile);
    if (branches.length > 0) metrics.branches.push(...branches);

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function toFunctionEntity(node, sourceFile) {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  ) {
    const body = node.body;
    if (!body) return null;
    const start = body.getStart(sourceFile);
    const end = body.end;
    return {
      name: resolveFunctionName(node) ?? "<anonymous>",
      line: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
      start,
      end,
    };
  }

  return null;
}

function toStatementEntity(node, sourceFile) {
  const executableStatementKinds = new Set([
    ts.SyntaxKind.VariableStatement,
    ts.SyntaxKind.ExpressionStatement,
    ts.SyntaxKind.ReturnStatement,
    ts.SyntaxKind.ThrowStatement,
    ts.SyntaxKind.IfStatement,
    ts.SyntaxKind.SwitchStatement,
    ts.SyntaxKind.ForStatement,
    ts.SyntaxKind.ForInStatement,
    ts.SyntaxKind.ForOfStatement,
    ts.SyntaxKind.WhileStatement,
    ts.SyntaxKind.DoStatement,
    ts.SyntaxKind.TryStatement,
    ts.SyntaxKind.BreakStatement,
    ts.SyntaxKind.ContinueStatement,
    ts.SyntaxKind.LabeledStatement,
    ts.SyntaxKind.DebuggerStatement,
    ts.SyntaxKind.ExportAssignment,
  ]);

  if (!executableStatementKinds.has(node.kind)) return null;

  const start = node.getStart(sourceFile);
  return {
    line: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
    start,
    end: node.end,
  };
}

function toBranchEntities(node, sourceFile) {
  const branches = [];

  if (ts.isIfStatement(node)) {
    branches.push(createBranchEntity(node.thenStatement, sourceFile, "if.then"));
    if (node.elseStatement) {
      branches.push(createBranchEntity(node.elseStatement, sourceFile, "if.else"));
    }
  }

  if (ts.isConditionalExpression(node)) {
    branches.push(createBranchEntity(node.whenTrue, sourceFile, "ternary.true"));
    branches.push(createBranchEntity(node.whenFalse, sourceFile, "ternary.false"));
  }

  if (ts.isSwitchStatement(node)) {
    for (const clause of node.caseBlock.clauses) {
      branches.push(createBranchEntity(clause, sourceFile, ts.isCaseClause(clause) ? "switch.case" : "switch.default"));
    }
  }

  if (
    ts.isBinaryExpression(node) &&
    (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      node.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
      node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
  ) {
    branches.push(createBranchEntity(node.right, sourceFile, "logical.right"));
  }

  if (ts.isTryStatement(node)) {
    if (node.catchClause?.block) {
      branches.push(createBranchEntity(node.catchClause.block, sourceFile, "try.catch"));
    }
    if (node.finallyBlock) {
      branches.push(createBranchEntity(node.finallyBlock, sourceFile, "try.finally"));
    }
  }

  return branches;
}

function createBranchEntity(node, sourceFile, label) {
  const start = node.getStart(sourceFile);
  return {
    label,
    line: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
    start,
    end: node.end,
  };
}

function resolveFunctionName(node) {
  if ("name" in node && node.name && ts.isIdentifier(node.name)) {
    return node.name.text;
  }

  return null;
}

function summarizeEntities(entities, coveredIntervals) {
  let covered = 0;

  for (const entity of entities) {
    if (overlapsAny(entity.start, entity.end, coveredIntervals)) {
      covered += 1;
    }
  }

  return {
    covered,
    total: entities.length,
  };
}

function summarizeGroups(files) {
  const grouped = new Map();

  for (const file of files) {
    const group = resolveGroup(file.path);
    const current =
      grouped.get(group) ??
      {
        group,
        fileCount: 0,
        lines: { covered: 0, total: 0 },
        statements: { covered: 0, total: 0 },
        functions: { covered: 0, total: 0 },
        branches: { covered: 0, total: 0 },
      };

    current.fileCount += 1;
    accumulateMetric(current.lines, file.lines);
    accumulateMetric(current.statements, file.statements);
    accumulateMetric(current.functions, file.functions);
    accumulateMetric(current.branches, file.branches);
    grouped.set(group, current);
  }

  return [...grouped.values()]
    .map((group) => ({
      group: group.group,
      fileCount: group.fileCount,
      lines: withPct(group.lines),
      statements: withPct(group.statements),
      functions: withPct(group.functions),
      branches: withPct(group.branches),
    }))
    .sort((left, right) => left.group.localeCompare(right.group));
}

function rollupMetrics(files) {
  const totals = {
    lines: { covered: 0, total: 0 },
    statements: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
  };

  for (const file of files) {
    accumulateMetric(totals.lines, file.lines);
    accumulateMetric(totals.statements, file.statements);
    accumulateMetric(totals.functions, file.functions);
    accumulateMetric(totals.branches, file.branches);
  }

  return {
    lines: withPct(totals.lines),
    statements: withPct(totals.statements),
    functions: withPct(totals.functions),
    branches: withPct(totals.branches),
  };
}

function renderLcov(summary) {
  let output = "";

  for (const file of summary.files) {
    output += "TN:\n";
    output += `SF:${path.join(ROOT, file.path)}\n`;

    for (const fn of file.functionHits) {
      output += `FN:${fn.line},${sanitizeLcovName(fn.name)}\n`;
    }
    for (const fn of file.functionHits) {
      output += `FNDA:${fn.hits},${sanitizeLcovName(fn.name)}\n`;
    }
    output += `FNF:${file.functions.total}\n`;
    output += `FNH:${file.functions.covered}\n`;

    for (const branch of file.branchHits) {
      output += `BRDA:${branch.line},0,${branch.id},${branch.hits}\n`;
    }
    output += `BRF:${file.branches.total}\n`;
    output += `BRH:${file.branches.covered}\n`;

    for (const [line, hits] of Object.entries(file.lineHits)) {
      output += `DA:${line},${hits}\n`;
    }
    output += `LF:${file.lines.total}\n`;
    output += `LH:${file.lines.covered}\n`;
    output += "end_of_record\n";
  }

  return output;
}

function renderHtml(summary, history = []) {
  const gateHeading = summary.profile === "full" ? "Baseline Informacional E Meta" : "Meta e Gates";
  const gateDescription =
    summary.profile === "full"
      ? "O perfil full acompanha o repositorio inteiro. O gate obrigatorio de 60% permanece no perfil core."
      : "O perfil core e o gate obrigatorio da trilha, focado no runtime compartilhado instrumentado em Node.";
  const rows = summary.files
    .slice()
    .sort((left, right) => left.lines.pct - right.lines.pct)
    .slice(0, 30)
    .map(
      (file) => `
        <tr>
          <td>${escapeHtml(file.path)}</td>
          <td>${formatMetric(file.lines)}</td>
          <td>${formatMetric(file.statements)}</td>
          <td>${formatMetric(file.functions)}</td>
          <td>${formatMetric(file.branches)}</td>
        </tr>`,
    )
    .join("");

  const groups = summary.groups
    .map(
      (group) => `
        <tr>
          <td>${escapeHtml(group.group)}</td>
          <td>${group.fileCount}</td>
          <td>${formatMetric(group.lines)}</td>
          <td>${formatMetric(group.statements)}</td>
          <td>${formatMetric(group.functions)}</td>
          <td>${formatMetric(group.branches)}</td>
        </tr>`,
    )
    .join("");

  const milestones = summary.targets.milestones
    .map(
      (milestone) => `
        <li><strong>${escapeHtml(milestone.name)}:</strong> ${milestone.targetPct}% - ${escapeHtml(milestone.focus)}</li>`,
    )
    .join("");

  const historyRows = history
    .slice()
    .reverse()
    .slice(0, 8)
    .map(
      (entry) => `
        <tr>
          <td>${escapeHtml(entry.generatedAt)}</td>
          <td>${escapeHtml(entry.profile)}</td>
          <td>${escapeHtml((entry.suitesExecutadas ?? []).join(", "))}</td>
          <td>${formatPct(entry.lines)}</td>
          <td>${formatPct(entry.statements)}</td>
          <td>${formatPct(entry.functions)}</td>
          <td>${formatPct(entry.branches)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(activeProfile.title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f3ec;
        --card: #fffdf8;
        --ink: #1f1a16;
        --muted: #6b6259;
        --accent: #9d3c1f;
        --border: #d9d1c7;
      }
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--ink); }
      main { max-width: 1120px; margin: 0 auto; padding: 32px 24px 64px; }
      h1, h2 { margin: 0 0 12px; }
      p { margin: 0 0 8px; color: var(--muted); }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin: 24px 0; }
      .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; }
      .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
      .metric { font-size: 28px; font-weight: 700; margin-top: 6px; }
      table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
      th, td { padding: 12px 14px; border-bottom: 1px solid var(--border); text-align: left; font-size: 14px; vertical-align: top; }
      th { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); background: #f0ebe3; }
      tr:last-child td { border-bottom: none; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
      ul { margin: 10px 0 0 18px; color: var(--muted); }
      .section { margin-top: 28px; }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">${escapeHtml(activeProfile.title)}</p>
      <h1>Playwright + V8</h1>
      <p>Gerado em ${escapeHtml(summary.generatedAt)} sobre <code>${escapeHtml(summary.methodology.scope)}</code>.</p>

      <div class="grid">
        <div class="card">
          <div class="eyebrow">Lines</div>
          <div class="metric">${formatPct(summary.summary.lines.pct)}</div>
          <p>${summary.summary.lines.covered}/${summary.summary.lines.total}</p>
        </div>
        <div class="card">
          <div class="eyebrow">Statements</div>
          <div class="metric">${formatPct(summary.summary.statements.pct)}</div>
          <p>${summary.summary.statements.covered}/${summary.summary.statements.total}</p>
        </div>
        <div class="card">
          <div class="eyebrow">Functions</div>
          <div class="metric">${formatPct(summary.summary.functions.pct)}</div>
          <p>${summary.summary.functions.covered}/${summary.summary.functions.total}</p>
        </div>
        <div class="card">
          <div class="eyebrow">Branches</div>
          <div class="metric">${formatPct(summary.summary.branches.pct)}</div>
          <p>${summary.summary.branches.covered}/${summary.summary.branches.total}</p>
        </div>
      </div>

      <div class="section">
        <h2>Suites consideradas</h2>
        <p>Playwright atual: ${summary.baseline.playwright.totalTests} testes em ${summary.baseline.playwright.totalFiles} arquivos.</p>
        <p>Suites executadas neste snapshot: <strong>${escapeHtml(summary.baseline.suitesExecutadas.join(", "))}</strong>.</p>
        <p>Smoke E2E configurado: ${summary.baseline.smoke.files} arquivos representativos.</p>
      </div>

      <div class="section">
        <h2>${escapeHtml(gateHeading)}</h2>
        <p>Meta global acordada: <strong>${summary.targets.globalGoalPct}%</strong>.</p>
        <p>${escapeHtml(gateDescription)}</p>
        <p>Gates ativos: lines ${summary.targets.activeGates.lines}% | statements ${summary.targets.activeGates.statements}% | functions ${summary.targets.activeGates.functions}% | branches ${summary.targets.activeGates.branches}%.</p>
        <p>Snapshot atual: lines ${summary.targets.snapshotPct.lines}% | statements ${summary.targets.snapshotPct.statements}% | functions ${summary.targets.snapshotPct.functions}% | branches ${summary.targets.snapshotPct.branches}%.</p>
        <p>Piso inicial por arquivo alterado no core: ${summary.targets.changedFilesLinesPct}% em lines.</p>
        <ul>${milestones}</ul>
      </div>

      ${
        historyRows
          ? `<div class="section">
        <h2>Tendencia Recente</h2>
        <table>
          <thead>
            <tr>
              <th>Gerado Em</th>
              <th>Perfil</th>
              <th>Suites</th>
              <th>Lines</th>
              <th>Statements</th>
              <th>Functions</th>
              <th>Branches</th>
            </tr>
          </thead>
          <tbody>${historyRows}</tbody>
        </table>
      </div>`
          : ""
      }

      <div class="section">
        <h2>Breakdown por Grupo</h2>
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Arquivos</th>
              <th>Lines</th>
              <th>Statements</th>
              <th>Functions</th>
              <th>Branches</th>
            </tr>
          </thead>
          <tbody>${groups}</tbody>
        </table>
      </div>

      <div class="section">
        <h2>Top Gaps</h2>
        <table>
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Lines</th>
              <th>Statements</th>
              <th>Functions</th>
              <th>Branches</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="section">
        <h2>Notas</h2>
        <ul>
          ${summary.methodology.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
        </ul>
      </div>
    </main>
  </body>
</html>`;
}

function renderMarkdown(summary, history = []) {
  const gatesSectionTitle =
    summary.profile === "full" ? "Baseline Informacional E Meta" : "Meta Incremental E Gates Ativos";
  const gateContextLines =
    summary.profile === "full"
      ? [
          "- Este perfil acompanha o repositorio inteiro e continua informacional.",
          "- O gate obrigatorio de 60% fica no perfil `core`, usado pelos scripts padrao de `coverage:*` para merge.",
        ]
      : [
          "- Este perfil `core` e o gate obrigatorio da trilha.",
          "- Os scripts padrao de `coverage:report`, `coverage:baseline` e `coverage:gate` operam neste perfil.",
        ];
  const topGroups = summary.groups
    .slice()
    .sort((left, right) => left.lines.pct - right.lines.pct)
    .slice(0, 8)
    .map(
      (group) =>
        `| ${group.group} | ${group.fileCount} | ${formatMetric(group.lines)} | ${formatMetric(group.statements)} | ${formatMetric(group.functions)} | ${formatMetric(group.branches)} |`,
    )
    .join("\n");

  const topFiles = summary.topGaps
    .slice(0, 10)
    .map(
      (file) =>
        `| ${file.path} | ${formatMetric(file.lines)} | ${formatMetric(file.statements)} | ${formatMetric(file.functions)} | ${formatMetric(file.branches)} |`,
    )
    .join("\n");

  const recentHistory = history
    .slice()
    .reverse()
    .slice(0, 8)
    .map(
      (entry) =>
        `| ${entry.generatedAt} | ${entry.profile} | ${(entry.suitesExecutadas ?? []).join(", ")} | ${formatPct(entry.lines)} | ${formatPct(entry.statements)} | ${formatPct(entry.functions)} | ${formatPct(entry.branches)} |`,
    )
    .join("\n");

  return `# ${activeProfile.title}

## Snapshot

- Gerado em: \`${summary.generatedAt}\`
- Perfil: \`${summary.profile}\`
- Escopo instrumentado atual: \`${summary.methodology.scope}\`
- Runtime de coleta: \`V8\` via \`NODE_V8_COVERAGE\`
- Suites consideradas:
  - Playwright unit: \`${summary.baseline.playwright.unit.tests}\` testes em \`${summary.baseline.playwright.unit.files}\` arquivos
  - Playwright e2e: \`${summary.baseline.playwright.e2e.tests}\` testes em \`${summary.baseline.playwright.e2e.files}\` arquivos
  - Smoke e2e de coverage: \`${summary.baseline.smoke.files}\` arquivos
- Suites executadas neste snapshot: \`${summary.baseline.suitesExecutadas.join(", ")}\`
- Baseline funcional atual do repositorio: \`${summary.baseline.playwright.totalTests}\` testes Playwright em \`${summary.baseline.playwright.totalFiles}\` arquivos

## Coverage Atual

| Metrica | Coberto | Total | Percentual |
| --- | ---: | ---: | ---: |
| Lines | ${summary.summary.lines.covered} | ${summary.summary.lines.total} | ${formatPct(summary.summary.lines.pct)} |
| Statements | ${summary.summary.statements.covered} | ${summary.summary.statements.total} | ${formatPct(summary.summary.statements.pct)} |
| Functions | ${summary.summary.functions.covered} | ${summary.summary.functions.total} | ${formatPct(summary.summary.functions.pct)} |
| Branches | ${summary.summary.branches.covered} | ${summary.summary.branches.total} | ${formatPct(summary.summary.branches.pct)} |

## ${gatesSectionTitle}

- Meta global desta trilha: \`${summary.targets.globalGoalPct}%\`
${gateContextLines.join("\n")}
- Gates ativos:
  - Lines: \`${summary.targets.activeGates.lines}%\`
  - Statements: \`${summary.targets.activeGates.statements}%\`
  - Functions: \`${summary.targets.activeGates.functions}%\`
  - Branches: \`${summary.targets.activeGates.branches}%\`
- Snapshot atual:
  - Lines: \`${summary.targets.snapshotPct.lines}%\`
  - Statements: \`${summary.targets.snapshotPct.statements}%\`
  - Functions: \`${summary.targets.snapshotPct.functions}%\`
  - Branches: \`${summary.targets.snapshotPct.branches}%\`
- Piso inicial por arquivo alterado: \`${summary.targets.changedFilesLinesPct}%\` em lines
- Marcos intermediarios:
${summary.targets.milestones.map((milestone) => `  - ${milestone.name}: \`${milestone.targetPct}%\` focando ${milestone.focus}`).join("\n")}
- Politica operacional:
${summary.targets.policy.map((item) => `  - ${item}`).join("\n")}

## Smoke E2E Configurado

${summary.baseline.smoke.specs.map((spec) => `- \`${spec}\``).join("\n")}

${recentHistory ? `## Tendencia Recente

| Gerado Em | Perfil | Suites | Lines | Statements | Functions | Branches |
| --- | --- | --- | ---: | ---: | ---: | ---: |
${recentHistory}

` : ""}## Grupos Prioritarios

| Grupo | Arquivos | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: | ---: |
${topGroups}

## Top Gaps Por Arquivo

| Arquivo | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: |
${topFiles}

## Notas Metodologicas

${summary.methodology.notes.map((note) => `- ${note}`).join("\n")}

## Exclusions Basicas

${summary.methodology.exclusions.map((item) => `- \`${item}\``).join("\n")}

## Artefatos

- \`coverage/summary.json\`
- \`coverage/summary.${activeProfile.artifactPrefix}.json\`
- \`coverage/lcov.info\`
- \`coverage/lcov.${activeProfile.artifactPrefix}.info\`
- \`coverage/index.html\`
- \`docs/${path.basename(activeProfile.docsJsonPath)}\`
- \`docs/${path.basename(activeProfile.docsMdPath)}\`
${activeProfile.historyPath ? `- \`docs/${path.basename(activeProfile.historyPath)}\`` : ""}
`;
}

function normalizeCoverageUrl(url) {
  if (typeof url !== "string" || !url.startsWith("file://")) return null;
  const filePath = fileURLToPath(url);
  if (!isPathInScope(filePath)) return null;
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) return null;
  if (filePath.endsWith(".d.ts")) return null;
  return filePath;
}

function isPathInScope(filePath) {
  return activeProfile.sourceRoots.some(
    (rootDir) => filePath === rootDir || filePath.startsWith(`${rootDir}${path.sep}`),
  );
}

function listSourceFiles(rootDirs) {
  const files = [];
  for (const rootDir of rootDirs) {
    if (!fs.existsSync(rootDir)) continue;
    for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
      const fullPath = path.join(rootDir, entry.name);
      if (entry.isDirectory()) {
        files.push(...listSourceFiles([fullPath]));
        continue;
      }
      if ((fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) && !fullPath.endsWith(".d.ts")) {
        files.push(fullPath);
      }
    }
  }
  return [...new Set(files)].sort((left, right) => left.localeCompare(right));
}

function listJsonFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJsonFiles(fullPath));
      continue;
    }
    if (fullPath.endsWith(".json")) {
      files.push(fullPath);
    }
  }
  return files;
}

function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];
  const sorted = intervals
    .map(([start, end]) => [Number(start), Number(end)])
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .sort((left, right) => left[0] - right[0]);

  if (sorted.length === 0) return [];

  const merged = [sorted[0]];
  for (const current of sorted.slice(1)) {
    const last = merged[merged.length - 1];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  return merged;
}

function overlapsAny(start, end, intervals) {
  for (const [rangeStart, rangeEnd] of intervals) {
    if (rangeEnd < start) continue;
    if (rangeStart > end) break;
    if (rangeStart <= end && rangeEnd >= start) return true;
  }
  return false;
}

function collectMeaningfulLines(sourceText) {
  const lines = sourceText.split(/\r?\n/);
  const meaningful = new Set();

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (EXECUTABLE_LINE_COMMENT_PATTERNS.some((pattern) => pattern.test(trimmed))) continue;
    meaningful.add(index + 1);
  }

  return meaningful;
}

function linesForSpan(start, end, lineStarts, meaningfulLines) {
  const startLine = lineNumberForOffset(start, lineStarts);
  const endLine = lineNumberForOffset(Math.max(start, end - 1), lineStarts);
  const lines = [];

  for (let line = startLine; line <= endLine; line += 1) {
    if (meaningfulLines.has(line)) {
      lines.push(line);
    }
  }

  return lines;
}

function lineSpan(line, lineStarts, sourceLength) {
  const start = lineStarts[line - 1] ?? 0;
  const nextStart = lineStarts[line] ?? sourceLength;
  return {
    start,
    end: nextStart,
  };
}

function lineNumberForOffset(offset, lineStarts) {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const lineStart = lineStarts[mid];
    const nextStart = lineStarts[mid + 1] ?? Number.POSITIVE_INFINITY;

    if (offset < lineStart) {
      high = mid - 1;
    } else if (offset >= nextStart) {
      low = mid + 1;
    } else {
      return mid + 1;
    }
  }

  return Math.max(1, Math.min(lineStarts.length, low + 1));
}

function resolveGroup(relativePath) {
  const parts = relativePath.split("/");
  if (parts.length < 2) return relativePath;
  if (parts[0] !== "src") return parts[0];
  if (parts[1] === "lib" && parts[2]) return `src/lib/${parts[2]}`;
  return `src/${parts[1]}`;
}

function withPct(metric) {
  return {
    covered: metric.covered,
    total: metric.total,
    pct: metric.total === 0 ? 100 : (metric.covered / metric.total) * 100,
  };
}

function accumulateMetric(target, source) {
  target.covered += source.covered;
  target.total += source.total;
}

function sumMapValues(map) {
  let total = 0;
  for (const value of map.values()) total += value;
  return total;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeLcovName(name) {
  return name.replaceAll(",", "_");
}

function formatPct(value) {
  if (value == null || !Number.isFinite(value)) return "NaN%";
  return `${value.toFixed(2)}%`;
}

function toRoundedPct(value) {
  if (value == null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(2));
}

function formatMetric(metric) {
  return `${formatPct(metric.pct)} (${metric.covered}/${metric.total})`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

main();

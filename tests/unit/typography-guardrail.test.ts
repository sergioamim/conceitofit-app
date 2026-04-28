import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const repoRoot = resolve(__dirname, "../..");
const sourceRoots = [
  "src/app/(portal)",
  "src/app/(backoffice)",
  "src/components",
  "src/features",
];

const allowedDisplaySmallFiles = new Set([
  "src/components/public/public-journey-shell.tsx",
  "src/components/storefront/storefront-planos.tsx",
  "src/components/storefront/storefront-unidades.tsx",
  "src/components/layout/sidebar.tsx",
  "src/components/layout/app-topbar.tsx",
  "src/components/auth/admin-login-flow.tsx",
  "src/components/auth/global-login-flow.tsx",
]);

const ignoredPathFragments = [
  "/(public)/",
  "/(cliente)/",
  "/storefront/",
  "/modern-showcase/",
  "/monitor/",
  "/debug/",
];

const forbiddenPatterns = [
  /\bfont-display\s+text-(?:xs|sm|base)\b/,
  /\btext-(?:xs|sm|base)\s+font-display\b/,
  /\bfont-display\s+text-\[(?:10|11|12|13|14|15|16)px\]\b/,
  /\btext-\[(?:10|11|12|13|14|15|16)px\]\s+font-display\b/,
  /DialogTitle[^>\n]*className=["{][^"\n}]*font-display/,
  /SheetTitle[^>\n]*className=["{][^"\n}]*font-display/,
];

function listSourceFiles(dir: string): string[] {
  const absDir = resolve(repoRoot, dir);
  const files: string[] = [];

  for (const entry of readdirSync(absDir)) {
    const absEntry = join(absDir, entry);
    const stats = statSync(absEntry);

    if (stats.isDirectory()) {
      files.push(...listSourceFiles(relative(repoRoot, absEntry)));
      continue;
    }

    if (/\.(tsx|ts)$/.test(entry) && !/\.(test|spec)\./.test(entry)) {
      files.push(relative(repoRoot, absEntry));
    }
  }

  return files;
}

describe("typography guardrail", () => {
  it("não usa font-display em microtipografia operacional", () => {
    const violations = sourceRoots
      .flatMap(listSourceFiles)
      .filter((file) => !allowedDisplaySmallFiles.has(file))
      .filter((file) => !ignoredPathFragments.some((fragment) => file.includes(fragment)))
      .flatMap((file) => {
        const content = readFileSync(resolve(repoRoot, file), "utf8");
        return forbiddenPatterns.flatMap((pattern) =>
          [...content.matchAll(new RegExp(pattern, "g"))].map((match) => `${file}: ${match[0]}`),
        );
      });

    expect(violations).toEqual([]);
  });
});

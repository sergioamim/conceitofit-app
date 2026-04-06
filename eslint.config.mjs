import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const runtimeFiles = ["src/**/*.{ts,tsx}"];
const testFiles = ["tests/**/*.{ts,tsx}"];
const localStorageAllowedFiles = [
  "src/lib/api/http.ts",
  "src/lib/public/storage.ts",
  "src/app/(backoffice)/admin/importacao-evo-p0/page.tsx",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [...runtimeFiles, ...testFiles],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/mock", "@/lib/mock/*", "**/src/lib/mock", "**/src/lib/mock/*"],
              message: "O runtime backend-only não permite reintroduzir imports de src/lib/mock.",
            },
          ],
        },
      ],
    },
  },
  {
    files: runtimeFiles,
    ignores: localStorageAllowedFiles,
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "localStorage",
          message: "Use API/Session ou um draft transitório documentado; localStorage operacional está proibido.",
        },
      ],
    },
  },
  // ── Import boundaries entre domínios ──────────────────────────────────
  {
    files: runtimeFiles,
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
      "boundaries/elements": [
        { type: "shared",     pattern: "src/lib/shared/**" },
        { type: "api",        pattern: "src/lib/api/**" },
        { type: "tenant",     pattern: "src/lib/tenant/**" },
        { type: "backoffice", pattern: "src/lib/backoffice/**" },
        { type: "public",     pattern: "src/lib/public/**" },
        { type: "forms",      pattern: "src/lib/forms/**" },
        { type: "hooks",      pattern: "src/hooks/**" },
        { type: "components", pattern: "src/components/**" },
        { type: "app",        pattern: "src/app/**" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          rules: [
            {
              // tenant NÃO importa backoffice
              from: { type: "tenant" },
              disallow: { to: { type: "backoffice" } },
              message: "Domínio tenant não pode importar de backoffice. Use shared para código comum.",
            },
            {
              // backoffice NÃO importa tenant
              from: { type: "backoffice" },
              disallow: { to: { type: "tenant" } },
              message: "Domínio backoffice não pode importar de tenant. Use shared para código comum.",
            },
            {
              // public NÃO importa backoffice, hooks ou components
              from: { type: "public" },
              disallow: { to: { type: ["backoffice", "hooks", "components"] } },
              message: "Domínio public não pode importar de backoffice, hooks ou components. Use shared/api/forms.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "max-lines": ["warn", { max: 500, skipBlankLines: true, skipComments: true }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".coverage/**",
    "coverage/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;

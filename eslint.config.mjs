import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const runtimeFiles = ["src/**/*.{ts,tsx}"];
const testFiles = ["tests/**/*.{ts,tsx}"];
const localStorageAllowedFiles = [
  "src/lib/api/session.ts",
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

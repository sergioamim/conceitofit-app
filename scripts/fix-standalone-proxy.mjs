/**
 * Workaround: Next.js 16 + proxy.ts + output: 'standalone'
 *
 * Durante "Finalizing page optimization", o build tenta ler
 * .next/server/middleware.js.nft.json e copiar middleware.js para
 * standalone — mas proxy.ts nao gera esses arquivos.
 *
 * Solucao: criar stubs e recriar via polling durante o build,
 * parando o polling assim que "Finalizing" inicia (para nao
 * interferir com o cleanup do Next.js).
 *
 * Bug: https://github.com/vercel/next.js/issues/91600
 * Fix: https://github.com/vercel/next.js/pull/91736
 *
 * TODO: Remover este script e reverter o "build" no package.json
 *       quando atualizar Next.js para a versao que inclui o PR #91736.
 *       Testar com: npm run build (deve funcionar sem este script).
 */

import { existsSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const serverDir = join(root, ".next", "server");
const nftFile = join(serverDir, "middleware.js.nft.json");
const mjsFile = join(serverDir, "middleware.js");

const NFT_STUB = JSON.stringify({ version: 1, files: [] });
const MJS_STUB = "// stub — see scripts/fix-standalone-proxy.mjs\n";
const STUB_SIZE = MJS_STUB.length;

let stopped = false;

function ensureStubs() {
  if (stopped) return;
  try {
    if (!existsSync(serverDir)) mkdirSync(serverDir, { recursive: true });
    if (!existsSync(nftFile)) writeFileSync(nftFile, NFT_STUB);
    // Only write stub if middleware.js doesn't exist — NEVER overwrite real middleware
    // Next.js compiles proxy.ts into middleware.js, so if it's larger than stub, it's the real one
    if (!existsSync(mjsFile)) {
      writeFileSync(mjsFile, MJS_STUB);
    }
  } catch {
    // ignore
  }
}

// Create stubs and poll to keep them alive during build
ensureStubs();
const poll = setInterval(ensureStubs, 300);

// Run next build, piping output through to detect "Finalizing"
const child = spawn("npx", ["next", "build"], {
  cwd: root,
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

child.stdout.on("data", (data) => {
  const text = data.toString();
  process.stdout.write(data);

  // Stop polling once build reaches finalization — stubs already in place
  if (text.includes("Finalizing")) {
    stopped = true;
    clearInterval(poll);
  }
});

child.stderr.on("data", (data) => {
  process.stderr.write(data);
});

child.on("close", (code) => {
  stopped = true;
  clearInterval(poll);
  process.exit(code ?? 0);
});

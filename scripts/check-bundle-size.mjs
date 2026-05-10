#!/usr/bin/env node
/**
 * scripts/check-bundle-size.mjs
 * Fails CI if any published package exceeds its size budget.
 */
import { stat } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Budget in bytes. Fail CI if exceeded.
const BUDGETS = {
  "@zerithdb/core":    50_000,   // 50 KB
  "@zerithdb/db":     150_000,  // 150 KB (includes Dexie)
  "@zerithdb/sync":   400_000,  // 400 KB (includes Yjs)
  "@zerithdb/network": 200_000, // 200 KB (includes simple-peer)
  "@zerithdb/auth":    80_000,  // 80 KB  (includes @noble/ed25519)
  "@zerithdb/sdk":     30_000,  // 30 KB  (thin orchestration layer)
};

const PACKAGE_DIST = {
  "@zerithdb/core":    "packages/core/dist/index.js",
  "@zerithdb/db":      "packages/db/dist/index.js",
  "@zerithdb/sync":    "packages/sync/dist/index.js",
  "@zerithdb/network": "packages/network/dist/index.js",
  "@zerithdb/auth":    "packages/auth/dist/index.js",
  "@zerithdb/sdk":     "packages/sdk/dist/index.js",
};

let failed = false;

for (const [pkg, distPath] of Object.entries(PACKAGE_DIST)) {
  const budget = BUDGETS[pkg];
  const fullPath = resolve(root, distPath);

  try {
    const { size } = await stat(fullPath);
    const kb = (size / 1024).toFixed(1);
    const budgetKb = (budget / 1024).toFixed(0);
    const status = size <= budget ? "✅" : "❌";

    console.log(`${status} ${pkg.padEnd(25)} ${kb.padStart(7)} KB  (budget: ${budgetKb} KB)`);

    if (size > budget) {
      failed = true;
    }
  } catch {
    console.log(`⚠️  ${pkg.padEnd(25)} dist not found — skipping (run pnpm build first)`);
  }
}

if (failed) {
  console.error("\n❌ Bundle size budget exceeded. Investigate with: npx bundlephobia");
  process.exit(1);
} else {
  console.log("\n✅ All bundle sizes within budget.");
}

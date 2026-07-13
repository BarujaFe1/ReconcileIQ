/**
 * Capture portfolio screenshots from the local demo (synthetic data only).
 * Usage: node scripts/capture_screenshots.mjs [baseUrl]
 */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "assets", "screenshots");
const baseUrl = process.argv[2] || "http://127.0.0.1:3005";

fs.mkdirSync(OUT, { recursive: true });

const shots = [
  { name: "01-matching-workbench.png", wait: "text=Matching workbench" },
  { name: "02-exception-inbox.png", scroll: "text=Exception inbox" },
  { name: "03-confidence-score.png", scroll: "text=Financial leakage board" },
  { name: "04-diff-viewer.png", wait: "text=Order side" },
  { name: "05-financial-leakage-board.png", scroll: "text=Financial leakage board" },
  { name: "06-audit-trail.png", scroll: "text=Audit trail" },
  { name: "07-monthly-close.png", scroll: "text=OpsLedger vs ReconcileIQ" },
  { name: "08-executive-memo.png", scroll: "text=Methodology" },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("text=ReconcileIQ", { timeout: 30000 });
await page.waitForTimeout(1500);

// Prefer fuzzy pair for workbench storytelling
const fuzzyFilter = page.locator("#match-filter");
if (await fuzzyFilter.count()) {
  await fuzzyFilter.selectOption("fuzzy");
  await page.waitForTimeout(400);
  const firstRow = page.locator("table tbody tr").first();
  if (await firstRow.count()) await firstRow.click();
  await page.waitForTimeout(400);
}

for (const shot of shots) {
  if (shot.scroll) {
    const loc = page.locator(shot.scroll).first();
    if (await loc.count()) await loc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  if (shot.wait) {
    await page.waitForSelector(shot.wait, { timeout: 10000 }).catch(() => null);
  }
  const file = path.join(OUT, shot.name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", shot.name, fs.statSync(file).size);
}

// Hero-style full viewport after reset to all filter
if (await fuzzyFilter.count()) {
  await fuzzyFilter.selectOption("all");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}
await page.screenshot({
  path: path.join(ROOT, "assets", "hero-cover.png"),
  fullPage: false,
});
console.log("wrote hero-cover.png");

await browser.close();

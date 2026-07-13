/**
 * Capture portfolio screenshots from the local demo (synthetic data only).
 * Run from apps/web: node scripts/capture_screenshots.mjs [baseUrl]
 */
const { chromium } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = path.resolve(__dirname, "../../..");
const OUT = path.join(ROOT, "assets", "screenshots");
const baseUrl = process.argv[2] || "http://127.0.0.1:3005";

fs.mkdirSync(OUT, { recursive: true });

const shots = [
  { name: "01-matching-workbench.png", prepare: "fuzzy" },
  { name: "02-exception-inbox.png", scroll: "Exception inbox" },
  { name: "03-confidence-score.png", scroll: "Financial leakage board" },
  { name: "04-diff-viewer.png", prepare: "fuzzy" },
  { name: "05-financial-leakage-board.png", scroll: "Financial leakage board" },
  { name: "06-audit-trail.png", scroll: "Audit trail" },
  { name: "07-monthly-close.png", scroll: "OpsLedger vs ReconcileIQ" },
  { name: "08-executive-memo.png", scroll: "Methodology" },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("text=ReconcileIQ", { timeout: 30000 });
  await page.waitForTimeout(1200);

  async function prepareFuzzy() {
    const fuzzyFilter = page.locator("#match-filter");
    if (await fuzzyFilter.count()) {
      await fuzzyFilter.selectOption("fuzzy");
      await page.waitForTimeout(300);
      const firstRow = page.locator("table tbody tr").first();
      if (await firstRow.count()) await firstRow.click();
      await page.waitForTimeout(300);
    }
  }

  for (const shot of shots) {
    if (shot.prepare === "fuzzy") await prepareFuzzy();
    if (shot.scroll) {
      const loc = page.getByText(shot.scroll, { exact: false }).first();
      if (await loc.count()) await loc.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
    }
    const file = path.join(OUT, shot.name);
    await page.screenshot({ path: file, fullPage: false });
    console.log("wrote", shot.name, fs.statSync(file).size);
  }

  const filter = page.locator("#match-filter");
  if (await filter.count()) await filter.selectOption("all");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(ROOT, "assets", "hero-cover.png"),
    fullPage: false,
  });
  console.log("wrote hero-cover.png");

  // Social preview crop-ish full viewport
  await page.screenshot({
    path: path.join(ROOT, "assets", "social-preview.png"),
    fullPage: false,
  });
  console.log("wrote social-preview.png");

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

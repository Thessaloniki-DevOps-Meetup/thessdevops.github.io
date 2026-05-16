import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(here, 'og-template.html');
const outPath = resolve(here, '..', 'public', 'og-image.png');

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

await page.goto(pathToFileURL(templatePath).href, { waitUntil: 'networkidle' });
await page.screenshot({ path: outPath, type: 'png', omitBackground: false });

await browser.close();
console.log(`✓ wrote ${outPath}`);

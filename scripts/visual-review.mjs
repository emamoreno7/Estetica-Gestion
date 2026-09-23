import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:4173/Estetica-Gestion/';
const output = 'visual-review';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const views = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'mobile-small', width: 320, height: 700 },
];
const report = [];
let failed = false;
for (const size of views) {
  const page = await browser.newPage({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.locator('#amore-hero-title').waitFor({ timeout: 15_000 });
  await page.waitForTimeout(1300);
  await page.screenshot({ path: output + '/' + size.name + '.png', fullPage: true, animations: 'disabled' });
  const check = await page.evaluate(() => {
    const img = document.querySelector('.amore-hero__visual img');
    const rect = img?.getBoundingClientRect();
    const h = document.querySelector('.amore-header')?.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      heroImageLoaded: Boolean(img?.complete && img.naturalWidth),
      heroImageWidth: img?.naturalWidth ?? 0,
      heroRect: rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      headerRect: h && { x: h.x, y: h.y, width: h.width, height: h.height },
      catalogueCardCount: document.querySelectorAll('.amore-services__service').length,
      catalogueCoverCount: document.querySelectorAll('.amore-services__featured-card').length,
      missingImages: Array.from(document.querySelectorAll('img')).filter(img => img.complete && !img.naturalWidth).map(img => img.src),
      heroFont: getComputedStyle(document.querySelector('#amore-hero-title')).fontFamily,
    };
  });
  let mobileMenu = null;
  if (size.width <= 760) {
    const trigger = page.getByRole('button', { name: 'Abrir menú' });
    await trigger.click();
    mobileMenu = await page.locator('#amore-nav').isVisible();
    await page.screenshot({ path: output + '/' + size.name + '-menu.png', animations: 'disabled' });
  }
  const result = { viewport: size.name, httpStatus: response?.status(), ...check, mobileMenu, errors };
  console.log(JSON.stringify(result));
  report.push(result);
  if (result.documentWidth > size.width + 2 || !result.heroImageLoaded || result.httpStatus !== 200 || !mobileMenu && size.width <= 760 || errors.length) failed = true;
  await page.close();
}
await browser.close();
await writeFile(output + '/report.json', JSON.stringify(report, null, 2));
if (failed) process.exitCode = 1;

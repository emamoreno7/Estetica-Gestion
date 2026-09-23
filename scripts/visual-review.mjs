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
  // Desplazamiento real para activar imágenes lazy y animaciones mientras se revisa la página completa.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(400, innerHeight - 100)) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  const initialMetrics = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    const scripts = resources.filter(r => r.initiatorType === 'script');
    const images = resources.filter(r => r.initiatorType === 'img');
    return {
      scriptTransferBytes: scripts.reduce((sum,r) => sum + (r.transferSize || 0), 0),
      imageTransferBytes: images.reduce((sum,r) => sum + (r.transferSize || 0), 0),
      scriptRequests: scripts.length,
      imageRequests: images.length,
    };
  });
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
      horizontalOffenders: Array.from(document.querySelectorAll('body *')).map(el => ({ el, rect: el.getBoundingClientRect() })).filter(({el, rect}) => rect.width > 0 && (rect.right > innerWidth + 1 || rect.left < -1) && getComputedStyle(el).position !== 'fixed').slice(0, 30).map(({el, rect}) => ({tag: el.tagName, className: String(el.className).slice(0,90), text: el.textContent?.trim().slice(0,55), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width)})),
    };
  });
  let mobileMenu = null;
  let escapedMenu = null;
  if (size.width <= 760) {
    const trigger = page.getByRole('button', { name: 'Abrir menú' });
    await trigger.click();
    mobileMenu = await page.locator('#amore-nav').isVisible();
    await page.screenshot({ path: output + '/' + size.name + '-menu.png', animations: 'disabled' });
    await page.keyboard.press('Escape');
    escapedMenu = await page.getByRole('button', { name: 'Abrir menú' }).getAttribute('aria-expanded') === 'false';
  }

  // Contratos de navegación y contacto: detectan regresiones sin utilizar credenciales.
  const bookingHref = await page.locator('.amore-header__booking').getAttribute('href');
  const bookingOk = /^https:\/\/wa\.me\/[0-9]+\?/.test(bookingHref || '');
  const tabs = page.locator('.amore-services__tab');
  const handsTab = tabs.filter({ hasText: /manos/i }).first();
  const handsAvailable = await handsTab.count() > 0;
  let handsCards = null;
  if (handsAvailable) {
    await handsTab.click();
    handsCards = await page.locator('.amore-services__service').count();
    await tabs.first().click();
  }
  const result = {
    viewport: size.name, httpStatus: response?.status(), ...check,
    mobileMenu, escapedMenu, bookingOk, handsCards, initialMetrics, errors
  };
  console.log(JSON.stringify(result));
  report.push(result);
  if (result.documentWidth > size.width + 2 || !result.heroImageLoaded || result.httpStatus !== 200 ||
      !bookingOk || (handsAvailable && !handsCards) ||
      (size.width <= 760 && (!mobileMenu || !escapedMenu)) || errors.length) failed = true;
  await page.close();
}
await browser.close();
await writeFile(output + '/report.json', JSON.stringify(report, null, 2));
if (failed) process.exitCode = 1;

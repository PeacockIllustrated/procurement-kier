import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const DIR = 'docs/screenshots';
mkdirSync(DIR, { recursive: true });

const MOBILE = { width: 375, height: 812 };
const BASE = 'http://localhost:3000';
const SHOP_PW = 'Persimmon-signage-2026';
const ADMIN_PW = 'Onesign-Persimmon-admin';

async function waitForSplash(page) {
  // Wait for splash screen to fully exit (2.6s animation + buffer)
  await page.waitForTimeout(3500);
}

async function shot(page, name, opts = {}) {
  if (opts.scrollTo !== undefined) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), opts.scrollTo);
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: opts.fullPage || false });
  console.log(`  -> ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: MOBILE });
  const page = await ctx.newPage();

  // 1. Login page
  console.log('1. Login page');
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="password"]');
  await waitForSplash(page);
  await shot(page, '01-login');

  // 2. Login -> Homepage
  console.log('2. Logging in...');
  await page.fill('input[type="password"]', SHOP_PW);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');
  await waitForSplash(page);
  await shot(page, '02-homepage');
  await shot(page, '02-homepage-scroll', { scrollTo: 400 });
  await shot(page, '02-homepage-full', { fullPage: true });

  // 3. Category page - environmental signs (has images)
  console.log('3. Category page');
  await page.goto(`${BASE}/category/environmental-signs`);
  await waitForSplash(page);
  await shot(page, '03-category');
  await shot(page, '03-category-full', { fullPage: true });

  // 4. Product detail - pick one with a good image
  console.log('4. Product detail');
  await page.goto(`${BASE}/product/PA115`);
  await waitForSplash(page);
  await shot(page, '04-product');
  await shot(page, '04-product-full', { fullPage: true });

  // 5. Add to basket and see toast
  console.log('5. Adding to basket');
  const addBtn = page.locator('button:has-text("Add to Basket")').first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(500);
    await shot(page, '05-added-toast');
  }

  // 6. Add another product for a fuller basket
  console.log('6. Adding second product');
  await page.goto(`${BASE}/product/PA520`);
  await waitForSplash(page);
  await shot(page, '06-product-detail');
  const addBtn2 = page.locator('button:has-text("Add to Basket")').first();
  if (await addBtn2.isVisible()) {
    await addBtn2.click();
    await page.waitForTimeout(500);
  }

  // 7. Basket page
  console.log('7. Basket page');
  await page.goto(`${BASE}/basket`);
  await waitForSplash(page);
  await shot(page, '07-basket');
  await shot(page, '07-basket-full', { fullPage: true });

  // 8. Checkout page
  console.log('8. Checkout page');
  await page.goto(`${BASE}/checkout`);
  await waitForSplash(page);
  await shot(page, '08-checkout');
  await shot(page, '08-checkout-scroll', { scrollTo: 600 });
  await shot(page, '08-checkout-full', { fullPage: true });

  // 9. Custom sign builder
  console.log('9. Custom sign builder');
  await page.goto(`${BASE}/custom-sign`);
  await waitForSplash(page);
  await shot(page, '09-custom-sign');
  // Fill in the form for a richer preview
  const typeSelect = page.locator('select').first();
  if (await typeSelect.count() > 0) {
    await typeSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
  }
  const textarea = page.locator('textarea').first();
  if (await textarea.count() > 0) {
    await textarea.fill('Caution: Site entrance ahead');
    await page.waitForTimeout(300);
  }
  await shot(page, '09-custom-sign-filled', { scrollTo: 0 });
  await shot(page, '09-custom-sign-preview', { scrollTo: 800 });
  await shot(page, '09-custom-sign-full', { fullPage: true });

  // 10. Orders page
  console.log('10. Orders page');
  await page.goto(`${BASE}/orders`);
  await waitForSplash(page);
  await shot(page, '10-orders');
  await shot(page, '10-orders-full', { fullPage: true });

  // Try to expand an order
  const orderChevron = page.locator('svg[class*="chevron"], button[aria-label*="expand"], [class*="cursor-pointer"]').first();
  if (await orderChevron.count() > 0) {
    await orderChevron.click();
    await page.waitForTimeout(1000);
    await shot(page, '10-order-expanded', { fullPage: true });
  }

  // ---- ADMIN SECTION ----
  console.log('\n--- ADMIN SECTION ---');

  // 11. Admin login
  console.log('11. Admin login');
  await ctx.clearCookies();
  await page.goto(`${BASE}/login?mode=admin`);
  await waitForSplash(page);
  await page.waitForSelector('input[type="password"]');
  await shot(page, '11-admin-login');
  await page.fill('input[type="password"]', ADMIN_PW);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  // 12. Admin dashboard - Orders tab
  console.log('12. Admin dashboard');
  await page.goto(`${BASE}/admin`);
  await waitForSplash(page);
  await shot(page, '12-admin-orders');
  await shot(page, '12-admin-orders-full', { fullPage: true });

  // 13. Expand an order to show detail / PO handling
  console.log('13. Admin order detail');
  // Click the chevron/expand on first order
  const adminSnapshot = await page.content();
  // Try clicking on the order card area or chevron
  const chevronSvg = page.locator('[class*="chevron"], [data-testid*="expand"]').first();
  const orderClickable = page.locator('div.cursor-pointer, tr.cursor-pointer').first();

  if (await chevronSvg.count() > 0) {
    await chevronSvg.click();
    await page.waitForTimeout(1000);
    await shot(page, '13-admin-order-detail', { fullPage: true });
  } else if (await orderClickable.count() > 0) {
    await orderClickable.click();
    await page.waitForTimeout(1000);
    await shot(page, '13-admin-order-detail', { fullPage: true });
  } else {
    // Try the order number text area
    const orderNum = page.locator('text=/PER-/').first();
    if (await orderNum.count() > 0) {
      await orderNum.click();
      await page.waitForTimeout(1000);
      await shot(page, '13-admin-order-detail', { fullPage: true });
    }
  }

  // 14. Suggestions tab
  console.log('14. Admin suggestions tab');
  const sugTab = page.locator('button:has-text("Suggestions")').first();
  if (await sugTab.count() > 0) {
    await sugTab.click();
    await page.waitForTimeout(1000);
    await shot(page, '14-admin-suggestions');
  }

  // ---- ONBOARDING GUIDE EXTRAS ----
  console.log('\n--- ONBOARDING GUIDE EXTRAS ---');

  // 15. Order confirmation page (needs shop auth)
  console.log('15. Order confirmation page');
  await ctx.clearCookies();
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="password"]');
  await waitForSplash(page);
  await page.fill('input[type="password"]', SHOP_PW);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');
  await waitForSplash(page);
  await page.goto(`${BASE}/order-confirmation?order=PER-20260318-DEMO`);
  await waitForSplash(page);
  await shot(page, '15-order-confirmation');

  // 16. PO upload page (use admin auth to bypass token)
  console.log('16. PO upload page');
  await ctx.clearCookies();
  await page.goto(`${BASE}/login?mode=admin`);
  await page.waitForSelector('input[type="password"]');
  await waitForSplash(page);
  await page.fill('input[type="password"]', ADMIN_PW);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  await page.goto(`${BASE}/po-upload/PER-20260318-DEMO`);
  await waitForSplash(page);
  await shot(page, '16-po-upload');

  // 17. Manage contacts modal (open from checkout)
  console.log('17. Manage contacts modal');
  await page.goto(`${BASE}/product/PA520`);
  await waitForSplash(page);
  const addBtnManage = page.locator('button:has-text("Add to Basket")').first();
  if (await addBtnManage.isVisible()) {
    await addBtnManage.click();
    await page.waitForTimeout(500);
  }
  await page.goto(`${BASE}/checkout`);
  await waitForSplash(page);
  const contactSelect = page.locator('select').first();
  if (await contactSelect.count() > 0) {
    await contactSelect.selectOption({ value: '__manage__' });
    await page.waitForTimeout(1000);
  }
  await shot(page, '17-manage-contacts');

  // 18. PO email mockup (static HTML)
  console.log('18. PO email mockup');
  const emailMockupPath = new URL('./screenshots/18-po-email-mockup.html', import.meta.url).href;
  await page.goto(emailMockupPath, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await shot(page, '18-po-email-mockup');

  await browser.close();
  console.log('\nDone! All screenshots saved to docs/screenshots/');
})();

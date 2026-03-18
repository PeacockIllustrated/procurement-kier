# Onboarding Guide Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 12-page PDF onboarding guide for Persimmon Homes staff, matching the visual identity of the existing case study brochure.

**Architecture:** Fork `docs/brochure.html` into `docs/onboarding-guide.html` with all CSS embedded. Add new CSS patterns for numbered steps, tip callouts, role badges, and status tables. Extend the Playwright screenshot script for 4 new captures. Parameterise the Puppeteer PDF generator. All output is a single static HTML file rendered to PDF.

**Tech Stack:** HTML/CSS (embedded), Puppeteer (PDF generation), Playwright (screenshots)

**Spec:** `docs/superpowers/specs/2026-03-18-onboarding-guide-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `docs/onboarding-guide.html` | **Create** | 12-page HTML document with all CSS embedded — the core deliverable |
| `docs/generate-pdf.mjs` | **Modify** | Accept CLI arg for input file, default to brochure for backwards compat |
| `docs/capture-screenshots.mjs` | **Modify** | Add 4 new screenshot captures at end of existing script |
| `docs/screenshots/18-po-email-mockup.html` | **Create** | Standalone HTML email mockup for PO request screenshot |
| `docs/Persimmon-Signage-Portal-Onboarding-Guide.pdf` | **Output** | Generated PDF (not hand-edited) |

---

## Task 1: Parameterise the PDF Generator

**Files:**
- Modify: `docs/generate-pdf.mjs`

- [ ] **Step 1: Read current generate-pdf.mjs**

The current script hardcodes paths:
```js
const htmlPath = resolve(__dirname, 'brochure.html');
const pdfPath = resolve(__dirname, 'Persimmon-Signage-Portal-Brochure-v2.pdf');
```

- [ ] **Step 2: Add CLI argument support**

Replace the hardcoded paths with:
```js
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, resolve, basename } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Accept optional CLI arg: node generate-pdf.mjs [html-filename]
const inputFile = process.argv[2] || 'brochure.html';
const htmlPath = resolve(__dirname, inputFile);
const pdfName = basename(inputFile, '.html') + '.pdf';
const pdfPath = resolve(__dirname, pdfName);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
  waitUntil: 'networkidle0',
  timeout: 30000
});

await page.evaluateHandle('document.fonts.ready');

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  preferCSSPageSize: true
});

await browser.close();
console.log(`PDF generated: ${pdfPath}`);
```

- [ ] **Step 3: Verify backwards compatibility**

Run: `node docs/generate-pdf.mjs`
Expected: generates `docs/brochure.pdf` (same as before, just renamed from the hardcoded name)

Note: The existing `Persimmon-Signage-Portal-Brochure-v2.pdf` output name changes to `brochure.pdf` with this parameterisation. If the old name must be preserved, pass the full filename: `node docs/generate-pdf.mjs brochure.html` and adjust the pdfName logic to use a mapping or keep the old hardcoded default.

Alternative: keep the default output as `Persimmon-Signage-Portal-Brochure-v2.pdf` when no arg is passed, and only derive the name from the input filename when an arg IS passed:

```js
const inputFile = process.argv[2];
let htmlPath, pdfPath;
if (inputFile) {
  htmlPath = resolve(__dirname, inputFile);
  pdfPath = resolve(__dirname, basename(inputFile, '.html') + '.pdf');
} else {
  htmlPath = resolve(__dirname, 'brochure.html');
  pdfPath = resolve(__dirname, 'Persimmon-Signage-Portal-Brochure-v2.pdf');
}
```

Use this alternative approach to preserve backwards compatibility.

- [ ] **Step 4: Test with a dummy file**

Run: `node docs/generate-pdf.mjs onboarding-guide.html`
Expected: error (file doesn't exist yet) — confirms arg parsing works.

- [ ] **Step 5: Commit**

```bash
git add docs/generate-pdf.mjs
git commit -m "feat: parameterise PDF generator to accept input filename"
```

---

## Task 2: Create PO Email Mockup HTML

The PO upload page (page 10) needs a screenshot of the email a purchaser receives. Since we can't capture a real email, we create a static HTML mockup and screenshot it.

**Files:**
- Create: `docs/screenshots/18-po-email-mockup.html`

- [ ] **Step 1: Create the email mockup HTML**

Create `docs/screenshots/18-po-email-mockup.html`:

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=375, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    padding: 20px 16px;
    color: #1a1d21;
    width: 375px;
  }
  .email-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    overflow: hidden;
  }
  .email-header {
    background: #00474A;
    padding: 24px 20px;
    text-align: center;
  }
  .email-header h1 {
    color: white;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .email-header p {
    color: rgba(255,255,255,0.6);
    font-size: 13px;
  }
  .email-body {
    padding: 20px;
  }
  .email-body p {
    font-size: 14px;
    line-height: 1.6;
    color: #4a5568;
    margin-bottom: 16px;
  }
  .order-ref {
    background: #f8f6f2;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .order-ref .label {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .order-ref .value {
    font-size: 15px;
    font-weight: 600;
    color: #00474A;
  }
  .items-summary {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #4a5568;
  }
  .items-summary .row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
  }
  .items-summary .total {
    border-top: 1px solid #e2e8f0;
    margin-top: 8px;
    padding-top: 8px;
    font-weight: 600;
    color: #1a1d21;
  }
  .cta-btn {
    display: block;
    width: 100%;
    background: #3DB28C;
    color: white;
    text-align: center;
    padding: 14px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    margin-bottom: 12px;
  }
  .email-footer {
    text-align: center;
    font-size: 12px;
    color: #94a3b8;
    padding: 0 20px 20px;
    line-height: 1.5;
  }
</style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <h1>Purchase Order Request</h1>
      <p>Persimmon Signage Portal</p>
    </div>
    <div class="email-body">
      <p>Hi Sarah,</p>
      <p>A purchase order is needed for the following signage order. Please review the details below and attach your PO document.</p>

      <div class="order-ref">
        <div>
          <div class="label">Order Reference</div>
          <div class="value">PER-20260318-Y4K2</div>
        </div>
        <div>
          <div class="label">Site</div>
          <div class="value" style="font-size: 13px;">Fallow Park Phase 3</div>
        </div>
      </div>

      <div class="items-summary">
        <div class="row"><span>PA115 — Site Setup Pack &times;1</span><span>&pound;437.39</span></div>
        <div class="row"><span>PA520 — Paint Tins &times;2</span><span>&pound;6.92</span></div>
        <div class="row"><span>PCF151 — Site Organisation &times;1</span><span>&pound;19.22</span></div>
        <div class="row total"><span>Total (inc. VAT)</span><span>&pound;555.64</span></div>
      </div>

      <a href="#" class="cta-btn">Attach Purchase Order</a>
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">This link is unique to this order. No login required.</p>
    </div>
    <div class="email-footer">
      Onesign and Digital &bull; D86 Princesway, Gateshead NE11 0TU<br>
      onesignanddigital.com &bull; 0191 487 6767
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 2: Preview in browser**

Open `docs/screenshots/18-po-email-mockup.html` in a browser. Verify it looks like a professional email notification at 375px width.

- [ ] **Step 3: Commit**

```bash
git add docs/screenshots/18-po-email-mockup.html
git commit -m "feat: add PO email mockup HTML for onboarding guide screenshot"
```

---

## Task 3: Extend Screenshot Capture Script

**Files:**
- Modify: `docs/capture-screenshots.mjs`

- [ ] **Step 1: Add new captures at end of script**

Before the `await browser.close()` line (currently line 188), add the following new screenshot captures. Insert them after the admin suggestions section (line 186) and before `await browser.close()`:

```js
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
  // Navigate to confirmation page with a demo order number
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
  // First add an item to basket so checkout is accessible
  await page.goto(`${BASE}/product/PA520`);
  await waitForSplash(page);
  const addBtnManage = page.locator('button:has-text("Add to Basket")').first();
  if (await addBtnManage.isVisible()) {
    await addBtnManage.click();
    await page.waitForTimeout(500);
  }
  await page.goto(`${BASE}/checkout`);
  await waitForSplash(page);
  // Select "Manage contacts..." from the contact dropdown
  const contactSelect = page.locator('select').first();
  if (await contactSelect.count() > 0) {
    await contactSelect.selectOption({ label: /manage/i });
    await page.waitForTimeout(1000);
  }
  await shot(page, '17-manage-contacts');

  // 18. PO email mockup (static HTML)
  console.log('18. PO email mockup');
  const emailMockupPath = new URL('./screenshots/18-po-email-mockup.html', import.meta.url).href;
  await page.goto(emailMockupPath, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await shot(page, '18-po-email-mockup');
```

- [ ] **Step 2: Test the extended script**

Run: `node docs/capture-screenshots.mjs`
Expected: All existing screenshots still captured, plus 4 new files:
- `docs/screenshots/15-order-confirmation.png`
- `docs/screenshots/16-po-upload.png`
- `docs/screenshots/17-manage-contacts.png`
- `docs/screenshots/18-po-email-mockup.png`

Note: This requires the local dev server running at `http://localhost:3000`. Start it first with `cd shop && npm run dev`.

Note: Screenshots 15-17 depend on app state. The order confirmation page may show a "not found" state if the order number doesn't exist — that's acceptable for a mockup screenshot, or use a real order number from the database. Screenshot 17 depends on having contacts in the database. If the "Manage contacts..." option doesn't appear or the select option text doesn't match, adjust the locator strategy (try `selectOption({ value: '__manage__' })` based on the checkout page code).

- [ ] **Step 3: Commit**

```bash
git add docs/capture-screenshots.mjs docs/screenshots/15-order-confirmation.png docs/screenshots/16-po-upload.png docs/screenshots/17-manage-contacts.png docs/screenshots/18-po-email-mockup.png
git commit -m "feat: add 4 new screenshot captures for onboarding guide"
```

---

## Task 4: Build the Onboarding Guide HTML — Cover & CSS Foundation

This is the main deliverable. We build it in stages across Tasks 4-7 to keep each task focused.

**Files:**
- Create: `docs/onboarding-guide.html`

- [ ] **Step 1: Create the HTML file with full CSS**

Create `docs/onboarding-guide.html`. Start with the complete `<head>` section including ALL CSS (inherited from brochure + new instructional patterns). This file will contain all 12 pages by the end of Task 7.

The CSS section should include everything from `docs/brochure.html` lines 7-396 (the entire `<style>` block), plus these new rules appended before the closing `</style>`:

```css
/* ═══ NUMBERED STEPS ═══ */
.steps { list-style: none; padding: 0; margin: 3mm 0; }
.steps li {
  display: flex;
  align-items: flex-start;
  gap: 3mm;
  padding: 2mm 0;
  font-size: 10.5pt;
  color: var(--mid);
  line-height: 1.6;
}
.step-num {
  width: 16px;
  height: 16px;
  min-width: 16px;
  background: var(--teal);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8pt;
  font-weight: 700;
  margin-top: 2px;
  font-family: 'DM Sans', sans-serif;
}

/* ═══ TIP CALLOUT ═══ */
.tip {
  background: var(--cream);
  border-left: 3px solid var(--teal);
  padding: 4mm 5mm;
  border-radius: 0 6px 6px 0;
  margin-top: 4mm;
  font-size: 9.5pt;
  color: var(--mid);
  line-height: 1.55;
}
.tip strong {
  color: var(--navy);
  font-weight: 600;
}

/* ═══ ROLE BADGE ═══ */
.role-badge {
  position: absolute;
  top: 28mm;
  right: 22mm;
  background: var(--navy);
  color: white;
  font-family: 'DM Sans', sans-serif;
  font-size: 7pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 6px;
  z-index: 20;
}

/* ═══ STATUS TABLE ═══ */
.status-table {
  width: 100%;
  border-collapse: collapse;
  margin: 3mm 0;
  font-size: 9pt;
}
.status-table td {
  padding: 2mm 3mm;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.status-table .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 2mm;
  vertical-align: middle;
}
.dot-new { background: #3b82f6; }
.dot-awaiting { background: #f59e0b; }
.dot-progress { background: #8b5cf6; }
.dot-completed { background: #22c55e; }
.dot-cancelled { background: #94a3b8; }

/* ═══ CONTEXT LINE ═══ */
.context-line {
  font-size: 10.5pt;
  color: var(--mid);
  margin-bottom: 4mm;
  font-style: italic;
}

/* ═══ TOC (Table of Contents) ═══ */
.toc {
  list-style: none;
  padding: 0;
  margin: 4mm 0;
}
.toc li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 2.5mm 0;
  border-bottom: 1px solid var(--border);
  font-size: 10pt;
  color: var(--dark);
}
.toc li .toc-num {
  color: var(--teal);
  font-weight: 600;
  margin-right: 3mm;
  font-size: 9pt;
}
.toc li .toc-page {
  color: var(--light);
  font-size: 9pt;
}

/* ═══ REFERENCE GRID ═══ */
.ref-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3mm;
}
.ref-item {
  padding: 3mm 4mm;
  border-bottom: 1px solid var(--border);
}
.ref-label {
  font-family: 'Gilroy-Bold', sans-serif;
  font-size: 11pt;
  color: var(--navy);
  margin-bottom: 1mm;
}
.ref-value {
  font-size: 9pt;
  color: var(--mid);
  line-height: 1.5;
}
```

- [ ] **Step 2: Add Page 1 — Cover**

After the closing `</style></head><body>`, add the cover page. Reuse the brochure's cover structure exactly, changing only the text content:

```html
<!-- ═══ PAGE 1: COVER ═══ -->
<div class="page cover">
  <img src="screenshots/onesign-logo-white.png" style="width: 160px; margin-bottom: 18mm; position: relative; z-index: 1; opacity: 0.9;">

  <div class="tag" style="position: relative; z-index: 1;">
    <span class="tag-line"></span>
    <span class="tag-text">Getting Started</span>
  </div>

  <h1>Persimmon<br>Signage Portal</h1>

  <p class="subtitle">A step-by-step guide for site managers and purchasers</p>

  <div class="client">Persimmon Homes</div>

  <div class="bottom-bar">
    <p><strong style="color: rgba(255,255,255,0.7);">Onesign and Digital</strong></p>
    <p>D86 Princesway, Gateshead NE11 0TU</p>
    <p>onesignanddigital.com &nbsp;&bull;&nbsp; 0191 487 6767</p>
  </div>
</div>
```

- [ ] **Step 3: Add Page 2 — Welcome & Contents**

```html
<!-- ═══ PAGE 2: WELCOME & CONTENTS ═══ -->
<div class="page" style="background: var(--white);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="section-num">01</span>
  <div class="content">
    <h1 style="font-size: 28pt; color: var(--navy); margin-bottom: 3mm;">Welcome</h1>
    <p class="text-mid mb-4" style="font-size: 10.5pt;">The Persimmon Signage Portal is your one-stop shop for ordering construction signage. Browse products with images, select sizes and materials, and submit orders directly &mdash; all from your browser.</p>

    <div class="callout mb-6">
      <p><strong>Site managers:</strong> start at page 3. <strong>Purchasers:</strong> skip to page 10.</p>
    </div>

    <h2 style="font-size: 16pt; color: var(--navy); margin-bottom: 3mm;">What&rsquo;s Inside</h2>
    <ol class="toc">
      <li><span><span class="toc-num">02</span>Logging In</span><span class="toc-page">3</span></li>
      <li><span><span class="toc-num">03</span>Browsing Products</span><span class="toc-page">4</span></li>
      <li><span><span class="toc-num">04</span>Selecting &amp; Adding Products</span><span class="toc-page">5</span></li>
      <li><span><span class="toc-num">05</span>Checkout &mdash; Contact &amp; Site</span><span class="toc-page">6</span></li>
      <li><span><span class="toc-num">06</span>Checkout &mdash; Review &amp; Submit</span><span class="toc-page">7</span></li>
      <li><span><span class="toc-num">07</span>Requesting a Custom Sign</span><span class="toc-page">8</span></li>
      <li><span><span class="toc-num">08</span>Tracking Your Orders</span><span class="toc-page">9</span></li>
      <li><span><span class="toc-num">09</span>Uploading a Purchase Order</span><span class="toc-page">10</span></li>
      <li><span><span class="toc-num">10</span>Managing Contacts &amp; Sites</span><span class="toc-page">11</span></li>
      <li><span><span class="toc-num">11</span>Quick Reference</span><span class="toc-page">12</span></li>
    </ol>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>2</span>
  </div>
</div>
```

- [ ] **Step 4: Preview in browser**

Open `docs/onboarding-guide.html` in Chrome. Verify:
- Cover page: navy gradient, white logo, title, subtitle, footer
- Welcome page: header with logo + "Getting Started" meta, section number 01, welcome text, role callout, TOC list
- Fonts loading (Gilroy-Bold for headings, DM Sans for body)
- Page dimensions look correct for A4

- [ ] **Step 5: Commit**

```bash
git add docs/onboarding-guide.html
git commit -m "feat: onboarding guide HTML — cover + welcome pages with new CSS patterns"
```

---

## Task 5: Build Pages 3-5 (Login, Browsing, Adding Products)

**Files:**
- Modify: `docs/onboarding-guide.html`

- [ ] **Step 1: Add Page 3 — Logging In**

Append after the page 2 closing `</div>`:

```html
<!-- ═══ PAGE 3: LOGGING IN ═══ -->
<div class="page" style="background: var(--cream);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="section-num">02</span>
  <div class="content">
    <h1 style="font-size: 28pt; color: var(--navy); margin-bottom: 3mm;">Logging In</h1>
    <p class="context-line">Access the portal from any device with a web browser.</p>

    <ol class="steps mb-4">
      <li><span class="step-num">1</span><span>Open your browser and navigate to the portal URL provided by your team.</span></li>
      <li><span class="step-num">2</span><span>Enter the password provided by your administrator.</span></li>
      <li><span class="step-num">3</span><span>You&rsquo;ll land on the <strong>Construction Signage</strong> homepage showing all available categories.</span></li>
    </ol>

    <div class="tip"><strong>Tip:</strong> The portal works on phones and tablets too &mdash; handy for ordering on-site.</div>

    <div class="two-up" style="flex: 1; align-items: center; margin-top: 5mm;">
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/01-login.png">
        </div>
        <span class="caption">Branded login screen</span>
      </div>
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/02-homepage.png">
        </div>
        <span class="caption">Category overview after login</span>
      </div>
    </div>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>3</span>
  </div>
</div>
```

- [ ] **Step 2: Add Page 4 — Browsing Products**

```html
<!-- ═══ PAGE 4: BROWSING PRODUCTS ═══ -->
<div class="page" style="background: var(--white);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="section-num">03</span>
  <div class="content">
    <h1 style="font-size: 28pt; color: var(--navy); margin-bottom: 3mm;">Browsing Products</h1>
    <p class="context-line">Find the right sign by category or search across 800+ products.</p>

    <ol class="steps mb-4">
      <li><span class="step-num">1</span><span>Select a category from the homepage to see all products in that group.</span></li>
      <li><span class="step-num">2</span><span>Each product shows an image, code, name, and starting price.</span></li>
      <li><span class="step-num">3</span><span>Tap any product to see all available sizes and materials.</span></li>
      <li><span class="step-num">4</span><span>Use the <strong>search bar</strong> in the header to find products by name or code.</span></li>
    </ol>

    <div class="tip"><strong>Tip:</strong> Product codes (like PCF151) match the codes in your existing signage catalogues.</div>

    <div class="two-up" style="flex: 1; align-items: center; margin-top: 5mm;">
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/03-category.png">
        </div>
        <span class="caption">Product grid with images and pricing</span>
      </div>
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/04-product.png">
        </div>
        <span class="caption">Product detail with variants</span>
      </div>
    </div>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>4</span>
  </div>
</div>
```

- [ ] **Step 3: Add Page 5 — Selecting & Adding Products**

```html
<!-- ═══ PAGE 5: SELECTING & ADDING PRODUCTS ═══ -->
<div class="page" style="background: var(--cream);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="section-num">04</span>
  <div class="content">
    <h1 style="font-size: 28pt; color: var(--navy); margin-bottom: 3mm;">Selecting &amp; Adding Products</h1>
    <p class="context-line">Choose your size, material, and quantity, then add to your basket.</p>

    <ol class="steps mb-4">
      <li><span class="step-num">1</span><span>On the product page, find the variant you need (size and material are listed for each).</span></li>
      <li><span class="step-num">2</span><span>If the product has custom fields (e.g. <strong>Site Name</strong>), fill them in &mdash; they&rsquo;re required before adding.</span></li>
      <li><span class="step-num">3</span><span>Set your quantity using the <strong>+</strong> and <strong>&minus;</strong> buttons.</span></li>
      <li><span class="step-num">4</span><span>Tap <strong>Add to Basket</strong>. A confirmation toast will appear.</span></li>
      <li><span class="step-num">5</span><span>The basket icon in the header updates with your item count and running total.</span></li>
    </ol>

    <div class="tip"><strong>Tip:</strong> Some products like site entrance boards require you to enter your site name &mdash; this gets printed on the sign.</div>

    <div class="two-up" style="flex: 1; align-items: center; margin-top: 5mm;">
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/06-product-detail.png">
        </div>
        <span class="caption">Variant selection with custom fields</span>
      </div>
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/07-basket.png">
        </div>
        <span class="caption">Basket summary with pricing</span>
      </div>
    </div>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>5</span>
  </div>
</div>
```

- [ ] **Step 4: Preview pages 3-5 in browser**

Open `docs/onboarding-guide.html`. Verify:
- Alternating backgrounds: cream (p3), white (p4), cream (p5)
- Numbered step circles render as teal circles with white numbers
- Tip callouts have cream background with teal left border
- Phone mockup screenshots render inside rounded frames
- Text fits within page bounds without overflow

- [ ] **Step 5: Commit**

```bash
git add docs/onboarding-guide.html
git commit -m "feat: onboarding guide — pages 3-5 (login, browsing, adding products)"
```

---

## Task 6: Build Pages 6-8 (Checkout Part 1 & 2, Custom Signs)

**Files:**
- Modify: `docs/onboarding-guide.html`

- [ ] **Step 1: Add Page 6 — Checkout Part 1 (sidebar layout)**

```html
<!-- ═══ PAGE 6: CHECKOUT PART 1 ═══ -->
<div class="page" style="background: var(--white);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="section-num">05</span>
  <div class="content">
    <h1 style="font-size: 28pt; color: var(--navy); margin-bottom: 3mm;">Checkout</h1>
    <p class="context-line">Tell us who&rsquo;s ordering and where it&rsquo;s going.</p>

    <div class="sidebar-layout">
      <div class="sidebar-text-col">
        <ol class="steps mb-4">
          <li><span class="step-num">1</span><span>Tap <strong>Proceed to Checkout</strong> from your basket.</span></li>
          <li><span class="step-num">2</span><span>Under <strong>Contact Details</strong>, select an existing contact from the dropdown &mdash; or tap <strong>Add new</strong> to create one.</span></li>
          <li><span class="step-num">3</span><span>Under <strong>Site Details</strong>, select the delivery site &mdash; or tap <strong>Add new</strong> to enter the site name and address.</span></li>
          <li><span class="step-num">4</span><span>To edit or remove saved records, select <strong>Manage contacts&hellip;</strong> (or <strong>Manage sites&hellip;</strong>) from the dropdown.</span></li>
        </ol>

        <div class="tip"><strong>Tip:</strong> Contacts and sites are saved for future orders. Set them up once and reuse them every time.</div>
      </div>
      <div class="sidebar-img-col">
        <div class="screen-tall">
          <img src="screenshots/08-checkout.png">
        </div>
        <span class="caption" style="margin-top: 3mm; font-size: 7.5pt; color: var(--light); font-style: italic;">Contact and site selection at checkout</span>
      </div>
    </div>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>6</span>
  </div>
</div>
```

- [ ] **Step 2: Add Page 7 — Checkout Part 2 (sidebar layout)**

```html
<!-- ═══ PAGE 7: CHECKOUT PART 2 ═══ -->
<div class="page" style="background: var(--cream);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="section-num">06</span>
  <div class="content">
    <h1 style="font-size: 28pt; color: var(--navy); margin-bottom: 3mm;">Review &amp; Submit</h1>
    <p class="context-line">Add purchaser details, review your order, and submit.</p>

    <div class="sidebar-layout">
      <div class="sidebar-text-col">
        <ol class="steps mb-4">
          <li><span class="step-num">1</span><span>Under <strong>Purchaser</strong>, select the person responsible for raising the purchase order &mdash; or tap <strong>Add new</strong>.</span></li>
          <li><span class="step-num">2</span><span>Optionally enter a <strong>PO Number</strong> if you have one.</span></li>
          <li><span class="step-num">3</span><span>Add any <strong>Special Instructions</strong> (delivery notes, timing, etc.).</span></li>
          <li><span class="step-num">4</span><span>Review the <strong>Order Summary</strong> &mdash; it shows every item, subtotal, VAT (20%), and total.</span></li>
          <li><span class="step-num">5</span><span>Tap <strong>Submit Order</strong>. You&rsquo;ll see a confirmation screen with your order reference number.</span></li>
        </ol>

        <div class="tip"><strong>Tip:</strong> Your order reference (e.g. PER-20260318-A1B2) is your tracking number &mdash; save it or find it later on the Orders page.</div>
      </div>
      <div class="sidebar-img-col">
        <div class="screen-tall" style="margin-bottom: 3mm;">
          <img src="screenshots/08-checkout-scroll.png">
        </div>
        <span class="caption" style="font-size: 7.5pt; color: var(--light); font-style: italic; margin-bottom: 4mm;">Purchaser and order summary</span>
        <div class="screen" style="max-width: 100%;">
          <img src="screenshots/15-order-confirmation.png">
        </div>
        <span class="caption" style="margin-top: 3mm; font-size: 7.5pt; color: var(--light); font-style: italic;">Order confirmation with reference number</span>
      </div>
    </div>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>7</span>
  </div>
</div>
```

- [ ] **Step 3: Add Page 8 — Custom Signs**

```html
<!-- ═══ PAGE 8: CUSTOM SIGNS ═══ -->
<div class="page" style="background: var(--white);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="section-num">07</span>
  <div class="content">
    <h1 style="font-size: 28pt; color: var(--navy); margin-bottom: 3mm;">Requesting a Custom Sign</h1>
    <p class="context-line">Need something bespoke? Describe it and we&rsquo;ll quote you.</p>

    <ol class="steps mb-3">
      <li><span class="step-num">1</span><span>Tap <strong>Custom Sign</strong> in the header navigation.</span></li>
      <li><span class="step-num">2</span><span>Select the <strong>Sign Type</strong> (Warning, Prohibition, Mandatory, etc.) and <strong>Shape</strong> (Rectangle, Square, Circle, or Triangle).</span></li>
      <li><span class="step-num">3</span><span>Enter the <strong>Sign Text</strong> &mdash; this is the message that will appear on the sign.</span></li>
      <li><span class="step-num">4</span><span>Choose your <strong>Size</strong> and <strong>Material</strong>, then set the quantity.</span></li>
      <li><span class="step-num">5</span><span>The <strong>Preview</strong> panel updates in real time as you make changes.</span></li>
      <li><span class="step-num">6</span><span>Tap <strong>Add to Basket &mdash; Quote on Request</strong>. The sign is added at no charge; our team will confirm pricing before manufacture.</span></li>
    </ol>

    <div class="two-up" style="flex: 1; align-items: center; margin-top: 3mm;">
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/09-custom-sign.png">
        </div>
        <span class="caption">Sign specification form</span>
      </div>
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/09-custom-sign-preview.png">
        </div>
        <span class="caption">Live preview with size and material</span>
      </div>
    </div>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>8</span>
  </div>
</div>
```

- [ ] **Step 4: Preview pages 6-8 in browser**

Verify:
- Pages 6 & 7 use sidebar layout (text left, tall screenshot right with teal border)
- Page 8 uses two-up layout
- 6 steps on page 8 fit without overflowing
- Backgrounds alternate correctly: white (p6), cream (p7), white (p8)

- [ ] **Step 5: Commit**

```bash
git add docs/onboarding-guide.html
git commit -m "feat: onboarding guide — pages 6-8 (checkout, custom signs)"
```

---

## Task 7: Build Pages 9-12 (Orders, PO Upload, Contacts, Quick Reference)

**Files:**
- Modify: `docs/onboarding-guide.html`

- [ ] **Step 1: Add Page 9 — Tracking Orders**

```html
<!-- ═══ PAGE 9: TRACKING ORDERS ═══ -->
<div class="page" style="background: var(--cream);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="section-num">08</span>
  <div class="content">
    <h1 style="font-size: 28pt; color: var(--navy); margin-bottom: 3mm;">Tracking Your Orders</h1>
    <p class="context-line">Check the status of any order without picking up the phone.</p>

    <ol class="steps mb-3">
      <li><span class="step-num">1</span><span>Tap <strong>Orders</strong> in the header to open the My Orders page.</span></li>
      <li><span class="step-num">2</span><span>Filter by <strong>contact</strong> (tap a name pill at the top) or <strong>site</strong> (tap a site card).</span></li>
      <li><span class="step-num">3</span><span>Use the <strong>status tabs</strong> to filter: All, New, Awaiting PO, In Progress, Completed.</span></li>
      <li><span class="step-num">4</span><span>Tap any order card to expand it and see full details: items, pricing, contact info, and current status.</span></li>
    </ol>

    <table class="status-table mb-3">
      <tr><td><span class="dot dot-new"></span><strong>New</strong></td><td class="text-mid">Order received, being reviewed</td></tr>
      <tr><td><span class="dot dot-awaiting"></span><strong>Awaiting PO</strong></td><td class="text-mid">Purchase order requested from your purchaser</td></tr>
      <tr><td><span class="dot dot-progress"></span><strong>In Progress</strong></td><td class="text-mid">Signs being manufactured</td></tr>
      <tr><td><span class="dot dot-completed"></span><strong>Completed</strong></td><td class="text-mid">Order fulfilled and delivered</td></tr>
      <tr><td><span class="dot dot-cancelled"></span><strong>Cancelled</strong></td><td class="text-mid">Order cancelled &mdash; no further action needed</td></tr>
    </table>

    <div class="two-up" style="flex: 1; align-items: center;">
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/10-orders.png">
        </div>
        <span class="caption">Order tracking with filters</span>
      </div>
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/10-orders-full.png">
        </div>
        <span class="caption">Expanded order detail</span>
      </div>
    </div>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>9</span>
  </div>
</div>
```

- [ ] **Step 2: Add Page 10 — Uploading a PO**

```html
<!-- ═══ PAGE 10: UPLOADING A PURCHASE ORDER ═══ -->
<div class="page" style="background: var(--white);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="role-badge">Purchasers</span>
  <span class="section-num">09</span>
  <div class="content">
    <h1 style="font-size: 28pt; color: var(--navy); margin-bottom: 3mm;">Uploading a Purchase Order</h1>
    <p class="context-line">When a purchase order is needed, you&rsquo;ll receive an email with an upload link.</p>

    <ol class="steps mb-4">
      <li><span class="step-num">1</span><span>You&rsquo;ll receive an email titled <strong>&ldquo;PO Request&rdquo;</strong> with the order details and a link.</span></li>
      <li><span class="step-num">2</span><span>Click the <strong>Attach Purchase Order</strong> button in the email.</span></li>
      <li><span class="step-num">3</span><span>You&rsquo;ll be taken to the upload page. Select your PO document (PDF or image).</span></li>
      <li><span class="step-num">4</span><span>Click <strong>Upload</strong>. The document is attached to the order and the team is notified.</span></li>
    </ol>

    <div class="tip"><strong>Tip:</strong> The upload link is unique to this order. No login required &mdash; just click and upload.</div>

    <div class="two-up" style="flex: 1; align-items: center; margin-top: 5mm;">
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/18-po-email-mockup.png">
        </div>
        <span class="caption">PO request email with upload link</span>
      </div>
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/16-po-upload.png">
        </div>
        <span class="caption">PO upload page</span>
      </div>
    </div>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>10</span>
  </div>
</div>
```

- [ ] **Step 3: Add Page 11 — Managing Contacts & Sites**

```html
<!-- ═══ PAGE 11: MANAGING CONTACTS & SITES ═══ -->
<div class="page" style="background: var(--cream);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="section-num">10</span>
  <div class="content">
    <h1 style="font-size: 28pt; color: var(--navy); margin-bottom: 3mm;">Managing Contacts &amp; Sites</h1>
    <p class="context-line">Keep your contact and site records up to date for fast repeat ordering.</p>

    <ol class="steps mb-4">
      <li><span class="step-num">1</span><span>During checkout, select <strong>Manage contacts&hellip;</strong> (or <strong>Manage sites&hellip;</strong> / <strong>Manage purchasers&hellip;</strong>) from the relevant dropdown.</span></li>
      <li><span class="step-num">2</span><span>A modal opens showing all saved records.</span></li>
      <li><span class="step-num">3</span><span>Tap the <strong>edit icon</strong> to update a name, email, phone number, or address.</span></li>
      <li><span class="step-num">4</span><span>Tap the <strong>delete icon</strong> to remove a record. Past orders are not affected.</span></li>
      <li><span class="step-num">5</span><span>To add a new record, tap <strong>Add new</strong> and fill in the details.</span></li>
    </ol>

    <div class="tip"><strong>Tip:</strong> Any changes you make are available immediately for all future orders.</div>

    <div class="two-up" style="flex: 1; align-items: center; margin-top: 5mm;">
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/17-manage-contacts.png">
        </div>
        <span class="caption">Managing saved contacts</span>
      </div>
      <div class="col">
        <div class="screen" style="max-width: 56mm;">
          <img src="screenshots/08-checkout.png">
        </div>
        <span class="caption">Selecting from saved records at checkout</span>
      </div>
    </div>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>11</span>
  </div>
</div>
```

- [ ] **Step 4: Add Page 12 — Quick Reference**

```html
<!-- ═══ PAGE 12: QUICK REFERENCE ═══ -->
<div class="page" style="background: var(--white);">
  <div class="pg-header">
    <img class="logo-sm" src="screenshots/onesign-logo.png">
    <span class="meta">Getting Started &mdash; Persimmon Signage Portal</span>
    <div class="accent-line"></div>
  </div>
  <span class="section-num">11</span>
  <div class="content">
    <div class="banner mb-5">
      <h2>Quick Reference</h2>
    </div>

    <p class="text-mid mb-5 fs-sm">Everything you need at a glance.</p>

    <div class="ref-grid mb-6">
      <div class="ref-item">
        <div class="ref-label">Portal URL</div>
        <div class="ref-value">Provided by your administrator</div>
      </div>
      <div class="ref-item">
        <div class="ref-label">Password</div>
        <div class="ref-value">Provided by your administrator</div>
      </div>
      <div class="ref-item">
        <div class="ref-label">Order Format</div>
        <div class="ref-value">PER-YYYYMMDD-XXXX<br>(e.g. PER-20260318-A1B2)</div>
      </div>
      <div class="ref-item">
        <div class="ref-label">Pricing</div>
        <div class="ref-value">All prices shown ex. VAT. 20% VAT added at checkout.</div>
      </div>
      <div class="ref-item">
        <div class="ref-label">Custom Signs</div>
        <div class="ref-value">Priced at &ldquo;Quote on request&rdquo; &mdash; team confirms before manufacture</div>
      </div>
      <div class="ref-item">
        <div class="ref-label">Suggest a Feature</div>
        <div class="ref-value">Tap the green button in the bottom-right corner of any page</div>
      </div>
    </div>

    <div class="callout mb-6">
      <p>From site manager to delivered signage: one digital workflow replacing spreadsheets, emails, and manual coordination.</p>
    </div>

    <div class="cta-section">
      <h2>Need Help?</h2>
      <p class="cta-body">If you have questions about the portal or your orders, get in touch.</p>
      <p class="cta-email">mike@onesignanddigital.com</p>
      <p class="cta-details">0191 487 6767 &nbsp;&bull;&nbsp; onesignanddigital.com</p>
      <p class="cta-details" style="margin-top: 2mm;">Onesign and Digital &mdash; D86 Princesway, Gateshead NE11 0TU</p>
    </div>
  </div>
  <div class="pg-footer">
    <span>onesignanddigital.com</span>
    <span>12</span>
  </div>
</div>

</body>
</html>
```

- [ ] **Step 5: Preview all 12 pages in browser**

Open `docs/onboarding-guide.html` in Chrome. Verify all 12 pages:
- Cover: navy gradient, correct title/subtitle
- Page 2: TOC renders with section numbers and page numbers aligned
- Pages 3-5: two-up layouts with numbered steps, tips, alternating backgrounds
- Pages 6-7: sidebar layouts with tall screenshots, teal left border
- Page 8: two-up layout, 6 steps fit on page
- Page 9: status table with coloured dots, two-up screenshots
- Page 10: "PURCHASERS" role badge top-right, email mockup + upload screenshots
- Page 11: manage contacts steps + two-up screenshots
- Page 12: reference grid (2-col), callout, navy CTA card
- All fonts loading correctly
- No text overflow on any page
- Page numbers sequential (2-12)

- [ ] **Step 6: Commit**

```bash
git add docs/onboarding-guide.html
git commit -m "feat: onboarding guide — pages 9-12 (orders, PO upload, contacts, quick reference)"
```

---

## Task 8: Generate PDF and Final Verification

**Files:**
- Output: `docs/Persimmon-Signage-Portal-Onboarding-Guide.pdf`

- [ ] **Step 1: Generate the PDF**

Run:
```bash
node docs/generate-pdf.mjs onboarding-guide.html
```

Expected: `docs/onboarding-guide.pdf` generated successfully.

Rename the output to the full name:
```bash
mv docs/onboarding-guide.pdf "docs/Persimmon-Signage-Portal-Onboarding-Guide.pdf"
```

Alternatively, if you want the proper output name, update the generate-pdf.mjs to handle a custom name mapping, or just rename after generation.

- [ ] **Step 2: Verify the PDF**

Open `docs/Persimmon-Signage-Portal-Onboarding-Guide.pdf` and verify:
- 12 pages total
- All fonts rendered (Gilroy-Bold headings, DM Sans body)
- All screenshots visible and properly framed
- Navy gradients and coloured backgrounds print correctly
- No blank pages or page break issues
- Page numbers correct on each page
- Teal step circles render properly

- [ ] **Step 3: Check against spec**

Walk through the spec (`docs/superpowers/specs/2026-03-18-onboarding-guide-design.md`) page by page:
- Cover title matches: "Getting Started with the Persimmon Signage Portal" — verify the title in the cover. Note: we used "Persimmon Signage Portal" as the h1 with "Getting Started" as the tag. Adjust if needed to match spec exactly.
- Each page has correct section number, layout, background colour, screenshots, step content, and tip
- Role badge appears on page 10 only
- Status table on page 9 has all 5 statuses with coloured dots
- Quick reference grid on page 12 has all 6 items
- CTA card has correct contact details

- [ ] **Step 4: Fix any issues found**

If any pages overflow, adjust font sizes or step count. If screenshots are missing (because captures haven't been run), use placeholder text or run the capture script first.

- [ ] **Step 5: Commit the final PDF**

```bash
git add "docs/Persimmon-Signage-Portal-Onboarding-Guide.pdf" docs/onboarding-guide.html
git commit -m "feat: complete Persimmon onboarding guide — 12-page PDF"
```

---

## Execution Notes

- **Tasks 1-3** (PDF generator, email mockup, screenshots) can be parallelised as code modifications. However, **Task 2 must complete before running the capture script** from Task 3, because screenshot 18 loads the email mockup HTML file created in Task 2.
- **Tasks 4-7** (HTML pages) are sequential — each builds on the previous.
- **Task 8** (PDF generation) depends on all prior tasks.
- Screenshots 15-17 require the local dev server running (`cd shop && npm run dev`). Screenshot 18 (email mockup) does not.
- If new screenshots can't be captured (no dev server), the HTML can still be built with placeholder `<div>` elements and the screenshots added later. The PDF will still generate — just with missing images.
- **Page 10 visual check:** The role badge (`.role-badge`) and section number watermark (`.section-num`) are both positioned top-right. Since the watermark is 15% opacity this likely looks fine, but verify during preview. If they clash, move the role badge down to `top: 38mm` or position it top-left instead.
- **Page 7 sidebar column:** Contains two stacked screenshots (checkout scroll + order confirmation). If the combined height overflows the page, reduce the `screen-tall` max-height or use only one screenshot.

# Persimmon Signage Portal — Onboarding Guide Design Spec

**Date:** 2026-03-18
**Status:** Draft
**Type:** Document (HTML → PDF)

---

## 1. Purpose

Create a step-by-step onboarding guide for Persimmon Homes staff that walks them through every feature of the Persimmon Signage Portal. The guide should be "idiot proof" — any site manager, purchaser, or administrator within Persimmon can pick it up and immediately understand how to use the portal.

This is distinct from the existing case study brochure (`Persimmon-Signage-Portal-Brochure-v2.pdf`), which is a sales document explaining *what* the portal does. The onboarding guide explains *how* to use it.

## 2. Audience

| Role | What they do | Pages they care about |
|------|-------------|----------------------|
| **Site managers** | Browse products, place orders, track order status | 3-9 |
| **Purchasers** | Receive PO request emails, upload PO documents | 10 |
| **Contact/site administrators** | Manage saved contacts, sites, and purchasers | 11 |

All roles are Persimmon staff. The Onesign admin team is not addressed.

## 3. Design Approach

**Blend of brochure aesthetics + walkthrough flow.** The guide inherits the exact visual identity of the existing case study brochure (fonts, colours, phone mockups, layout patterns, page structure) but replaces sales copy with numbered instructional steps that follow the user's natural journey through the portal.

## 4. Tone & Voice

- **Friendly professional with a lean toward ultra-simple** — matches the brochure's polished feel but uses dead-simple numbered steps
- Direct second person: "Select your delivery site"
- Present tense, imperative mood
- One action per step
- Each step is 1-2 sentences max
- Bold UI elements being referenced: "Click the **Sign In** button"
- No jargon, no assumed technical knowledge

## 5. Page Map (12 Pages)

### Page 1 — Cover

- **Layout:** Navy gradient (identical to brochure cover page)
- **Title:** "Getting Started with the Persimmon Signage Portal"
- **Subtitle:** "A step-by-step guide for site managers and purchasers"
- **Footer:** Onesign and Digital, D86 Princesway, Gateshead NE11 0TU, onesignanddigital.com, 0191 487 6767
- **Logo:** Onesign white logo (top left)

### Page 2 — Welcome & Contents

- **Layout:** White background
- **Section number:** 01
- **Content:**
  - Brief welcome paragraph (2-3 sentences): what the portal is, who it's for
  - Visual table of contents with section titles and page numbers
  - Role guide callout: "Site managers: start at page 3. Purchasers: skip to page 10."
- **Screenshots:** None (or small page thumbnails if generated post-production)

### Page 3 — Logging In

- **Layout:** Cream background, two-up phone mockups
- **Section number:** 02
- **Context line:** "Access the portal from any device with a web browser."
- **Steps:**
  1. Open your browser and navigate to the portal URL provided by your team.
  2. Enter the password provided by your administrator.
  3. You'll land on the **Construction Signage** homepage showing all available categories.
- **Tip:** "The portal works on phones and tablets too — handy for ordering on-site."
- **Screenshots:** `01-login.png` (login screen), `02-homepage.png` (category overview)
- **Captions:** "Branded login screen" / "Category overview after login"

### Page 4 — Browsing Products

- **Layout:** White background, two-up phone mockups
- **Section number:** 03
- **Context line:** "Find the right sign by category or search across 800+ products."
- **Steps:**
  1. Select a category from the homepage to see all products in that group.
  2. Each product shows an image, code, name, and starting price.
  3. Tap any product to see all available sizes and materials.
  4. Use the **search bar** in the header to find products by name or code.
- **Tip:** "Product codes (like PCF151) match the codes in your existing signage catalogues."
- **Screenshots:** `03-category.png` (category grid), `04-product.png` (product page)
- **Captions:** "Product grid with images and pricing" / "Product detail with variants"

### Page 5 — Selecting & Adding Products

- **Layout:** Cream background, two-up phone mockups
- **Section number:** 04
- **Context line:** "Choose your size, material, and quantity, then add to your basket."
- **Steps:**
  1. On the product page, find the variant you need (size and material are listed for each).
  2. If the product has custom fields (e.g. **Site Name**), fill them in — they're required before adding.
  3. Set your quantity using the **+** and **-** buttons.
  4. Tap **Add to Basket**. A confirmation toast will appear.
  5. The basket icon in the header updates with your item count and running total.
- **Tip:** "Some products like site entrance boards require you to enter your site name — this gets printed on the sign."
- **Screenshots:** `06-product-detail.png` (variant selection with custom fields), `07-basket.png` (basket view)
- **Captions:** "Variant selection with custom fields" / "Basket summary with pricing"

### Page 6 — Checkout (Part 1: Contact & Site)

- **Layout:** White background, sidebar layout (text left, tall screenshot right)
- **Section number:** 05
- **Context line:** "Tell us who's ordering and where it's going."
- **Steps:**
  1. Tap **Proceed to Checkout** from your basket.
  2. Under **Contact Details**, select an existing contact from the dropdown — or tap **Add new** to create one.
  3. Under **Site Details**, select the delivery site — or tap **Add new** to enter the site name and address.
  4. To edit or remove saved contacts and sites, select **Manage contacts...** (or **Manage sites...**) from the dropdown to open the management modal.
- **Tip:** "Contacts and sites are saved for future orders. Set them up once and reuse them every time."
- **Screenshots:** `08-checkout.png` (checkout top section with contact/site panels)
- **Caption:** "Contact and site selection at checkout"

### Page 7 — Checkout (Part 2: Review & Submit)

- **Layout:** Cream background, sidebar layout
- **Section number:** 06
- **Context line:** "Add purchaser details, review your order, and submit."
- **Steps:**
  1. Under **Purchaser**, select the person responsible for raising the purchase order — or tap **Add new**.
  2. Optionally enter a **PO Number** if you have one.
  3. Add any **Special Instructions** (delivery notes, timing, etc.).
  4. Review the **Order Summary** on the right — it shows every item, subtotal, VAT (20%), and total.
  5. Tap **Submit Order**. You'll see a confirmation screen with your order reference number.
- **Tip:** "Your order reference (e.g. PER-20260318-A1B2) is your tracking number — save it or find it later on the Orders page."
- **Screenshots:** `08-checkout-scroll.png` (checkout bottom with purchaser/summary), `15-order-confirmation.png` (confirmation page — **new capture**)
- **Captions:** "Purchaser and order summary" / "Order confirmation with reference number"

### Page 8 — Requesting a Custom Sign

- **Layout:** White background, two-up phone mockups
- **Section number:** 07
- **Context line:** "Need something bespoke? Describe it and we'll quote you."
- **Steps:**
  1. Tap **Custom Sign** in the header navigation.
  2. Select the **Sign Type** (Warning, Prohibition, Mandatory, etc.) and **Shape** (Rectangle, Square, Circle, or Triangle).
  3. Enter the **Sign Text** — this is the message that will appear on the sign.
  4. Choose your **Size** and **Material**, then set the quantity.
  5. The **Preview** panel on the right updates in real time as you make changes.
  6. Tap **Add to Basket — Quote on Request**. The sign is added at no charge; our team will confirm pricing before manufacture.
- **Screenshots:** `09-custom-sign.png` (form), `09-custom-sign-preview.png` (preview)
- **Captions:** "Sign specification form" / "Live preview with size and material"

### Page 9 — Tracking Your Orders

- **Layout:** Cream background, two-up phone mockups
- **Section number:** 08
- **Context line:** "Check the status of any order without picking up the phone."
- **Steps:**
  1. Tap **Orders** in the header to open the My Orders page.
  2. Filter by **contact** (tap a name pill at the top) or **site** (tap a site card).
  3. Use the **status tabs** to filter: All, New, Awaiting PO, In Progress, Completed.
  4. Tap any order card to expand it and see full details: items, pricing, contact info, and current status.
- **Status key table:**
  | Status | Meaning |
  |--------|---------|
  | **New** | Order received, being reviewed |
  | **Awaiting PO** | Purchase order requested from your purchaser |
  | **In Progress** | Signs being manufactured |
  | **Completed** | Order fulfilled and delivered |
  | **Cancelled** | Order cancelled — no further action needed |
- **Screenshots:** `10-orders.png` (orders page with filters), `10-orders-full.png` (expanded order detail)
- **Captions:** "Order tracking with filters" / "Expanded order detail"

### Page 10 — Uploading a Purchase Order

- **Layout:** White background, two-up mockups
- **Section number:** 09
- **Role badge:** "Purchasers"
- **Context line:** "When a purchase order is needed, you'll receive an email with an upload link."
- **Steps:**
  1. You'll receive an email titled **"PO Request"** with the order details and a link.
  2. Click the **Attach PO** button in the email.
  3. You'll be taken to the upload page. Select your PO document (PDF or image).
  4. Click **Upload**. The document is attached to the order and the team is notified.
- **Tip:** "The upload link is unique to this order. No login required — just click and upload."
- **Screenshots:** `18-po-email-mockup.png` (email mockup — **new capture/mock**), `16-po-upload.png` (upload page — **new capture**)
- **Captions:** "PO request email with upload link" / "PO upload page"

### Page 11 — Managing Contacts & Sites

- **Layout:** Cream background, two-up mockups
- **Section number:** 10
- **Context line:** "Keep your contact and site records up to date for fast repeat ordering."
- **Steps:**
  1. During checkout, select **Manage contacts...** (or **Manage sites...** / **Manage purchasers...**) from the relevant dropdown.
  2. A modal opens showing all saved records.
  3. Tap the **edit icon** to update a name, email, phone number, or address.
  4. Tap the **delete icon** to remove a record. Past orders are not affected.
  5. To add a new record, tap **Add new** and fill in the details.
- **Tip:** "Any changes you make are available immediately for all future orders."
- **Screenshots:** `17-manage-contacts.png` (manage modal — **new capture**), `08-checkout.png` (checkout dropdowns, reused)
- **Captions:** "Managing saved contacts" / "Selecting from saved records at checkout"

### Page 12 — Quick Reference

- **Layout:** White background (top), navy CTA card (bottom) — matches brochure page 8
- **Section number:** 11
- **Content — top half (benefits-style grid):**
  | Topic | Detail |
  |-------|--------|
  | **Portal URL** | Provided by your administrator |
  | **Password** | Provided by your administrator |
  | **Order format** | PER-YYYYMMDD-XXXX (e.g. PER-20260318-A1B2) |
  | **Pricing** | All prices shown ex. VAT. 20% VAT added at checkout. |
  | **Custom signs** | Priced at "Quote on request" — team confirms before manufacture |
  | **Suggest a Feature** | Tap the green button in the bottom-right corner of any page |
- **Content — bottom half (navy CTA card):**
  - Title: "Need Help?"
  - Body: "If you have questions about the portal or your orders, get in touch."
  - Email: mike@onesignanddigital.com
  - Phone: 0191 487 6767
  - Website: onesignanddigital.com
  - Address: Onesign and Digital — D86 Princesway, Gateshead NE11 0TU

## 6. Visual Design System

### Inherited from brochure (no changes)

- **Fonts:** Gilroy-Bold (headings, via CDNFonts), DM Sans (body, via Google Fonts)
- **Colours:** Navy `#00474A`, deep navy `#002E30`, teal `#3DB28C`, cream `#F8F6F2`, dark `#1A1D21`, mid `#4A5568`, light `#94A3B8`
- **Phone mockups:** 56mm max-width, 18px border-radius, 2px `#222` border, subtle shadow
- **Two-up layout:** Flexbox, 6mm gap, centered captions (7.5pt italic)
- **Sidebar layout:** Text column (flex 1) + image column (42% width, teal left border)
- **Section number watermarks:** 48pt Gilroy-Bold, teal, 15% opacity, top-right
- **Page header:** Onesign logo (7mm), teal accent line, metadata text
- **Page footer:** URL left, page number right
- **Cover:** Navy gradient (165deg), white logo, white text
- **CTA card:** Navy background, 8px radius, white text, teal email
- **Callout box:** Cream background, 3px teal left border, right-side rounded corners
- **A4 format:** 210mm x 297mm, 28mm top / 22mm sides / 20mm bottom padding

### New patterns for instructional content

**Numbered steps:**
- Teal circle (16px diameter) with white number inside
- Step text beside circle, DM Sans 10.5pt
- 4mm vertical gap between steps
- Bold UI element references within step text

**Tip callout:**
- Reuses brochure `.callout` pattern (cream bg, teal left border)
- Prefixed with "Tip:" in DM Sans 600 weight
- Max one per page, positioned after steps

**Role badge:**
- Navy pill: 6px border-radius, navy background, white text
- DM Sans 7pt, uppercase, letter-spacing 0.5px
- Positioned top-right of page content area
- Values: "SITE MANAGERS" / "PURCHASERS"

**Status key table:**
- 2-column mini-table, no outer border
- Coloured dot (8px) matching app status colours beside each status name
- DM Sans 9pt

## 7. Screenshots

### Reused from existing set

| File | Used on page(s) |
|------|----------------|
| `01-login.png` | 3 |
| `02-homepage.png` | 3 |
| `03-category.png` | 4 |
| `04-product.png` | 4 |
| `06-product-detail.png` | 5 |
| `07-basket.png` | 5 |
| `08-checkout.png` | 6, 11 |
| `08-checkout-scroll.png` | 7 |
| `09-custom-sign.png` | 8 |
| `09-custom-sign-preview.png` | 8 |
| `10-orders.png` | 9 |
| `10-orders-full.png` | 9 |

### New captures required

| File | Page | Method |
|------|------|--------|
| `15-order-confirmation.png` | 7 | Playwright: authenticate with shop-auth cookie first, then navigate to `/order-confirmation?order=PER-DEMO` |
| `16-po-upload.png` | 10 | Playwright: authenticate with admin-auth cookie (bypasses token validation), then navigate to `/po-upload/PER-DEMO` |
| `17-manage-contacts.png` | 11 | Playwright: open checkout, select "Manage contacts..." from the dropdown to open modal |
| `18-po-email-mockup.png` | 10 | Static HTML mockup rendered and screenshotted via Playwright |

## 8. Build Pipeline

### Files

| File | Action |
|------|--------|
| `docs/onboarding-guide.html` | **Create** — fork from `brochure.html`, replace content, add new CSS patterns |
| `docs/capture-screenshots.mjs` | **Extend** — add 4 new capture routes |
| `docs/generate-pdf.mjs` | **Modify** — parameterise input/output paths (currently hardcoded to brochure), or duplicate as `generate-onboarding-pdf.mjs` |
| `docs/Persimmon-Signage-Portal-Onboarding-Guide.pdf` | **Output** |

### Steps

1. Extend `capture-screenshots.mjs` with 4 new routes
2. Run captures: `node docs/capture-screenshots.mjs`
3. Build `docs/onboarding-guide.html` (12 pages, all CSS embedded)
4. Preview in browser, verify all pages
5. Generate PDF: `node docs/generate-pdf.mjs`
6. Verify output PDF

### Dependencies

No new dependencies. Same Puppeteer + Playwright toolchain already in the project.

## 9. Out of Scope

- Admin dashboard walkthrough (Onesign internal)
- Video tutorials
- Interactive/web-based guide
- Multi-language support
- Password included in document (placeholder with instruction instead)

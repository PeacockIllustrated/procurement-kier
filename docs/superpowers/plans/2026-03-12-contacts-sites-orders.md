# Contacts, Sites & Orders Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent contacts and sites with dropdown selectors at checkout and a bento-card site overview on the orders page.

**Architecture:** Two new Supabase tables (`psp_contacts`, `psp_sites`) with CRUD API routes. Checkout form gets dropdown selectors with inline "add new" forms. Orders page gets a site card grid at the top that filters the order list. Orders store foreign keys to contacts/sites alongside denormalised snapshot text fields.

**Tech Stack:** Next.js 16 (App Router), Supabase (PostgreSQL), Tailwind CSS v4, TypeScript

---

## Chunk 1: Database & API Layer

### Task 1: Database Migration

**Files:**
- Modify: `shop/supabase-setup.sql`

- [ ] **Step 1: Add new tables and columns to schema file**

Append to the bottom of `shop/supabase-setup.sql`:

```sql
-- ============================================================
-- Contacts & Sites (added 2026-03-12)
-- ============================================================

CREATE TABLE IF NOT EXISTS psp_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  email        text NOT NULL UNIQUE,
  phone        text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS psp_sites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  address      text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE psp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE psp_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_psp_contacts" ON psp_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_psp_sites" ON psp_sites FOR ALL USING (true) WITH CHECK (true);

-- Foreign keys on orders (nullable for existing orders)
ALTER TABLE psp_orders ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES psp_contacts(id);
ALTER TABLE psp_orders ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES psp_sites(id);
CREATE INDEX IF NOT EXISTS idx_psp_orders_contact_id ON psp_orders(contact_id);
CREATE INDEX IF NOT EXISTS idx_psp_orders_site_id ON psp_orders(site_id);
```

- [ ] **Step 2: Run the migration against Supabase**

Go to the Supabase SQL editor and run the SQL from step 1. Verify:
- `psp_contacts` and `psp_sites` tables exist
- `psp_orders` has `contact_id` and `site_id` columns (nullable)

- [ ] **Step 3: Commit**

```bash
git add shop/supabase-setup.sql
git commit -m "feat: add psp_contacts and psp_sites tables with FK on orders"
```

---

### Task 2: Contacts API

**Files:**
- Create: `shop/app/api/contacts/route.ts`

- [ ] **Step 1: Create the contacts API route**

Create `shop/app/api/contacts/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isShopAuthed, isAdminAuthed } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  if (!(await isShopAuthed()) && !(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("psp_contacts")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Fetch contacts error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }

  return NextResponse.json({ contacts: data });
}

export async function POST(req: NextRequest) {
  if (!(await isShopAuthed()) && !(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();

    if (!name || name.length > 200) {
      return NextResponse.json({ error: "Name is required (max 200 chars)" }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json({ error: "Valid email is required (max 200 chars)" }, { status: 400 });
    }
    if (!phone || phone.length > 50) {
      return NextResponse.json({ error: "Phone is required (max 50 chars)" }, { status: 400 });
    }

    // Check for existing contact with same email (upsert semantics)
    const { data: existing } = await supabase
      .from("psp_contacts")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const { data, error } = await supabase
      .from("psp_contacts")
      .insert({ name, email, phone })
      .select()
      .single();

    if (error) {
      console.error("Create contact error:", error);
      return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Verify the endpoint works**

Run the dev server and test with curl:

```bash
# GET (should return empty list)
curl http://localhost:3000/api/contacts

# POST (should create and return contact)
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Tom Peacock","email":"tom@test.com","phone":"07494860722"}'

# POST same email again (should return existing, 200)
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Tom Peacock","email":"tom@test.com","phone":"07494860722"}'
```

- [ ] **Step 3: Commit**

```bash
git add shop/app/api/contacts/route.ts
git commit -m "feat: add contacts API (GET list, POST create with upsert)"
```

---

### Task 3: Sites API

**Files:**
- Create: `shop/app/api/sites/route.ts`

- [ ] **Step 1: Create the sites API route**

Create `shop/app/api/sites/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isShopAuthed, isAdminAuthed } from "@/lib/auth";

export async function GET() {
  if (!(await isShopAuthed()) && !(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("psp_sites")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Fetch sites error:", error);
    return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 });
  }

  return NextResponse.json({ sites: data });
}

export async function POST(req: NextRequest) {
  if (!(await isShopAuthed()) && !(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const address = String(body.address || "").trim();

    if (!name || name.length > 200) {
      return NextResponse.json({ error: "Name is required (max 200 chars)" }, { status: 400 });
    }
    if (!address || address.length > 500) {
      return NextResponse.json({ error: "Address is required (max 500 chars)" }, { status: 400 });
    }

    // Check for existing site with same name (upsert semantics)
    const { data: existing } = await supabase
      .from("psp_sites")
      .select("*")
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const { data, error } = await supabase
      .from("psp_sites")
      .insert({ name, address })
      .select()
      .single();

    if (error) {
      console.error("Create site error:", error);
      return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Verify the endpoint works**

```bash
# GET (should return empty list)
curl http://localhost:3000/api/sites

# POST (should create and return site)
curl -X POST http://localhost:3000/api/sites \
  -H "Content-Type: application/json" \
  -d '{"name":"Riverside Quarter Phase 2","address":"14 Riverside Way, Manchester, M3 4LQ"}'
```

- [ ] **Step 3: Commit**

```bash
git add shop/app/api/sites/route.ts
git commit -m "feat: add sites API (GET list, POST create with upsert)"
```

---

### Task 4: Update Orders API to accept and return contact_id / site_id

**Files:**
- Modify: `shop/app/api/orders/route.ts`

- [ ] **Step 1: Update POST handler to accept contactId and siteId**

In `shop/app/api/orders/route.ts`, in the POST handler, update the destructuring at line 22 to include the new fields:

```ts
const { contactName, email, phone, siteName, siteAddress, poNumber, notes, items, contactId, siteId } = body;
```

Then in the Supabase insert (around line 93), add the new columns:

```ts
const { data: order, error: orderError } = await supabase
  .from("psp_orders")
  .insert({
    order_number: orderNumber,
    status: "new",
    contact_name: String(contactName),
    email: String(email),
    phone: String(phone),
    site_name: String(siteName),
    site_address: String(siteAddress),
    po_number: poNumber ? String(poNumber) : null,
    notes: notes ? String(notes) : null,
    contact_id: contactId || null,
    site_id: siteId || null,
    subtotal,
    vat,
    total,
  })
  .select("id")
  .single();
```

- [ ] **Step 2: Update GET handler to return contactId and siteId**

In the GET handler's transform (around line 220), add the new fields to the response object:

```ts
const transformed = orders.map((o) => ({
  orderNumber: o.order_number,
  createdAt: o.created_at,
  status: o.status,
  contactId: o.contact_id || null,
  siteId: o.site_id || null,
  contact: { contactName: o.contact_name, email: o.email, phone: o.phone },
  site: { siteName: o.site_name, siteAddress: o.site_address },
  poNumber: o.po_number,
  notes: o.notes,
  items: (allItems || [])
    .filter((item) => item.order_id === o.id)
    .map((item) => ({
      code: item.code,
      baseCode: item.base_code,
      name: item.name,
      size: item.size,
      price: Number(item.price),
      quantity: item.quantity,
      customData: item.custom_data || null,
    })),
  subtotal: Number(o.subtotal),
  vat: Number(o.vat),
  total: Number(o.total),
}));
```

- [ ] **Step 3: Type-check**

```bash
cd shop && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add shop/app/api/orders/route.ts
git commit -m "feat: accept and return contactId/siteId on orders API"
```

---

## Chunk 2: Checkout Page

### Task 5: Rewrite checkout form with contact/site dropdowns

**Files:**
- Modify: `shop/app/(shop)/checkout/page.tsx`

- [ ] **Step 1: Replace the checkout page**

Replace the entire contents of `shop/app/(shop)/checkout/page.tsx` with the updated version that:

1. Fetches contacts and sites from the API on mount
2. Replaces the Contact Details section with a dropdown + read-only display
3. Replaces the Site Details section with a dropdown + read-only display
4. Adds inline "add new" forms for both
5. Sends `contactId` and `siteId` with the order submission

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBasket } from "@/components/BasketContext";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Site {
  id: string;
  name: string;
  address: string;
}

export default function CheckoutPage() {
  const { items, totalPrice, clearBasket } = useBasket();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Saved records
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // "Add new" form state
  const [showNewContact, setShowNewContact] = useState(false);
  const [showNewSite, setShowNewSite] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" });
  const [newSite, setNewSite] = useState({ name: "", address: "" });
  const [savingContact, setSavingContact] = useState(false);
  const [savingSite, setSavingSite] = useState(false);

  // Free-text fields
  const [poNumber, setPoNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch contacts and sites on mount
  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then((d) => setContacts(d.contacts || [])).catch(() => {});
    fetch("/api/sites").then((r) => r.json()).then((d) => setSites(d.sites || [])).catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-persimmon-navy mb-2">Nothing to checkout</h1>
        <p className="text-gray-400 mb-8">Add some items to your basket first.</p>
        <Link href="/" className="inline-block bg-persimmon-green text-white px-8 py-3 rounded-xl font-medium hover:bg-persimmon-green-dark transition">
          Browse Products
        </Link>
      </div>
    );
  }

  const canSubmit = selectedContact && selectedSite && !submitting;

  const handleContactSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__new__") {
      setSelectedContact(null);
      setShowNewContact(true);
      return;
    }
    setShowNewContact(false);
    const contact = contacts.find((c) => c.id === val) || null;
    setSelectedContact(contact);
  };

  const handleSiteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__new__") {
      setSelectedSite(null);
      setShowNewSite(true);
      return;
    }
    setShowNewSite(false);
    const site = sites.find((s) => s.id === val) || null;
    setSelectedSite(site);
  };

  const saveNewContact = async () => {
    if (!newContact.name.trim() || !newContact.email.trim() || !newContact.phone.trim()) {
      alert("Please fill in all contact fields.");
      return;
    }
    setSavingContact(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });
      if (res.ok) {
        const saved: Contact = await res.json();
        setContacts((prev) => {
          const exists = prev.some((c) => c.id === saved.id);
          const updated = exists ? prev : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name));
          return updated;
        });
        setSelectedContact(saved);
        setShowNewContact(false);
        setNewContact({ name: "", email: "", phone: "" });
      }
    } catch { /* ignore */ }
    setSavingContact(false);
  };

  const saveNewSite = async () => {
    if (!newSite.name.trim() || !newSite.address.trim()) {
      alert("Please fill in all site fields.");
      return;
    }
    setSavingSite(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSite),
      });
      if (res.ok) {
        const saved: Site = await res.json();
        setSites((prev) => {
          const exists = prev.some((s) => s.id === saved.id);
          const updated = exists ? prev : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name));
          return updated;
        });
        setSelectedSite(saved);
        setShowNewSite(false);
        setNewSite({ name: "", address: "" });
      }
    } catch { /* ignore */ }
    setSavingSite(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: selectedContact.name,
          email: selectedContact.email,
          phone: selectedContact.phone,
          siteName: selectedSite.name,
          siteAddress: selectedSite.address,
          contactId: selectedContact.id,
          siteId: selectedSite.id,
          poNumber,
          notes,
          items: items.map((item) => ({
            code: item.code,
            baseCode: item.baseCode,
            name: item.name,
            size: item.size,
            material: item.material,
            description: item.description,
            price: item.price,
            quantity: item.quantity,
            ...(item.customSign ? { customSign: item.customSign } : {}),
            ...(item.customFieldValues ? { customFieldValues: item.customFieldValues } : {}),
          })),
          subtotal: totalPrice,
          vat: totalPrice * 0.2,
          total: totalPrice * 1.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        clearBasket();
        router.push(`/order-confirmation?order=${data.orderNumber}`);
      } else {
        alert("Failed to submit order. Please try again.");
      }
    } catch {
      alert("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-persimmon-green/15 focus:border-persimmon-green outline-none transition bg-white appearance-none cursor-pointer";
  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-persimmon-green/15 focus:border-persimmon-green outline-none transition bg-white";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/basket" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-persimmon-green transition mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to basket
      </Link>
      <h1 className="text-2xl font-bold text-persimmon-navy mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">

          {/* Contact section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-persimmon-navy mb-5">Contact Details</h2>
            <select value={selectedContact?.id || (showNewContact ? "__new__" : "")} onChange={handleContactSelect} className={selectClass}>
              <option value="" disabled>Select a contact...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
              <option value="__new__">+ Add new contact</option>
            </select>

            {selectedContact && !showNewContact && (
              <div className="mt-3 px-1 text-sm text-gray-500 space-y-0.5">
                <p className="font-medium text-gray-700">{selectedContact.name}</p>
                <p>{selectedContact.email}</p>
                <p>{selectedContact.phone}</p>
              </div>
            )}

            {showNewContact && (
              <div className="mt-4 border-2 border-dashed border-persimmon-green rounded-xl p-4 bg-emerald-50/30">
                <p className="text-sm font-semibold text-persimmon-navy mb-3">New Contact</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input type="text" placeholder="Name *" value={newContact.name} onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
                  <input type="email" placeholder="Email *" value={newContact.email} onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))} className={inputClass} />
                  <input type="tel" placeholder="Phone *" value={newContact.phone} onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))} className={inputClass} />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button type="button" onClick={() => { setShowNewContact(false); setNewContact({ name: "", email: "", phone: "" }); }} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="button" onClick={saveNewContact} disabled={savingContact} className="px-4 py-2 text-sm text-white bg-persimmon-green rounded-lg font-medium hover:bg-persimmon-green-dark transition disabled:opacity-50">{savingContact ? "Saving..." : "Save Contact"}</button>
                </div>
              </div>
            )}
          </div>

          {/* Site section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-persimmon-navy mb-5">Site Details</h2>
            <select value={selectedSite?.id || (showNewSite ? "__new__" : "")} onChange={handleSiteSelect} className={selectClass}>
              <option value="" disabled>Select a site...</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
              <option value="__new__">+ Add new site</option>
            </select>

            {selectedSite && !showNewSite && (
              <div className="mt-3 px-1 text-sm text-gray-500 space-y-0.5">
                <p className="font-medium text-gray-700">{selectedSite.name}</p>
                <p>{selectedSite.address}</p>
              </div>
            )}

            {showNewSite && (
              <div className="mt-4 border-2 border-dashed border-persimmon-green rounded-xl p-4 bg-emerald-50/30">
                <p className="text-sm font-semibold text-persimmon-navy mb-3">New Site</p>
                <div className="space-y-3">
                  <input type="text" placeholder="Site Name *" value={newSite.name} onChange={(e) => setNewSite((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
                  <textarea placeholder="Site Address *" value={newSite.address} onChange={(e) => setNewSite((p) => ({ ...p, address: e.target.value }))} rows={2} className={inputClass} />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button type="button" onClick={() => { setShowNewSite(false); setNewSite({ name: "", address: "" }); }} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="button" onClick={saveNewSite} disabled={savingSite} className="px-4 py-2 text-sm text-white bg-persimmon-green rounded-lg font-medium hover:bg-persimmon-green-dark transition disabled:opacity-50">{savingSite ? "Saving..." : "Save Site"}</button>
                </div>
              </div>
            )}
          </div>

          {/* PO Number & Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-persimmon-navy mb-5">Order Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">PO Number</label>
                <input type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className={inputClass} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Special Instructions</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} placeholder="Any special requirements or notes..." />
              </div>
            </div>
          </div>
        </div>

        {/* Order summary sidebar */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-base font-semibold text-persimmon-navy mb-4">Order Summary</h2>

            <div className="space-y-2.5 mb-4 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.code} className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 truncate mr-2">
                      {item.customSign ? "Custom Sign" : item.code} x{item.quantity}
                    </span>
                    {item.customSign ? (
                      <span className="font-medium text-amber-600 shrink-0 text-xs">Quote</span>
                    ) : (
                      <span className="font-medium text-gray-700 shrink-0">
                        {"\u00A3"}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {item.customFieldValues && item.customFieldValues.length > 0 && (
                    <div className="ml-1 mt-0.5">
                      {item.customFieldValues.map((f) => (
                        <p key={f.key} className="text-[11px] text-persimmon-green truncate">
                          {f.label}: <span className="text-gray-400">{f.value}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span>
                <span>{"\u00A3"}{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>VAT (20%)</span>
                <span>{"\u00A3"}{(totalPrice * 0.2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-persimmon-navy pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{"\u00A3"}{(totalPrice * 1.2).toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full mt-6 bg-persimmon-green text-white py-3 rounded-xl font-medium hover:bg-persimmon-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting ? "Submitting Order..." : "Submit Order"}
            </button>

            {!selectedContact && !showNewContact && (
              <p className="text-[11px] text-amber-600 mt-3 text-center">Please select or add a contact to continue.</p>
            )}
            {!selectedSite && !showNewSite && selectedContact && (
              <p className="text-[11px] text-amber-600 mt-3 text-center">Please select or add a site to continue.</p>
            )}

            <p className="text-[11px] text-gray-400 mt-3 text-center leading-relaxed">
              All prices exclude VAT. You will receive a confirmation email.
            </p>
            {items.some((i) => i.customSign) && (
              <p className="text-[11px] text-amber-600 mt-2 text-center leading-relaxed">
                Custom sign items will be quoted separately after review.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd shop && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manually test in browser**

1. Navigate to `/checkout` with items in basket
2. Verify dropdown shows "Select a contact..." placeholder
3. Select "+ Add new contact" — verify inline form appears
4. Fill in name/email/phone, click Save — verify it appears in dropdown and is selected
5. Repeat for site dropdown
6. Submit order — verify it succeeds and redirects to confirmation

- [ ] **Step 4: Commit**

```bash
git add shop/app/(shop)/checkout/page.tsx
git commit -m "feat: replace checkout free-text with contact/site dropdown selectors"
```

---

## Chunk 3: Orders Page with Site Bento Cards

### Task 6: Add site bento cards and filtering to orders page

**Files:**
- Modify: `shop/app/(shop)/orders/page.tsx`

- [ ] **Step 1: Update the Order interface**

At the top of `shop/app/(shop)/orders/page.tsx`, add `contactId` and `siteId` to the Order interface:

```ts
interface Order {
  orderNumber: string;
  createdAt: string;
  status: string;
  contactId: string | null;
  siteId: string | null;
  contact: { contactName: string; email: string; phone: string };
  site: { siteName: string; siteAddress: string };
  poNumber: string | null;
  notes: string | null;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  total: number;
}
```

- [ ] **Step 2: Add site filter state and computed site cards**

In the `OrdersPage` component, add the site filter state after the existing state declarations (around line 51):

```ts
const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
```

Add a `useMemo` to compute site card data (after the existing `filteredOrders` memo):

```ts
const siteCards = useMemo(() => {
  const siteMap = new Map<string, { siteId: string; name: string; address: string; statuses: Record<string, number> }>();
  for (const o of orders) {
    if (!o.siteId) continue;
    let entry = siteMap.get(o.siteId);
    if (!entry) {
      entry = { siteId: o.siteId, name: o.site.siteName, address: o.site.siteAddress, statuses: {} };
      siteMap.set(o.siteId, entry);
    }
    entry.statuses[o.status] = (entry.statuses[o.status] || 0) + 1;
  }
  return Array.from(siteMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}, [orders]);
```

Update the `filteredOrders` memo to also filter by selected site:

```ts
const filteredOrders = useMemo(() => {
  let result = orders;
  // When a site is selected, show orders for that site + orders without a siteId (pre-feature orders)
  if (selectedSiteId) result = result.filter((o) => o.siteId === selectedSiteId || !o.siteId);
  if (filter !== "all") result = result.filter((o) => o.status === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.contact.contactName.toLowerCase().includes(q) ||
        o.site.siteName.toLowerCase().includes(q)
    );
  }
  return result;
}, [orders, filter, search, selectedSiteId]);
```

- [ ] **Step 3: Add the site bento cards section to the JSX**

Insert the site cards section between the header and the search bar (after the closing `</div>` of the header around line 120, before the `{/* Search */}` comment):

```tsx
{/* Site bento cards */}
{siteCards.length > 0 && (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-sm font-semibold text-persimmon-navy">Your Sites</h2>
      <span className="bg-persimmon-navy text-white px-2.5 py-0.5 rounded-full text-[11px] font-medium">
        {siteCards.length} {siteCards.length === 1 ? "site" : "sites"}
      </span>
    </div>
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {siteCards.map((site) => {
        const isSelected = selectedSiteId === site.siteId;
        return (
          <button
            key={site.siteId}
            onClick={() => setSelectedSiteId(isSelected ? null : site.siteId)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? "border-persimmon-green bg-white shadow-sm"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <p className="font-semibold text-persimmon-navy text-sm">{site.name}</p>
              {isSelected && (
                <span className="w-5 h-5 bg-persimmon-green rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-2 line-clamp-1">{site.address}</p>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(site.statuses).map(([status, count]) => {
                const cfg = statusConfig[status];
                if (!cfg) return null;
                return (
                  <span key={status} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}>
                    {count} {cfg.label}
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  </div>
)}

{/* Active site filter indicator */}
{selectedSiteId && (
  <div className="flex items-center gap-2 mb-4">
    <span className="text-sm text-persimmon-navy font-medium">
      Showing: {siteCards.find((s) => s.siteId === selectedSiteId)?.name}
    </span>
    <button
      onClick={() => setSelectedSiteId(null)}
      className="text-xs text-gray-400 border border-gray-200 rounded-lg px-2 py-0.5 hover:bg-gray-50 transition"
    >
      Clear filter
    </button>
  </div>
)}
```

- [ ] **Step 4: Add `useMemo` to imports if not already present**

Check that line 3 includes `useMemo`:

```ts
import { useState, useEffect, useMemo } from "react";
```

(It already does in the current file.)

- [ ] **Step 5: Type-check**

```bash
cd shop && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Manually test in browser**

1. Navigate to `/orders`
2. If there are orders with `siteId`, verify bento cards appear at top
3. Click a site card — verify it highlights with green border and filters the list
4. Click again — verify it deselects and shows all orders
5. Verify status filter pills still work alongside site filter
6. Verify search still works alongside site filter

- [ ] **Step 7: Commit**

```bash
git add shop/app/(shop)/orders/page.tsx
git commit -m "feat: add site bento cards with filtering to orders page"
```

---

### Task 7: Final verification and push

- [ ] **Step 1: Type-check the entire project**

```bash
cd shop && npx tsc --noEmit
```

- [ ] **Step 2: Build the project**

```bash
cd shop && npm run build
```

Expected: clean build with no errors.

- [ ] **Step 3: Push to remote**

```bash
git push origin main
```

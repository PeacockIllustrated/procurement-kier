# Contacts, Sites & Orders Page Redesign

## Goal

Add persistent contacts and sites to the Persimmon Signage Portal so orders can be placed against saved records, providing Persimmon with a semi-audit trail of who ordered what for which site. Redesign the customer orders page with a bento-card site overview and filtered order list.

## Architecture

Two new Supabase tables (`psp_contacts`, `psp_sites`) store reusable contact and site records. Orders link to these via foreign keys while keeping denormalised text fields for historical integrity (if a contact's phone number changes, past orders keep the original). The checkout form replaces free-text inputs with dropdown selectors that auto-fill from saved records, with inline "add new" forms. The orders page gains a site bento-card grid at the top that filters the order list below.

## Data Model

### New tables

```sql
CREATE TABLE psp_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  email        text NOT NULL UNIQUE,
  phone        text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE psp_sites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  address      text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- RLS policies (service role access)
ALTER TABLE psp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE psp_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_psp_contacts" ON psp_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_psp_sites" ON psp_sites FOR ALL USING (true) WITH CHECK (true);
```

### Changes to `psp_orders`

Add two nullable foreign key columns with indexes:

```sql
ALTER TABLE psp_orders ADD COLUMN contact_id uuid REFERENCES psp_contacts(id);
ALTER TABLE psp_orders ADD COLUMN site_id uuid REFERENCES psp_sites(id);
CREATE INDEX idx_psp_orders_contact_id ON psp_orders(contact_id);
CREATE INDEX idx_psp_orders_site_id ON psp_orders(site_id);
```

These are nullable so existing orders (created before this feature) remain valid. The existing `contact_name`, `email`, `phone`, `site_name`, `site_address` text columns stay — they are the order's snapshot of the data at time of placement. The foreign keys are for grouping/filtering only.

### New API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/contacts` | List all contacts, sorted by name ascending |
| POST | `/api/contacts` | Create a new contact |
| GET | `/api/sites` | List all sites, sorted by name ascending |
| POST | `/api/sites` | Create a new site |

All require `shop-auth` or `admin-auth`.

#### POST /api/contacts

**Request body:**
- `name` — required, non-empty, max 200 chars
- `email` — required, must match email regex, max 200 chars
- `phone` — required, non-empty, max 50 chars

**Response:** `{ id, name, email, phone, created_at }` (201 Created)

**Duplicate handling:** If `email` already exists, return the existing record (200 OK) rather than failing. This prevents confusion when two people try to add the same contact.

#### POST /api/sites

**Request body:**
- `name` — required, non-empty, max 200 chars
- `address` — required, non-empty, max 500 chars

**Response:** `{ id, name, address, created_at }` (201 Created)

**Duplicate handling:** If `name` already exists, return the existing record (200 OK).

### Changes to existing endpoints

- `POST /api/orders` — accepts optional `contactId` and `siteId` fields. If provided, stores them as foreign keys on the order. Contact/site text fields are still populated (snapshot).
- `GET /api/orders` — response adds `contactId` and `siteId` as top-level fields:

```ts
{
  orderNumber: string;
  contactId: string | null;  // NEW
  siteId: string | null;     // NEW
  contact: { contactName, email, phone };  // unchanged snapshot
  site: { siteName, siteAddress };         // unchanged snapshot
  // ...rest unchanged
}
```

## Checkout Page Changes

### Contact section
- Dropdown selector populated from `GET /api/contacts`
- Selecting a contact auto-fills name, email, phone as read-only display below dropdown
- Snapshot fields are read-only when a saved contact is selected. To use different details, the user selects "+ Add new contact" instead
- "+ Add new contact" option at bottom of dropdown
- When selected, expands an inline form (name, email, phone) with Save/Cancel buttons
- Saving POSTs to `/api/contacts`, adds to dropdown, and selects the new contact
- Fields: white background, light grey border (#e5e7eb)

### Site section
- Dropdown selector populated from `GET /api/sites`
- Selecting a site auto-fills site name and address as read-only display below dropdown
- Snapshot fields are read-only when a saved site is selected. To use a different address, the user selects "+ Add new site" instead
- "+ Add new site" option at bottom of dropdown
- When selected, expands an inline form (name, address textarea) with Save/Cancel buttons
- Saving POSTs to `/api/sites`, adds to dropdown, and selects the new site
- Fields: white background, light grey border (#e5e7eb)

### PO Number & Notes
- Remain as free-text inputs (not tied to contact or site)

## Orders Page Changes

### Site bento cards (top section)
- Header: "Your Sites" with site count pill
- Responsive grid: `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`
- Each card shows:
  - Site name (bold, persimmon-navy)
  - Site address (grey, smaller text)
  - Status breakdown as coloured pills (e.g., "2 new", "1 awaiting PO", "3 completed")
- Card data is computed client-side from the orders list (group by `siteId`, count statuses)
- Clicking a card: highlights it (green border + checkmark), filters order list to that site
- Clicking again: deselects, shows all orders
- Sites with zero orders are not shown (only sites that have orders appear)

### Filtered order list (below cards)
- When a site is selected: shows "Showing: {site name}" with a "Clear filter" button
- Existing status filter pills and search bar remain
- Order cards unchanged — still expandable with full detail view

### Edge case: orders without a site_id
- Orders without a `site_id` (placed before this feature) always appear in the order list regardless of which site card is selected
- They do not get a bento card

## What's NOT in scope
- Company/organisation layer — contacts and sites are flat, not grouped under a company
- Editing or deleting contacts/sites — add-only for v1
- Spend totals on site cards — just order count and status breakdown
- Dedicated site detail pages — clicking a card filters the list, doesn't navigate
- Contact bento cards — only sites get the bento overview
- Migrating existing orders to link to contacts/sites retroactively

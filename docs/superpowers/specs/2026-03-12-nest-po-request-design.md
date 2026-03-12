# Nest PO Request System — Design Spec

## Overview

Add a "Send to Nest" workflow to the Persimmon admin dashboard so that admins can send a formatted PO request email to Nest with one click. This replaces the current manual process of drafting and sending emails. The system introduces a new `awaiting_po` order status to track orders that are waiting on a purchase order from Nest.

**Initial deployment is internal-only** — the `NEST_EMAIL` env var will point to an Onesign team address for testing. Once verified, it will be swapped to Nest's real email.

## Status Model

### Current

```
new → in-progress → completed
         ↘ cancelled
```

### New

```
new → awaiting_po → in-progress → completed
         ↘ cancelled (from any state)
```

### Changes Required

1. **Database:** `ALTER` the CHECK constraint on `psp_orders.status` to include `'awaiting_po'`
2. **API validation:** Add `'awaiting_po'` to the valid statuses array in `shop/app/api/orders/[orderNumber]/route.ts` (PATCH handler)
3. **Admin dashboard:** Update filter pills, status dropdown, and badge colours in `shop/app/(shop)/admin/page.tsx`
4. **Customer orders page:** Add `awaiting_po` status description in `shop/app/(shop)/orders/page.tsx`

### Badge Colour

- `new` — green (existing)
- `awaiting_po` — amber/yellow (new)
- `in-progress` — blue (existing)
- `completed` — grey (existing)
- `cancelled` — red (existing)

## API: Send to Nest

### Endpoint

**POST `/api/orders/[orderNumber]/send-to-nest`**

### Authentication

Requires `admin-auth` cookie (same as existing admin endpoints).

### Request

No body required — the order number is in the URL path.

### Logic

1. Fetch order from `psp_orders` by order number
2. Validate: order exists, status is `new` (reject if already `awaiting_po` or later — prevents duplicate sends)
3. Fetch order items from `psp_order_items` by order ID
4. Send PO request email to `NEST_EMAIL` env var via Resend
5. Update order status to `awaiting_po`
6. Return response

### Response

**Success (200):**
```json
{ "success": true, "message": "PO request sent to Nest" }
```

**Error (400/404/500):**
```json
{ "error": "Description of what went wrong" }
```

### Guard Rails

- Rejects if order status is not `new` (prevents double-sending)
- If email send fails, status is NOT updated (no silent failures)
- If status update fails after email send, returns error with note that email was sent (admin can retry or manually set status)

## Email Template

### Recipient

`NEST_EMAIL` environment variable (single fixed address).

### Subject

`PO Request — {orderNumber} — {siteName}`

### Body (HTML)

Follows the existing Persimmon email template style from `shop/lib/email.ts`:

- **Header:** Persimmon green banner with "Purchase Order Request"
- **Order details section:**
  - Order Number
  - Site Name
  - Site Address
  - Contact Name
  - Contact Email
  - Contact Phone
  - Customer PO Number (if provided at checkout)
  - Notes (if provided)
- **Items table:**
  - Columns: Product, Size, Material, Qty, Unit Price, Line Total
  - Custom sign items marked with sign type badge (same as existing emails)
- **Totals:**
  - Subtotal
  - VAT (20%)
  - Total

### New Function

`sendNestPORequest(order, items)` added to `shop/lib/email.ts`. Uses the same Resend client and inline-HTML approach as existing email functions.

### Sender

Same `FROM_EMAIL` env var used for all other system emails.

## Admin Dashboard UI

### "Send to Nest" Button

- **Visibility:** Appears on order cards with status `new` only
- **Placement:** Inside the order detail accordion, alongside the status dropdown
- **Style:** Amber/yellow button to visually associate with the `awaiting_po` state
- **Confirmation:** Browser `confirm()` dialog — "Send PO request to Nest for {orderNumber}?"
- **Loading state:** Button shows spinner/disabled state while request is in flight
- **Success:** Order status updates to `awaiting_po` in the UI (refetch or local state update)
- **Failure:** Error message displayed inline on the order card

### Filter Pills

Add `awaiting_po` pill between `new` and `in-progress`:

`All | New | Awaiting PO | In Progress | Completed`

Each pill shows a count badge.

### Status Dropdown

Add `Awaiting PO` option to the existing status dropdown. Normal workflow is via the button, but manual override is available.

### Status Badge

`awaiting_po` renders as an amber/yellow badge with text "Awaiting PO".

## Customer Orders Page

Add `awaiting_po` to the status descriptions:

- `new` — "Your order has been received and is being reviewed."
- `awaiting_po` — "Your order has been sent for purchase order approval."
- `in-progress` — "Your order is being processed."
- `completed` — "Your order has been completed."
- `cancelled` — "This order has been cancelled."

## Environment Variables

| Variable | Purpose | Initial Value (Testing) |
|----------|---------|------------------------|
| `NEST_EMAIL` | Recipient for PO request emails | Onesign team email address |

No new Supabase env vars needed — uses existing connection.

## Database Migration

```sql
-- Add 'awaiting_po' to the status check constraint
ALTER TABLE psp_orders DROP CONSTRAINT IF EXISTS psp_orders_status_check;
ALTER TABLE psp_orders ADD CONSTRAINT psp_orders_status_check
  CHECK (status IN ('new', 'awaiting_po', 'in-progress', 'completed', 'cancelled'));
```

## Files Changed

| File | Change |
|------|--------|
| `shop/app/api/orders/[orderNumber]/route.ts` | Add `'awaiting_po'` to valid statuses |
| `shop/app/api/orders/[orderNumber]/send-to-nest/route.ts` | **New file** — POST handler for sending PO request |
| `shop/lib/email.ts` | Add `sendNestPORequest()` function |
| `shop/app/(shop)/admin/page.tsx` | Add button, filter pill, badge colour, dropdown option |
| `shop/app/(shop)/orders/page.tsx` | Add `awaiting_po` status description |
| `shop/supabase-setup.sql` | Update CHECK constraint documentation |

## What Does NOT Change

- Order submission flow (checkout, POST `/api/orders`)
- Customer confirmation and team notification emails
- Product catalog, images, custom sign builder
- Authentication model
- Any other existing functionality

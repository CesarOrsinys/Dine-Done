# Stripe Checkout Integration Guide & TODO

This document is the single source of truth for the Stripe Checkout Embedded Form integration using the Dahlia API (`2026-03-25.dahlia`).

---

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [server/routes/checkout.routes.ts](server/routes/checkout.routes.ts)
- [.env](.env)
- [src/ui/services/StripeCheckoutService.ts](src/ui/services/StripeCheckoutService.ts)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| mode | `payment` | Set to `"payment"` for one-time charges or `"subscription"` for recurring billing. Choose based on product type. |
| line_items[].price | `price_...` | Your actual Stripe Price ID from the Dashboard (https://dashboard.stripe.com/prices) or API. |
| STRIPE_SECRET_KEY | `sk_test_...` | Your secret API key from the Stripe Dashboard (https://dashboard.stripe.com/test/apikeys). Server-side only. |
| STRIPE_PUBLISHABLE_KEY | `pk_test_...` | Your publishable API key from the Stripe Dashboard. |
| VITE_STRIPE_PUBLISHABLE_KEY | `pk_test_...` | Browser-accessible publishable key in Vite for client-side Stripe initialization. |
| STRIPE_WEBHOOK_SECRET | `whsec_...` | Your webhook endpoint signing secret from Stripe Dashboard (https://dashboard.stripe.com/workbench/webhooks). |

---

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [server/routes/checkout.routes.ts](server/routes/checkout.routes.ts)

| Parameter | Value |
|-----------|-------|
| ui_mode | `form` |
| billing_address_collection | `auto` |
| phone_number_collection | `{ "enabled": false }` |
| automatic_tax | `{ "enabled": false }` |
| submit_type | `auto` |
| integration_identifier | `custom_embedded_web_0001` |
| payment_method_collection | `always` (applied automatically when mode is `"subscription"`) |

---

## Setup and Next Steps

### 1. Environment Variables and Setup
Ensure the following variables are defined in your [`.env`](.env) file:
```env
# Stripe Server Secret Key (Never expose to browser)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Webhook Secret (For signature verification on /api/webhook)
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Publishable Keys (VITE_ prefix exposes to Vite client)
STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App Domain
DOMAIN=http://localhost:3000
```

Dependencies installed:
- `stripe`: Server-side Node SDK with support for API version `2026-03-25.dahlia`.

### 2. Project Structure of Integration Files
- [`server/routes/checkout.routes.ts`](server/routes/checkout.routes.ts): Server endpoint `POST /api/create-checkout-session` calling `stripe.checkout.sessions.create(...)` and `POST /api/webhook` handler.
- [`server/app.ts`](server/app.ts): Mounts `/api` checkout router and raw webhook middleware.
- [`index.html`](index.html):
  - Loads Stripe.js Dahlia script: `<script src="https://js.stripe.com/dahlia/stripe.js"></script>` in `<head>`.
  - Mount target container: `<div id="checkout-form"></div>`.
- [`src/ui/services/StripeCheckoutService.ts`](src/ui/services/StripeCheckoutService.ts): Client service initializing `stripe.initCheckoutFormSdk(...)` with configured appearance and confirm actions.

### 3. How the Integration Works (Flow Overview)
1. **Customer opens cart:** The client invokes `initStripeCheckoutForm()`.
2. **Session Creation:** The client sends a `POST` request to `/api/create-checkout-session`.
3. **Checkout Session:** The server calls `stripe.checkout.sessions.create` configured with `ui_mode: "form"`, `mode: "payment"`, and configured Checkout Studio parameters, returning `{ client_secret: session.client_secret }`.
4. **Form Mounting:** The client initializes `stripe.initCheckoutFormSdk({ clientSecret, appearance })`, creates an expanded form, and mounts it inside `#checkout-form`.
5. **Confirmation & Actions:** The client listens for the `confirm` event and confirms payment via `loadActionsResult.actions.confirm({ formConfirmEvent })`.
6. **Webhook Notification:** Upon completion, Stripe sends `checkout.session.completed` to `POST /api/webhook` for fulfillment and order recording.

### 4. Testing Credit Card Numbers and Test Modes
When running in Stripe Test Mode (`sk_test_...` / `pk_test_...`), use standard test card credentials:
- **Card Number:** `4242 4242 4242 4242`
- **Expiration:** Any future date (e.g. `12/32`)
- **CVC:** Any 3 digits (e.g. `123`)
- **Postal Code:** Any valid postal code (e.g. `28001`)

### 5. Next Steps
1. Replace placeholder `price_...` in [`server/routes/checkout.routes.ts`](server/routes/checkout.routes.ts) with real Price IDs created in your Stripe Dashboard, or dynamically generate them from the restaurant order items.
2. Add your real Stripe test keys (`pk_test_...`, `sk_test_...`, `whsec_...`) to [`.env`](.env).
3. Set up the Stripe CLI to forward webhooks locally for development:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhook
   ```
4. Verify order fulfillment logic inside `handleStripeWebhook` in [`server/routes/checkout.routes.ts`](server/routes/checkout.routes.ts) to mark orders as paid in Supabase.

### 6. Official Resources
- [Stripe Support](https://support.stripe.com)
- [Stripe Documentation & MCP](https://docs.stripe.com/mcp)
- [Stripe Embedded Checkout Guide](https://docs.stripe.com/checkout/embedded/quickstart)

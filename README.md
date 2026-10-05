# Ekiosa — web store and Android app

An npm-workspaces monorepo:

| Path | What it is |
| --- | --- |
| `apps/web` | Next.js 16 storefront (deployed on Vercel). Also hosts the order API the app calls. |
| `apps/mobile` | Expo (SDK 57) React Native app, Android first. |
| `packages/shared` | Types, pricing, checkout validation, search params, catalog queries — used by both apps. |
| `supabase/` | Database migrations and seed data. |

The catalog, profiles, orders, wishlists and push tokens live in **Supabase**. **Google sign-in** (Supabase Auth) is required to check out. **Mailgun** sends order confirmations and **Expo push** sends order notifications. Payments are still a placeholder (Stripe comes next).

```bash
npm install                 # installs every workspace
npm run dev:web             # web on http://localhost:3000
npm run build:web
npm run lint:web
npm run typecheck           # all workspaces
npm run dev:mobile          # Expo dev server (needs a development build — see "Mobile app")
npm run db:apply            # apply new migrations (seeds only an empty catalog)
npm run db:seed:generate    # rebuild supabase/seed.sql from apps/web/src/lib/data
```

> **Vercel:** set the project's **Root Directory** to `apps/web`.
> Web env vars live in `apps/web/.env.local` (see `apps/web/.env.example`).

## Setup

### 1. Environment
Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in the values. `SUPABASE_SERVICE_ROLE_KEY` and `MAILGUN_API_KEY` are server-only, so never give them a `NEXT_PUBLIC_` prefix.

### 2. Supabase database
In the Supabase dashboard → **SQL Editor**, run these in order:
1. `supabase/migrations/0001_init.sql`: tables, row-level security, the profile trigger and the `create_order` function.
2. `supabase/seed.sql`: 6 categories and 42 products.

### 3. Google sign-in
1. **Google Cloud Console** → APIs & Services → Credentials → your OAuth client (type "Web application"):
   - Authorized JavaScript origins: `http://localhost:3000` (plus any deployed URL)
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
2. **Supabase** → Authentication → Sign In / Providers → **Google**: enable it and paste the client ID and secret.
3. **Supabase** → Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`, plus every other origin you test on. For example `http://localhost:50230/**`, a deployed domain, or a tunnel URL. Quick-tunnel URLs change on every restart.

### 4. Mailgun
1. Create a Mailgun account. Under **Sending → Domains**, use the sandbox domain for testing. Add your own email under the sandbox's **Authorized Recipients** and confirm it, because sandbox only delivers to authorized addresses.
2. Create an API key (**API Security**). Set `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM` and `MAILGUN_API_BASE` (US `https://api.mailgun.net` or EU `https://api.eu.mailgun.net`).
3. For production, add and verify your own domain (SPF, DKIM and MX DNS records).

If Mailgun isn't configured, orders still succeed and the server logs that the email was skipped.

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Hero, value props, categories, bestsellers, promo banner, new arrivals, reviews |
| `/shop` | Server-rendered product grid with search, filters, sorting and filter chips. All filter state lives in the URL (`?q=&category=&min=&max=&instock=&sale=&sort=`) |
| `/products/[slug]` | Gallery, price/discount, stock, quantity, add to bag, details, related products |
| `/cart` | Line items, quantity, remove + undo, promo code, free-shipping progress, summary |
| `/checkout` | Google sign-in gate when signed out. When signed in: contact (from Google), address, delivery, payment placeholder |
| `/order/[id]` | Confirmation, visible only to the order's owner |
| `/account` | Google sign-in, or your profile and order history |

### Demo hooks
- **Promo codes:** `WELCOME10`, `LOAM20`. Validated in the bag for feedback, and again on the server.
- **Checkout error:** tick "Simulate a declined payment" in the payment section.
- **Stock:** several products are low stock or sold out. The server re-checks stock when you order.

## How it fits together
- **Catalog:** `src/lib/services/catalog.ts` (server-only) reads Supabase with a cookie-less anon client, so the home and product pages can be cached (`revalidate = 60`). `/shop` renders on the server from the URL's filters. Navbar suggestions come from a server action (`src/app/actions/search.ts`).
- **Auth:**
  - `src/proxy.ts` refreshes the session cookie on each request.
  - `src/app/auth/callback/route.ts` completes OAuth.
  - Server code uses `getUser()` from `src/lib/auth/get-user.ts`.
  - The navbar uses the `useSessionUser()` client hook, for display only.
- **Checkout:**
  - `/checkout` shows a Google sign-in gate when signed out. The bag is kept in localStorage, so it survives the redirect.
  - `placeOrderAction` (`src/app/checkout/actions.ts`) requires a user and re-validates the form.
  - It re-prices every item from the database and re-checks the promo code.
  - It then calls the `create_order` database function, which checks and decrements stock and inserts the order atomically.
- **Orders:** `/order/[id]` and `/account` read orders under row-level security, so users only ever see their own.
- **Email:** after an order is created, `after()` runs `sendOrderConfirmation` (`src/lib/email/*`). That sends through the Mailgun API and records `confirmation_email_sent_at`. A failed email is logged and never fails the order.

## Mobile app (`apps/mobile`)

Expo Router screens: Home, Shop (search, category chips, filter and sort sheets), Saved (wishlist), Bag (swipe to remove, promo, free-shipping progress) and Account (orders, sign-out), plus product, checkout, order and sign-in screens. It reads the catalog straight from Supabase with the shared query code, and places orders through the web app's **`POST /api/orders`**, so prices, stock checks and emails are identical to the website.

### One-time setup
1. **Config:** copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in the values. They are public (they ship in the app); never put the service-role key here. Set `EXPO_PUBLIC_API_URL` to your Vercel URL.
2. **Expo / EAS:** `npm i -g eas-cli`, `eas login`, then in `apps/mobile` run `eas init` (adds the project ID push needs). Add the same `EXPO_PUBLIC_*` values as EAS environment variables (`eas env:create`) for cloud builds.
3. **Google sign-in (native):**
   - Get the Android signing SHA-1: `eas credentials -p android`.
   - In Google Cloud → Credentials, create an **Android** OAuth client for package `market.ekiosa.app` with that SHA-1.
   - In Supabase → Authentication → Providers → Google, add the Android client ID to **Authorized Client IDs** (comma-separated, next to the Web client ID).
   - Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the **Web** client ID.
4. **Push notifications (Android):**
   - Create a Firebase project and add an Android app with package `market.ekiosa.app`.
   - Upload the FCM V1 service-account key with `eas credentials -p android` → Push Notifications.
   - "Order shipped" pushes: in Supabase → Database → Webhooks, add a webhook on `orders` for **UPDATE** that POSTs to `https://<site>/api/webhooks/order-status` with header `x-webhook-secret: <ORDER_WEBHOOK_SECRET>` (set the same secret in Vercel).
5. Apply the mobile migration if you haven't: `npm run db:apply` (`supabase/migrations/0002_mobile.sql`: wishlist, push tokens, order statuses).

### Build and run
```bash
cd apps/mobile
eas build -p android --profile development   # install the dev build on your phone/emulator
npx expo start                               # then open the dev build
eas build -p android --profile preview       # shareable APK
eas build -p android --profile production    # AAB for Google Play
eas submit -p android                        # upload to the Play internal-testing track
```

Native Google sign-in and push need a **development build**; they don't work in Expo Go.

## Next: Stripe
Replace `PaymentPlaceholder` with the Payment Element (or Stripe Checkout). Create the PaymentIntent inside `placeOrderAction` from the server-computed totals. Then move order creation and the confirmation email into the `payment_intent.succeeded` webhook.

Product photos are hot-linked from Unsplash as placeholders.

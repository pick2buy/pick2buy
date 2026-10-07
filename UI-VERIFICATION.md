# Pick2Buy UI update — 29 September 2026

## Google authentication — 7 October 2026

- Added Google Identity Services buttons to sign-in and registration, with backend verification of the ID token against the configured Google Web client ID.
- New Google users get customer accounts. Returning users are identified by Google's stable `sub`. Existing email/password accounts must sign in first and connect Google from Profile & Account; email alone never links accounts.
- Configure `GOOGLE_CLIENT_ID` on the backend and matching `VITE_GOOGLE_CLIENT_ID` on the frontend, authorize the storefront origin in Google Cloud, then apply the Prisma schema update (`prisma db push` for the existing deployment setup). Google sign-in remains hidden when the frontend client ID is absent.
- Backend and frontend build checks passed. A real Google sign-in and account linking test remain pending until a client ID is configured.
- The local SQLite schema was updated additively for `googleSub`. The Google endpoint returned 503 with no client ID and rejected an invalid credential with 401 when a test client ID was supplied. A live Google credential was unavailable.
- Other pending items found during this review: the customer support form currently shows a success alert without creating a ticket, and demo sign-in buttons were visible in production builds; the buttons are now limited to development builds. Email remains a log-only stub.

## Follow-up audit — 30 September 2026

- Compared the storefront with the current EcomBold landing page. EcomBold sells a course and has no ecommerce product card pattern, so Pick2Buy uses its light background, soft white panels, rounded corners, navy actions, and spacious typography while retaining shopping controls.
- Updated product cards and added a local fallback for broken catalog images.
- Replaced simulated Razorpay order IDs and automatic success with real Orders API creation, Checkout callback handling, signature validation, and gateway capture verification. Online methods are hidden when keys are absent. No real or test Razorpay transaction was run because valid keys are not configured.
- Added customer and guest order access checks, cart item ownership and quantity checks, coupon validity checks, stock-safe checkout updates, cancellation restocking, admin access gating, authenticated report download, searchable paginated admin orders, and shipping tracking entry.
- Verified TypeScript for frontend and backend, production Vite build, Razorpay signature unit test, API smoke checks for catalog, auth, cart, coupon, admin, and payment-unavailable behavior. An isolated SQLite copy confirmed COD order creation, guest order token access, stock deduction, cancellation, and stock restoration. The copy was removed after testing.
- Added admin product listing across statuses, edit controls, and recoverable archiving. An isolated API test created a draft, rejected an unauthorized update field, edited pricing, published it, archived it, and confirmed the archived product disappeared from the storefront while remaining in admin. The test database was removed.
- Replaced the PIN checker’s fabricated courier/date promise with an accurate COD restriction check. Inventory adjustments now validate quantities and prevent stock from dropping below zero within a transaction.
- An isolated inventory API test rejected an adjustment below zero and accepted a valid two-unit restock; the temporary database was removed.
- Remaining production work: configure Razorpay test/live keys and exercise gateway payment and webhook/recovery flows; add actual email transport; implement refund/return processing and carrier integration; replace demo catalog imagery/data; run broad automated end-to-end and device testing. Online orders currently reserve stock while payment is pending, with no automatic expiry/release for abandoned payments. Do not claim full production readiness until those are handled.

This update adapts the light canvas, navy pill buttons, generous spacing, rounded panels, and mixed sans/italic-serif headings observed at https://ecombold.com/ to Pick2Buy's existing storefront. Ecombold is currently a course landing page; its branding, text, assets, and implementation were not copied.

## Delivered

- Redesigned homepage, collection cards, promotional section, FAQ, and footer using existing catalog APIs.
- Shared navy theme across storefront and administration.
- Responsive header, product cards, cart drawer, mobile purchase bar, bottom navigation, and collapsible admin sidebar.
- Scrollable admin forms for short screens; focus containment, Escape dismissal, focus restoration, and background scroll locking for drawers and admin forms.
- Search route, URL-driven sort/category synchronization, stale-response protection, and retry states for catalog requests.
- Removed fabricated homepage testimonials, newsletter success alert, and fallback customer review counts.

## Verification performed

- TypeScript check: `node node_modules/typescript/bin/tsc --noEmit -p frontend/tsconfig.json` — passed.
- Production Vite build from frontend: `node ../node_modules/vite/bin/vite.js build` — passed.
- Browser viewport checks on homepage: 320, 375, 768, 1024, 1440, and 1920 CSS pixels. No horizontal document overflow in tested layouts. Catalog content loaded on all except the first immediate 320px matrix sample, which was still loading; populated 320px catalog was checked separately.
- Populated catalog, product, cart drawer, and shipping checkout checked at 320px. Checkout also checked at 768px.
- Added a product through the existing API and verified the cart drawer and server-calculated total; did not place an order or charge a payment.
- Search for `laptop` returned two products; unmatched search displayed an empty state.
- Mobile filters opened and dismissed with Escape.
- Development admin login succeeded. Dashboard and product form checked at 375px; CRM checked at 320px. Admin tables retain their own horizontal scrolling.
- `git diff --check` passed for changed frontend source and configuration.

## Scope and remaining platform work

This was a UI and responsive-layout update, not certification that the complete original 58-section platform specification is implemented. Existing demo product images and seeded data remain. Subsequent work replaced simulated Razorpay verification and added a backend test. Real payment testing and production readiness still need separate validation. Homepage configuration is still in source code, not an admin homepage builder. Physical-device testing, payment processing, and the full backend feature set were not verified in this pass.

The machine's npm launcher points to a missing npm CLI. Verification used installed Node/TypeScript/Vite entry points directly. The local frontend runs at http://127.0.0.1:5173 with the API on port 5000.

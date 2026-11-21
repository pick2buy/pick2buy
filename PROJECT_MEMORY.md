# Pick2Buy project memory

Last updated: 2026-11-18 (Asia/Kolkata).

## How to use this file

Read this file at the start of work, after `CODEX_INSTRUCTIONS.md`. Maintain concise, durable project facts and decisions so future chats can recover context. This is a curated record, not a complete chat history. Update it when the user confirms details or work changes the recorded state. Verify live hosting, DNS, and deployment status before acting on them.

Never store passwords, tokens, API keys, connection strings, environment file contents, or other secrets here. Keep secrets in ignored local configuration or the hosting provider's environment settings.

## Confirmed project context

- Project: Pick2Buy, an ecommerce application for the Indian market using INR.
- Official domain: `pick2buy.in` (documented in `README.md`).
- Frontend: React, Vite, TypeScript, and Tailwind CSS in `frontend/`.
- Backend: Node.js, Express, TypeScript, and Prisma in `backend/`.
- Database: PostgreSQL; SQLite is also used for local tests.
- Shared code: `shared/`; Docker configuration: `docker/` and `docker-compose.yml`.

## Hosting and domain connection

- Domain provider: GoDaddy, per the user's domain connection discussion.
- On 2026-11-07, the user reported that GoDaddy verification was completed. The type of verification was not specified.
- The user wants to connect the domain to the existing hosted application.
- Production hosting provider: Render.
- Frontend: Render Static Site, with Render origin `pick2buy-1.onrender.com`; it now serves `pick2buy.in` and redirects `www.pick2buy.in` to the apex domain.
- Backend: Render Web Service at `pick2buy.onrender.com`.
- On 2026-11-17, the user confirmed the backend uses Render Free. They chose to optimize the existing deployment rather than migrate or upgrade. Render's idle spin-down remains a separate limitation from database query performance.
- On 2026-11-07, `pick2buy.in` and `www.pick2buy.in` both became verified and received TLS certificates in Render.
- After custom-domain connection, backend logs showed CORS `Origin not allowed` for storefront API requests. The backend `FRONTEND_URL` must allow `https://pick2buy.in` and `https://www.pick2buy.in` (and can retain the Render static-site origin for compatibility).

## Deployment and collaboration rules

- Multiple developers work in this repository; follow `AGENTS.md` for synchronization and Git safety.
- Pushing to `main` deploys production, according to repository instructions. Only do this when the user explicitly asks to ship or deploy.
- Required checks for code integration include `npm run typecheck` and `npm run build`; use `scripts/verify-changed.sh` when available, with `--full` before pushing to `main`.
- Preserve unrelated local changes and private environment files.

## User preference

- The user requested repository-based Markdown memory so future work can retain project context and avoid repeatedly asking for established details.

## Performance optimization — local work, not deployed

- On 2026-11-17, branch `codex/catalog-performance` added a bounded cache that shares concurrent catalog loads, 30-second server caches for categories and active banner records, parallel product/offer/count reads, and skipped redundant counts for computed sorting. Product/category/banner edits invalidate server caches; banner schedules are checked on every response.
- The frontend reuses public product-list/category-list/banner responses for 15 seconds and shares concurrent requests. Mutations clear this cache; account/cart/payment responses and role-dependent product details are excluded. Secondary routes load on demand, reducing the main compressed JavaScript bundle from approximately 159 KB to 96 KB in the local build.
- Validation: typecheck, production build, and 29 isolated SQLite regression tests passed. Local cached catalog responses measured 8–9 ms through Vite; the first product request still measured approximately 1.9 seconds. These are local observations, not production guarantees. No deployment or database migration was performed during that initial validation.
- Follow-up on 2026-11-17: enabled Prisma 5.22's `relationJoins` preview feature in the PostgreSQL generator (joined relation reads become its default) and started database connection warmup during backend startup. Read-only PostgreSQL checks reduced a product-list load from 9 SQL queries to 3; joined and separate-query product results were identical. After startup warmup, local requests measured approximately 742 ms for uncached products, 210 ms for categories, and 277 ms for Home & Kitchen category details; cached products/categories measured 5–7 ms. Typecheck, build, and 29 SQLite tests passed; SQLite tests do not exercise PostgreSQL joins. These follow-up changes require client regeneration but no database migration; production deployment was separate from those local checks.

## Commerce implementation — local work, not deployed

- On 2026-11-17, the local product API returned HTTP 500 because the generated Prisma client was stale and the migration helper ignored the local `DATABASE_URL`. Regenerated Prisma Client after confirming migrations were applied, updated `backend/scripts/prisma-postgres.cjs` to fall back to local `DATABASE_URL`, and verified `/api/products` returns product data. This local fix is not yet committed or deployed.

- Added migration `20261109000000_commerce_features` for blocking/referrals, soft-deleted categories, per-product quantity limits, order operation locks, cancelled items, historical MRP snapshots, restricted coupons, and offers. Applied successfully to the locally configured cloud database on 2026-11-09 with explicit user approval. Product/order/user counts were unchanged before and after. Local products and categories APIs returned HTTP 200 afterwards; previously products returned 500 because schema fields were missing. Code has not been pushed/deployed as part of this migration.
- Wishlist-to-cart now validates stock/variants/aggregate product limits and removes the saved item only inside the successful cart transaction. Cart limits apply per order/cart, not lifetime purchases.
- Cancellation supports individual items and restores product/variant stock. Online refunds go to the original Razorpay source; wallet payments and paid COD refunds go to the wallet. Returns require admin confirmation before refund. Gateway sandbox/end-to-end refund verification remains outstanding.
- Refund operations lock the order before contacting the gateway. An ambiguous gateway error deliberately retains the lock to prevent duplicate refunds; staff must reconcile with the provider before clearing it. No automated reconciliation screen is implemented yet.
- Added admin customer blocking, scheduled product/category offers (largest matching percentage), verified-email referral reward coupons, date-filtered reports/dashboard top tens, PDF/XLSX reports/ledger, and authenticated invoice PDFs.
- Added checkout coupon controls, rating/alphabetical/sales sorting, out-of-stock filtering, exact stock counts, and minimum three-image validation for new/updated galleries. Existing product galleries are not automatically rewritten.
- Referral reward: one owner-restricted 10% coupon (maximum INR100, minimum order INR499, valid 30 days) after the referred email signup is verified. Google signup referral attribution is not implemented.
- Reports use order creation dates and India calendar boundaries; historical orders without MRP snapshots cannot reconstruct old product-discount totals. Report refunds include pending refund obligations.
- Production migration/deploy and live payment verification are separate from local build and isolated SQLite regression tests. Do not infer production readiness from those tests alone.
- On 2026-11-17, support tickets now create persistent notifications for all active admins, and admin replies notify the ticket owner. Authenticated users can read/mark notifications through `/api/auth/me/notifications`; the storefront header displays a polling notification bell/dropdown for both customer and admin accounts.

## Homepage category images - local work, not deployed

- On 2026-11-17, the user requested category images in place of the homepage Shop with Confidence benefits section. Branch `codex/home-category-images` adds 10 linked category photo cards with five desktop columns and two mobile columns. Uploaded category images take priority over optimized local Unsplash fallback photos; provenance is in `frontend/public/categories/SOURCES.md`. No category records were modified.
- Follow-up category redesign uses a warm ivory panel, circular photo frames, centered navy labels, orange arrow accents, and five/three/two columns for desktop/tablet/phone. Uploaded images, fallback handling, category visibility, and links remain in use. Changes are local, not deployed.
- Superseding the category section above, the user chose Shop by Budget. The homepage now renders `ShopByBudget` with cream, peach, and navy cards for products up to INR299, INR499, and INR999, linking to `/shop?maxPrice=...`. Shop reads and validates the URL price limit, preserves it when reloading, and applies it to the product API; both price sliders support these lower budgets. Category data is unchanged. This work is local, not deployed.
- The user subsequently requested categories back immediately after New Arrivals. `HomeCategories` now appears there as a compact single horizontal row with round photos, category labels, swipe/native scrolling, and left/right controls. Desktop cards are 124px wide with 96px photos; phone cards are 96px wide with 76px photos. Shop by Budget remains below Best Offers. This supersedes the larger category grid design; changes are local, not deployed.
- Shop by Budget now uses product collages: up to three in-stock catalog photos per card with actual price labels and Shop Now links. Three bounded catalog requests fetch candidates within each budget; selection checks price limits, image availability, stock, and duplicate IDs. Loading placeholders and an empty-catalog message avoid invented product previews. Styling retains cream, peach, and navy. Changes are local, not deployed.
- The homepage marquee now sits between Best Offers and Shop by Budget, replacing its previous position above the footer. It uses an ivory background, navy text, orange heart/tag/wallet icons, and a slow 40-second seamless loop. Copy: Find your next favourite; Explore the offers; Shop within your budget. It pauses on mouse hover and visible keyboard focus; touching on phones keeps it moving. Reduced-motion users see a static wrapping strip, and screen readers receive the text once. Local, not deployed.
- Homepage section spacing now uses one flex-column layout gap: 40px desktop/tablet, 28px below 640px. Direct section margins are reset and older adjacent-section/marquee margin overrides removed so optional sections do not change the rhythm. Top clearance is 16px desktop/12px phone; bottom clearance matches the shared gap. Local, not deployed.

- The product campaign carousel uses distinct product artwork, including user-uploaded winter dispenser and jacket designs without extra overlays. Auto-slide advances every five seconds when the carousel overflows, loops to the start, and pauses during hover, focus, touch interaction, hidden tabs, and reduced-motion preferences. The user requested removal of the Play/Pause slideshow button; auto-slide remains enabled. These carousel changes are local and not deployed.
- Shoe-cleaner and crystal string-light campaign images now match the uploaded blue winter artwork, with built-in titles and Shop Now buttons. All campaign cards display the full artwork without additional text overlays. Generated assets and prompts are saved in `frontend/public/banners/pick2buy/campaigns/`; the lights artwork has no packaging box.

- On 2026-11-18, storefront refresh work on `codex/home-category-images` was synchronized with remote main commit `3f3f900`, preserving the remote winter hero and account changes. Product heading titles and collection links use shared text-baseline alignment. Production deployment remains separate from the feature-branch push.

## Storefront integration status — 2026-11-18

- The user explicitly requested merging `codex/home-category-images` into `main` and pushing. The branch was merged into synchronized main without conflicts, preserving the remote winter hero and account updates. Earlier storefront notes labeled local/not deployed describe implementation history; the merged storefront changes are now on local main. Production rollout success remains unverified until checked after the main push.

## Storefront banner placements — local work, not deployed

- Banner desktop/mobile URL fields support copied-image paste (Ctrl+V/⌘V), sharing the existing validated/compressed storage upload flow. Ordinary URL paste remains supported; saving waits for uploads. Mobile artwork has its own preview. Added locally on 2026-11-21.

- On 2026-11-20, branch `codex/banner-placements` separated homepage banner management into three admin sections: main hero (`HERO`), square seasonal campaigns (`CAMPAIGN`), and the existing Everyday Essentials row (`ESSENTIALS`). Existing banner records default to `ESSENTIALS`, and built-in hero/campaign artwork remains as the storefront fallback until active managed banners are added.
- The public banner API accepts an optional placement filter. Hero banners support a responsive desktop/mobile image carousel; campaign and Everyday Essentials placements also use their matching responsive images and retain existing fallback content when empty or unavailable.
- Migration `20261120000000_banner_placements` adds the placement column and index. On 2026-11-20, the user explicitly approved applying it to the configured PostgreSQL database; Prisma reported it applied successfully, and the local public API then returned the filtered `HERO` banner response without the previous missing-column error. Local verification passed typecheck, production build, all 29 isolated SQLite tests, and visual checks at 330px, 768px, and 1440px without horizontal overflow.
- On 2026-11-21, desktop managed heroes were changed to full-width images with natural height, replacing the fixed frame that caused cropping or side gaps. The recommended slim desktop artwork is still 1600 × 325; taller artwork produces a taller banner. Mobile retains the approved 800 × 408 frame and contain fitting. These changes are local, not deployed.

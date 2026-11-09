# Pick2Buy project memory

Last updated: 2026-11-09 (Asia/Kolkata).

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
- On 2026-11-07, `pick2buy.in` and `www.pick2buy.in` both became verified and received TLS certificates in Render.
- After custom-domain connection, backend logs showed CORS `Origin not allowed` for storefront API requests. The backend `FRONTEND_URL` must allow `https://pick2buy.in` and `https://www.pick2buy.in` (and can retain the Render static-site origin for compatibility).

## Deployment and collaboration rules

- Multiple developers work in this repository; follow `AGENTS.md` for synchronization and Git safety.
- Pushing to `main` deploys production, according to repository instructions. Only do this when the user explicitly asks to ship or deploy.
- Required checks for code integration include `npm run typecheck` and `npm run build`; use `scripts/verify-changed.sh` when available, with `--full` before pushing to `main`.
- Preserve unrelated local changes and private environment files.

## User preference

- The user requested repository-based Markdown memory so future work can retain project context and avoid repeatedly asking for established details.

## Commerce implementation — local work, not deployed

- Added migration `20261109000000_commerce_features` for blocking/referrals, soft-deleted categories, per-product quantity limits, order operation locks, cancelled items, historical MRP snapshots, restricted coupons, and offers. Applied successfully to the locally configured cloud database on 2026-11-09 with explicit user approval. Product/order/user counts were unchanged before and after. Local products and categories APIs returned HTTP 200 afterwards; previously products returned 500 because schema fields were missing. Code has not been pushed/deployed as part of this migration.
- Wishlist-to-cart now validates stock/variants/aggregate product limits and removes the saved item only inside the successful cart transaction. Cart limits apply per order/cart, not lifetime purchases.
- Cancellation supports individual items and restores product/variant stock. Online refunds go to the original Razorpay source; wallet payments and paid COD refunds go to the wallet. Returns require admin confirmation before refund. Gateway sandbox/end-to-end refund verification remains outstanding.
- Refund operations lock the order before contacting the gateway. An ambiguous gateway error deliberately retains the lock to prevent duplicate refunds; staff must reconcile with the provider before clearing it. No automated reconciliation screen is implemented yet.
- Added admin customer blocking, scheduled product/category offers (largest matching percentage), verified-email referral reward coupons, date-filtered reports/dashboard top tens, PDF/XLSX reports/ledger, and authenticated invoice PDFs.
- Added checkout coupon controls, rating/alphabetical/sales sorting, out-of-stock filtering, exact stock counts, and minimum three-image validation for new/updated galleries. Existing product galleries are not automatically rewritten.
- Referral reward: one owner-restricted 10% coupon (maximum INR100, minimum order INR499, valid 30 days) after the referred email signup is verified. Google signup referral attribution is not implemented.
- Reports use order creation dates and India calendar boundaries; historical orders without MRP snapshots cannot reconstruct old product-discount totals. Report refunds include pending refund obligations.
- Production migration/deploy and live payment verification are separate from local build and isolated SQLite regression tests. Do not infer production readiness from those tests alone.

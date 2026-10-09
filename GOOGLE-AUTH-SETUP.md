# Google sign-in setup

1. Sign in to [Google Cloud Console](https://console.cloud.google.com/) with the Google account that will manage Pick2Buy (for example, `pick2buy.in@gmail.com`). Create or select a project and configure its OAuth consent/branding screen.
2. Create an OAuth client of type **Web application**. Add every storefront origin to **Authorized JavaScript origins**, such as `http://localhost:5173`, `http://127.0.0.1:5173`, and the exact production HTTPS origin. Do not add a path. This implementation uses Google's JavaScript callback, so it does not need a redirect URI.
3. Set the Web client ID as `GOOGLE_CLIENT_ID` in the backend environment (`backend/.env.local` for local development) and the same value as `VITE_GOOGLE_CLIENT_ID` in the frontend environment (`frontend/.env.local` for local development). The client ID is public; no Google client secret is used by this sign-in flow. Restart the backend and rebuild/restart the frontend after setting it.
4. Apply the tracked PostgreSQL migrations before starting the backend with `npm run db:migrate` from the repository root. The active schema is `backend/prisma/schema.prisma`. The old SQLite schema is retained as `backend/prisma/schema.sqlite.prisma` for local data access.
5. Test a new Google account, a returning Google account, and an existing email/password account. For the existing account, sign in with its password and use **Profile & Account → Google sign-in** to connect the same Google email. The app does not automatically attach a Google identity to an existing email account.

The backend must be allowed to fetch Google's public signing keys from `https://www.googleapis.com/oauth2/v1/certs`. A blocked outbound connection makes verification unavailable even when the browser successfully receives a Google credential.

Google's [setup guide](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) covers the client ID and authorized origins. Its [server verification guide](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) explains ID token validation and using the stable Google `sub` as the account identifier.

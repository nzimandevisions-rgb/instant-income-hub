# Syde Hustle

Syde Hustle is a rewards platform built with TanStack Start, Cloudflare Workers, Cloudflare D1 and approved offer-provider integrations.

## Current architecture

- **Frontend:** TanStack React Start
- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1
- **Rewards:** provider postbacks credited to a Syde Hustle account ID
- **Offer delivery:** approved provider APIs are normalized into Syde Hustle task cards
- **Task experience:** tasks open inside an in-page Syde Hustle task window where the provider permits embedded completion
- **Cash-out:** requests are reserved from the user's points balance and recorded as pending until a payout operator/provider completes the payment

## Reward accounting

The application uses **1,000 points = US$1.00**.

Provider conversions are credited only from server-side postbacks. Duplicate conversion IDs are ignored so a retry cannot double-credit the same completion.

## Provider configuration

Optional provider credentials are stored as Cloudflare Worker secrets. The UI does not expose provider names or provider dashboard links.

The CPAlead native feed can use the configured `CPALEAD_PUBLISHER_ID`. Other adapters remain disabled until their required secrets are present.

## Important

Provider availability, eligibility, advertiser approval and final conversion confirmation are controlled by the approved provider. The application must never credit a user merely because an offer was clicked.

## Development

Install dependencies with your preferred Node/Bun package manager, then run:

```sh
npm install
npm run dev
```

For Cloudflare deployment:

```sh
npm run build
npx wrangler deploy
```

## Required Cloudflare secrets

Set these in Cloudflare (Workers & Pages → instant-income-hub → Settings → Variables and Secrets), as **Secret** type:

| Secret | What it is |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud Console (type: Web application) |
| `GOOGLE_CLIENT_SECRET` | The matching client secret |
| `CPALEAD_POSTBACK_PASSWORD` | Any long random string. Put the same value as the postback password in CPAlead. Postbacks are refused until it is set. |
| `CPAGRIP_POSTBACK_SECRET` | Long random string; add `&key=<value>` to the CPAGrip postback URL. |
| `POSTBACK_SHARED_SECRET` | For the generic `/api/postback` endpoint (`&key=<value>`). |
| `ADGEM_POSTBACK_KEY` | AdGem postback signing key. |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | From the **Live** REST app in developer.paypal.com, with Payouts enabled. |
| `PAYPAL_ENVIRONMENT` | `live` (or `sandbox` for testing). |
| `ADMIN_API_KEY` | At least 24 random characters. Used on `/admin` to approve cash-outs. |
| `PAYOUTS_MODE` | Optional. `manual` (default): cash-outs wait for approval on `/admin`. `auto`: paid immediately. |

In Google Cloud Console, add this **Authorized redirect URI** to the OAuth client:
`https://<your-domain>/api/auth/google/callback`, and publish the OAuth consent screen (not "Testing").

## Accounts and cash-outs

- Visitors get an anonymous account from the server (cookie session). The browser can no longer choose its account ID.
- Signing in with Google keeps the points already earned on that browser and lets the user cash out from any device.
- Only Google-signed-in users can cash out, one open cash-out at a time.
- With `PAYOUTS_MODE=manual`, open `/admin`, enter the admin key, and approve or reject each request. Rejected and failed payouts return the points.

  

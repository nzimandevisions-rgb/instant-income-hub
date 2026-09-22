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

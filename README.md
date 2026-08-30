# Instant Income Hub

let's call it "Syde Hustle"     To make this completely turnkey for you, here is your entire step-by-step master workflow, from absolute scratch to a live, profit-generating application. Following this is the exact list of APIs you need and a proven application template to ensure the networks approve you on your first try.
------------------------------
## 🗺️ The Complete App Launch Workflow

[Phase 1: Setup Accounts] -> [Phase 2: Build App in Lovable] -> [Phase 3: Connect APIs & Database] -> [Phase 4: Set Up Security] -> [Phase 5: Launch & Market]

## Phase 1: Infrastructure & Network Registration

   1. Register your Domain: Buy a simple, professional domain name (e.g., afrirewards.com) using a registrar like Namecheap or GoDaddy. Setting up a real domain makes your platform look highly legitimate to ad networks.
   2. Create your Business Email: Set up a professional email address (e.g., partnerships@afrirewards.com) using Google Workspace or Zoho Mail. Do not apply to these networks using a generic @gmail.com address, or they will likely reject you.
   3. Apply to the Networks: Submit publisher applications to the ad networks and payment gateways using the Approval Template provided below.

## Phase 2: Build the System in Lovable.dev

   1. Initialize Project: Open Lovable.dev, create a new project, and name it.
   2. Run Prompt 1: Paste the first prompt from the previous step to generate your mobile-first UI layout (Surveys, Offers, Wallet tabs) and auto-configure your Supabase backend tables.
   3. Run Prompt 2: Paste the second prompt to let Lovable generate the backend API route (/api/postback) that listens for completed surveys.
   4. Run Prompt 3: Paste the third prompt to build out the African mobile money payment withdrawal forms.

## Phase 3: Connect Live Data Feeds & Payments

   1. Get your API Keys: Log in to your approved partner dashboards (Adscend Media, AdGem, Paystack/Flutterwave). Go to their "Developer Settings" or "API" tabs and copy your unique API Keys/Secrets.
   2. Add Environment Variables: In Lovable (or your project settings), find the Environment Variables (.env) section. Paste your live API keys there so the application can safely handle financial transactions and live data feeds in the background.

## Phase 4: Configure the Postback Handshake (Crucial)

   1. Copy your Live Postback URL: Find the exact URL Lovable created for your endpoint (e.g., https://lovable.app).
   2. Paste into Networks: Log into Adscend Media, Digital Turbine, and AdGem. Paste that exact URL into their "Global Postback" setting. This ensures that whenever an African user finishes a survey, their system tells your app to instantly credit that user with points.

## Phase 5: Launch & Marketing

   1. Publish: Click deploy in Lovable to make your web app accessible to the public.
   2. Local Marketing: Promote your web application link across local African Facebook groups, WhatsApp communities, and TikTok channels, emphasizing that users can earn direct MTN MoMo, Vodacom M-Pesa, Airtel Money, or Mobile Data Vouchers instantly.

------------------------------
## 🔌 The Complete API Integration List
These are the precise API endpoints you will hook into your application backend to run the arbitrage system:
## 1. Survey & Offer Feeds (Data Arbitrage)

* Adscend Media API: Slices up available market research questionnaires into dynamic data arrays you can display inside your custom layout cards.
* AdGem Static Offer API: Feeds real-time, high-paying mobile game download offers directly into your discovery panel.
* Digital Turbine Offer Wall REST API: Dynamically pulls high-volume app-engagement campaigns customized for global regions.

## 2. Ad Revenue (Direct Monetisation)

* Google AdMob SDK API: Implements Rewarded Video Ads, allowing users who get disqualified from surveys to watch a 30-second premium video advertisement to earn alternative point values.

## 3. African Local Payouts (The Utility Infrastructure)

* Flutterwave Transfers API: Automated payment rails that instantly process real-time mass payouts directly into local African bank accounts or popular Mobile Money (MTN MoMo, Orange, Airtel, M-Pesa) wallets.
* Reloadly Airtime & Data API: Converts user points directly into instant prepaid mobile data bundles or cellular airtime top-ups for over 800 global mobile networks.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ad95af29-456b-4739-b417-31502cb61998).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

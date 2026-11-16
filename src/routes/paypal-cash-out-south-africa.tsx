import { createFileRoute } from "@tanstack/react-router";

const TITLE = "How to Withdraw PayPal Money in South Africa (2026) | Syde Hustle";
const DESC =
  "Step-by-step: open a PayPal account, link it through FNB's PayPal service (even if you bank with Capitec, Absa or TymeBank) and withdraw your earnings in rand.";

export const Route = createFileRoute("/paypal-cash-out-south-africa")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: "https://sydehustle.dpdns.org/paypal-cash-out-south-africa" }],
  }),
  component: Page,
});

const h2 = { fontSize: 20, fontWeight: 700, marginTop: 28 } as const;
const ol = { paddingLeft: 20, listStyle: "decimal" } as const;
const ul = { paddingLeft: 20, listStyle: "disc" } as const;
const cta = {
  display: "inline-block", marginTop: 12, padding: "12px 20px", borderRadius: 12,
  background: "#10b981", color: "#04130d", fontWeight: 800, textDecoration: "none",
} as const;

function Page() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", lineHeight: 1.65 }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>How to get PayPal money into your South African bank account</h1>
      <p>Many online earning sites, including Syde Hustle, pay in US dollars by PayPal. In South Africa, PayPal withdrawals go through FNB's PayPal service. You don't need to bank with FNB: you can withdraw to Capitec, Absa, Standard Bank, Nedbank, TymeBank and other South African banks.</p>

      <h2 style={h2}>Step 1: Open a free PayPal account</h2>
      <ol style={ol}>
        <li>Go to paypal.com and choose a Personal account, with South Africa as your country.</li>
        <li>Use your real name exactly as it appears on your ID and bank account.</li>
        <li>Confirm your email address and phone number.</li>
      </ol>

      <h2 style={h2}>Step 2: Link PayPal through FNB</h2>
      <ol style={ol}>
        <li><b>If you bank with FNB:</b> in the FNB app or Online Banking, go to Forex, then PayPal, and link your PayPal account.</li>
        <li><b>If you bank elsewhere:</b> register a free FNB Online Banking profile for PayPal (non-FNB customers), complete the FICA check, then add your own bank account for withdrawals.</li>
      </ol>

      <h2 style={h2}>Step 3: Withdraw</h2>
      <ol style={ol}>
        <li>In FNB's PayPal service, choose Withdraw and enter the dollar amount.</li>
        <li>FNB shows the exchange rate and the rand amount before you confirm.</li>
        <li>FNB says withdrawals reflect instantly in an FNB account and can take up to 3 business days for other banks.</li>
      </ol>

      <h2 style={h2}>Fees to expect</h2>
      <ul style={ul}>
        <li>FNB uses tiered pricing with a maximum of 1.51% on PayPal withdrawals, depending on the amount, plus its exchange rate.</li>
        <li>Fees and limits change, so check FNB's PayPal page for the current rates before you withdraw.</li>
      </ul>

      <h2 style={h2}>Cashing out from Syde Hustle</h2>
      <ul style={ul}>
        <li>Earn points from surveys and tasks. 1,000 points = US$1.</li>
        <li>Request a cash-out from 500 points and enter your PayPal email address.</li>
        <li>Each cash-out is checked by a person before payment, to keep the site safe from fraud.</li>
      </ul>
      <a href="/surveys" style={cta}>Start earning</a>
      <p style={{ marginTop: 16 }}>New to surveys? Read our <a href="/paid-surveys-south-africa" style={{ textDecoration: "underline" }}>honest guide to paid surveys in South Africa</a>.</p>

      <p style={{ marginTop: 28, fontSize: 13, opacity: 0.75 }}>
        This guide is general information, not financial advice. <a href="/terms" style={{ textDecoration: "underline" }}>Terms</a> · <a href="/privacy" style={{ textDecoration: "underline" }}>Privacy</a> · <a href="/contact" style={{ textDecoration: "underline" }}>Contact</a>
      </p>
    </main>
  );
}

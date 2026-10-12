import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms and Conditions | Syde Hustle" }] }),
  component: TermsPage,
});

const h2 = { fontSize: 20, fontWeight: 600, marginTop: 24 } as const;

function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Syde Hustle Terms and Conditions</h1>
      <p>Last updated: 12 October 2026</p>
      <p>By using Syde Hustle you agree to these terms. If you do not agree, please do not use the service.</p>

      <h2 style={h2}>1. The service</h2>
      <p>Syde Hustle is a rewards platform based in South Africa. You earn points by completing offers and surveys supplied by third-party partners. 1,000 points equal US$1.00. Points have no cash value until a cash-out is approved and paid.</p>

      <h2 style={h2}>2. Eligibility and accounts</h2>
      <ul style={{ paddingLeft: 20, listStyle: "disc" }}>
        <li>You must be at least 18 years old.</li>
        <li>You must sign in with a Google account to start tasks, take surveys or cash out.</li>
        <li>One account per person and per household device. Multiple, shared or automated accounts are not allowed.</li>
        <li>You must give truthful, accurate information to offer and survey partners.</li>
      </ul>

      <h2 style={h2}>3. Earning points</h2>
      <p>Points are credited only after the partner confirms a completion to us. Partners decide whether a completion qualifies. If a partner later reverses or charges back a completion, the points are deducted from your balance, even if this makes it negative.</p>

      <h2 style={h2}>4. Fraud and prohibited behaviour</h2>
      <p>The following are not allowed and will lead to points being removed, cash-outs being refused and the account being closed:</p>
      <ul style={{ paddingLeft: 20, listStyle: "disc" }}>
        <li>VPNs, proxies, emulators, bots, scripts or anything that hides your real location or identity.</li>
        <li>Creating multiple accounts, or completing tasks on someone else's account.</li>
        <li>Giving false, random or inconsistent answers in surveys, or speeding through them.</li>
        <li>Abusing the referral program, including referring yourself.</li>
      </ul>

      <h2 style={h2}>5. Cash-outs</h2>
      <ul style={{ paddingLeft: 20, listStyle: "disc" }}>
        <li>The minimum cash-out is 500 points. Cash-outs are paid by PayPal in US dollars.</li>
        <li>Only one cash-out can be in progress at a time.</li>
        <li>Every cash-out is reviewed by hand before it is paid. We may delay or refuse a cash-out while we check for fraud.</li>
        <li>You are responsible for giving a correct PayPal email address.</li>
      </ul>

      <h2 style={h2}>6. Referrals</h2>
      <p>When a friend joins with your link, you earn 10% of the points they earn from completed tasks. There is no sign-up bonus.</p>

      <h2 style={h2}>7. Changes and termination</h2>
      <p>We may change these terms, the point values or the offers available at any time. We may suspend or close accounts that break these terms. You may close your account at any time by contacting us.</p>

      <h2 style={h2}>8. Liability</h2>
      <p>Offers and surveys are provided by third parties, and we are not responsible for their content or products. The service is provided as is, and to the extent the law allows, we are not liable for indirect losses.</p>

      <h2 style={h2}>9. Contact</h2>
      <p>Email <a href="mailto:info@sydehustle.dpdns.org" style={{ textDecoration: "underline" }}>info@sydehustle.dpdns.org</a>. See also our <a href="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</a> and <a href="/contact" style={{ textDecoration: "underline" }}>Contact</a> page.</p>
      <p style={{ marginTop: 24 }}><a href="/" style={{ textDecoration: "underline" }}>Back to Syde Hustle</a></p>
    </main>
  );
}

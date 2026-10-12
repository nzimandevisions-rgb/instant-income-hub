import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Syde Hustle Privacy Policy</h1>
      <p>Last updated: 12 October 2026</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 24 }}>What we collect</h2>
      <p>When you sign in with Google we receive your name, email address and Google account ID. We also keep the points you earn, the tasks you complete, and the PayPal email you give us for cash-outs.</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 24 }}>How we use it</h2>
      <p>We use this information only to run your Syde Hustle account: to credit completed tasks, prevent fraud, and send your cash-outs. We do not sell your information.</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 24 }}>Who we share it with</h2>
      <p>Offer partners report completed tasks to us using your account ID. PayPal receives your PayPal email and the amount when you cash out. Our app is hosted on Cloudflare.</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 24 }}>Deleting your data</h2>
      <p>Email <a href="mailto:info@sydehustle.dpdns.org" style={{ textDecoration: "underline" }}>info@sydehustle.dpdns.org</a> to delete your account and its data.</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 24 }}>Fraud prevention</h2>
      <p>To protect our partners and members, we record your account ID, completion records and the technical details partners send us (such as IP address and device type) and use them to detect duplicate accounts, VPNs and fake completions.</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 24 }}>Contact</h2>
      <p>Syde Hustle, Bethlehem, Free State, South Africa. Email info@sydehustle.dpdns.org. See also our <a href="/terms" style={{ textDecoration: "underline" }}>Terms and Conditions</a>.</p>
      <p style={{ marginTop: 24 }}><a href="/" style={{ textDecoration: "underline" }}>Back to Syde Hustle</a></p>
    </main>
  );
}

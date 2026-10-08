import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Syde Hustle Privacy Policy</h1>
      <p>Last updated: 8 October 2026</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 24 }}>What we collect</h2>
      <p>When you sign in with Google we receive your name, email address and Google account ID. We also keep the points you earn, the tasks you complete, and the PayPal email you give us for cash-outs.</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 24 }}>How we use it</h2>
      <p>We use this information only to run your Syde Hustle account: to credit completed tasks, prevent fraud, and send your cash-outs. We do not sell your information.</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 24 }}>Who we share it with</h2>
      <p>Offer partners report completed tasks to us using your account ID. PayPal receives your PayPal email and the amount when you cash out. Our app is hosted on Cloudflare.</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 24 }}>Deleting your data</h2>
      <p>Email velley.velley@gmail.com to delete your account and its data.</p>
      <p style={{ marginTop: 24 }}><a href="/" style={{ textDecoration: "underline" }}>Back to Syde Hustle</a></p>
    </main>
  );
}

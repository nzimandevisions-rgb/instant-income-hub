import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact | Syde Hustle" }] }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Contact Syde Hustle</h1>
      <p>Questions about your points, a missing reward, a cash-out, or a partnership? Email us and we reply within 2 business days.</p>
      <p style={{ marginTop: 16, fontSize: 18 }}>
        <a href="mailto:info@sydehustle.dpdns.org" style={{ textDecoration: "underline", fontWeight: 600 }}>info@sydehustle.dpdns.org</a>
      </p>
      <p style={{ marginTop: 16 }}>Syde Hustle is based in Bethlehem, Free State, South Africa.</p>
      <p style={{ marginTop: 16 }}>For a missing reward, include the offer or survey name, the date you completed it, and the email you sign in with.</p>
      <p style={{ marginTop: 24 }}>
        <a href="/terms" style={{ textDecoration: "underline" }}>Terms and Conditions</a> · <a href="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</a> · <a href="/" style={{ textDecoration: "underline" }}>Back to Syde Hustle</a>
      </p>
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";

const TITLE = "Paid Surveys in South Africa (2026): How to Earn Online | Syde Hustle";
const DESC =
  "How paid surveys work in South Africa, what they really pay, how to avoid scam survey sites, and how to start earning free with Syde Hustle.";

export const Route = createFileRoute("/paid-surveys-south-africa")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: "https://sydehustle.dpdns.org/paid-surveys-south-africa" }],
  }),
  component: Page,
});

const h2 = { fontSize: 20, fontWeight: 700, marginTop: 28 } as const;
const ul = { paddingLeft: 20, listStyle: "disc" } as const;
const cta = {
  display: "inline-block", marginTop: 12, padding: "12px 20px", borderRadius: 12,
  background: "#10b981", color: "#04130d", fontWeight: 800, textDecoration: "none",
} as const;

function Page() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", lineHeight: 1.65 }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>Paid surveys in South Africa: an honest guide (2026)</h1>
      <p>Paid surveys are one of the few online side hustles that need nothing but a phone and data. Companies pay research firms for opinions, and those firms share part of that with you. Here is how it really works, what to expect, and how to avoid the scams.</p>

      <h2 style={h2}>How paid surveys work</h2>
      <ul style={ul}>
        <li>You sign up on a rewards site and answer a few profile questions.</li>
        <li>The site shows surveys that match your profile (age, province, interests).</li>
        <li>You answer honestly. When the survey company confirms your answers, points are added to your balance.</li>
        <li>Once you reach the minimum, you cash out.</li>
      </ul>

      <h2 style={h2}>What surveys really pay</h2>
      <p>Most surveys take 5 to 20 minutes. Short ones pay a few cents, longer ones more. It is pocket money, not a salary. Anyone promising thousands of rand a day is not being straight with you.</p>
      <p>You will also be screened out of some surveys after a few questions. That is normal: the company is looking for specific people. Just move to the next one.</p>

      <h2 style={h2}>How to spot a scam survey site</h2>
      <ul style={ul}>
        <li><b>It asks you to pay.</b> Real survey sites are always free to join.</li>
        <li><b>It promises huge daily earnings</b> or "guaranteed" income.</li>
        <li><b>It asks for your banking PIN, OTP or ID copy</b> before you have earned anything.</li>
        <li><b>It has no terms, privacy policy or contact details.</b></li>
      </ul>

      <h2 style={h2}>Tips to earn more</h2>
      <ul style={ul}>
        <li>Fill in your profile fully, so you match more surveys.</li>
        <li>Answer truthfully and consistently. Rushed or random answers get reversed and can get your account closed.</li>
        <li>Check in at different times of day, because new surveys arrive all the time.</li>
        <li>Don't use a VPN. Surveys are matched to your real location.</li>
      </ul>

      <h2 style={h2}>Earning with Syde Hustle</h2>
      <p>Syde Hustle is a free South African rewards site. You can take paid surveys from our research partner, plus other tasks and offers, all in one place.</p>
      <ul style={ul}>
        <li>Free to join. Sign in with Google.</li>
        <li>1,000 points = US$1. Cash out from 500 points by PayPal.</li>
        <li>Every cash-out is checked by a person, which keeps the site safe from fraud.</li>
        <li>Invite friends and earn 10% of the points they earn.</li>
      </ul>
      <a href="/surveys" style={cta}>Start taking surveys</a>
      <p style={{ marginTop: 16 }}>New to PayPal? Read <a href="/paypal-cash-out-south-africa" style={{ textDecoration: "underline" }}>how to get PayPal money into your South African bank account</a>.</p>

      <h2 style={h2}>Common questions</h2>
      <p><b>Is it free?</b> Yes. You never pay to join or to cash out on Syde Hustle.</p>
      <p><b>Do I need a computer?</b> No. Everything works on a phone.</p>
      <p><b>How old must I be?</b> 18 or older.</p>

      <p style={{ marginTop: 28, fontSize: 13, opacity: 0.75 }}>
        <a href="/terms" style={{ textDecoration: "underline" }}>Terms</a> · <a href="/privacy" style={{ textDecoration: "underline" }}>Privacy</a> · <a href="/contact" style={{ textDecoration: "underline" }}>Contact</a>
      </p>
    </main>
  );
}

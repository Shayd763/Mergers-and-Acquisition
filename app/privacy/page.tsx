import Link from "next/link";

export const metadata = { title: "Privacy Policy — Acquisition Exchange" };

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 80px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 40 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>T</div>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#1c1917", letterSpacing: "-0.02em" }}>Acquisition Exchange</span>
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1c1917", margin: "0 0 8px", letterSpacing: "-0.03em" }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: "#78716c", margin: "0 0 40px" }}>Last updated: 30 June 2026</p>

      <div style={{ fontSize: 14, color: "#44403c", lineHeight: 1.75, display: "flex", flexDirection: "column", gap: 24 }}>
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1c1917", margin: "0 0 8px" }}>1. Who We Are</h2>
          <p>Acquisition Exchange is a deal analysis platform for UK SME acquisitions. References to &quot;we&quot;, &quot;us&quot;, or &quot;our&quot; refer to Acquisition Exchange. Contact: <a href="mailto:hello@acquisition.exchange" style={{ color: "#1c1917" }}>hello@acquisition.exchange</a>.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1c1917", margin: "0 0 8px" }}>2. Data We Collect</h2>
          <p>We collect information you provide when signing in (name, email address via Google or LinkedIn OAuth), deal data you enter into the platform, and usage logs for service improvement.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1c1917", margin: "0 0 8px" }}>3. How We Use Your Data</h2>
          <p>We use your data to provide and improve the Service, process subscription payments via Stripe, and communicate with you about your account. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1c1917", margin: "0 0 8px" }}>4. Data Sharing</h2>
          <p>We share data only with service providers necessary to operate the platform (Stripe for payments, Railway for database hosting, Vercel for hosting). All providers are contractually bound to protect your data.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1c1917", margin: "0 0 8px" }}>5. Data Retention</h2>
          <p>We retain your account data for as long as your account is active. You may request deletion at any time via your account settings or by emailing us.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1c1917", margin: "0 0 8px" }}>6. Your Rights (UK GDPR)</h2>
          <p>You have the right to access, correct, or delete your personal data; to object to processing; and to data portability. To exercise these rights, contact <a href="mailto:hello@acquisition.exchange" style={{ color: "#1c1917" }}>hello@acquisition.exchange</a>.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1c1917", margin: "0 0 8px" }}>7. Cookies</h2>
          <p>We use session cookies for authentication. We do not use third-party advertising cookies.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1c1917", margin: "0 0 8px" }}>8. Changes to This Policy</h2>
          <p>We may update this policy from time to time. We will notify you of material changes via email or a notice on the platform.</p>
        </section>
      </div>
    </div>
  );
}

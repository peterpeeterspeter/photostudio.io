"use client";
import React, { useState, useEffect } from "react";
import { supabaseClient as supabase } from '@/lib/supabase-client';

export default function Home() {
  // FAQ state
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Fetch profile
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const faqs = [
    {
      q: "Wat doet Photostudio.io?",
      a: "We maken van je smartphone- of winkel-foto's direct studio-waardige productbeelden: achtergrondwissels, ghost mannequin, flatlays, lifestyle en virtual try-on.",
    },
    {
      q: "Is er een gratis plan?",
      a: "Ja, je kunt gratis watermarked previews genereren. Pro en Agency ontgrendelen hoge resolutie, batch en integraties.",
    },
    {
      q: "Ondersteunt het virtual try-on?",
      a: "Ja (beta). Upload een foto van jezelf + het kledingstuk. De AI plaatst de kleding realistisch op de persoon.",
    },
    {
      q: "Kan ik direct naar mijn webshop exporteren?",
      a: "Ja, met de Pro/Agency-plannen kun je naar Shopify/WooCommerce pushen.",
    },
  ];

  return (
    <div style={st.page}>
      {/* Top bar */}
      <nav style={st.nav}>
        <div style={st.navInner}>
          <a href="/" style={st.brand}>
            <span style={st.logoDot} />
            <strong>Photostudio.io</strong>
          </a>
          <div style={st.navLinks}>
            <a href="#features" style={st.link}>Features</a>
            <a href="#integrations" style={st.link}>Integrations</a>
            <a href="#pricing" style={st.link}>Pricing</a>
            <a href="#faq" style={st.link}>FAQ</a>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a href="/account" style={st.link}>
                  {user.email} ({profile?.plan || 'free'})
                </a>
                <a href="/editor" style={st.navCta}>Open Editor</a>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a href="/login" style={st.link}>Sign In</a>
                <a href="/editor" style={st.navCta}>Try Free</a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header style={st.heroWrap}>
        <div style={st.heroBg1} />
        <div style={st.heroBg2} />
        <div style={st.hero}>
          <h1 style={st.h1}>
            AI product photography for{" "}
            <span style={st.h1Accent}>boutiques & D2C brands</span>
          </h1>
          <p style={st.heroSub}>
            Turn phone snaps into studio-quality visuals in minutes:
            background swaps, ghost mannequin, flatlays, lifestyle scenes, and virtual try-on.
          </p>
          <div style={st.heroCtas}>
            <a href="/editor" style={st.ctaPrimary}>Single Editor</a>
            <a href="/editor/batch" style={st.ctaSecondary}>Batch Editor</a>
          </div>

          {/* Mock panel */}
          <div style={st.mockWrap} aria-hidden>
            <div style={st.mockCard}>
              <div style={st.mockTop}>
                <span style={st.winDot} />
                <span style={st.winDot} />
                <span style={st.winDot} />
              </div>
              <div style={st.mockBody}>
                <aside style={st.mockSide}>
                  <div style={st.badge}>Presets</div>
                  <ul style={st.sideList}>
                    <li>Studio Background</li>
                    <li>Ghost Mannequin</li>
                    <li>Lifestyle Loft</li>
                    <li>Flatlay Marble</li>
                  </ul>
                </aside>
                <section style={st.mockCanvas}>
                  <div style={st.mockBefore}>Before</div>
                  <div style={st.mockAfter}>After</div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Logos / social proof */}
      <section style={st.section}>
        <p style={st.kicker}>Trusted by growing shops and agencies</p>
        <div style={st.logoRow}>
          <Logo text="Marais Boutique" />
          <Logo text="Denim District" />
          <Logo text="Studio Iris" />
          <Logo text="Kumo Agency" />
          <Logo text="Avanti D2C" />
        </div>
      </section>

      {/* Features */}
      <section id="features" style={st.sectionAlt}>
        <h2 style={st.h2}>Why Photostudio.io?</h2>
        <p style={st.sub}>Fast, consistent, and budget-friendly — without a studio.</p>
        <div style={st.grid3}>
          <Card title="Background swaps"
                desc="Replace cluttered shop backgrounds with clean white or on-brand lifestyle scenes."/>
          <Card title="Ghost mannequin"
                desc="Remove model/mannequin; preserve natural drape, seams & texture for true e-commerce shots."/>
          <Card title="Flatlays & outfit comps"
                desc="Create Pinterest-ready flatlays and multi-product looks for campaigns."/>
          <Card title="Virtual try-on (beta)"
                desc="Put garments on a user photo with realistic shadows and fit (front-pose works best)."/>
          <Card title="Batch editing"
                desc="Process dozens of SKUs in one go to keep listings up to date."/>
          <Card title="Brand consistency"
                desc="Reusable presets and color-safe output for a consistent storefront look."/>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" style={st.section}>
        <h2 style={st.h2}>Integrations</h2>
        <p style={st.sub}>Push images directly to where you sell and market.</p>
        <div style={st.grid3}>
          <Integr title="Shopify" desc="Publish edited images straight to product media." />
          <Integr title="WooCommerce" desc="Sync to your WordPress store with one click." />
          <Integr title="Zapier/Make" desc="Automate batch edits and folder workflows." />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={st.sectionAlt}>
        <h2 style={st.h2}>Simple pricing</h2>
        <p style={st.sub}>Start free, upgrade when you're ready.</p>
        <div style={st.grid3}>
          <Price name="Free" price="€0"
                 features={[
                   "Watermarked previews",
                   "2 presets included",
                   "Up to 5 images / month",
                 ]}
                 href="/editor" cta="Start Free" highlight={false} />
          <Price name="Pro" price="€39" highlight
                 features={[
                   "High-res exports",
                   "All presets + Virtual Try-On (beta)",
                   "Batch up to 25 images",
                   "Brand presets & color safety",
                 ]}
                 href="/editor" cta="Get Pro" />
          <Price name="Agency" price="€149"
                 features={[
                   "Batch 250+ images",
                   "Shopify/Woo plugins",
                   "Team seats & roles",
                   "Priority support",
                 ]}
                 href="mailto:hello@photostudio.io" cta="Contact Sales" highlight={false} />
        </div>
      </section>

      {/* CTA banner */}
      <section style={st.ctaBanner}>
        <div style={st.ctaInner}>
          <div>
            <h3 style={{ margin: 0 }}>Ready to upgrade your product visuals?</h3>
            <p style={{ margin: "6px 0 0", color: "#5f6368" }}>
              Try the editor now — no credit card required.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/editor" style={st.ctaPrimary}>Single Editor</a>
            <a href="/editor/batch" style={st.ctaSecondary}>Batch Editor</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={st.section}>
        <h2 style={st.h2}>FAQ</h2>
        <div style={st.faqList}>
          {faqs.map((f, i) => (
            <details
              key={i}
              open={faqOpen === i}
              onToggle={(e: any) => setFaqOpen(e.currentTarget.open ? i : null)}
              style={st.faqItem}
            >
              <summary style={st.faqSummary}>{f.q}</summary>
              <p style={st.faqAnswer}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={st.footer}>
        <div style={st.footerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={st.logoDot} />
            <strong>Photostudio.io</strong>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href="/editor" style={st.footerLink}>Editor</a>
            <a href="#pricing" style={st.footerLink}>Pricing</a>
            <a href="#integrations" style={st.footerLink}>Integrations</a>
            <a href="mailto:hello@photostudio.io" style={st.footerLink}>Contact</a>
          </div>
          <div style={{ color: "#9aa0a6", fontSize: 12 }}>
            © {new Date().getFullYear()} Photostudio.io — All rights reserved.
          </div>
        </div>
      </footer>

      {/* Minimal CSS helpers for responsiveness */}
      <style jsx>{css}</style>
    </div>
  );
}

/* --- Small, reusable atoms --- */
function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={st.card}>
      <h3 style={st.cardTitle}>{title}</h3>
      <p style={st.cardDesc}>{desc}</p>
    </div>
  );
}
function Integr({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={st.card}>
      <h3 style={st.cardTitle}>{title}</h3>
      <p style={st.cardDesc}>{desc}</p>
    </div>
  );
}
function Price({
  name, price, features, href, cta, highlight,
}: {
  name: string;
  price: string;
  features: string[];
  href: string;
  cta: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ ...st.priceCard, ...(highlight ? st.priceCardHi : {}) }}>
      <div style={st.priceHead}>
        <div style={{ fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{price}
          <span style={{ fontSize: 14, fontWeight: 500 }}> /mo</span>
        </div>
      </div>
      <ul style={st.priceList}>{features.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul>
      <a href={href} style={{ ...st.btnPrimary, textAlign: "center" }}>{cta}</a>
    </div>
  );
}
function Logo({ text }: { text: string }) {
  return (
    <div style={st.logoChip}>
      <span style={st.logoMark} />
      <span>{text}</span>
    </div>
  );
}

/* --- Styles --- */
const st = {
  page: { fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif", color: "#111", background: "linear-gradient(180deg,#fafafa,#fff)" },

  nav: { position: "sticky" as const, top: 0, zIndex: 50, borderBottom: "1px solid #eee", background: "rgba(255,255,255,0.7)", backdropFilter: "saturate(180%) blur(10px)" },
  navInner: { maxWidth: 1140, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand: { display: "flex", alignItems: "center", gap: 10, color: "#111", textDecoration: "none" },
  logoDot: { width: 18, height: 18, borderRadius: 6, background: "#111", display: "inline-block" },
  navLinks: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const },
  link: { color: "#444", textDecoration: "none", fontSize: 14 },
  navCta: { padding: "8px 12px", borderRadius: 10, background: "#111", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 },

  heroWrap: { position: "relative" as const, overflow: "hidden" },
  heroBg1: { position: "absolute" as const, inset: 0, background: "radial-gradient(800px 320px at 5% 0%, #ecf3ff 0%, transparent 60%)", zIndex: 0 },
  heroBg2: { position: "absolute" as const, inset: 0, background: "radial-gradient(800px 320px at 95% 0%, #ffecef 0%, transparent 60%)", zIndex: 0 },
  hero: { position: "relative" as const, zIndex: 1, maxWidth: 1140, margin: "0 auto", padding: "64px 16px 28px" },
  h1: { fontSize: 44, lineHeight: 1.1, margin: 0, letterSpacing: -0.5 },
  h1Accent: { background: "linear-gradient(90deg,#111,#666)", WebkitBackgroundClip: "text", color: "transparent" },
  heroSub: { marginTop: 14, fontSize: 18, color: "#5f6368" },
  heroCtas: { display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" as const },
  ctaPrimary: { padding: "12px 18px", borderRadius: 12, background: "#111", color: "#fff", textDecoration: "none", fontWeight: 800 },
  ctaSecondary: { padding: "12px 18px", borderRadius: 12, background: "#fff", border: "1px solid #eee", color: "#111", textDecoration: "none", fontWeight: 700 },

  mockWrap: { marginTop: 36 },
  mockCard: { border: "1px solid #eee", borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 12px 40px rgba(0,0,0,0.08)" },
  mockTop: { height: 36, display: "flex", alignItems: "center", gap: 6, padding: "0 12px", borderBottom: "1px solid #f1f3f4" },
  winDot: { width: 10, height: 10, borderRadius: 6, background: "#e0e0e0", display: "inline-block" },
  mockBody: { display: "grid", gridTemplateColumns: "220px 1fr", minHeight: 340 },
  mockSide: { padding: 16, borderRight: "1px solid #f1f3f4", background: "#fafafa" },
  badge: { display: "inline-block", fontSize: 11, padding: "4px 8px", borderRadius: 999, background: "#eef2ff", color: "#3730a3", fontWeight: 800, marginBottom: 8 },
  sideList: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, color: "#3c4043", fontSize: 14 },
  mockCanvas: { display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 304 },
  mockBefore: { display: "grid", placeItems: "center", borderRight: "1px solid #f1f3f4", color: "#9aa0a6", background: "linear-gradient(180deg,#fff,#f8f9fa)" },
  mockAfter: { display: "grid", placeItems: "center", color: "#34a853", background: "linear-gradient(180deg,#f8fff8,#f3fff5)" },

  section: { maxWidth: 1140, margin: "0 auto", padding: "56px 16px" },
  sectionAlt: { maxWidth: 1140, margin: "0 auto", padding: "56px 16px", background: "linear-gradient(180deg,#fcfcff,#ffffff)" },
  kicker: { textAlign: "center" as const, color: "#5f6368", margin: "0 0 8px" },
  logoRow: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, alignItems: "center" },

  logoChip: { border: "1px solid #eee", borderRadius: 999, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, justifyContent: "center", background: "#fff" },
  logoMark: { width: 6, height: 6, borderRadius: 8, background: "#111", display: "inline-block" },

  h2: { fontSize: 28, margin: 0, textAlign: "center" as const },
  sub: { marginTop: 8, textAlign: "center" as const, color: "#5f6368" },

  grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 24 },

  card: { border: "1px solid #eee", borderRadius: 14, padding: 18, background: "#fff" },
  cardTitle: { margin: 0, fontSize: 16, letterSpacing: 0.2 },
  cardDesc: { marginTop: 8, color: "#5f6368", fontSize: 14 },

  priceCard: { border: "1px solid #eee", borderRadius: 14, padding: 18, background: "#fff", display: "flex", flexDirection: "column" as const, gap: 12 },
  priceCardHi: { outline: "2px solid #111", boxShadow: "0 14px 50px rgba(0,0,0,0.08)" },
  priceHead: { display: "flex", alignItems: "baseline", justifyContent: "space-between" },
  priceList: { margin: 0, paddingLeft: 18, color: "#3c4043", lineHeight: 1.8, flexGrow: 1 },

  btnPrimary: { padding: "12px 18px", borderRadius: 12, background: "#111", color: "#fff", textDecoration: "none", fontWeight: 800 },

  ctaBanner: { background: "linear-gradient(90deg,#111,#333)", color: "#fff" },
  ctaInner: { maxWidth: 1140, margin: "0 auto", padding: "18px 16px", display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const },

  faqList: { maxWidth: 900, margin: "16px auto 0", display: "grid", gap: 12 },
  faqItem: { border: "1px solid #eee", borderRadius: 12, padding: "10px 14px", background: "#fff" },
  faqSummary: { cursor: "pointer", fontWeight: 700 },
  faqAnswer: { marginTop: 8, color: "#5f6368" },

  footer: { borderTop: "1px solid #eee", marginTop: 40, background: "#fff" },
  footerInner: { maxWidth: 1140, margin: "0 auto", padding: "20px 16px", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 16, alignItems: "center" },
  footerLink: { color: "#444", textDecoration: "none", fontSize: 14 },
};

const css = `
@media (max-width: 980px) {
  /* make 3-col grids single column on mobile */
  .grid3 { grid-template-columns: 1fr !important; }
}
@media (max-width: 980px) {
  /* collapse logo row */
  .logoRow { grid-template-columns: repeat(2,1fr) !important; }
}
/* The inline styles above are primary; these classes are just helpers for responsiveness. */
`;
import Link from "next/link";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

export default function Home() {
  return (
    <div className="bg-white text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Turn raw boutique photos into <br />
            <span className="text-indigo-600">studio-quality images that sell</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Ghost mannequins, flatlays, background swaps, and Shopify-ready
            exports — all in minutes, no Photoshop needed.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700"
            >
              Start Free →
            </Link>
            <Link
              href="/integrations/shopify"
              className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:border-gray-400"
            >
              Connect Shopify
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required. Cancel anytime.
          </p>
          <div className="mt-12">
            <BeforeAfterSlider />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-bold text-center mb-10">
            Your photos aren't just pictures — they're costing you sales.
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-10">
            Shoppers judge your products in seconds. If your images look dim,
            cluttered, or inconsistent, they don't just scroll past… they buy
            from someone else.
          </p>
          <ul className="grid gap-6 sm:grid-cols-2 text-gray-700">
            <li className="rounded-lg bg-white p-6 shadow">
              • Hours lost editing, still ending with "meh" results
            </li>
            <li className="rounded-lg bg-white p-6 shadow">
              • Wasted ad spend on creatives that don't convert
            </li>
            <li className="rounded-lg bg-white p-6 shadow">
              • Embarrassment when your shop looks unprofessional
            </li>
            <li className="rounded-lg bg-white p-6 shadow">
              • Lost customers to boutiques with stronger visuals
            </li>
          </ul>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            From cluttered shop photos to studio-quality visuals — in seconds.
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            Upload your raw photo, pick a preset, and watch it transform. In
            less time than it takes to make a coffee, your store looks like it
            has its own professional studio.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
            <FeatureCard
              title="Ghost Mannequin Editing"
              desc="Preserve fabric detail and shape without models — catalog-ready in seconds."
            />
            <FeatureCard
              title="Flatlay Generator"
              desc="Show styled outfits instantly — no props, no setup."
            />
            <FeatureCard
              title="Background Swaps"
              desc="From shop wall to white studio or lifestyle scene — perfect for ads."
            />
            <FeatureCard
              title="Aspect Ratio Exporter"
              desc="1:1, 4:5, 9:16, 16:9 — optimized for Shopify, Instagram & TikTok."
            />
            <FeatureCard
              title="Shopify Integration"
              desc="Push images directly to your product listings — no re-upload hassle."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Boutiques already leveling up with Photostudio.io
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Testimonial
              name="Anna M., Rose & Thread"
              quote="Our dresses finally look like Zara's catalog shots. Conversions jumped 18% in 2 weeks."
            />
            <Testimonial
              name="Diego R., Atelier Azul"
              quote="We saved €500/month on photographers. Paid for itself after our first drop."
            />
            <Testimonial
              name="Sophie L., Maison Élise"
              quote="Standardized our brand visuals across locations. Now our shop looks cohesive."
            />
          </div>
          <div className="mt-12 flex justify-center gap-6">
            <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow">
              Shopify App
            </span>
            <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow">
              GDPR Ready
            </span>
            <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow">
              Powered by Google AI
            </span>
          </div>
        </div>
      </section>

      {/* Objections / FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Still not sure if this is right for your boutique?
          </h2>
          <div className="grid gap-8 sm:grid-cols-2">
            <FAQ q="Do I need photography skills?" a="No — if you can take a phone photo, Photostudio.io can transform it." />
            <FAQ q="Can I cancel anytime?" a="Yes. Start free, upgrade when ready, cancel anytime." />
            <FAQ q="Will the photos look fake?" a="No. Photostudio.io preserves fabric detail, natural shadows & texture." />
            <FAQ q="Does this work for accessories?" a="Yes — apparel, shoes, bags, jewelry, all supported." />
            <FAQ q="How fast are edits?" a="Most images are ready in under 30 seconds. Batch handles dozens at once." />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-indigo-600 text-white py-20 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-4xl font-bold mb-6">
            Stop losing sales to bad photos.
          </h2>
          <p className="mb-8 text-lg">
            Start free and transform your boutique today. Your next customer is
            already scrolling — make sure they stop on your photos, not your
            competitor's.
          </p>
          <Link
            href="/signup"
            className="rounded-lg bg-white text-indigo-600 px-8 py-4 font-semibold hover:bg-gray-100"
          >
            Start Free →
          </Link>
          <p className="mt-4 text-sm">No credit card required. Cancel anytime.</p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}

function Testimonial({ name, quote }: { name: string; quote: string }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <p className="text-gray-700 mb-4">"{quote}"</p>
      <p className="font-semibold text-gray-900">{name}</p>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-6 border border-gray-200">
      <h4 className="font-semibold mb-2">{q}</h4>
      <p className="text-gray-600">{a}</p>
    </div>
  );
}
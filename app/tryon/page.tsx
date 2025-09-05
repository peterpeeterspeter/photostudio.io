import Link from "next/link";

export default function TryOnPage() {
  return (
    <div className="bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Virtual Try-On Experience
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            See how clothes look on you before you buy. Upload your photo and try on any garment virtually with AI-powered technology.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/tryon/upload"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Start Virtual Try-On →
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:border-gray-400 transition"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Virtual Try-On Works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Photo</h3>
              <p className="text-gray-600">
                Take or upload a clear photo of yourself. Our AI will analyze your body shape and pose.
              </p>
            </div>
            <div className="text-center">
              <div className="rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Select Garment</h3>
              <p className="text-gray-600">
                Choose from our catalog or upload a garment image. Specify the type and fit preferences.
              </p>
            </div>
            <div className="text-center">
              <div className="rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">See Results</h3>
              <p className="text-gray-600">
                View realistic try-on results instantly. Download or share your virtual try-on images.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Advanced Virtual Try-On Features
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="AI-Powered Fitting"
              description="Advanced AI algorithms ensure realistic garment fitting based on your body measurements."
            />
            <FeatureCard
              title="Multiple Angles"
              description="See how garments look from different angles and poses for a complete view."
            />
            <FeatureCard
              title="Size Recommendations"
              description="Get personalized size recommendations based on your measurements and the garment."
            />
            <FeatureCard
              title="Privacy Protected"
              description="Your photos are processed securely and automatically deleted after processing."
            />
            <FeatureCard
              title="High Quality Results"
              description="Professional-grade rendering for realistic and detailed try-on experiences."
            />
            <FeatureCard
              title="Instant Processing"
              description="Get your virtual try-on results in seconds, not minutes."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 text-white py-20 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Try Virtual Try-On?
          </h2>
          <p className="mb-8 text-lg">
            Experience the future of online shopping. See how any garment looks on you before making a purchase.
          </p>
          <Link
            href="/tryon/upload"
            className="rounded-lg bg-white text-indigo-600 px-8 py-4 font-semibold hover:bg-gray-100 transition"
          >
            Start Virtual Try-On →
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

import Hero from '@/components/molecules/Hero';
import FeatureGrid from '@/components/molecules/FeatureGrid';
import SocialProof from '@/components/molecules/SocialProof';
import CTA from '@/components/molecules/CTA';

export default function Home() {
  const ldJson = {
    '@context':'https://schema.org',
    '@type':'SoftwareApplication',
    name:'Photostudio.io',
    applicationCategory:'PhotoEditing',
    operatingSystem:'Web',
    offers:{ '@type':'Offer', price:'39.00', priceCurrency:'EUR' }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }} />
      <Hero />
      <FeatureGrid />
      <SocialProof />
      <CTA />
    </>
  );
}
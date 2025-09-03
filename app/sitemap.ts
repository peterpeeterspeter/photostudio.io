import { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://photostudio.io';
  const now = new Date().toISOString();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/editor/batch`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/integrations/shopify`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/account`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];
}
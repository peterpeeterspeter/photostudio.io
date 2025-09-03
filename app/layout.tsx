import type { Metadata } from 'next';
import StyledComponentsRegistry from '@/lib/styled-registry';

export const metadata: Metadata = {
  title: 'Photostudio.io – AI product photos for boutiques',
  description: 'Turn raw shop photos into studio-grade images: background swap, ghost mannequin, relight, aspect ratios.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://photostudio.io'),
  alternates: { canonical: '/' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
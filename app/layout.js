import Script from 'next/script'

export const metadata = {
  title: 'Photostudio.io — Boutique Editor',
  description: 'AI-powered image editing for boutique fashion',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  )
}
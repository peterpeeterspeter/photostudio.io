export const metadata = {
  title: 'Photostudio.io — Boutique Editor',
  description: 'AI-powered image editing for boutique fashion',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
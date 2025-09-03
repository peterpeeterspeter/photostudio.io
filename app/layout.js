export const metadata = {
  title: 'Next.js App',
  description: 'A Next.js app with Google AI integration',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
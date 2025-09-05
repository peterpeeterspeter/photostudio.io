import './globals.css'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
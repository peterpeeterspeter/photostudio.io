import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Photostudio.io – AI product photos for boutiques",
  description:
    "Turn raw shop photos into studio-quality visuals: ghost mannequins, flatlays, background swaps, Shopify-ready exports.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://photostudio.io"),
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-gray-900 antialiased">
        <NavBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
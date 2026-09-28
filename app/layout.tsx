import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AuthProvider } from "@/lib/AuthContext";
import PayPalProviderWrapper from "@/components/PayPalProviderWrapper";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.pikagames.shop"),
  title: { default: "PikaGames | Juegos para Nintendo Switch", template: "%s | PikaGames" },
  description: "Explora informaci\u00f3n, novedades y t\u00edtulos para Nintendo Switch en PikaGames.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "PikaGames",
    title: "PikaGames | Juegos para Nintendo Switch",
    description: "Explora informaci\u00f3n, novedades y t\u00edtulos para Nintendo Switch en PikaGames.",
    url: "/",
    images: [{ url: "/icon.png", alt: "PikaGames" }],
  },
  twitter: { card: "summary", title: "PikaGames | Juegos para Nintendo Switch", description: "Explora informaci\u00f3n, novedades y t\u00edtulos para Nintendo Switch en PikaGames." },
  icons: { icon: "/icon.png", shortcut: "/icon.png", apple: "/icon.png" },
};

import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-MX"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#111311]" suppressHydrationWarning>
        <AuthProvider>
          <PayPalProviderWrapper>
            <Navigation />
            {children}
          </PayPalProviderWrapper>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

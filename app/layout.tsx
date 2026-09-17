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

export const metadata: Metadata = {
  title: "PIKAGAMES | Tienda de Videojuegos Nintendo Switch",
  description: "El catálogo definitivo de videojuegos para tu Nintendo Switch",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#111311]" suppressHydrationWarning>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

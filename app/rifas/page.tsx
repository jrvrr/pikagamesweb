import type { Metadata } from "next";
import { RifasClient } from "./RifasClient";

export const metadata: Metadata = {
  title: "Rifas y sorteos",
  description: "Participa en los sorteos de PikaGames: rifas con boletos, sorteos gratis de Instagram, bases y ganadores.",
  alternates: { canonical: "/rifas" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "PikaGames",
    title: "Rifas y sorteos | PikaGames",
    description: "Participa en los sorteos de PikaGames: rifas con boletos, sorteos gratis de Instagram, bases y ganadores.",
  },
};

export default function RifasPage() {
  return <RifasClient />;
}

import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "Juegos para Nintendo Switch | PikaGames",
  description: "Tienda de videojuegos para Nintendo Switch: explora títulos activos, sus detalles y opciones de compra en PikaGames.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "PikaGames",
    title: "Juegos para Nintendo Switch | PikaGames",
    description: "Tienda de videojuegos para Nintendo Switch: explora títulos activos, sus detalles y opciones de compra en PikaGames.",
    url: "/",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}

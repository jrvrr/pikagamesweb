import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de juegos",
  description: "Explora información de videojuegos para Nintendo Switch en el catálogo de PikaGames.",
  alternates: { canonical: "/catalogo" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "PikaGames",
    title: "Catálogo de juegos | PikaGames",
    description: "Explora información de videojuegos para Nintendo Switch en el catálogo de PikaGames.",
    url: "/catalogo",
  },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

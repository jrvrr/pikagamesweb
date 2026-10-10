import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de videojuegos para Nintendo Switch",
  description: "Explora videojuegos activos para Nintendo Switch por género y consulta las opciones disponibles en la tienda PikaGames.",
  alternates: { canonical: "/catalogo" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "PikaGames",
    title: "Catálogo de videojuegos para Nintendo Switch | PikaGames",
    description: "Explora videojuegos activos para Nintendo Switch por género y consulta las opciones disponibles en la tienda PikaGames.",
    url: "/catalogo",
  },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar videojuegos",
  description: "Busca videojuegos para Nintendo Switch y consulta información de cada título en PikaGames.",
  alternates: { canonical: "/buscar" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "PikaGames",
    title: "Buscar videojuegos | PikaGames",
    description: "Busca videojuegos para Nintendo Switch y consulta información de cada título en PikaGames.",
    url: "/buscar",
  },
};

export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de videojuegos",
  description: "Explora videojuegos y opciones de compra disponibles en PikaGames.",
  alternates: { canonical: "/catalogo" },
  robots: { index: false, follow: true },
};

export default function ComprarLayout({ children }: { children: React.ReactNode }) {
  return children;
}

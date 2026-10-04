import type { Metadata } from "next";
import { isDemoGameId } from "@/lib/demoGames";

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };
type RawgGame = { name?: string; description_raw?: string; background_image?: string | null };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const fallback: Metadata = {
    title: "Compra de videojuegos",
    description: "Consulta los detalles del videojuego y continúa al checkout de PikaGames.",
    robots: { index: false, follow: false },
  };
  const apiKey = process.env.NEXT_PUBLIC_RAWG_API_KEY;
  if (!/^\d+$/.test(id) || isDemoGameId(id) || !apiKey) return fallback;

  try {
    const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${apiKey}`, { next: { revalidate: 3600 } });
    if (!response.ok) return fallback;
    const game = await response.json() as RawgGame;
    if (!game.name) return fallback;
    const description = game.description_raw?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
      || `Información del videojuego ${game.name}.`;
    const title = `${game.name} | Videojuego`;

    return {
      title,
      description,
      alternates: { canonical: `/comprar/${id}` },
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        locale: "es_MX",
        siteName: "PikaGames",
        title,
        description,
        ...(game.background_image ? { images: [{ url: game.background_image, alt: game.name }] } : {}),
      },
    };
  } catch {
    return fallback;
  }
}

export default function ComprarLayout({ children }: Props) {
  return children;
}

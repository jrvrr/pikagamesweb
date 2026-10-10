import { cache } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pikagamesapiweb.vercel.app/api";
const RAWG_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;
const SITE_URL = "https://www.pikagames.shop";

export const categories = [
  { slug: "accion", name: "Acción", description: "Videojuegos de acción para Nintendo Switch.", genreId: 4 },
  { slug: "aventura", name: "Aventura", description: "Videojuegos de aventura para Nintendo Switch.", genreId: 3 },
  { slug: "rpg", name: "RPG", description: "Juegos de rol disponibles para Nintendo Switch.", genreId: 5 },
  { slug: "carreras", name: "Carreras", description: "Videojuegos de carreras para Nintendo Switch.", genreId: 1 },
  { slug: "deportes", name: "Deportes", description: "Videojuegos deportivos para Nintendo Switch.", genreId: 15 },
  { slug: "lucha", name: "Lucha", description: "Videojuegos de lucha para Nintendo Switch.", genreId: 6 },
  { slug: "plataformas", name: "Plataformas", description: "Videojuegos de plataformas para Nintendo Switch.", genreId: 83 },
  { slug: "estrategia", name: "Estrategia", description: "Videojuegos de estrategia para Nintendo Switch.", genreId: 10 },
  { slug: "simulacion", name: "Simulación", description: "Videojuegos de simulación para Nintendo Switch.", genreId: 14 },
] as const;

type StoreProduct = {
  id: number | string;
  tipo_cuenta: string;
  precio: number | string;
  activo: boolean;
  Videojuego?: {
    rawg_id?: number | string | null;
    titulo?: string;
    descripcion?: string | null;
    imagen_url?: string | null;
    consola?: string | null;
    activo?: boolean;
  };
};

export type CatalogGame = {
  id: string;
  name: string;
  description: string;
  image?: string;
  genres: { id: number; name: string }[];
  products: StoreProduct[];
};

function cleanText(value: string | undefined | null): string {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

async function getStoreProducts(): Promise<StoreProduct[]> {
  try {
    const response = await fetch(`${API_URL.replace(/\/$/, "")}/productos`, { next: { revalidate: 1800 } });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];
    return (data as StoreProduct[]).filter((product) =>
      product.activo === true && product.Videojuego?.activo === true && /^\d+$/.test(String(product.Videojuego.rawg_id || "")),
    );
  } catch {
    return [];
  }
}

async function getRawgGame(id: string) {
  if (!RAWG_KEY) return null;
  try {
    const response = await fetch(`https://api.rawg.io/api/games/${encodeURIComponent(id)}?key=${RAWG_KEY}`, { next: { revalidate: 86400 } });
    if (!response.ok) return null;
    return await response.json() as {
      name?: string;
      description_raw?: string;
      background_image?: string | null;
      platforms?: { platform?: { id?: number; name?: string } }[];
      genres?: { id: number; name: string }[];
    };
  } catch {
    return null;
  }
}

export const getSwitchCatalog = cache(async (): Promise<CatalogGame[]> => {
  const products = await getStoreProducts();
  const byGame = new Map<string, StoreProduct[]>();
  for (const product of products) {
    const id = String(product.Videojuego!.rawg_id);
    byGame.set(id, [...(byGame.get(id) || []), product]);
  }

  const entries: (CatalogGame | null)[] = await Promise.all([...byGame].map(async ([id, gameProducts]): Promise<CatalogGame | null> => {
    const rawg = await getRawgGame(id);
    const platformMatches = rawg?.platforms?.some(({ platform }) => platform?.id === 7 || /nintendo switch/i.test(platform?.name || ""));
    const console = gameProducts[0].Videojuego?.consola || "";
    if (!platformMatches && !/nintendo switch/i.test(console)) return null;
    const record = gameProducts[0].Videojuego!;
    return {
      id,
      name: rawg?.name || record.titulo || `Videojuego ${id}`,
      description: cleanText(rawg?.description_raw || record.descripcion) || `Consulta los detalles de ${record.titulo || "este videojuego"} en PikaGames.`,
      image: rawg?.background_image || record.imagen_url || undefined,
      genres: rawg?.genres || [],
      products: gameProducts,
    };
  }));

  return entries.filter((entry): entry is CatalogGame => entry !== null);
});

export const getSwitchGame = cache(async (id: string) =>
  /^\d+$/.test(id) ? (await getSwitchCatalog()).find((game) => game.id === id) || null : null,
);

export const siteUrl = SITE_URL;

export function jsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

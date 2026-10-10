import type { MetadataRoute } from "next";
import { categories, getSwitchCatalog, siteUrl } from "@/lib/seoCatalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await getSwitchCatalog();
  const categoryEntries = categories
    .filter((category) => games.some((game) => game.genres.some((genre) => genre.id === category.genreId)))
    .map((category) => ({ url: `${siteUrl}/categoria/${category.slug}`, changeFrequency: "weekly" as const, priority: 0.7 }));

  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/soporte`, changeFrequency: "monthly", priority: 0.3 },
    ...(games.length ? [{ url: `${siteUrl}/nintendo-switch`, changeFrequency: "daily" as const, priority: 0.9 }] : []),
    ...categoryEntries,
    ...games.map((game) => ({ url: `${siteUrl}/videojuegos/${game.id}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}

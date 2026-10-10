import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { categories, getSwitchCatalog, jsonLd, siteUrl } from "@/lib/seoCatalog";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function getCategory(slug: string) {
  const category = categories.find((item) => item.slug === slug);
  if (!category) return null;
  const games = (await getSwitchCatalog()).filter((game) => game.genres.some((genre) => genre.id === category.genreId));
  return { category, games };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategory(slug);
  if (!result) return { title: "Categoría no encontrada", robots: { index: false, follow: false } };
  const { category, games } = result;
  const title = `${category.name} para Nintendo Switch`;
  return {
    title,
    description: `Explora juegos de ${category.name.toLowerCase()} para Nintendo Switch disponibles en la tienda PikaGames.`,
    alternates: { canonical: `/categoria/${category.slug}` },
    robots: games.length ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website", locale: "es_MX", siteName: "PikaGames", title: `${title} | PikaGames`,
      description: `Explora juegos de ${category.name.toLowerCase()} para Nintendo Switch disponibles en la tienda PikaGames.`,
      url: `/categoria/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const result = await getCategory(slug);
  if (!result) notFound();
  const { category, games } = result;
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Catálogo", item: `${siteUrl}/catalogo` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${siteUrl}/categoria/${category.slug}` },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#111311] px-4 pb-20 pt-28 text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-zinc-400"><Link href="/" className="hover:text-white">Inicio</Link><span aria-hidden="true"> / </span><Link href="/catalogo" className="hover:text-white">Catálogo</Link><span aria-hidden="true"> / </span><span>{category.name}</span></nav>
        <h1 className="text-3xl font-black text-white sm:text-5xl">{category.name} para Nintendo Switch</h1>
        <p className="mt-3 max-w-3xl text-zinc-300">{category.description} Estos títulos pertenecen al catálogo activo de PikaGames.</p>
        {games.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => <Link key={game.id} href={`/videojuegos/${game.id}`} className="group block">
            <Card className="h-full border border-zinc-800 bg-zinc-900 px-4 py-4 text-zinc-100 ring-0 hover:border-[#ffd90f]">
            <h2 className="text-lg font-bold text-white group-hover:text-[#ffd90f]">{game.name}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{game.description}</p>
            <span className="mt-4 inline-block text-sm font-bold text-[#ffd90f]">Ver detalles</span>
            </Card>
          </Link>)}
        </div> : <p className="mt-8 text-zinc-300">No hay videojuegos activos de esta categoría en el catálogo.</p>}
        <p className="mt-8"><Link href={`/comprar?categoria=${category.slug}`} className="font-bold text-[#ffd90f] hover:underline">Ver resultados del catálogo</Link></p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
    </main>
  );
}

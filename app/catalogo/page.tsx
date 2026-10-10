import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { categories, getSwitchCatalog, jsonLd, siteUrl } from "@/lib/seoCatalog";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const games = await getSwitchCatalog();
  const description = "Tienda de videojuegos para Nintendo Switch: explora títulos activos por género y consulta las opciones disponibles en PikaGames.";
  return {
    title: "Catálogo de videojuegos para Nintendo Switch", description,
    alternates: { canonical: "/catalogo" },
    robots: games.length ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website", locale: "es_MX", siteName: "PikaGames",
      title: "Catálogo de videojuegos para Nintendo Switch | PikaGames", description, url: "/catalogo",
    },
  };
}

export default async function CatalogoPage() {
  const games = await getSwitchCatalog();
  const activeCategories = categories.filter((category) =>
    games.some((game) => game.genres.some((genre) => genre.id === category.genreId)),
  );
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Catálogo", item: `${siteUrl}/catalogo` },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#111311] px-4 pb-20 pt-28 text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 max-w-3xl">
          <p className="mb-2 text-sm font-bold uppercase text-[#ffd90f]">PikaGames</p>
          <h1 className="text-3xl font-black text-white sm:text-5xl">Catálogo de videojuegos para Nintendo Switch</h1>
          <p className="mt-3 text-pretty text-zinc-400">Explora títulos activos de nuestro catálogo y consulta sus detalles y opciones de compra.</p>
          {games.length > 0 && <Link href="/nintendo-switch" className="mt-3 inline-flex min-h-10 items-center font-bold text-[#ffd90f] hover:underline">Ver todos los juegos para Nintendo Switch</Link>}
        </header>

        {activeCategories.length > 0 && <nav aria-label="Categorías del catálogo" className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-white">Explora por género</h2>
          <ul className="flex flex-wrap gap-3">
            {activeCategories.map((category) => <li key={category.slug}><Link href={`/categoria/${category.slug}`} className="inline-flex min-h-10 items-center rounded-full border border-zinc-700 px-4 font-semibold text-zinc-100 hover:border-[#ffd90f] hover:text-[#ffd90f]">{category.name}</Link></li>)}
          </ul>
        </nav>}

        <section aria-labelledby="games-heading">
          <h2 id="games-heading" className="mb-5 text-2xl font-black text-white">Videojuegos disponibles</h2>
          {games.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => <li key={game.id}><Link href={`/videojuegos/${game.id}`} className="group block h-full">
              <Card className="h-full border border-zinc-800 bg-zinc-900 px-4 py-4 text-zinc-100 ring-0 hover:border-[#ffd90f]">
              {game.image && <Image src={game.image} alt="" width={800} height={450} unoptimized className="mb-4 aspect-video w-full rounded-xl object-cover" />}
              <h3 className="text-lg font-bold text-white group-hover:text-[#ffd90f]">{game.name}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{game.description}</p>
              <span className="mt-4 inline-block text-sm font-bold text-[#ffd90f]">Ver detalles</span>
              </Card>
            </Link></li>)}
          </ul> : <p className="text-zinc-300">El catálogo no tiene videojuegos activos de Nintendo Switch en este momento.</p>}
        </section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
    </main>
  );
}

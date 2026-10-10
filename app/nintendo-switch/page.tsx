import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { getSwitchCatalog, jsonLd, siteUrl } from "@/lib/seoCatalog";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const games = await getSwitchCatalog();
  return {
    title: "Juegos para Nintendo Switch",
    description: "Consulta juegos para Nintendo Switch del catálogo activo y sus opciones en la tienda PikaGames.",
    alternates: { canonical: "/nintendo-switch" },
    robots: games.length ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website", locale: "es_MX", siteName: "PikaGames",
      title: "Juegos para Nintendo Switch | PikaGames",
      description: "Consulta juegos para Nintendo Switch del catálogo activo y sus opciones en la tienda PikaGames.",
      url: "/nintendo-switch",
    },
  };
}

export default async function NintendoSwitchPage() {
  const games = await getSwitchCatalog();
  if (!games.length) notFound();

  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Nintendo Switch", item: `${siteUrl}/nintendo-switch` },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#111311] px-4 pb-20 pt-28 text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-zinc-400"><Link href="/" className="hover:text-white">Inicio</Link><span aria-hidden="true"> / </span><span>Nintendo Switch</span></nav>
        <h1 className="text-3xl font-black text-white sm:text-5xl">Juegos para Nintendo Switch</h1>
        <p className="mt-3 max-w-3xl text-zinc-300">Videojuegos de Nintendo Switch que aparecen en el catálogo activo de PikaGames.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => <Link key={game.id} href={`/videojuegos/${game.id}`} className="group block">
            <Card className="h-full border border-zinc-800 bg-zinc-900 px-4 py-4 text-zinc-100 ring-0 hover:border-[#ffd90f]">
            {game.image && <Image src={game.image} alt="" width={800} height={450} unoptimized className="mb-4 aspect-video w-full rounded-xl object-cover" />}
            <h2 className="text-lg font-bold text-white group-hover:text-[#ffd90f]">{game.name}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{game.description}</p>
            <span className="mt-4 inline-block text-sm font-bold text-[#ffd90f]">Ver detalles</span>
            </Card>
          </Link>)}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
    </main>
  );
}

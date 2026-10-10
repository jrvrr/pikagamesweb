import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSwitchGame, jsonLd, siteUrl } from "@/lib/seoCatalog";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = await getSwitchGame(id);
  if (!game) return { title: "Videojuego no disponible", robots: { index: false, follow: false } };
  const description = `${game.name} para Nintendo Switch: consulta sus detalles y opciones disponibles en la tienda PikaGames.`;
  return {
    title: `${game.name} para Nintendo Switch`,
    description,
    alternates: { canonical: `/videojuegos/${game.id}` },
    openGraph: {
      type: "website", locale: "es_MX", siteName: "PikaGames",
      title: `${game.name} para Nintendo Switch | PikaGames`, description,
      url: `/videojuegos/${game.id}`,
      ...(game.image ? { images: [{ url: game.image, alt: game.name }] } : {}),
    },
  };
}

export default async function VideojuegoPage({ params }: Props) {
  const { id } = await params;
  const game = await getSwitchGame(id);
  if (!game) notFound();

  const offers = game.products.flatMap((product) => {
    const price = Number(product.precio);
    return Number.isFinite(price) && price >= 0 ? [{
      "@type": "Offer", name: product.tipo_cuenta,
      url: `${siteUrl}/comprar/${game.id}`,
      price: price.toFixed(2), priceCurrency: "MXN",
      availability: product.activo ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    }] : [];
  });
  const productSchema = {
    "@context": "https://schema.org", "@type": "Product",
    name: game.name, description: game.description, category: "Videojuego para Nintendo Switch",
    ...(game.image ? { image: game.image } : {}), ...(offers.length ? { offers } : {}),
  };
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Nintendo Switch", item: `${siteUrl}/nintendo-switch` },
      { "@type": "ListItem", position: 3, name: game.name, item: `${siteUrl}/videojuegos/${game.id}` },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#111311] px-4 pb-20 pt-28 text-zinc-100 sm:px-6">
      <article className="mx-auto max-w-4xl">
        <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-zinc-400"><Link href="/" className="hover:text-white">Inicio</Link><span aria-hidden="true"> / </span><Link href="/nintendo-switch" className="hover:text-white">Nintendo Switch</Link><span aria-hidden="true"> / </span><span>{game.name}</span></nav>
        {game.image && <Image src={game.image} alt={game.name} width={1200} height={675} unoptimized className="mb-6 max-h-[30rem] w-full rounded-2xl object-cover" />}
        <h1 className="text-3xl font-black text-white sm:text-5xl">{game.name}</h1>
        <p className="mt-2 font-semibold text-[#ffd90f]">Nintendo Switch</p>
        <p className="mt-5 leading-7 text-zinc-300">{game.description}</p>
        <section aria-labelledby="purchase-options" className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 id="purchase-options" className="text-xl font-bold text-white">Opciones disponibles</h2>
          <ul className="mt-4 space-y-3">
            {game.products.map((product) => <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-3">
              <span className="capitalize text-zinc-200">{product.tipo_cuenta}</span>
              <span className="font-bold text-white">${Number(product.precio).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
              <span className="text-sm text-zinc-400">{product.activo ? "Disponible" : "No disponible"}</span>
            </li>)}
          </ul>
          <Link href={`/comprar/${game.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#ffd90f] px-5 font-black text-zinc-950 hover:bg-[#ffe45c]">Continuar a compra</Link>
        </section>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
    </main>
  );
}

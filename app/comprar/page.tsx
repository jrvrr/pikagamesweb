"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gamepad2, ShoppingBag } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string | number;
  precio: string | number;
  activo: boolean;
  Videojuego?: {
    rawg_id?: string | number | null;
    titulo?: string;
    imagen_url?: string | null;
    activo?: boolean;
  };
};

type GameForSale = {
  rawgId: string;
  title: string;
  image: string | null;
  fromPrice: number;
};

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default function ComprarPage() {
  const [games, setGames] = useState<GameForSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    apiFetch("/productos")
      .then((result) => {
        if (!Array.isArray(result)) throw new Error("Respuesta no válida");
        const byGame = new Map<string, GameForSale>();
        for (const product of result as Product[]) {
          const game = product.Videojuego;
          const rawgId = game?.rawg_id === null || game?.rawg_id === undefined ? "" : String(game.rawg_id);
          const price = Number(product.precio);
          if (!product.activo || !game?.activo || !rawgId || !game.titulo || !Number.isFinite(price)) continue;
          const existing = byGame.get(rawgId);
          if (!existing || price < existing.fromPrice) {
            byGame.set(rawgId, { rawgId, title: game.titulo, image: game.imagen_url ?? null, fromPrice: price });
          }
        }
        if (active) setGames([...byGame.values()].sort((a, b) => a.title.localeCompare(b.title, "es")));
      })
      .catch(() => { if (active) setError("No se pudieron cargar los juegos disponibles."); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-[#111311] px-4 pb-20 pt-24 text-zinc-100 sm:px-6 md:pt-28">
      <div className="mx-auto max-w-6xl">
        <Link href="/catalogo" className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">
          <ArrowLeft aria-hidden="true" className="size-4" /> Explorar catálogo
        </Link>
        <header className="mb-8 max-w-2xl">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-[#ffd90f]"><ShoppingBag aria-hidden="true" className="size-4" /> Compra directa</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Juegos disponibles para comprar</h1>
          <p className="mt-3 text-zinc-400">Elige un juego disponible y continúa al checkout para seleccionar tu tipo de cuenta y método de pago.</p>
        </header>

        {loading ? <p role="status" className="py-16 text-center text-sm text-zinc-400">Cargando juegos disponibles…</p> : error ? (
          <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">{error}</p>
        ) : games.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <li key={game.rawgId} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                <div className="aspect-video bg-zinc-800">
                  {game.image ? <img src={game.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-600"><Gamepad2 aria-hidden="true" className="size-10" /></div>}
                </div>
                <div className="p-4">
                  <h2 className="line-clamp-2 min-h-12 font-bold text-white">{game.title}</h2>
                  <p className="mt-2 text-sm text-zinc-400">Desde <strong className="text-white">{money.format(game.fromPrice)}</strong></p>
                  <Link href={`/comprar/${encodeURIComponent(game.rawgId)}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#ffd90f] px-4 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#e5c30d]">
                    Comprar este juego
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <Gamepad2 aria-hidden="true" className="mx-auto size-10 text-zinc-500" />
            <h2 className="mt-3 font-bold text-white">No hay juegos disponibles por ahora</h2>
            <p className="mt-2 text-sm text-zinc-400">Puedes explorar el catálogo mientras agregamos nuevos títulos.</p>
            <Link href="/catalogo" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 px-4 text-sm font-bold text-zinc-100 transition-colors hover:border-[#ffd90f] hover:text-[#ffd90f]">Ir al catálogo</Link>
          </section>
        )}
      </div>
    </main>
  );
}

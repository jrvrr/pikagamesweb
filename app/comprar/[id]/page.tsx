"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Gamepad2, Loader2, Send, ShieldCheck, Star } from "lucide-react";
import { getGameDetails, type Game } from "@/lib/rawg";

type AccountType = "principal" | "secundaria";

const accountOptions: Record<AccountType, { label: string; price: number; description: string }> = {
  principal: {
    label: "Cuenta principal",
    price: 650,
    description: "Juega desde tu perfil personal y conserva tus logros y guardados.",
  },
  secundaria: {
    label: "Cuenta secundaria",
    price: 260,
    description: "Una opción más económica para jugar desde el perfil asignado.",
  },
};

const switch2FallbackNames: Record<string, string> = {
  "99901": "Metroid Prime 4: Beyond (Switch 2 Edition)",
  "99902": "Mario Kart Ultimate (Nintendo Switch 2)",
  "99903": "Pokémon Legends: Z-A (Switch 2 Enhanced)",
  "99904": "The Legend of Zelda: Deluxe 4K Edition",
  "99905": "Donkey Kong 3D Bananza (Switch 2)",
  "99906": "Super Smash Bros. Universe (Switch 2)",
};

export default function ComprarJuegoPage({ params }: { params: Promise<{ id: string }> }) {
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountType, setAccountType] = useState<AccountType>("principal");

  useEffect(() => {
    let active = true;

    async function loadGame() {
      const { id } = await params;
      const gameDetails = await getGameDetails(id);
      const fallbackName = switch2FallbackNames[id];
      if (active) {
        setGame(gameDetails || (fallbackName ? {
          id: Number(id),
          slug: id,
          name: fallbackName,
          background_image: "",
          rating: 0,
          released: "",
          platforms: [],
          description_raw: "Título digital para Nintendo Switch 2.",
        } : null));
        setIsLoading(false);
      }
    }

    loadGame();
    return () => {
      active = false;
    };
  }, [params]);

  const selectedOption = accountOptions[accountType];

  const continueToWhatsApp = () => {
    if (!game) return;
    const message = `Hola Pikagames, deseo comprar "${game.name}" con cuenta ${selectedOption.label.toLowerCase()} por $${selectedOption.price} MXN.`;
    window.open(`https://wa.me/528136975487?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#111311] pt-28 text-zinc-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-32 text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#ffd90f]" />
          <p className="font-bold">Cargando información del videojuego...</p>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-[#111311] pt-28 text-zinc-100">
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <Gamepad2 className="mx-auto mb-5 h-14 w-14 text-[#ffd90f]" />
          <h1 className="text-2xl font-black">No encontramos este videojuego</h1>
          <p className="mt-3 text-zinc-400">Regresa al catálogo para elegir otro título.</p>
          <Link href="/catalogo" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#ffd90f] px-5 py-3 text-sm font-black text-zinc-900">
            <ArrowLeft className="h-4 w-4" /> Volver al catálogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111311] pb-24 pt-24 text-zinc-100 md:pt-28">
      <div className="mx-auto max-w-6xl px-6">
        <Link href="/catalogo" className="mb-8 inline-flex items-center gap-2 rounded-full border-2 border-zinc-800 bg-zinc-900 px-5 py-2 text-sm font-bold text-zinc-300 transition-colors hover:border-[#ffd90f] hover:text-[#ffd90f]">
          <ArrowLeft className="h-4 w-4" /> Volver al catálogo
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <section className="overflow-hidden rounded-3xl border-2 border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="relative aspect-video bg-zinc-800">
              {game.background_image ? (
                <img src={game.background_image} alt={game.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center"><Gamepad2 className="h-20 w-20 text-zinc-600" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
              {game.rating > 0 && (
                <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-zinc-950/90 px-3 py-1.5 text-sm font-black text-[#ffd90f]"><Star className="h-4 w-4 fill-current" /> {game.rating.toFixed(1)}</span>
              )}
            </div>
            <div className="p-6 md:p-8">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#ffd90f]">Tu selección</span>
              <h1 className="mt-2 text-3xl font-black leading-tight text-white md:text-4xl">{game.name}</h1>
              {game.genres && game.genres.length > 0 && <p className="mt-3 text-sm font-semibold text-zinc-400">{game.genres.map((genre) => genre.name).join(" · ")}</p>}
              <p className="mt-5 text-sm leading-6 text-zinc-300 md:text-base">{game.description_raw || "Disfruta este título digital para Nintendo Switch."}</p>
            </div>
          </section>

          <aside className="rounded-3xl border-2 border-[#ffd90f]/40 bg-zinc-900 p-6 shadow-[0_0_35px_rgba(255,217,15,0.1)] md:p-8">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#ffd90f]">Paso 1 de 1</span>
            <h2 className="mt-2 text-2xl font-black text-white">Elige el tipo de cuenta</h2>
            <p className="mt-2 text-sm text-zinc-400">Selecciona la opción que prefieras para continuar con tu pedido.</p>

            <div className="mt-6 space-y-3">
              {(Object.keys(accountOptions) as AccountType[]).map((type) => {
                const option = accountOptions[type];
                const selected = accountType === type;
                return (
                  <button key={type} type="button" onClick={() => setAccountType(type)} className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${selected ? "border-[#ffd90f] bg-[#ffd90f]/10 shadow-[0_0_20px_rgba(255,217,15,0.12)]" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-[#ffd90f] bg-[#ffd90f] text-zinc-900" : "border-zinc-500"}`}>{selected && <Check className="h-3.5 w-3.5 stroke-[3]" />}</span><h3 className="font-black text-white">{option.label}</h3></div>
                        <p className="mt-2 pl-7 text-xs leading-5 text-zinc-400">{option.description}</p>
                      </div>
                      <span className="shrink-0 text-xl font-black text-[#ffd90f]">${option.price} <small className="text-xs">MXN</small></span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
              <div className="flex items-center justify-between text-sm"><span className="text-zinc-400">Total</span><strong className="text-2xl text-white">${selectedOption.price} MXN</strong></div>
              <p className="mt-2 flex items-center gap-2 text-xs text-zinc-400"><ShieldCheck className="h-4 w-4 text-[#ffd90f]" /> Confirmarás los detalles de entrega con un asesor.</p>
            </div>

            <button type="button" onClick={continueToWhatsApp} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-4 font-black text-white transition-colors hover:bg-[#1fbe59]">
              <Send className="h-5 w-5" /> Continuar por WhatsApp
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

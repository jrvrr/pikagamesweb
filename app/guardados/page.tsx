"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Trash2, ArrowLeft, Gamepad2, Tag } from "lucide-react";
import { ShapeGrid } from "@/components/ShapeGrid";

// Mock data for saved games
const initialSavedGames = [
  {
    id: 1,
    title: "Zelda: Tears of the Kingdom",
    price: "$1,399",
    image: "/1.png",
    category: "Aventura",
    discount: "-10%",
    oldPrice: "$1,599",
  },
  {
    id: 2,
    title: "Mario Kart 8 Deluxe",
    price: "$1,199",
    image: "/2.avif",
    category: "Carreras",
  },
  {
    id: 3,
    title: "Super Smash Bros. Ultimate",
    price: "$1,299",
    image: "/1.png", // Reusing image since we lack specific assets
    category: "Peleas",
    discount: "-5%",
    oldPrice: "$1,369",
  },
  {
    id: 4,
    title: "Animal Crossing: New Horizons",
    price: "$1,199",
    image: "/2.avif",
    category: "Simulación",
  }
];

export default function GuardadosPage() {
  const [savedGames, setSavedGames] = useState(initialSavedGames);

  const removeGame = (id: number) => {
    setSavedGames(savedGames.filter(game => game.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#111311] text-zinc-100 font-sans pt-24 pb-20 md:pb-12">
      {/* Background shape grid for aesthetic */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <ShapeGrid 
          speed={0.3}
          squareSize={50}
          direction="diagonal"
          borderColor="#2a2a2a"
          shape="square"
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 md:mb-12 border-b-2 border-zinc-800 pb-6">
          <div>
            <Link href="/" className="bg-zinc-800 text-white border-2 border-zinc-600 hover:bg-zinc-700 hover:text-white hover:border-[#ffd90f] rounded-full px-5 py-2 md:px-8 md:py-3 font-bold shadow-[0_4px_20px_rgba(0,0,0,0.6)] inline-flex items-center gap-2 transition-all hover:-translate-y-1 mb-8 text-sm md:text-base">
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              Volver al inicio
            </Link>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-3 md:gap-4 text-white">
              <Heart className="w-8 h-8 md:w-12 md:h-12 text-[#ffd90f] fill-[#ffd90f]" />
              Tus Guardados
            </h1>
            <p className="text-zinc-400 mt-2 font-medium text-sm md:text-base max-w-[90%] md:max-w-none">
              Los juegos que más deseas, listos para tu próxima aventura.
            </p>
          </div>
          <div className="mt-6 md:mt-0 bg-zinc-900 px-5 md:px-6 py-2 md:py-3 rounded-full border-2 border-zinc-800 flex items-center gap-3">
            <span className="font-bold text-base md:text-lg text-white">{savedGames.length}</span>
            <span className="text-zinc-400 text-xs md:text-sm font-medium uppercase tracking-widest">Juegos</span>
          </div>
        </div>

        {savedGames.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/50 rounded-3xl border-2 border-zinc-800/50 backdrop-blur-sm">
            <div className="w-32 h-32 bg-zinc-800 rounded-full flex items-center justify-center mb-8 relative">
              <Heart className="w-16 h-16 text-zinc-600" />
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#ffd90f] rounded-full flex items-center justify-center text-zinc-900 font-bold text-xl animate-bounce">
                ?
              </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Tu lista está vacía</h2>
            <p className="text-zinc-400 max-w-md mb-8 font-medium">
              Aún no has guardado ningún juego. Explora nuestro catálogo y encuentra tu próxima aventura.
            </p>
            <Link href="/">
              <Button size="lg" className="bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 rounded-full font-bold px-8 py-6 text-lg shadow-[0_4px_14px_rgba(255,217,15,0.4)] transition-all hover:scale-105">
                <Gamepad2 className="w-6 h-6 mr-3" />
                Explorar Juegos
              </Button>
            </Link>
          </div>
        ) : (
          /* Populated State */
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
            {savedGames.map((game) => (
              <div 
                key={game.id} 
                className="group bg-zinc-900/80 rounded-2xl border-2 border-zinc-800 overflow-hidden hover:border-[#ffd90f] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,217,15,0.15)] hover:-translate-y-1 md:hover:-translate-y-2 flex flex-col relative"
              >
                {/* Remove button */}
                <button 
                  onClick={() => removeGame(game.id)}
                  className="absolute top-2 right-2 md:top-4 md:right-4 z-20 w-8 h-8 md:w-10 md:h-10 bg-zinc-900/80 hover:bg-red-500 hover:text-white text-zinc-400 rounded-full flex items-center justify-center backdrop-blur-md transition-colors border border-zinc-700 hover:border-red-500 shadow-sm"
                  title="Eliminar de guardados"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Discount Tag */}
                {game.discount && (
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 bg-[#d0144c] text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-[#d0144c]/30">
                    <Tag className="w-3 h-3 hidden md:block" /> {game.discount}
                  </div>
                )}

                {/* Image Container */}
                <div className="h-32 md:h-56 w-full bg-zinc-800 relative flex items-center justify-center overflow-hidden p-3 md:p-6">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10 opacity-60" />
                  <img 
                    src={game.image} 
                    alt={game.title} 
                    className="w-full h-full object-contain relative z-0 group-hover:scale-110 transition-transform duration-500 drop-shadow-xl"
                  />
                </div>

                {/* Content */}
                <div className="p-3 md:p-6 flex flex-col flex-grow relative z-20 bg-zinc-900">
                  <span className="text-[#ffd90f] text-[9px] md:text-xs font-bold uppercase tracking-widest mb-1 md:mb-2">{game.category}</span>
                  <h3 className="text-sm md:text-xl font-black text-white mb-2 md:mb-4 leading-tight group-hover:text-[#ffd90f] transition-colors line-clamp-2">{game.title}</h3>
                  
                  <div className="mt-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-0 md:gap-3 mb-3 md:mb-6">
                      <span className="text-lg md:text-3xl font-black text-white leading-none">{game.price}</span>
                      {game.oldPrice && (
                        <span className="text-zinc-500 line-through font-bold text-[10px] md:text-base mt-1 md:mt-0 md:mb-1">{game.oldPrice}</span>
                      )}
                    </div>
                    
                    <Button className="w-full bg-white hover:bg-[#ffd90f] text-zinc-900 font-bold rounded-lg md:rounded-xl py-4 md:py-6 transition-all shadow-[2px_2px_0px_0px_rgba(255,217,15,1)] md:shadow-[4px_4px_0px_0px_rgba(255,217,15,1)] hover:translate-y-[1px] md:hover:translate-y-[2px] active:shadow-none text-[11px] md:text-base px-2 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 shrink-0" />
                      <span>Comprar<span className="hidden md:inline"> Ahora</span></span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

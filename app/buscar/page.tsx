"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowLeft, TrendingUp, Clock } from "lucide-react";
import { ShapeGrid } from "@/components/ShapeGrid";

const popularSearches = [
  "Zelda", "Mario Kart", "Smash Bros", "Pokemon", "Animal Crossing"
];

const recentSearches = [
  "Hollow Knight", "Metroid Dread"
];

export default function BuscarPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-[#111311] text-zinc-100 font-sans pt-20 md:pt-24 pb-24 md:pb-12">
      {/* Background shape grid */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <ShapeGrid 
          speed={0.4}
          squareSize={40}
          direction="vertical"
          borderColor="#2a2a2a"
          shape="square"
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col gap-8">
        
        {/* Header / Search Input */}
        <div className="flex flex-col gap-6">
          <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-[#ffd90f] transition-colors font-medium w-fit">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Link>

          <div className="relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-zinc-500" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué juego estás buscando?" 
              className="w-full pl-20 pr-8 py-6 bg-zinc-900 border-2 border-zinc-800 rounded-3xl text-xl font-bold focus:outline-none focus:border-[#ffd90f] focus:ring-4 focus:ring-[#ffd90f]/20 transition-all text-white placeholder-zinc-600 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              autoFocus
            />
          </div>
        </div>

        {/* Content based on search state */}
        {!query ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {/* Recent Searches */}
            <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800">
              <h3 className="text-zinc-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" /> Búsquedas Recientes
              </h3>
              <div className="flex flex-wrap gap-3">
                {recentSearches.map((item, idx) => (
                  <button key={idx} onClick={() => setQuery(item)} className="bg-zinc-800 hover:bg-zinc-700 hover:text-[#ffd90f] px-4 py-2 rounded-full text-sm font-medium transition-colors border border-zinc-700 text-left">
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Searches */}
            <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800">
              <h3 className="text-zinc-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Tendencias
              </h3>
              <div className="flex flex-wrap gap-3">
                {popularSearches.map((item, idx) => (
                  <button key={idx} onClick={() => setQuery(item)} className="bg-zinc-800 hover:bg-zinc-700 hover:text-[#ffd90f] px-4 py-2 rounded-full text-sm font-medium transition-colors border border-zinc-700 text-left">
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-16 h-16 text-zinc-700 mb-6" />
            <h2 className="text-2xl font-black text-white mb-2">Buscando "{query}"</h2>
            <p className="text-zinc-400 font-medium max-w-md">
              Los resultados de búsqueda aparecerán aquí próximamente cuando conectemos el catálogo completo.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

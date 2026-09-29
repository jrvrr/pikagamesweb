"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShapeGrid } from "@/components/ShapeGrid";
import { GameCard } from "@/components/GameCard";
import { 
  Gamepad2, 
  Search, 
  Heart, 
  ShoppingCart, 
  Star, 
  Calendar, 
  ArrowLeft, 
  Loader2, 
  ChevronDown, 
  X
} from "lucide-react";
import { getPopularGames, getNewReleases, searchGames, getGameDetails, Game } from "@/lib/rawg";
import { useAuth } from "@/lib/AuthContext";
import { isDemoGameId } from "@/lib/demoGames";
import { AccessibleDialog } from "@/components/AccessibleDialog";

// Special curated Nintendo Switch 2 upcoming and enhanced titles
const switch2Games: Game[] = [
  {
    id: 99901,
    slug: "metroid-prime-4-beyond",
    name: "Metroid Prime 4: Beyond (Switch 2 Edition)",
    background_image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    released: "2025-06-15",
    platforms: [{ platform: { id: 7, name: "Nintendo Switch 2" } }],
    genres: [{ id: 4, name: "Acción" }, { id: 3, name: "Aventura" }],
    description_raw: "La esperadísima nueva entrega de Samus Aran optimizada para el hardware de nueva generación de Nintendo Switch 2 con gráficos 4K en dock y 60 FPS estables.",
    metacritic: 94
  },
  {
    id: 99902,
    slug: "mario-kart-next-gen",
    name: "Mario Kart Ultimate (Nintendo Switch 2)",
    background_image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    released: "2025-09-20",
    platforms: [{ platform: { id: 7, name: "Nintendo Switch 2" } }],
    genres: [{ id: 1, name: "Carreras" }, { id: 2, name: "Multijugador" }],
    description_raw: "La nueva generación de carreras con pistas dinámicas, trazado de rayos y hasta 24 jugadores simultáneos en línea.",
    metacritic: 96
  },
  {
    id: 99903,
    slug: "pokemon-legends-z-a-switch-2",
    name: "Pokémon Legends: Z-A (Switch 2 Enhanced)",
    background_image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    released: "2025-11-10",
    platforms: [{ platform: { id: 7, name: "Nintendo Switch 2" } }],
    genres: [{ id: 5, name: "RPG" }, { id: 3, name: "Aventura" }],
    description_raw: "Regresa a Ciudad Luminalia en una aventura Pokémon totalmente rediseñada con efectos visuales de alta definición y mundo abierto sin tiempos de carga.",
    metacritic: 92
  },
  {
    id: 99904,
    slug: "zelda-breath-of-the-wild-deluxe-switch-2",
    name: "The Legend of Zelda: Deluxe 4K Edition",
    background_image: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    rating: 5.0,
    released: "2025-05-01",
    platforms: [{ platform: { id: 7, name: "Nintendo Switch 2" } }],
    genres: [{ id: 3, name: "Aventura" }, { id: 4, name: "Acción" }],
    description_raw: "La obra maestra definitiva ahora con texturas en 4K, HDR, audio espacial 3D y tiempos de carga instantáneos en Nintendo Switch 2.",
    metacritic: 98
  },
  {
    id: 99905,
    slug: "donkey-kong-bananza-switch-2",
    name: "Donkey Kong 3D Bananza (Switch 2)",
    background_image: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    released: "2025-08-14",
    platforms: [{ platform: { id: 7, name: "Nintendo Switch 2" } }],
    genres: [{ id: 83, name: "Plataformas" }, { id: 4, name: "Acción" }],
    description_raw: "Una nueva aventura de plataformas 3D completa de Donkey Kong y Diddy Kong con física hiperrealista y multijugador cooperativo.",
    metacritic: 91
  },
  {
    id: 99906,
    slug: "super-smash-bros-complete-switch-2",
    name: "Super Smash Bros. Universe (Switch 2)",
    background_image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    released: "2025-12-05",
    platforms: [{ platform: { id: 7, name: "Nintendo Switch 2" } }],
    genres: [{ id: 6, name: "Lucha" }, { id: 2, name: "Multijugador" }],
    description_raw: "La entrega más colosal de Smash con todos los luchadores históricos y nuevos contendientes de nueva generación a 120 FPS.",
    metacritic: 95
  }
];

const popularSearches = [
  { query: "Luigi's Mansion 3", matches: (name: string) => name.includes("luigi") && name.includes("mansion") },
  { query: "Mario Kart 8 Deluxe", matches: (name: string) => name.includes("mario kart") },
  { query: "Pokémon Scarlet", matches: (name: string) => name.includes("pokemon") && name.includes("scarlet") },
  { query: "Pokémon Legends Arceus", matches: (name: string) => name.includes("pokemon") && name.includes("arceus") },
  { query: "Super Smash Bros Ultimate", matches: (name: string) => name.includes("smash") && name.includes("ultimate") },
];

function CatalogoContent() {
  const router = useRouter();
  const [consoleTab, setConsoleTab] = useState<'all' | 'switch1' | 'switch2'>('all');
  const [genreFilter, setGenreFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [games, setGames] = useState<Game[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [gamesError, setGamesError] = useState("");

  const { savedGames, toggleSaveGame, isGameSaved } = useAuth();

  // Modals
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; game: Game | null; isLoading: boolean }>({
    isOpen: false,
    game: null,
    isLoading: false,
  });

  // Load initial games
  const loadGames = async (pageNum = 1, isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);
    setGamesError("");

    try {
      let fetched: Game[] = [];
      if (searchQuery.trim()) {
        fetched = await searchGames(searchQuery.trim(), pageNum, 12, { throwOnError: true });
      } else if (genreFilter === 'mario') {
        fetched = await searchGames('Mario', pageNum, 12, { throwOnError: true });
      } else if (genreFilter === 'zelda') {
        fetched = await searchGames('Zelda', pageNum, 12, { throwOnError: true });
      } else if (genreFilter === 'pokemon') {
        fetched = await searchGames('Pokemon', pageNum, 12, { throwOnError: true });
      } else if (genreFilter === 'estrenos') {
        fetched = await getNewReleases(pageNum, 12, { throwOnError: true });
      } else {
        const [popular, ...franchiseResults] = await Promise.all([
          getPopularGames(pageNum, 12, { throwOnError: true }),
          ...(pageNum === 1 ? popularSearches.map(({ query }) => searchGames(query, 1, 4)) : []),
        ]);
        if (pageNum === 1) {
          const featured = franchiseResults.map((matches, index) => {
            const matcher = popularSearches[index].matches;
            return matches.find((game) => matcher(game.name.toLowerCase())) ?? matches[0];
          }).filter((game): game is Game => Boolean(game));
          const seen = new Set<number>();
          fetched = [...featured, ...popular].filter((game) => {
            if (seen.has(game.id)) return false;
            seen.add(game.id);
            return true;
          }).slice(0, 12);
        } else {
          fetched = popular;
        }
      }

      if (pageNum === 1) setGames(fetched);
      else setGames((prev) => [...prev, ...fetched]);

      setHasMore(fetched.length === 12);
    } catch (error) {
      const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : undefined;
      setGamesError(status && status >= 500
        ? "El catálogo no está disponible temporalmente. Intenta de nuevo."
        : "No se pudo cargar el catálogo. Revisa tu conexión e intenta de nuevo.");
      if (pageNum === 1) setGames([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadGames(1, true);
  }, [genreFilter, searchQuery]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadGames(nextPage, false);
  };

  const handleOpenDetailModal = async (game: Game) => {
    setDetailModal({ isOpen: true, game, isLoading: true });
    if (isDemoGameId(game.id)) {
      // Local mock for switch 2
      setDetailModal({ isOpen: true, game, isLoading: false });
      return;
    }
    const fullDetails = await getGameDetails(game.id);
    if (fullDetails) {
      setDetailModal({ isOpen: true, game: fullDetails, isLoading: false });
    } else {
      setDetailModal({ isOpen: true, game, isLoading: false });
    }
  };

  const displayedGames = (() => {
    if (consoleTab === 'switch2') {
      return searchQuery.trim()
        ? switch2Games.filter((game) => game.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : switch2Games;
    }
    if (consoleTab === 'switch1') return games;
    return games;
  })();

  return (
    <main id="main-content" className="min-h-screen bg-[#111311] text-zinc-100 font-sans pt-24 md:pt-28 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-16">
      {/* Background shape grid */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <ShapeGrid 
          speed={0.3}
          squareSize={45}
          direction="diagonal"
          borderColor="#2a2a2a"
          shape="square"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="bg-zinc-900 border-2 border-zinc-800 text-zinc-300 hover:text-[#ffd90f] hover:border-[#ffd90f] rounded-full px-5 py-2 font-bold inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>

            <Link 
              href="/guardados" 
              className="bg-zinc-900 border-2 border-zinc-800 text-zinc-300 hover:text-[#ff7a93] hover:border-[#ff7a93] rounded-full px-5 py-2 font-bold inline-flex items-center gap-2 transition-all text-sm"
            >
              <Heart className="w-4 h-4 text-[#ff7a93] fill-[#ff7a93]" />
              Guardados ({savedGames.length})
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-800">
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                Catálogo de Juegos
              </h1>
              <p className="text-zinc-400 mt-2 font-medium text-sm md:text-base max-w-2xl">
                Explora la biblioteca más completa de títulos para <strong className="text-white">Nintendo Switch 1</strong> y los próximos estrenos para <strong className="text-[#ffd90f]">Nintendo Switch 2</strong>.
              </p>
            </div>

            {/* Console Switch Tabs */}
            <div className="flex bg-zinc-900 p-1.5 rounded-2xl border-2 border-zinc-800 self-start md:self-auto shrink-0 shadow-lg">
              <button
                onClick={() => setConsoleTab('all')}
                className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  consoleTab === 'all'
                    ? 'bg-[#ffd90f] text-zinc-900 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setConsoleTab('switch1')}
                className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  consoleTab === 'switch1'
                    ? 'bg-[#e60012] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Switch 1
              </button>
              <button
                onClick={() => setConsoleTab('switch2')}
                className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  consoleTab === 'switch2'
                    ? 'bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Switch 2
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center mb-8">
          {/* Genre & Tag Chips */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {[
              { id: 'todos', label: 'Populares' },
              { id: 'estrenos', label: 'Nuevos Estrenos' },
              { id: 'mario', label: 'Super Mario' },
              { id: 'zelda', label: 'The Legend of Zelda' },
              { id: 'pokemon', label: 'Pokémon' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setGenreFilter(cat.id);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
                  genreFilter === cat.id && !searchQuery
                    ? 'bg-[#ffd90f] text-zinc-900 border-[#ffd90f] shadow-[0_2px_10px_rgba(255,217,15,0.3)]'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Inline Search Bar */}
          <div className="relative min-w-70 lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ffd90f]" />
            <input 
              aria-label="Filtrar catálogo por título"
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="catalog-search w-full pl-10 pr-12 py-2.5 bg-zinc-900 border-2 border-zinc-800 rounded-full text-sm font-medium text-white focus-visible:border-[#ffd90f] focus-visible:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                type="button"
                aria-label="Limpiar filtro"
                className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-zinc-400 hover:text-white focus-visible:outline-2 focus-visible:outline-[#ffd90f]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Console 2 Banner Announcement */}
        {consoleTab === 'switch2' && (
          <div className="mb-8 p-6 bg-linear-to-r from-blue-900/40 via-cyan-900/30 to-zinc-900 rounded-3xl border-2 border-cyan-500/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shrink-0">
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Línea de Títulos Nintendo Switch 2 (Próxima Generación)</h3>
                <p className="text-sm text-cyan-200/80 mt-1">
                  Estos títulos son datos de demostración; no representan inventario ni se pueden comprar.
                </p>
              </div>
            </div>
            <span className="bg-cyan-400 text-zinc-950 font-black px-4 py-2 rounded-full text-xs uppercase tracking-widest shrink-0">
              Próximos Estrenos 2025
            </span>
          </div>
        )}

        {/* Games Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-zinc-400">
            <Loader2 className="w-12 h-12 text-[#ffd90f] animate-spin mb-4" />
            <p className="font-bold text-lg text-white">Cargando catálogo de Nintendo Switch...</p>
          </div>
        ) : gamesError ? (
          <div role="alert" className="flex flex-col items-center justify-center rounded-3xl border border-amber-500/40 bg-zinc-900/50 p-8 text-center">
            <p className="mb-5 text-zinc-200">{gamesError}</p>
            <Button onClick={() => loadGames(1, true)} className="bg-[#ffd90f] font-bold text-zinc-900 hover:bg-[#e5c30d]">Reintentar</Button>
          </div>
        ) : displayedGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/50 rounded-3xl border-2 border-zinc-800 p-8">
            <Gamepad2 className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">No se encontraron videojuegos</h3>
            <p className="text-zinc-400 max-w-md text-sm mb-6">
              Prueba con otro término de búsqueda o selecciona otra categoría.
            </p>
            <Button 
              onClick={() => { setSearchQuery(''); setGenreFilter('todos'); setConsoleTab('all'); }}
              className="bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 font-bold rounded-full px-6"
            >
              Restablecer Filtros
            </Button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {displayedGames.map((game) => {
                const saved = isGameSaved(game.id);
                const isDemo = isDemoGameId(game.id);
                const isSwitch2 = isDemo || game.name.includes('Switch 2');
                
                return (
                  <GameCard
                    key={game.id}
                    game={game}
                    saved={saved}
                    onToggleSave={toggleSaveGame}
                    onView={handleOpenDetailModal}
                    onBuy={(selectedGame) => router.push(`/comprar/${selectedGame.id}`)}
                    isSwitch2={isSwitch2}
                    isDemo={isDemo}
                    buyLabel="Comprar"
                  />
                );
              })}
            </div>

            {/* Load More Button */}
            {consoleTab !== 'switch2' && hasMore && (
              <div className="mt-14 flex justify-center">
                <Button 
                  onClick={handleLoadMore} 
                  disabled={isLoadingMore}
                  size="lg" 
                  className="bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-zinc-700 hover:border-[#ffd90f] rounded-full font-black px-10 py-6 text-base transition-all flex items-center gap-2 shadow-lg"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#ffd90f]" />
                      <span>Cargando más juegos...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5 text-[#ffd90f]" />
                      <span>Cargar más videojuegos</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* GAME DETAIL MODAL */}
      {detailModal.isOpen && detailModal.game && (
        <AccessibleDialog open={detailModal.isOpen} title={detailModal.game.name} description={`Detalles del juego ${detailModal.game.name}`} onClose={() => setDetailModal({ isOpen: false, game: null, isLoading: false })}>
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button 
              onClick={() => setDetailModal({ isOpen: false, game: null, isLoading: false })}
              aria-label="Cerrar detalles del juego"
              className="absolute top-4 right-4 size-11 text-zinc-400 hover:text-white bg-zinc-800 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            {detailModal.isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                <Loader2 className="w-10 h-10 animate-spin text-[#ffd90f] mb-3" />
                <p>Cargando información del juego...</p>
              </div>
            ) : (
              <div>
                <div className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden mb-6 bg-zinc-800">
                  <img 
                    src={detailModal.game.background_image || '/1.png'} 
                    alt={detailModal.game.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-md">
                      {detailModal.game.name}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-[#ffd90f] text-zinc-900 font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" /> {detailModal.game.rating ? Number(detailModal.game.rating).toFixed(1) : "4.8"} / 5
                  </span>
                  {detailModal.game.released && (
                    <span className="bg-zinc-800 text-zinc-300 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#ffd90f]" /> Estreno: {detailModal.game.released}
                    </span>
                  )}
                  {detailModal.game.genres?.map(g => (
                    <span key={g.id} className="bg-zinc-800 text-zinc-300 font-medium px-3 py-1 rounded-full text-xs">
                      {g.name}
                    </span>
                  ))}
                  {detailModal.game.metacritic && (
                    <span className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-full text-xs">
                      Metacritic: {detailModal.game.metacritic}/100
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Descripción</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed max-h-48 overflow-y-auto pr-2">
                    {detailModal.game.description_raw || "Sumérgete en esta aventura épica diseñada para Nintendo Switch con gráficos optimizados, controles fluidos y horas de entretenimiento garantizado."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800">
                  <Button
                    onClick={() => {
                      toggleSaveGame(detailModal.game!);
                    }}
                    variant="outline"
                    className={`flex-1 py-5 rounded-xl font-bold text-sm ${
                      isGameSaved(detailModal.game.id)
                        ? "bg-[#ffd90f] text-zinc-900 border-[#ffd90f]"
                        : "bg-zinc-800 text-white border-zinc-700"
                    }`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isGameSaved(detailModal.game.id) ? "fill-zinc-900" : ""}`} />
                    {isGameSaved(detailModal.game.id) ? "Guardado en Favoritos" : "Guardar en Favoritos"}
                  </Button>
                  {!isDemoGameId(detailModal.game.id) && <Button
                    onClick={() => {
                      if (detailModal.game) router.push(`/comprar/${detailModal.game.id}`);
                    }}
                    className="flex-1 py-5 bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 font-black rounded-xl text-sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Comprar Ahora
                  </Button>}
                </div>
              </div>
            )}
          </div>
        </AccessibleDialog>
      )}

    </main>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111311] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#ffd90f] animate-spin" />
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}

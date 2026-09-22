"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShapeGrid } from "@/components/ShapeGrid";
import { 
  Gamepad2, 
  Search, 
  Heart, 
  Eye, 
  ShoppingCart, 
  Star, 
  Calendar, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Flame, 
  ChevronDown, 
  X, 
  CreditCard, 
  Landmark, 
  Send,
  Zap,
  Filter
} from "lucide-react";
import { getPopularGames, getNewReleases, searchGames, getGameDetails, Game } from "@/lib/rawg";
import { useAuth } from "@/lib/AuthContext";

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

  const { savedGames, toggleSaveGame, isGameSaved } = useAuth();

  // Modals
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; game: Game | null; isLoading: boolean }>({
    isOpen: false,
    game: null,
    isLoading: false,
  });

  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    game: Game | null;
    step: 'method' | 'paypal' | 'transferencia';
  }>({
    isOpen: false,
    game: null,
    step: 'method',
  });

  // Load initial games
  const loadGames = async (pageNum = 1, isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    let fetched: Game[] = [];
    if (searchQuery.trim()) {
      fetched = await searchGames(searchQuery.trim(), pageNum, 12);
    } else if (genreFilter === 'mario') {
      fetched = await searchGames('Mario', pageNum, 12);
    } else if (genreFilter === 'zelda') {
      fetched = await searchGames('Zelda', pageNum, 12);
    } else if (genreFilter === 'pokemon') {
      fetched = await searchGames('Pokemon', pageNum, 12);
    } else if (genreFilter === 'estrenos') {
      fetched = await getNewReleases(pageNum, 12);
    } else {
      fetched = await getPopularGames(pageNum, 12);
    }

    if (pageNum === 1) {
      setGames(fetched);
    } else {
      setGames(prev => [...prev, ...fetched]);
    }

    if (fetched.length < 12) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }

    setIsLoading(false);
    setIsLoadingMore(false);
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
    if (game.id >= 99900) {
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

  const handleWhatsAppRedirect = (gameName: string) => {
    const message = `Hola Pikagames, deseo comprar el videojuego "${gameName}" para Nintendo Switch. ¿Tienen disponibilidad y entrega inmediata?`;
    const whatsappUrl = `https://wa.me/528136975487?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Filter display based on consoleTab
  const displayedGames = (() => {
    if (consoleTab === 'switch2') {
      if (searchQuery.trim()) {
        return switch2Games.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return switch2Games;
    }
    if (consoleTab === 'switch1') {
      return games;
    }
    // 'all' -> Combine Switch 2 featured on top or alongside Switch 1 games
    if (page === 1 && !searchQuery.trim() && genreFilter === 'todos') {
      return [...switch2Games.slice(0, 2), ...games];
    }
    return games;
  })();

  return (
    <div className="min-h-screen bg-[#111311] text-zinc-100 font-sans pt-24 md:pt-28 pb-24 md:pb-16">
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ffd90f]/10 border border-[#ffd90f]/30 text-[#ffd90f] font-black text-xs uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Catálogo Oficial Nintendo
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                <Gamepad2 className="w-9 h-9 md:w-12 md:h-12 text-[#ffd90f]" />
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
                Todos (1 y 2)
              </button>
              <button
                onClick={() => setConsoleTab('switch1')}
                className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  consoleTab === 'switch1'
                    ? 'bg-[#e60012] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Switch 1
              </button>
              <button
                onClick={() => setConsoleTab('switch2')}
                className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  consoleTab === 'switch2'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Switch 2 (Next-Gen)
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center mb-8">
          {/* Genre & Tag Chips */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {[
              { id: 'todos', label: '🔥 Todos los Populares' },
              { id: 'estrenos', label: '✨ Nuevos Estrenos' },
              { id: 'mario', label: '🍄 Super Mario' },
              { id: 'zelda', label: '🗡️ The Legend of Zelda' },
              { id: 'pokemon', label: '⚡ Pokémon' },
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
          <div className="relative min-w-[280px] lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ffd90f]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nombre..." 
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border-2 border-zinc-800 rounded-full text-sm font-medium focus:outline-none focus:border-[#ffd90f] transition-all text-white placeholder-zinc-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Console 2 Banner Announcement */}
        {consoleTab === 'switch2' && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-zinc-900 rounded-3xl border-2 border-cyan-500/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shrink-0">
                <Zap className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Línea de Títulos Nintendo Switch 2 (Próxima Generación)</h3>
                <p className="text-sm text-cyan-200/80 mt-1">
                  Reserva con anticipación los títulos optimizados con gráficos 4K, 60 FPS y trazado de rayos.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedGames.map((game) => {
                const saved = isGameSaved(game.id);
                const isSwitch2 = game.id >= 99900 || game.name.includes('Switch 2');
                
                return (
                  <div 
                    key={game.id} 
                    className={`bg-zinc-900 rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden group relative shadow-lg ${
                      isSwitch2 
                        ? 'border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_8px_30px_rgba(6,182,212,0.25)]' 
                        : 'border-zinc-800 hover:border-[#ffd90f] hover:shadow-[0_8px_30px_rgba(255,217,15,0.15)]'
                    }`}
                  >
                    {/* Image Area */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-800">
                      {game.background_image ? (
                        <img 
                          src={game.background_image} 
                          alt={game.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Gamepad2 size={40} />
                        </div>
                      )}

                      {/* Console Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        {isSwitch2 ? (
                          <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black px-2.5 py-1 rounded-md text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-current" /> Switch 2
                          </span>
                        ) : (
                          <span className="bg-[#e60012] text-white font-black px-2 py-0.5 rounded-md text-[10px] tracking-wider uppercase shadow-md">
                            Switch 1
                          </span>
                        )}
                        
                        <span className="bg-zinc-900/90 text-[#ffd90f] font-bold px-2 py-0.5 rounded-md text-[11px] shadow-md border border-zinc-700 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> {game.rating ? Number(game.rating).toFixed(1) : "4.8"}
                        </span>
                      </div>

                      {/* Bookmark button */}
                      <button
                        onClick={() => toggleSaveGame(game)}
                        className={`absolute top-2 right-2 p-2 rounded-xl border-2 transition-all duration-200 shadow-md ${
                          saved 
                            ? 'bg-[#ffd90f] text-zinc-900 border-[#ffd90f]' 
                            : 'bg-zinc-900/80 text-white border-zinc-700 hover:bg-[#ffd90f] hover:text-zinc-900'
                        }`}
                        title={saved ? "Quitar de guardados" : "Guardar en favoritos"}
                      >
                        <Heart className={`w-4 h-4 ${saved ? 'fill-zinc-900' : ''}`} />
                      </button>

                      {/* Release date tag */}
                      {game.released && (
                        <div className="absolute bottom-2 left-2 bg-zinc-900/90 backdrop-blur-md text-zinc-300 font-medium px-2 py-0.5 rounded text-[10px] border border-zinc-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#ffd90f]" />
                          <span>{game.released}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-grow bg-zinc-900">
                      <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                        {game.genres?.[0]?.name || 'Nintendo Switch'}
                      </span>
                      
                      <h3 className="text-base font-black text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#ffd90f] transition-colors">
                        {game.name}
                      </h3>
                      
                      <div className="mt-auto pt-2 flex flex-col gap-2">
                        <Button 
                          onClick={() => handleOpenDetailModal(game)}
                          variant="outline"
                          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-4 h-4 text-[#ffd90f]" />
                          Ver Videojuego
                        </Button>

                        <Button 
                          onClick={() => router.push(`/comprar/${game.id}`)}
                          className={`w-full font-black uppercase text-xs tracking-wide shadow-sm flex items-center justify-center gap-1.5 ${
                            isSwitch2
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                              : 'bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {isSwitch2 ? 'Reservar Switch 2' : 'Comprar'}
                        </Button>
                      </div>
                    </div>
                  </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button 
              onClick={() => setDetailModal({ isOpen: false, game: null, isLoading: false })}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 p-2 rounded-full"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
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
                  <Button 
                    onClick={() => router.push(`/comprar/${detailModal.game.id}`)}
                    className="flex-1 py-5 bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 font-black rounded-xl text-sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Comprar Ahora
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PURCHASE MODAL */}
      {purchaseModal.isOpen && purchaseModal.game && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative">
            <button 
              onClick={() => setPurchaseModal({ isOpen: false, game: null, step: 'method' })}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <img 
                src={purchaseModal.game.background_image || '/1.png'} 
                alt={purchaseModal.game.name} 
                className="w-16 h-16 rounded-xl object-cover border border-zinc-700"
              />
              <div>
                <span className="text-[#ffd90f] text-xs font-bold uppercase tracking-wider">Finalizar Pedido</span>
                <h3 className="text-lg font-black text-white leading-tight">{purchaseModal.game.name}</h3>
                <span className="text-xl font-black text-white">$1,299 MXN</span>
              </div>
            </div>

            {purchaseModal.step === 'method' && (
              <div className="flex flex-col gap-3">
                <p className="text-zinc-400 text-sm mb-2">Selecciona tu método de pago preferido:</p>
                
                <button 
                  onClick={() => setPurchaseModal(prev => ({ ...prev, step: 'transferencia' }))}
                  className="w-full flex items-center justify-between p-4 bg-zinc-800/80 hover:bg-zinc-800 rounded-2xl border border-zinc-700 hover:border-[#ffd90f] transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-zinc-700 group-hover:bg-[#ffd90f] rounded-xl transition-colors">
                      <Landmark className="w-5 h-5 text-white group-hover:text-zinc-900" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Transferencia SPEI / OXXO</h4>
                      <p className="text-xs text-zinc-400">Sin comisiones adicionales</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setPurchaseModal(prev => ({ ...prev, step: 'paypal' }))}
                  className="w-full flex items-center justify-between p-4 bg-zinc-800/80 hover:bg-zinc-800 rounded-2xl border border-zinc-700 hover:border-[#ffd90f] transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-zinc-700 group-hover:bg-[#ffd90f] rounded-xl transition-colors">
                      <CreditCard className="w-5 h-5 text-white group-hover:text-zinc-900" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">PayPal / Tarjeta de Débito o Crédito</h4>
                      <p className="text-xs text-zinc-400">Pago seguro con protección al comprador</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => handleWhatsAppRedirect(purchaseModal.game!.name)}
                  className="w-full flex items-center justify-between p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-2xl border border-[#25D366]/30 transition-all text-left mt-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#25D366] rounded-xl text-white">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Comprar por WhatsApp</h4>
                      <p className="text-xs text-[#25D366]">Atención inmediata con un asesor</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {purchaseModal.step === 'transferencia' && (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800/80 rounded-2xl border border-zinc-700 space-y-2">
                  <h4 className="font-bold text-sm text-[#ffd90f]">Datos Bancarios para Transferencia (SPEI)</h4>
                  <div className="text-xs text-zinc-300 space-y-1">
                    <p><span className="text-zinc-400">Banco:</span> BBVA Bancomer</p>
                    <p><span className="text-zinc-400">CLABE:</span> <span className="font-mono text-white bg-zinc-900 px-2 py-0.5 rounded">012580015987463210</span></p>
                    <p><span className="text-zinc-400">Beneficiario:</span> PIKAGAMES STORE S.A. DE C.V.</p>
                    <p><span className="text-zinc-400">Concepto:</span> {purchaseModal.game.name.slice(0, 20)}</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400">
                  Una vez realizada la transferencia, presiona el botón de abajo para enviar tu comprobante vía WhatsApp y recibir tu juego.
                </p>

                <Button 
                  onClick={() => handleWhatsAppRedirect(purchaseModal.game!.name)}
                  className="w-full py-5 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar Comprobante por WhatsApp
                </Button>
              </div>
            )}

            {purchaseModal.step === 'paypal' && (
              <div className="space-y-4 text-center py-4">
                <p className="text-sm text-zinc-300">
                  Haz clic en el siguiente botón para continuar el pago de <span className="text-[#ffd90f] font-bold">$1,299 MXN</span> de forma segura mediante PayPal:
                </p>
                <Button 
                  onClick={() => window.open(`https://paypal.me/pikagames/${1299}`, '_blank')}
                  className="w-full py-6 bg-[#0070ba] hover:bg-[#005ea6] text-white font-black text-base rounded-xl"
                >
                  Pagar con PayPal
                </Button>
                <p className="text-xs text-zinc-500">
                  Al completar el pago, tu código o envío físico será despachado de inmediato a tu correo registrado.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
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

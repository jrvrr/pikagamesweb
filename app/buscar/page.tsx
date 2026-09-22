"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  Loader2, 
  Heart, 
  Eye, 
  ShoppingCart, 
  Star, 
  Calendar, 
  Gamepad2, 
  X, 
  CreditCard, 
  Landmark, 
  Send 
} from "lucide-react";
import { ShapeGrid } from "@/components/ShapeGrid";
import { Button } from "@/components/ui/button";
import { searchGames, getGameDetails, Game } from "@/lib/rawg";
import { useAuth } from "@/lib/AuthContext";

const popularSearches = [
  "Mario", "Zelda", "Pokemon", "Smash Bros", "Animal Crossing", "Metroid", "Kirby", "Luigi", "Donkey Kong", "Fire Emblem"
];

function BuscarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { isGameSaved, toggleSaveGame } = useAuth();

  // Detail Modal State
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    game: Game | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    game: null,
    isLoading: false,
  });

  // Purchase Modal State
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    game: Game | null;
    step: 'method' | 'paypal' | 'transferencia';
  }>({
    isOpen: false,
    game: null,
    step: 'method',
  });

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentSearches");
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Perform search
  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    saveRecentSearch(searchTerm);

    const data = await searchGames(searchTerm.trim(), 1, 20);
    setResults(data);
    setIsLoading(false);
  };

  // Trigger search on mount if initialQuery is set
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSearch = (term: string) => {
    setQuery(term);
    router.replace(`/buscar?q=${encodeURIComponent(term)}`);
    performSearch(term);
  };

  const handleOpenDetailModal = async (game: Game) => {
    setDetailModal({ isOpen: true, game, isLoading: true });
    const fullDetails = await getGameDetails(game.id);
    if (fullDetails) {
      setDetailModal({ isOpen: true, game: fullDetails, isLoading: false });
    } else {
      setDetailModal({ isOpen: true, game, isLoading: false });
    }
  };

  const handleWhatsAppRedirect = (gameName: string) => {
    const message = `Hola Pikagames, me interesa comprar el juego "${gameName}". ¿Tienen disponibilidad y entrega inmediata?`;
    const whatsappUrl = `https://wa.me/528136975487?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#111311] text-zinc-100 font-sans pt-24 md:pt-28 pb-24 md:pb-12">
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

      <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-8">
        {/* Header / Search Input */}
        <div className="flex flex-col gap-6">
          <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-[#ffd90f] transition-colors font-bold w-fit">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al inicio
          </Link>

          <div className="relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-[#ffd90f]" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué videojuego estás buscando? (ej. Mario Kart, Zelda...)" 
              className="w-full pl-18 md:pl-20 pr-12 py-5 md:py-6 bg-zinc-900 border-2 border-zinc-800 rounded-3xl text-lg md:text-xl font-bold focus:outline-none focus:border-[#ffd90f] focus:ring-4 focus:ring-[#ffd90f]/20 transition-all text-white placeholder-zinc-500 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              autoFocus
            />
            {query && (
              <button 
                onClick={() => { setQuery(""); setResults([]); setHasSearched(false); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Chips if no query or along with results */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 mr-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#ffd90f]" /> Tendencias:
          </span>
          {popularSearches.map((item, idx) => (
            <button 
              key={idx} 
              onClick={() => handleSelectSearch(item)} 
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                query.toLowerCase() === item.toLowerCase()
                  ? "bg-[#ffd90f] text-zinc-900 border-[#ffd90f] shadow-sm"
                  : "bg-zinc-900 hover:bg-zinc-800 hover:border-[#ffd90f] text-zinc-300 border-zinc-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Content based on state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-12 h-12 text-[#ffd90f] animate-spin mb-4" />
            <h2 className="text-xl font-black text-white">Buscando "{query}"...</h2>
            <p className="text-zinc-400 text-sm mt-1">Explorando el catálogo de Nintendo Switch</p>
          </div>
        ) : hasSearched ? (
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <h2 className="text-xl md:text-2xl font-black text-white">
                Resultados para <span className="text-[#ffd90f]">"{query}"</span>
              </h2>
              <span className="bg-zinc-900 px-3 py-1 rounded-full text-xs font-bold text-zinc-400 border border-zinc-800">
                {results.length} {results.length === 1 ? "juego encontrado" : "juegos encontrados"}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/50 rounded-3xl border border-zinc-800 p-8">
                <Search className="w-16 h-16 text-zinc-700 mb-4" />
                <h3 className="text-2xl font-black text-white mb-2">No se encontraron títulos</h3>
                <p className="text-zinc-400 max-w-md text-sm mb-6">
                  No encontramos videojuegos que coincidan con tu búsqueda. Intenta con palabras clave como Mario, Zelda o Pokémon.
                </p>
                <button 
                  onClick={() => handleSelectSearch("Mario")}
                  className="bg-[#ffd90f] text-zinc-900 font-black px-6 py-2.5 rounded-full hover:bg-[#e5c30d] transition-all"
                >
                  Ver juegos de Mario
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {results.map((game) => {
                  const saved = isGameSaved(game.id);
                  return (
                    <div 
                      key={game.id} 
                      className="bg-zinc-900 rounded-2xl border-2 border-zinc-800 hover:border-[#ffd90f] transition-all flex flex-col overflow-hidden group shadow-lg"
                    >
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
                        
                        {/* Rating */}
                        <div className="absolute top-2 left-2 bg-zinc-900/90 text-[#ffd90f] font-bold px-2 py-1 rounded-md text-xs shadow-md border border-zinc-700 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> {game.rating ? game.rating.toFixed(1) : "4.8"}
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

                      <div className="p-4 flex flex-col flex-grow">
                        <span className="text-[#ffd90f] text-[11px] font-bold uppercase tracking-wider mb-1">
                          Nintendo Switch
                        </span>
                        <h3 className="text-white font-bold text-base mb-3 line-clamp-2 leading-tight group-hover:text-[#ffd90f] transition-colors">
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
                            className="w-full bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 font-black uppercase text-xs tracking-wide shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Comprar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Empty search initial view */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
            {recentSearches.length > 0 && (
              <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800">
                <h3 className="text-zinc-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#ffd90f]" /> Búsquedas Recientes
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {recentSearches.map((item, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleSelectSearch(item)} 
                      className="bg-zinc-800 hover:bg-zinc-700 hover:text-[#ffd90f] px-4 py-2 rounded-full text-sm font-medium transition-colors border border-zinc-700 text-left"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 ${recentSearches.length === 0 ? "md:col-span-2" : ""}`}>
              <h3 className="text-zinc-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#ffd90f]" /> Sugerencias Populares
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {popularSearches.map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleSelectSearch(item)} 
                    className="bg-zinc-800 hover:bg-zinc-700 hover:text-[#ffd90f] px-4 py-2 rounded-full text-sm font-medium transition-colors border border-zinc-700 text-left"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
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
                    src={detailModal.game.background_image} 
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
                    <Star className="w-3.5 h-3.5 fill-current" /> {detailModal.game.rating ? detailModal.game.rating.toFixed(1) : "4.8"} / 5
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

export default function BuscarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111311] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#ffd90f] animate-spin" />
      </div>
    }>
      <BuscarContent />
    </Suspense>
  );
}

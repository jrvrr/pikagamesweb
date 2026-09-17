"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowLeft, 
  Gamepad2, 
  Star, 
  Calendar, 
  Eye, 
  X, 
  CreditCard, 
  Landmark, 
  Send,
  Loader2 
} from "lucide-react";
import { ShapeGrid } from "@/components/ShapeGrid";
import { useAuth } from "@/lib/AuthContext";
import { getGameDetails, Game } from "@/lib/rawg";

export default function GuardadosPage() {
  const { savedGames, toggleSaveGame, isFavoritesLoading } = useAuth();

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
    game: any | null;
    step: 'method' | 'paypal' | 'transferencia';
  }>({
    isOpen: false,
    game: null,
    step: 'method',
  });

  const handleOpenDetailModal = async (savedGame: any) => {
    setDetailModal({ 
      isOpen: true, 
      game: { 
        id: savedGame.id, 
        name: savedGame.name, 
        background_image: savedGame.background_image, 
        rating: savedGame.rating, 
        released: savedGame.released,
        slug: "",
        platforms: [] 
      } as Game, 
      isLoading: true 
    });
    
    const fullDetails = await getGameDetails(savedGame.id);
    if (fullDetails) {
      setDetailModal({ isOpen: true, game: fullDetails, isLoading: false });
    } else {
      setDetailModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleWhatsAppRedirect = (gameName: string) => {
    const message = `Hola Pikagames, me interesa comprar el juego "${gameName}" de mi lista de guardados. ¿Tienen entrega inmediata?`;
    const whatsappUrl = `https://wa.me/528136975487?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#111311] text-zinc-100 font-sans pt-24 pb-20 md:pb-12">
      {/* Background shape grid */}
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
            <Link 
              href="/" 
              className="bg-zinc-800 text-white border-2 border-zinc-600 hover:bg-zinc-700 hover:text-white hover:border-[#ffd90f] rounded-full px-5 py-2 md:px-6 md:py-2.5 font-bold shadow-md inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              Volver al inicio
            </Link>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-3 md:gap-4 text-white">
              <Heart className="w-8 h-8 md:w-12 md:h-12 text-[#ff7a93] fill-[#ff7a93]" />
              Tus Guardados
            </h1>
            <p className="text-zinc-400 mt-2 font-medium text-sm md:text-base">
              Los títulos que guardaste para tu Nintendo Switch, siempre disponibles.
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-zinc-900 px-5 md:px-6 py-2 md:py-3 rounded-full border-2 border-zinc-800 flex items-center gap-3">
            <span className="font-black text-lg text-[#ffd90f]">{savedGames.length}</span>
            <span className="text-zinc-400 text-xs md:text-sm font-bold uppercase tracking-widest">
              {savedGames.length === 1 ? "Juego" : "Juegos"}
            </span>
          </div>
        </div>

        {isFavoritesLoading && savedGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-12 h-12 text-[#ffd90f] animate-spin mb-4" />
            <p className="text-zinc-400 font-bold">Cargando tus títulos guardados...</p>
          </div>
        ) : savedGames.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/50 rounded-3xl border-2 border-zinc-800/50 backdrop-blur-sm p-8">
            <div className="w-28 h-28 bg-zinc-800 rounded-full flex items-center justify-center mb-6 relative">
              <Heart className="w-14 h-14 text-zinc-600" />
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#ffd90f] rounded-full flex items-center justify-center text-zinc-900 font-black text-lg">
                !
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-tight">Tu lista de guardados está vacía</h2>
            <p className="text-zinc-400 max-w-md mb-8 text-sm md:text-base font-medium">
              Aún no has guardado ningún juego. Explora nuestro catálogo y presiona el corazón en los títulos que más te gusten.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/catalogo">
                <Button size="lg" className="bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 rounded-full font-black px-8 py-6 text-base shadow-lg transition-all hover:scale-105">
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  Explorar Catálogo Switch
                </Button>
              </Link>
              <Link href="/buscar">
                <Button size="lg" variant="outline" className="border-2 border-zinc-700 hover:border-[#ffd90f] bg-zinc-800 text-white rounded-full font-bold px-8 py-6 text-base transition-all">
                  Buscar Juegos
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Populated State */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedGames.map((game) => (
              <div 
                key={game.id} 
                className="group bg-zinc-900 rounded-2xl border-2 border-zinc-800 overflow-hidden hover:border-[#ffd90f] transition-all flex flex-col relative shadow-lg"
              >
                {/* Remove button */}
                <button 
                  onClick={() => toggleSaveGame(game)}
                  className="absolute top-2 right-2 z-20 w-9 h-9 bg-zinc-900/90 hover:bg-red-500 hover:text-white text-zinc-400 rounded-xl flex items-center justify-center backdrop-blur-md transition-colors border border-zinc-700 hover:border-red-500 shadow-md"
                  title="Eliminar de guardados"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Image Container */}
                <div className="aspect-[4/3] w-full bg-zinc-800 relative flex items-center justify-center overflow-hidden">
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

                  {/* Rating Tag */}
                  <div className="absolute top-2 left-2 bg-zinc-900/90 text-[#ffd90f] font-bold px-2 py-0.5 rounded-md text-xs shadow-md border border-zinc-700 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> {game.rating ? Number(game.rating).toFixed(1) : "4.8"}
                  </div>

                  {/* Release Date */}
                  {game.released && (
                    <div className="absolute bottom-2 left-2 bg-zinc-900/90 backdrop-blur-md text-zinc-300 font-medium px-2 py-0.5 rounded text-[10px] border border-zinc-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#ffd90f]" />
                      <span>{game.released}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow bg-zinc-900">
                  <span className="text-[#ffd90f] text-[11px] font-bold uppercase tracking-wider mb-1">
                    Nintendo Switch
                  </span>
                  <h3 className="text-base font-black text-white mb-4 leading-tight group-hover:text-[#ffd90f] transition-colors line-clamp-2">
                    {game.name}
                  </h3>
                  
                  <div className="mt-auto flex flex-col gap-2">
                    <Button 
                      onClick={() => handleOpenDetailModal(game)}
                      variant="outline"
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4 text-[#ffd90f]" />
                      Ver Videojuego
                    </Button>

                    <Button 
                      onClick={() => setPurchaseModal({ isOpen: true, game, step: 'method' })}
                      className="w-full bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 font-black uppercase text-xs tracking-wide shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Comprar ($1,299)
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
                    className="flex-1 py-5 rounded-xl font-bold text-sm bg-[#ff7a93]/20 text-[#ff7a93] hover:bg-[#ff7a93]/30 border-red-500/50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Quitar de Guardados
                  </Button>
                  <Button 
                    onClick={() => {
                      const g = detailModal.game;
                      setDetailModal({ isOpen: false, game: null, isLoading: false });
                      setPurchaseModal({ isOpen: true, game: g, step: 'method' });
                    }}
                    className="flex-1 py-5 bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 font-black rounded-xl text-sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Comprar Ahora ($1,299)
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

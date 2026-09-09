"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShapeGrid } from "@/components/ShapeGrid";
import {
  MessageCircle,
  Home,
  Search,
  ShoppingCart,
  User,
  ChevronRight,
  Mail,
  Phone,
  ArrowUp,
  Heart,
  Menu,
  Gamepad2,
  Compass,
  ChevronDown,
  ShoppingBag,
  HelpCircle,
  Star,
  StarHalf,
  ChevronLeft,
  X,
  CreditCard,
  Landmark,
  Send,
  Loader2,
  Eye,
  Sparkles,
  Calendar,
  Info,
  Check,
  Flame
} from "lucide-react";
import { getPopularGames, getUpcomingGames, getNewReleases, getGameDetails, Game } from "@/lib/rawg";
import { useAuth } from "@/lib/AuthContext";

export default function HomePage() {
  const { savedGames, toggleSaveGame, isGameSaved } = useAuth();
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [isCustomerServiceOpen, setIsCustomerServiceOpen] = useState(false);
  const [customerServiceView, setCustomerServiceView] = useState<'selection' | 'comment' | 'email'>('selection');
  const [rating, setRating] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Game Catalog States
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  
  // New releases state
  const [newReleases, setNewReleases] = useState<Game[]>([]);
  const [isLoadingNewReleases, setIsLoadingNewReleases] = useState(true);

  // Catalog tab selection
  const [catalogTab, setCatalogTab] = useState<'destacados' | 'estrenos'>('destacados');

  // Purchase Modal State
  const [purchaseModal, setPurchaseModal] = useState<{isOpen: boolean; game: Game | null; step: 'method' | 'paypal' | 'transferencia'}>({
    isOpen: false,
    game: null,
    step: 'method'
  });

  // Game Detail Modal ("Ver Videojuego") State
  const [detailModal, setDetailModal] = useState<{isOpen: boolean; game: Game | null; isLoading: boolean}>({
    isOpen: false,
    game: null,
    isLoading: false
  });

  // Upcoming games state
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);

  // Load Popular Games
  useEffect(() => {
    async function loadGames() {
      const data = await getPopularGames(1, 8);
      setGames(data);
      setIsLoadingGames(false);
    }
    loadGames();
  }, []);

  // Load Upcoming Games from RAWG
  useEffect(() => {
    async function loadUpcoming() {
      const data = await getUpcomingGames(1, 8);
      setUpcomingGames(data);
      setIsLoadingUpcoming(false);
    }
    loadUpcoming();
  }, []);

  // Load New Releases from RAWG
  useEffect(() => {
    async function loadReleases() {
      const data = await getNewReleases(1, 8);
      setNewReleases(data);
      setIsLoadingNewReleases(false);
    }
    loadReleases();
  }, []);

  // Helper to open game detail modal ("Ver videojuego")
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
    const message = `Hola Pikagames, acabo de realizar una transferencia para comprar el juego "${gameName}". Aquí envío mi comprobante:`;
    const whatsappUrl = `https://wa.me/528136975487?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmitComentario = async () => {
    if (rating === 0 || mensaje.trim() === "") {
      alert("Por favor selecciona una calificación y escribe un comentario.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "Jerry Gamer", calificacion: rating, mensaje })
      });
      
      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsCustomerServiceOpen(false);
          setIsSuccess(false);
          setMensaje("");
          setRating(0);
          setTimeout(() => setCustomerServiceView('selection'), 300);
        }, 2000);
      } else {
        alert("Hubo un error al enviar tu comentario.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de red. Asegúrate de que el servidor esté corriendo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        // If reached the end, go back to start, else scroll right
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          carouselRef.current.scrollBy({ left: 512, behavior: "smooth" });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -512, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 512, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#111311] text-zinc-100 font-sans">
      {/* Hero Section */}
      <section className="relative w-full min-h-[700px] md:min-h-[800px] flex flex-col md:flex-row items-center justify-between px-6 md:px-12 pb-12 pt-32 md:pt-40 overflow-hidden border-b-4 border-zinc-900 bg-[#111311]">
        {/* Animated Background */}
        <ShapeGrid 
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#2a2a2a"
          hoverFillColor="#ffd90f"
          shape="square"
          hoverTrailAmount={0}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="relative z-10 md:w-1/2 flex flex-col items-start space-y-6"
        >
          <h1 className="text-5xl md:text-7xl font-black leading-tight uppercase tracking-tighter text-zinc-100 transition-all duration-300 hover:drop-shadow-[0_4px_12px_rgba(255,217,15,0.4)] cursor-default">
            Tu Aventura <br />
            <span className="text-zinc-900 bg-[#ffd90f] px-4 py-1 inline-block -rotate-2 my-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">Switch</span> <br /> 
            Comienza Aquí
          </h1>
          <Link href="/catalogo" passHref>
            <Button size="lg" className="bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 rounded-full font-bold px-8 text-lg shadow-[0_4px_14px_rgba(255,217,15,0.4)]">
              Explorar Catálogo
            </Button>
          </Link>
        </motion.div>

        {/* Floating Cards / Images */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5, x: 100 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
          className="relative z-10 w-full mt-12 md:mt-0 md:w-1/2 flex justify-center md:justify-end gap-6 h-64 md:h-96"
        >
            <div className="w-40 md:w-64 h-full bg-zinc-200 rounded-xl border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] -rotate-6 hover:rotate-0 hover:translate-y-[-10px] transition-all duration-300 flex items-center justify-center">
               <span className="font-bold text-zinc-400">Juego 1</span>
            </div>
            <div className="w-32 md:w-48 h-4/5 mt-12 bg-zinc-300 rounded-xl border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] rotate-6 hover:rotate-0 hover:translate-y-[-10px] transition-all duration-300 flex items-center justify-center">
               <span className="font-bold text-zinc-500">Juego 2</span>
            </div>
        </motion.div>
      </section>

      {/* Qué Buscas Section */}
      <section className="relative z-10 py-16 px-6 md:px-12 bg-white bg-dots border-b-4 border-t-4 border-zinc-900 overflow-hidden">
        <motion.h2 
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
          className="text-3xl font-black mb-10 uppercase tracking-tight text-center text-zinc-900"
        >
          ¿Qué buscas?
        </motion.h2>
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto"
        >
          {[
            { title: 'Precio', folder: '/svg/folder1.svg', cartucho: '/png/cartucho3.png' },
            { title: 'Popular', folder: '/svg/folder2.svg', cartucho: '/png/cartucho4.png' },
            { title: 'Estreno', folder: '/svg/folder3.svg', cartucho: '/png/cartucho1.png' },
            { title: 'Mario', folder: '/svg/folder4.svg', cartucho: '/png/cartucho2.png' }
          ].map((item) => (
            <motion.div 
               variants={{ hidden: { opacity: 0, y: 100, scale: 0.8 }, visible: { opacity: 1, y: 0, scale: 1 } }}
               key={item.title} 
               className="group cursor-pointer hover:-translate-y-2 transition-all flex flex-col items-center justify-center pt-8 md:pt-12 pb-4"
            >
              {/* Contenedor ajustado a la carpeta para posicionar bien el cartucho */}
              <div className="relative w-32 md:w-40 flex items-end justify-center">
                {/* Cartucho (Guardado adentro, sale al hover) */}
                <div className="absolute bottom-2 w-16 md:w-20 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-16 md:group-hover:-translate-y-20 z-10 flex flex-col items-center justify-start">
                   <img src={item.cartucho} alt={`Cartucho ${item.title}`} className="w-full h-auto relative z-10" />
                </div>

                {/* Carpeta (Frente) con el texto */}
                <div className="relative z-20 w-full group-hover:scale-[1.03] transition-transform duration-300 flex flex-col items-center justify-center">
                  <img src={item.folder} alt={`Carpeta ${item.title}`} className="w-full h-auto relative z-20 drop-shadow-md" />
                  
                  {/* Texto alineado sobre la carpeta */}
                  <span className="absolute top-[55%] md:top-[60%] w-[80%] text-center font-black text-[12px] md:text-sm uppercase tracking-tighter text-zinc-900 z-30 leading-none" style={{ transform: 'translateY(-50%)' }}>
                    {item.title}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Slanted Wrapper for Black Gap and Pink Section */}
      <div className="relative z-0 w-full skew-y-2 -mt-16 mb-[-3rem]">
        {/* Black Dotted Slanted Gap */}
        <div className="relative w-full h-24 md:h-32 bg-[#111311] bg-dots-light overflow-hidden">
        </div>

        {/* El Catálogo Definitivo Section (Slanted) */}
        <section className="relative py-32 bg-diagonal-lines border-y-4 border-[#d0144c] overflow-hidden">
          <div className="max-w-6xl mx-auto flex flex-col items-center -skew-y-2 px-6 md:px-12">
            <motion.h2 
              initial={{ opacity: 0, x: -150, y: -50, rotate: -10 }}
              whileInView={{ opacity: 1, x: 0, y: 0, rotate: -1 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
              className="text-3xl md:text-5xl font-black mb-16 text-center uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,0.4)] -rotate-1"
            >
              El catálogo definitivo para tu Nintendo Switch
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, x: 150, y: 50, scale: 0.8 }}
              whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.5 }}
              className="flex flex-col md:flex-row justify-center items-center gap-12 w-full mt-8"
            >
              <img 
                src="/1.png" 
                alt="Catálogo Switch 1" 
                className="-mt-4 md:-mt-8 h-60 md:h-80 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] hover:-translate-y-2 transition-transform duration-300"
              />
              <img 
                src="/2.avif" 
                alt="Catálogo Switch 2" 
                className="h-48 md:h-72 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] hover:-translate-y-2 transition-transform duration-300"
              />
            </motion.div>
          </div>
        </section>

        {/* Bottom Black Dotted Slanted Gap */}
        <div className="relative w-full h-24 md:h-32 bg-[#111311] bg-dots-light overflow-hidden border-b-4 border-zinc-900">
        </div>
      </div>

      {/* Próximamente Section */}
      <section className="relative z-10 py-20 px-6 md:px-12 border-t-4 border-b-4 border-zinc-900 bg-white overflow-hidden" id="proximos">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="flex flex-col items-center mb-10 text-center"
          >
            <span className="bg-[#ffd90f] text-zinc-900 font-extrabold text-xs md:text-sm uppercase tracking-widest px-4 py-1 rounded-full border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-zinc-900" /> Próximos Lanzamientos
            </span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-zinc-900">
              Próximos Estrenos
            </h2>
            <p className="text-zinc-600 font-medium text-sm md:text-base mt-2 max-w-xl">
              Anticípate a los lanzamientos más esperados de Nintendo Switch. ¡Guárdalos o resérvalos hoy mismo!
            </p>
          </motion.div>

          {isLoadingUpcoming ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#ffd90f]" />
              <p className="font-bold text-lg text-zinc-800">Cargando próximos estrenos...</p>
            </div>
          ) : (
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.1 }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08 }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 w-full"
            >
              {upcomingGames.map((game) => {
                const saved = isGameSaved(game.id);
                return (
                  <motion.div 
                    key={game.id}
                    variants={{ hidden: { opacity: 0, y: 100, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                    className="bg-zinc-900 rounded-2xl border-4 border-zinc-900 shadow-[6px_6px_0px_0px_rgba(255,217,15,1)] hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(230,0,18,1)] transition-all flex flex-col overflow-hidden group relative"
                  >
                    {/* Image & Badges */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-800">
                      {game.background_image ? (
                        <img src={game.background_image} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600"><Gamepad2 size={40} /></div>
                      )}
                      
                      {/* Release date tag */}
                      <div className="absolute bottom-2 left-2 bg-zinc-900/90 backdrop-blur-md text-[#ffd90f] font-bold px-2.5 py-1 rounded-lg text-[11px] border border-zinc-700 flex items-center gap-1 shadow-md">
                        <Calendar className="w-3 h-3 text-[#ffd90f]" />
                        <span>{game.released ? game.released : 'Próximamente'}</span>
                      </div>

                      {/* Bookmark button */}
                      <button
                        onClick={() => toggleSaveGame(game)}
                        className={`absolute top-2 right-2 p-2 rounded-xl border-2 border-zinc-900 transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          saved 
                            ? 'bg-[#ffd90f] text-zinc-900 hover:bg-[#e5c30d]' 
                            : 'bg-zinc-900/80 text-white hover:bg-[#ffd90f] hover:text-zinc-900'
                        }`}
                        title={saved ? "Quitar de guardados" : "Guardar en favoritos"}
                      >
                        <Heart className={`w-4 h-4 ${saved ? 'fill-zinc-900' : ''}`} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-white font-bold text-lg mb-3 line-clamp-2 leading-tight group-hover:text-[#ffd90f] transition-colors">
                        {game.name}
                      </h3>
                      
                      <div className="mt-auto pt-2 flex flex-col gap-2">
                        {/* Botón Ver Videojuego */}
                        <Button 
                          onClick={() => handleOpenDetailModal(game)}
                          variant="outline"
                          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-2 border-zinc-700 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-4 h-4 text-[#ffd90f]" />
                          Ver Videojuego
                        </Button>

                        {/* Botón Comprar */}
                        <Button 
                          onClick={() => setPurchaseModal({ isOpen: true, game, step: 'method' })}
                          className="w-full bg-[#ff7a93] hover:bg-[#e66a82] text-white font-bold uppercase text-xs tracking-wide border-2 border-transparent hover:border-white shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Reservar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Catálogo Section */}
      <section className="py-20 px-6 md:px-12 border-b-4 border-zinc-900 bg-white overflow-hidden" id="catalogo">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <motion.h2 
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tight text-center text-zinc-900"
          >
            Catálogo de Videojuegos
          </motion.h2>

          {/* Interactive Catalog Tabs */}
          <div className="flex flex-wrap justify-center items-center gap-3 mb-10">
            <button
              onClick={() => setCatalogTab('destacados')}
              className={`px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-wide border-2 border-zinc-900 transition-all flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 ${
                catalogTab === 'destacados'
                  ? 'bg-[#ffd90f] text-zinc-900'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-600 fill-orange-600" /> Populares
            </button>

            <button
              onClick={() => setCatalogTab('estrenos')}
              className={`px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-wide border-2 border-zinc-900 transition-all flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 ${
                catalogTab === 'estrenos'
                  ? 'bg-[#ff7a93] text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-white" /> Estrenos Recientes
            </button>

            <Link href="/guardados" passHref>
              <button className="px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-wide border-2 border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(255,217,15,1)]">
                <Heart className="w-4 h-4 text-[#ff7a93] fill-[#ff7a93]" /> 
                Guardados ({savedGames.length})
              </button>
            </Link>
          </div>

          {/* Grid Content */}
          {(catalogTab === 'destacados' ? isLoadingGames : isLoadingNewReleases) ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#ffd90f]" />
              <p className="font-bold text-lg text-zinc-800">Cargando videojuegos...</p>
            </div>
          ) : (
            <motion.div 
              key={catalogTab}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08 }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 w-full"
            >
              {(catalogTab === 'destacados' ? games : newReleases).map((game) => {
                const saved = isGameSaved(game.id);
                return (
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 50, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                    key={game.id} 
                    className="bg-zinc-900 rounded-2xl border-4 border-zinc-900 shadow-[6px_6px_0px_0px_rgba(255,217,15,1)] hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(230,0,18,1)] transition-all flex flex-col overflow-hidden group relative"
                  >
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-800">
                      {game.background_image ? (
                        <img src={game.background_image} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600"><Gamepad2 size={40} /></div>
                      )}
                      
                      {/* Rating */}
                      <div className="absolute top-2 left-2 bg-zinc-900/90 text-[#ffd90f] font-bold px-2 py-1 rounded-md text-xs shadow-md border border-zinc-700 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> {game.rating ? game.rating.toFixed(1) : "4.8"}
                      </div>

                      {/* Bookmark button */}
                      <button
                        onClick={() => toggleSaveGame(game)}
                        className={`absolute top-2 right-2 p-2 rounded-xl border-2 border-zinc-900 transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          saved 
                            ? 'bg-[#ffd90f] text-zinc-900 hover:bg-[#e5c30d]' 
                            : 'bg-zinc-900/80 text-white hover:bg-[#ffd90f] hover:text-zinc-900'
                        }`}
                        title={saved ? "Quitar de guardados" : "Guardar en favoritos"}
                      >
                        <Heart className={`w-4 h-4 ${saved ? 'fill-zinc-900' : ''}`} />
                      </button>
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-white font-bold text-lg mb-3 line-clamp-2 leading-tight group-hover:text-[#ffd90f] transition-colors">
                        {game.name}
                      </h3>
                      
                      <div className="mt-auto pt-2 flex flex-col gap-2">
                        {/* Botón Ver Videojuego */}
                        <Button 
                          onClick={() => handleOpenDetailModal(game)}
                          variant="outline"
                          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-2 border-zinc-700 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-4 h-4 text-[#ffd90f]" />
                          Ver Videojuego
                        </Button>

                        {/* Botón Comprar */}
                        <Button 
                          onClick={() => setPurchaseModal({ isOpen: true, game, step: 'method' })}
                          className="w-full bg-[#ff7a93] hover:bg-[#e66a82] text-white font-bold uppercase text-xs tracking-wide border-2 border-transparent hover:border-white shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Comprar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>


      {/* Comentarios Section */}
      <section className="py-24 px-6 md:px-12 bg-white bg-dots border-b-4 border-zinc-900 overflow-hidden relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.5, rotate: 5 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="max-w-6xl mx-auto relative z-10"
        >
          
          <div className="flex flex-col items-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-10 text-center text-zinc-900 uppercase tracking-tight">
              Comentarios
            </h2>
            
            {/* Rating Summary */}
            <div className="flex flex-col items-center mb-4">
              <h2 className="text-2xl md:text-4xl font-medium text-zinc-900 tracking-tight border-b-4 border-dotted border-[#ffd90f] pb-2 text-center inline-block">
                Lo que opinan nuestros clientes
              </h2>
              <div className="flex items-center gap-2 text-[#ffd90f] mt-5 drop-shadow-sm">
                <Star className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                <Star className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                <Star className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                <Star className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                <StarHalf className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                <span className="text-zinc-900 font-black text-2xl md:text-3xl ml-3">4.8 / 5</span>
              </div>
            </div>
          </div>

          {/* Carousel */}
          <div className="relative w-full mt-10">
            {/* Arrows */}
            <button 
              onClick={scrollLeft}
              className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white border-4 border-zinc-900 rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:bg-[#ffd90f] transition-colors hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-zinc-900" strokeWidth={3} />
            </button>

            <button 
              onClick={scrollRight}
              className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white border-4 border-zinc-900 rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:bg-[#ffd90f] transition-colors hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-6 h-6 text-zinc-900" strokeWidth={3} />
            </button>

            <div 
              ref={carouselRef}
              className="flex overflow-x-auto gap-6 md:gap-8 pb-12 pt-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 md:mx-0 md:px-4"
            >
              {[
                { bgSvg: "/svg/comentario1.svg", text: "¡El mejor lugar para encontrar mis juegos favoritos! La entrega fue súper rápida.", name: "GamerPro99", rating: 5, color: "text-zinc-900", alignment: "pb-8 md:pb-12" },
                { bgSvg: "/svg/comentario2.svg", text: "Me encanta la interfaz. Fue muy fácil encontrar lo que buscaba y el servicio es excelente.", name: "ZeldaFan", rating: 5, color: "text-white", alignment: "pt-8 md:pt-12" },
                { bgSvg: "/svg/comentario3.svg", text: "Descubrí juegos indie increíbles. Definitivamente recomendaré esta tienda a mis amigos.", name: "IndieExplorer", rating: 4, color: "text-zinc-900", alignment: "pt-8 md:pt-12" },
                { bgSvg: "/svg/comentario4.svg", text: "Compré el nuevo Mario aquí y llegó en perfectas condiciones. Precios competitivos.", name: "MarioBro", rating: 5, color: "text-zinc-900", alignment: "pb-10 md:pb-14" },
                { bgSvg: "/svg/comentario5.svg", text: "Soy cliente frecuente y siempre tienen disponibilidad en los estrenos más esperados.", name: "SwitchMaster", rating: 5, color: "text-white", alignment: "pt-8 md:pt-12" },
                { bgSvg: "/svg/comentario6.svg", text: "Tuve una duda con mi pedido y el soporte me respondió rapidísimo. Muy confiables.", name: "PikaTrainer", rating: 4, color: "text-zinc-900", alignment: "pb-10 md:pb-14" }
              ].map((comment, i) => (
                <div key={i} className={`w-[320px] h-[190px] md:w-[480px] md:h-[260px] shrink-0 snap-center relative hover:-translate-y-2 transition-transform duration-300 group flex items-center justify-center px-6 md:px-12 ${comment.alignment}`}>
                  <img src={comment.bgSvg} alt="Comentario" className="absolute inset-0 w-full h-full object-fill -z-10 drop-shadow-[8px_8px_0px_rgba(24,24,27,1)] group-hover:scale-[1.02] transition-transform duration-300" />
                  
                  <div className="flex flex-col items-center text-center max-w-[90%] relative z-10">
                    <div className={`font-black text-xl md:text-2xl mb-1 ${comment.color}`}>{comment.name}</div>
                    <div className={`flex gap-1 mb-2 md:mb-3 ${comment.color === 'text-white' ? 'text-white' : 'text-zinc-900'}`}>
                      {[...Array(5)].map((_, idx) => (
                         <Star key={idx} className={`w-4 h-4 md:w-5 md:h-5 ${idx < comment.rating ? 'fill-current' : 'fill-transparent'} stroke-current`} strokeWidth={2.5} />
                      ))}
                    </div>
                    <p className={`${comment.color} font-bold leading-tight text-[13px] md:text-base line-clamp-4`}>
                      &quot;{comment.text}&quot;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Footer */}
      <footer className="relative text-zinc-100 pt-24 pb-12 px-6 md:px-12 overflow-hidden border-t-[8px] border-white bg-zinc-900">
        
        {/* Background SVG (Diagonal Tiled) */}
        <div 
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] z-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "url('/footer/footer.svg')",
            backgroundSize: "1920px",
            backgroundRepeat: "repeat",
            transform: "rotate(-10deg)"
          }}
        />

        {/* Dark Overlay (Filtro negro) */}
        <div className="absolute inset-0 bg-[#2e2e2e]/80 z-0 pointer-events-none"></div>

        {/* Background Pattern Elements */}
        <div className="absolute inset-0 opacity-5 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center">
          
          {/* Button */}
          <div className="mb-10 sm:mb-14 md:mb-16">
            <Button 
              onClick={() => setIsCustomerServiceOpen(true)}
              size="lg" 
              className="text-sm sm:text-lg md:text-xl font-extrabold px-5 py-2.5 sm:px-8 sm:py-3.5 md:py-4 h-auto rounded-full bg-gradient-to-r from-[#ffdf91] to-[#ff7a93] text-zinc-900 border-2 border-white hover:from-[#ffcf61] hover:to-[#ff607d] transition-all shadow-[0_4px_20px_rgba(255,122,147,0.3)] hover:shadow-[0_8px_30px_rgba(255,122,147,0.6)] hover:-translate-y-1 tracking-tight flex items-center gap-2 sm:gap-3"
            >
              <span>Servicio al cliente</span>
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3] shrink-0" />
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full max-w-5xl pb-24 md:pb-0">
            
            {/* Left Column: Social Media */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left z-20 w-full md:w-1/3">
              <h3 className="text-xl font-bold mb-6 text-white tracking-wide">Sigue a Pikagames:</h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <a href="https://www.facebook.com/profile.php?id=61550079205640" className="w-12 h-12 p-2.5 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg border-[3px] border-transparent hover:border-white bg-[#1877F2] flex items-center justify-center overflow-hidden">
                  <img src="/footer/facebook.svg" alt="Facebook" className="w-full h-full object-contain filter invert" style={{ filter: 'brightness(0) invert(1)' }} />
                </a>
                <a href="https://www.tiktok.com/@pikagamesjuegos?lang=es-419" className="w-12 h-12 p-2.5 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg border-[3px] border-transparent hover:border-white bg-black flex items-center justify-center overflow-hidden">
                  <img src="/footer/tiktok.svg" alt="TikTok" className="w-full h-full object-contain filter invert" style={{ filter: 'brightness(0) invert(1)' }} />
                </a>
                <a href="https://www.youtube.com/@JuegosDigitalesPika" className="w-12 h-12 p-2 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg border-[3px] border-transparent hover:border-white bg-[#FF0000] flex items-center justify-center overflow-hidden">
                  <img src="/footer/youtube.svg" alt="YouTube" className="w-full h-full object-contain filter invert" style={{ filter: 'brightness(0) invert(1)' }} />
                </a>
                <a href="https://www.instagram.com/pika.switch" className="w-12 h-12 p-2.5 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg border-[3px] border-transparent hover:border-white bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center overflow-hidden text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>
            </div>

            {/* Middle Column: Botón Inicio */}
            <div className="flex flex-col items-center justify-start z-20 mt-12 md:mt-0 w-full md:w-1/3">
               <a 
                  href="#"
                  onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="bg-zinc-800 text-white border-2 border-zinc-600 hover:bg-zinc-700 hover:text-white hover:border-[#ff7a93] rounded-full px-8 py-3 font-bold shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center gap-2 transition-all hover:-translate-y-1" 
               >
                  <Home className="w-5 h-5" />
                  Inicio
               </a>
            </div>

            {/* Right Column: Contact Info */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right z-20 mt-12 md:mt-0 w-full md:w-1/3">
              <div className="flex flex-col space-y-4 w-full">
                <div className="flex items-center justify-center md:justify-end gap-3 text-zinc-300 hover:text-white transition-colors">
                  <a href="https://wa.me/528136975487" target="_blank" rel="noreferrer" className="font-medium text-lg">81 3697 5487</a>
                  <MessageCircle className="w-5 h-5 text-[#ff7a93]" />
                </div>
                <div className="flex items-center justify-center md:justify-end gap-3 text-zinc-300 hover:text-white transition-colors">
                  <a href="mailto:pikagamestore@gmail.com" className="font-medium">pikagamestore@gmail.com</a>
                  <Mail className="w-5 h-5 text-[#ff7a93]" />
                </div>
              </div>
            </div>

          </div>

          <div className="relative mt-20 w-full border-t border-zinc-700 pt-8 pb-4 flex flex-col md:flex-row justify-between items-center text-sm text-zinc-500 gap-4 z-20">
             {/* Pikachu */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[69%] z-30 pointer-events-none">
                <img 
                   src="/footer/pikachu.jpg" 
                   alt="Pikachu" 
                   className="w-48 md:w-60 h-auto pointer-events-none"
                   style={{ mixBlendMode: 'lighten' }}
                />
             </div>

             <p className="flex items-center gap-2 z-20">
               <span className="w-2 h-2 rounded-full bg-[#ff7a93] inline-block"></span>
               *Se podrían requerir juegos, consolas o accesorios adicionales para el modo multijugador.
             </p>
             <p className="font-bold flex items-center gap-2 z-20 md:pr-40">
                © 2026 Pikagames
             </p>
          </div>
        </div>
      </footer>

      {/* Modal de Servicio al Cliente */}
      <AnimatePresence>
        {isCustomerServiceOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => {
                setIsCustomerServiceOpen(false);
                setTimeout(() => setCustomerServiceView('selection'), 300);
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-zinc-900 border-2 border-zinc-700 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden z-10 flex flex-col my-auto max-h-[85vh] sm:max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 sm:px-6 sm:py-5 border-b border-zinc-800 bg-zinc-900/80">
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff7a93] fill-[#ff7a93]" /> Servicio al Cliente
                </h3>
                <button 
                  onClick={() => {
                    setIsCustomerServiceOpen(false);
                    setTimeout(() => setCustomerServiceView('selection'), 300);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-5 sm:p-6 md:p-8 flex flex-col justify-center relative overflow-y-auto">
                <AnimatePresence mode="wait">
                  {customerServiceView === 'selection' && (
                    <motion.div 
                      key="selection"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full py-2"
                    >
                      <button 
                        onClick={() => setCustomerServiceView('comment')}
                        className="flex-1 group bg-zinc-800/90 border-2 border-zinc-700 hover:border-[#ffd90f] hover:bg-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center transition-all hover:-translate-y-1 active:translate-y-0"
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-700/70 group-hover:bg-[#ffd90f]/20 flex items-center justify-center mb-4 transition-colors">
                          <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-400 group-hover:text-[#ffd90f] transition-colors" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-bold text-white mb-1.5">Dejar un Comentario</h4>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">Cuéntanos tu experiencia y aparece en nuestra página.</p>
                      </button>

                      <button 
                        onClick={() => setCustomerServiceView('email')}
                        className="flex-1 group bg-zinc-800/90 border-2 border-zinc-700 hover:border-[#ff7a93] hover:bg-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center transition-all hover:-translate-y-1 active:translate-y-0"
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-700/70 group-hover:bg-[#ff7a93]/20 flex items-center justify-center mb-4 transition-colors">
                          <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-400 group-hover:text-[#ff7a93] transition-colors" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-bold text-white mb-1.5">Enviar un Correo</h4>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">Contáctanos directamente para soporte o dudas.</p>
                      </button>
                    </motion.div>
                  )}

                  {customerServiceView === 'comment' && (
                    <motion.div 
                      key="comment"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="w-full flex flex-col"
                    >
                      <button onClick={() => setCustomerServiceView('selection')} className="text-zinc-400 hover:text-white mb-6 flex items-center gap-2 self-start font-medium transition-colors">
                        <ChevronLeft className="w-5 h-5" /> Volver
                      </button>
                      <div className="space-y-5 w-full">
                        <div>
                          <label className="block text-sm font-bold text-zinc-300 mb-2">Tu Nombre (Automático)</label>
                          <input type="text" readOnly value="Jerry Gamer" className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-3 text-zinc-300 font-medium cursor-not-allowed outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-zinc-300 mb-2">Calificación</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} onClick={() => setRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                                <Star className={`w-8 h-8 ${rating >= star ? 'fill-[#ffd90f] text-[#ffd90f]' : 'text-zinc-600'} transition-colors`} strokeWidth={2} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-zinc-300 mb-2">Comentario</label>
                          <textarea 
                            rows={4} 
                            placeholder="¡Me encantó mi nuevo juego para Switch!" 
                            className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-[#ffd90f] rounded-xl px-4 py-3 text-white font-medium outline-none transition-colors resize-none"
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                          ></textarea>
                        </div>
                        <Button 
                          onClick={handleSubmitComentario}
                          disabled={isSubmitting || isSuccess}
                          className={`w-full font-black text-lg py-6 rounded-xl transition-all ${
                            isSuccess 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900'
                          }`}
                        >
                          {isSuccess ? '¡Enviado a revisión!' : isSubmitting ? 'Enviando...' : 'Publicar Comentario'}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {customerServiceView === 'email' && (
                    <motion.div 
                      key="email"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="w-full flex flex-col"
                    >
                      <button onClick={() => setCustomerServiceView('selection')} className="text-zinc-400 hover:text-white mb-6 flex items-center gap-2 self-start font-medium transition-colors">
                        <ChevronLeft className="w-5 h-5" /> Volver
                      </button>
                      <div className="space-y-5 w-full">
                        <div>
                          <label className="block text-sm font-bold text-zinc-300 mb-2">Asunto</label>
                          <input type="text" placeholder="Problema con mi pedido / Duda general" className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-[#ff7a93] rounded-xl px-4 py-3 text-white font-medium outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-zinc-300 mb-2">Mensaje</label>
                          <textarea rows={5} placeholder="Escribe aquí los detalles..." className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-[#ff7a93] rounded-xl px-4 py-3 text-white font-medium outline-none transition-colors resize-none"></textarea>
                        </div>
                        <Button className="w-full bg-[#ff7a93] hover:bg-[#e66a82] text-white font-black text-lg py-6 rounded-xl">
                          Enviar Correo
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Compra */}
      <AnimatePresence>
        {purchaseModal.isOpen && purchaseModal.game && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setPurchaseModal({ isOpen: false, game: null, step: 'method' })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white border-4 border-zinc-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(255,217,15,1)] overflow-hidden z-10 flex flex-col my-auto"
            >
              {/* Header */}
              <div className="relative h-40 bg-zinc-900 overflow-hidden border-b-4 border-zinc-900">
                {purchaseModal.game.background_image && (
                  <img src={purchaseModal.game.background_image} alt="Game background" className="w-full h-full object-cover opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
                <button 
                  onClick={() => setPurchaseModal({ isOpen: false, game: null, step: 'method' })}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border-2 border-zinc-900 hover:bg-[#ffd90f] flex items-center justify-center text-zinc-900 transition-colors z-20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <X className="w-5 h-5 font-bold" />
                </button>
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <span className="bg-[#ff7a93] text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border-2 border-zinc-900 mb-2 inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Comprar Juego</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] line-clamp-1">{purchaseModal.game.name}</h3>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {purchaseModal.step === 'method' && (
                    <motion.div 
                      key="method"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex flex-col gap-4"
                    >
                      <h4 className="font-black text-zinc-900 text-lg uppercase tracking-tight text-center mb-2">Selecciona un método de pago</h4>
                      
                      <button 
                        onClick={() => setPurchaseModal({ ...purchaseModal, step: 'paypal' })}
                        className="group relative w-full bg-blue-50 border-4 border-blue-900 hover:bg-blue-100 rounded-2xl p-4 flex items-center gap-4 transition-all hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] active:translate-y-0 active:shadow-none"
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <div className="font-black text-blue-900 text-lg">PayPal</div>
                          <div className="text-blue-800/70 font-medium text-sm">Pago rápido y seguro</div>
                        </div>
                      </button>

                      <button 
                        onClick={() => setPurchaseModal({ ...purchaseModal, step: 'transferencia' })}
                        className="group relative w-full bg-emerald-50 border-4 border-emerald-900 hover:bg-emerald-100 rounded-2xl p-4 flex items-center gap-4 transition-all hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(6,78,59,1)] active:translate-y-0 active:shadow-none"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center shrink-0">
                          <Landmark className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <div className="font-black text-emerald-900 text-lg">Transferencia Bancaria</div>
                          <div className="text-emerald-800/70 font-medium text-sm">Envía tu comprobante por WhatsApp</div>
                        </div>
                      </button>
                    </motion.div>
                  )}

                  {purchaseModal.step === 'paypal' && (
                    <motion.div 
                      key="paypal"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex flex-col items-center text-center"
                    >
                      <button onClick={() => setPurchaseModal({ ...purchaseModal, step: 'method' })} className="text-zinc-500 hover:text-zinc-900 mb-4 flex items-center gap-1 self-start font-bold transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Volver
                      </button>
                      
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-4 border-blue-900">
                         <CreditCard className="w-10 h-10 text-blue-900" />
                      </div>
                      <h4 className="font-black text-2xl text-zinc-900 mb-2">Pago con PayPal</h4>
                      <p className="text-zinc-600 font-medium mb-6">Serás redirigido a PayPal para completar tu compra de forma segura.</p>
                      
                      <Button className="w-full bg-[#ffc439] hover:bg-[#f4b828] text-blue-900 font-black text-lg py-6 rounded-xl border-4 border-blue-900 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)]">
                        Pagar con PayPal
                      </Button>
                    </motion.div>
                  )}

                  {purchaseModal.step === 'transferencia' && (
                    <motion.div 
                      key="transferencia"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex flex-col"
                    >
                      <button onClick={() => setPurchaseModal({ ...purchaseModal, step: 'method' })} className="text-zinc-500 hover:text-zinc-900 mb-4 flex items-center gap-1 self-start font-bold transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Volver
                      </button>
                      
                      <h4 className="font-black text-xl text-zinc-900 mb-4 uppercase text-center border-b-4 border-dashed border-zinc-200 pb-4">Datos Bancarios</h4>
                      
                      <div className="bg-zinc-100 p-4 rounded-xl border-2 border-zinc-300 mb-6 font-medium text-zinc-800 space-y-3 shadow-inner">
                        <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                           <span className="text-zinc-500 text-sm">Banco:</span>
                           <span className="font-black text-zinc-900">Banorte</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                           <span className="text-zinc-500 text-sm">Titular:</span>
                           <span className="font-black text-zinc-900">Pikagames S.A de C.V</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-zinc-500 text-sm">CLABE / Cuenta:</span>
                           <span className="font-black text-zinc-900 text-lg tracking-wider">072 580 1234567890 1</span>
                        </div>
                      </div>

                      <div className="bg-[#ffd90f]/20 border-2 border-[#ffd90f] p-4 rounded-xl mb-6">
                        <p className="text-sm font-bold text-zinc-800 text-center">
                          ⚠️ Instrucciones: Realiza la transferencia y luego envíanos el comprobante por WhatsApp presionando el botón de abajo.
                        </p>
                      </div>

                      <Button 
                        onClick={() => handleWhatsAppRedirect(purchaseModal.game?.name || "Juego")}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-lg py-6 rounded-xl border-4 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        Enviar recibo a WhatsApp
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Detalle del Videojuego ("Ver Videojuego") */}
      <AnimatePresence>
        {detailModal.isOpen && detailModal.game && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setDetailModal({ isOpen: false, game: null, isLoading: false })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border-4 border-zinc-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(255,217,15,1)] overflow-hidden z-10 flex flex-col my-auto max-h-[90vh]"
            >
              {/* Cover Banner */}
              <div className="relative h-56 sm:h-72 w-full bg-zinc-800 overflow-hidden border-b-4 border-zinc-900 shrink-0">
                {detailModal.game.background_image ? (
                  <img 
                    src={detailModal.game.background_image} 
                    alt={detailModal.game.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Gamepad2 size={64} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                
                {/* Close Button */}
                <button 
                  onClick={() => setDetailModal({ isOpen: false, game: null, isLoading: false })}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-[#ffd90f] hover:text-zinc-900 text-white border-2 border-zinc-700 flex items-center justify-center transition-colors z-20"
                >
                  <X className="w-5 h-5 font-bold" />
                </button>

                {/* Rating Badge */}
                <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                  <span className="bg-[#ffd90f] text-zinc-900 font-black text-xs px-3 py-1 rounded-full border border-zinc-900 flex items-center gap-1 shadow-md">
                    <Star className="w-3.5 h-3.5 fill-current" /> {detailModal.game.rating ? detailModal.game.rating.toFixed(1) : "4.8"} / 5
                  </span>
                  {detailModal.game.released && (
                    <span className="bg-zinc-900/90 text-white font-bold text-xs px-3 py-1 rounded-full border border-zinc-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#ffd90f]" /> {detailModal.game.released}
                    </span>
                  )}
                </div>

                {/* Title & Platform Header */}
                <div className="absolute bottom-4 left-6 right-6 z-20">
                  <span className="bg-[#ff7a93] text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border border-white mb-2 inline-block shadow-sm">
                    Nintendo Switch
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">
                    {detailModal.game.name}
                  </h2>
                </div>
              </div>

              {/* Detail Content Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {detailModal.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#ffd90f]" />
                    <p className="font-bold text-sm">Cargando información detallada...</p>
                  </div>
                ) : (
                  <>
                    {/* Genres */}
                    {detailModal.game.genres && detailModal.game.genres.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Géneros</h4>
                        <div className="flex flex-wrap gap-2">
                          {detailModal.game.genres.map((g) => (
                            <span key={g.id} className="bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold px-3 py-1 rounded-full">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Overview Description */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Descripción del Juego</h4>
                      <p className="text-zinc-300 text-sm leading-relaxed font-medium bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                        {detailModal.game.description_raw 
                          ? detailModal.game.description_raw 
                          : `Sumérgete en la increíble aventura de ${detailModal.game.name} para Nintendo Switch. Disfruta de gráficos deslumbrantes, jugabilidad fluida y horas inigualables de diversión.`}
                      </p>
                    </div>

                    {/* Metacritic & Features */}
                    {detailModal.game.metacritic && (
                      <div className="flex items-center justify-between bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#ffd90f]" />
                          <span className="text-sm font-bold text-white">Metascore de la crítica:</span>
                        </div>
                        <span className="bg-emerald-600 text-white font-black text-sm px-3 py-1 rounded-md">
                          {detailModal.game.metacritic} / 100
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => toggleSaveGame(detailModal.game!)}
                    variant="outline"
                    className={`flex-1 font-extrabold text-sm py-5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      isGameSaved(detailModal.game.id)
                        ? 'bg-[#ffd90f] text-zinc-900 border-[#ffd90f] hover:bg-[#e5c30d]'
                        : 'bg-zinc-800 text-white border-zinc-700 hover:border-[#ffd90f]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isGameSaved(detailModal.game.id) ? 'fill-zinc-900' : ''}`} />
                    {isGameSaved(detailModal.game.id) ? 'Guardado en Favoritos' : 'Guardar en Favoritos'}
                  </Button>

                  <Button
                    onClick={() => {
                      const gameToBuy = detailModal.game;
                      setDetailModal({ isOpen: false, game: null, isLoading: false });
                      setPurchaseModal({ isOpen: true, game: gameToBuy, step: 'method' });
                    }}
                    className="flex-1 bg-[#ff7a93] hover:bg-[#e66a82] text-white font-black text-sm py-5 rounded-xl shadow-md border-2 border-transparent hover:border-white flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Comprar Ahora
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}

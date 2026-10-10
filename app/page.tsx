"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AccessibleDialog } from "@/components/AccessibleDialog";
import { Card, CardContent } from "@/components/ui/card";
import { ShapeGrid } from "@/components/ShapeGrid";
import { HeroSwitch } from "@/components/HeroSwitch";
import { LoadingScreen } from "@/components/LoadingScreen";
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
  ChevronLeft,
  X,
  Loader2,
  Eye,
  Sparkles,
  Info,
  Check,
  Flame,
  Headphones,
  ArrowRight
} from "lucide-react";
import { getPopularGames, getUpcomingGames, getNewReleases, getGameDetails, searchGames, Game } from "@/lib/rawg";
import { useAuth } from "@/lib/AuthContext";
import { isDemoGameId } from "@/lib/demoGames";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ApiComment {
  id: string | number;
  nombre: string;
  calificacion: number;
  mensaje: string;
  fecha_creacion?: string;
}
type GameListKey = "popular" | "upcoming" | "releases" | "mario" | "price";

export default function HomePage() {
  const router = useRouter();
  const { user, token, toggleSaveGame, isGameSaved } = useAuth();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeComment, setActiveComment] = useState(0);
  const [apiComments, setApiComments] = useState<ApiComment[]>([]);
  
  // Modal states
  const [isCustomerServiceOpen, setIsCustomerServiceOpen] = useState(false);
  const [customerServiceView, setCustomerServiceView] = useState<'selection' | 'comment' | 'email'>('selection');
  const [rating, setRating] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const commentUserName = user
    ? `${user.nombre || ""} ${user.apellidos || ""}`.trim() || user.email
    : "";

  const handleSupportEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setEmailSending(true);
    setEmailError("");

    try {
      const response = await fetch("/api/support-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.get("email"),
          subject: fields.get("subject"),
          message: fields.get("message"),
          website: fields.get("website"),
        }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || "No se pudo enviar el correo.");
      }
      setEmailSent(true);
      form.reset();
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "No se pudo enviar el correo.");
    } finally {
      setEmailSending(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await apiFetch("/comentarios");
      const comments = Array.isArray(data) ? data : data?.comentarios;
      if (Array.isArray(comments)) {
        setApiComments(comments);
      }
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  // Game Catalog States
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  
  // New releases state
  const [newReleases, setNewReleases] = useState<Game[]>([]);
  const [isLoadingNewReleases, setIsLoadingNewReleases] = useState(true);

  // Mario & Price category states
  const [marioGames, setMarioGames] = useState<Game[]>([]);
  const [isLoadingMario, setIsLoadingMario] = useState(false);
  const [priceGames, setPriceGames] = useState<Game[]>([]);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Active category selected from '¿Qué buscas?' cartridges
  const [catalogCategory, setCatalogCategory] = useState<'popular' | 'estreno' | 'precio' | 'mario'>('popular');
  const [insertingCategory, setInsertingCategory] = useState<'popular' | 'estreno' | 'precio' | 'mario' | null>(null);
  const [insertedCategory, setInsertedCategory] = useState<'popular' | 'estreno' | 'precio' | 'mario' | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const insertionDuration = shouldReduceMotion ? 0 : 18000;

  // Game Detail Modal ("Ver Videojuego") State
  const [detailModal, setDetailModal] = useState<{isOpen: boolean; game: Game | null; isLoading: boolean}>({
    isOpen: false,
    game: null,
    isLoading: false
  });

  // Upcoming games state
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);
  const [introTimedOut, setIntroTimedOut] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [gameListErrors, setGameListErrors] = useState<Partial<Record<GameListKey, string>>>({});

  useEffect(() => {
    const timeout = window.setTimeout(() => setIntroTimedOut(true), 12000);
    return () => window.clearTimeout(timeout);
  }, []);

  const loadGameList = useCallback(async (
    key: GameListKey,
    request: () => Promise<Game[]>,
    save: (games: Game[]) => void,
    finish: () => void,
  ) => {
    setGameListErrors((errors) => ({ ...errors, [key]: undefined }));
    try {
      save(await request());
    } catch (error) {
      const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : undefined;
      setGameListErrors((errors) => ({
        ...errors,
        [key]: status && status >= 500
          ? "Este listado no está disponible temporalmente. Intenta de nuevo."
          : "No se pudo cargar este listado. Revisa tu conexión e intenta de nuevo.",
      }));
    } finally {
      finish();
    }
  }, []);

  // Load Popular Games
  useEffect(() => {
    loadGameList("popular", () => getPopularGames(1, 8, { throwOnError: true }), setGames, () => setIsLoadingGames(false));
  }, [loadGameList]);

  // Load Upcoming Games from RAWG
  useEffect(() => {
    loadGameList("upcoming", () => getUpcomingGames(1, 8, { throwOnError: true }), setUpcomingGames, () => setIsLoadingUpcoming(false));
  }, [loadGameList]);

  // Load New Releases from RAWG
  useEffect(() => {
    loadGameList("releases", () => getNewReleases(1, 8, { throwOnError: true }), setNewReleases, () => setIsLoadingNewReleases(false));
  }, [loadGameList]);

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

  // Handle cartridge clicks to filter and scroll to catalog
  const handleCartridgeClick = async (category: 'popular' | 'estreno' | 'precio' | 'mario') => {
    if (insertingCategory || category === insertedCategory) return;

    setInsertingCategory(category);
    setCatalogCategory(category);
    window.setTimeout(() => {
      setInsertedCategory(category);
      setInsertingCategory(null);
    }, insertionDuration);

    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });

    if (category === 'mario' && marioGames.length === 0) {
      setIsLoadingMario(true);
      await loadGameList("mario", () => searchGames('Mario', 1, 8, { throwOnError: true }), setMarioGames, () => setIsLoadingMario(false));
    } else if (category === 'precio' && priceGames.length === 0) {
      setIsLoadingPrice(true);
      await loadGameList("price", () => getPopularGames(2, 8, { throwOnError: true }), setPriceGames, () => setIsLoadingPrice(false));
    }
  };

  const retryCatalogList = () => {
    if (catalogCategory === "popular") {
      setIsLoadingGames(true);
      void loadGameList("popular", () => getPopularGames(1, 8, { throwOnError: true }), setGames, () => setIsLoadingGames(false));
    } else if (catalogCategory === "estreno") {
      setIsLoadingNewReleases(true);
      void loadGameList("releases", () => getNewReleases(1, 8, { throwOnError: true }), setNewReleases, () => setIsLoadingNewReleases(false));
    } else if (catalogCategory === "mario") {
      setIsLoadingMario(true);
      void loadGameList("mario", () => searchGames("Mario", 1, 8, { throwOnError: true }), setMarioGames, () => setIsLoadingMario(false));
    } else {
      setIsLoadingPrice(true);
      void loadGameList("price", () => getPopularGames(2, 8, { throwOnError: true }), setPriceGames, () => setIsLoadingPrice(false));
    }
  };

  const catalogGames = catalogCategory === "popular" ? games
    : catalogCategory === "estreno" ? newReleases
    : catalogCategory === "mario" ? (marioGames.length ? marioGames : games)
    : (priceGames.length ? priceGames : games);
  const catalogErrorKey: GameListKey = catalogCategory === "estreno" ? "releases"
    : catalogCategory === "precio" ? "price"
    : catalogCategory;


  const handleSubmitComentario = async () => {
    if (rating === 0 || mensaje.trim() === "") {
      setCommentError("Selecciona una calificación y escribe un comentario.");
      return;
    }

    if (!user || !token || !commentUserName) {
      setCommentError("Inicia sesión para publicar un comentario.");
      return;
    }
    
    setIsSubmitting(true);
    setCommentError("");
    try {
      await apiFetch("/comentarios", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id || null,
          nombre: commentUserName,
          calificacion: Number(rating),
          mensaje: mensaje.trim(),
        }),
      });
      
      setIsSuccess(true);
      await loadComments();
      setTimeout(() => {
        setIsCustomerServiceOpen(false);
        setIsSuccess(false);
        setMensaje("");
        setRating(0);
        setTimeout(() => setCustomerServiceView('selection'), 300);
      }, 2000);
    } catch (error) {
      console.error(error);
      setCommentError(error instanceof Error ? error.message : "Error al enviar el comentario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (apiComments.length === 0) return;
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        // If reached the end, go back to start, else scroll right
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
          setActiveComment(0);
        } else {
          carouselRef.current.scrollBy({ left: 512, behavior: "smooth" });
          setActiveComment((current) => (current + 1) % apiComments.length);
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [apiComments.length]);

  const averageCommentRating = apiComments.length
    ? (apiComments.reduce((sum, comment) => sum + (Number(comment.calificacion) || 0), 0) / apiComments.length).toFixed(1)
    : null;

  const commentCards = apiComments.map((comment, index) => ({
        bgSvg: `/svg/comentario${(index % 6) + 1}.svg`,
        text: comment.mensaje,
        name: comment.nombre,
        rating: Math.max(0, Math.min(5, Number(comment.calificacion) || 0)),
        color: index % 3 === 1 ? "text-white" : "text-zinc-900",
        alignment: index % 2 === 0 ? "pb-8 md:pb-12" : "pt-8 md:pt-12",
      }));

  const introProgress = Number(!isLoadingGames) + Number(!isLoadingUpcoming) + Number(!isLoadingNewReleases);

  useEffect(() => {
    if (introProgress < 3 && !introTimedOut) return;
    const timeout = window.setTimeout(() => setShowIntro(false), introProgress === 3 && !shouldReduceMotion ? 2400 : 0);
    return () => window.clearTimeout(timeout);
  }, [introProgress, introTimedOut, shouldReduceMotion]);

  useEffect(() => {
    if (!showIntro) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [showIntro]);

  return (
    <div className="min-h-screen bg-[#111311] text-zinc-100 font-sans">
      <AnimatePresence>{showIntro && <LoadingScreen progress={introProgress / 3} />}</AnimatePresence>
      <main id="main-content" aria-busy={showIntro}>
      {/* Hero Section */}
      <section className="relative w-full min-h-175 md:min-h-200 flex flex-col md:flex-row items-center justify-between px-6 md:px-12 pb-12 pt-32 md:pt-40 overflow-hidden border-b-4 border-zinc-900 bg-[#111311]">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 opacity-40">
          <ShapeGrid 
            speed={0.5}
            squareSize={40}
            direction="diagonal"
            borderColor="#333"
            hoverFillColor="#222"
            shape="square"
          />
        </div>

        {/* Hero Content */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -56, y: 16 }}
          animate={showIntro && !shouldReduceMotion ? { opacity: 0, x: -56, y: 16 } : { opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative z-10 flex flex-col items-start max-w-xl"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase leading-[1.05] mb-6">
            Tu Universo de <span className="text-[#ffd90f]">Nintendo</span> en un solo lugar
          </h1>
          <p className="text-zinc-400 text-base md:text-lg mb-8 leading-relaxed font-medium">
            Encuentra los videojuegos más épicos, estrenos exclusivos y las mejores ofertas digitales y físicas para tu consola favorita.
          </p>
          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            <Link href="/catalogo">
              <Button size="lg" className="bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 font-black rounded-2xl px-8 py-6 text-base shadow-[0_4px_20px_rgba(255,217,15,0.4)] transition-all hover:scale-105 flex items-center gap-2">
                Ver Catálogo Completo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Visuals */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 90, y: 24, rotate: 7, scale: 0.82 }}
          animate={showIntro && !shouldReduceMotion
            ? { opacity: 0, x: 90, y: 24, rotate: 7, scale: 0.82 }
            : { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 85, damping: 15, delay: 0.22 }}
          whileHover={shouldReduceMotion ? undefined : { y: -8, rotate: -1, scale: 1.02 }}
          className="relative z-10 mt-12 md:mt-0 w-full md:w-[52%] md:shrink-0 flex items-center justify-center"
        >
          <div className="relative w-full max-w-2xl flex items-center justify-center">
            <div className="absolute inset-0 bg-linear-to-tr from-[#ffd90f]/20 to-transparent rounded-full blur-3xl" />
            <HeroSwitch />
          </div>
        </motion.div>
      </section>

      {/* ¿Qué buscas? Section */}
      <section className="relative z-10 overflow-hidden border-b-4 border-zinc-900 bg-white px-6 pt-4 pb-12 md:px-12 md:pb-16">
        <motion.h2 
          initial={shouldReduceMotion ? false : { opacity: 0, x: -64, y: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.25 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.35 }}
          className="relative z-20 mb-44 text-center text-3xl font-black text-balance uppercase tracking-tight text-zinc-900"
        >
          ¿Qué buscas?
        </motion.h2>
        <div className="relative z-10 mt-8 grid w-full min-w-0 grid-cols-2 gap-x-3 gap-y-48 overflow-visible shadow-xl md:grid-cols-4 md:gap-0 md:rounded-2xl md:bg-zinc-900">
          {[
            { id: 'precio' as const, title: 'Precio', image: '/png/cartucho3.png' },
            { id: 'popular' as const, title: 'Popular', image: '/png/cartucho4.png' },
            { id: 'estreno' as const, title: 'Estreno', image: '/png/cartucho1.png' },
            { id: 'mario' as const, title: 'Mario', image: '/png/cartucho2.png' }
          ].map((item, index) => {
            const isSelected = catalogCategory === item.id;
            const isInserted = (insertingCategory ?? insertedCategory) === item.id;
            const isInserting = insertingCategory === item.id;
            return (
              <motion.button
                type="button"
                key={item.id}
                onClick={() => void handleCartridgeClick(item.id)}
                disabled={Boolean(insertingCategory)}
                aria-pressed={isSelected}
                aria-label={`Ver juegos de ${item.title}`}
                className="group relative h-20 border-0 text-center disabled:cursor-wait md:border-r-2 md:border-zinc-700 md:last:border-r-0"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 36, scale: 0.94 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.65, delay: index * 0.1, type: "spring", bounce: 0.3 },
                }}
                viewport={{ once: false, amount: 0.2 }}
                whileTap={shouldReduceMotion ? undefined : { transform: "translateY(2px) scale(0.98)" }}
                transition={{ duration: 0.40, ease: [0.23, 1, 0.32, 1] }}
              >
                <span className="pointer-events-none absolute bottom-full left-1/2 z-0 w-28 -translate-x-1/2" aria-hidden="true">
                  <motion.span
                    className="block"
                    animate={{
                      transform: isInserted
                        ? ["translateY(-8px)", "translateY(-16px)", "translateY(108px)"]
                        : "translateY(-8px)",
                    }}
                    transition={{ duration: insertionDuration / 1000, times: [0, 0.12, 1], ease: "linear" }}
                  >
                    <Image
                      src={item.image}
                      alt=""
                      width={834}
                      height={1200}
                      className="h-auto w-full drop-shadow-xl"
                    />
                  </motion.span>
                </span>

                <span className={cn(
                  "absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-zinc-900 px-3 text-white transition-colors duration-200 group-hover:bg-zinc-800 md:rounded-none md:first:rounded-l-2xl md:last:rounded-r-2xl",
                  isInserted && "bg-zinc-800",
                )}>
                  <span className="absolute top-0 left-1/2 h-2 w-25 -translate-x-1/2 rounded-b-md bg-white" aria-hidden="true" />
                  <span className="absolute top-2 h-0.5 w-20 rounded-full bg-zinc-600" aria-hidden="true" />
                  <span className="mt-2 text-balance text-sm font-black uppercase md:text-base">{item.title}</span>
                  <span aria-live="polite" className={cn("text-xs font-semibold text-zinc-400", isInserted && "text-[#ffd90f]")}>
                    {isInserting ? 'Insertando…' : isInserted ? 'Insertado' : 'Insertar'}
                  </span>
                </span>
              </motion.button>
            );
          })}
          <span className="pointer-events-none absolute inset-x-0 top-full z-20 h-20 bg-white" aria-hidden="true" />
        </div>
      </section>

      {/* Slanted Wrapper for Black Gap and Pink Section */}
      <div className="relative z-0 w-full skew-y-2 -mt-16 -mb-12">
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
              className="grid w-full min-w-0 grid-cols-1 items-center justify-items-center gap-8 mt-8 md:grid-cols-2 md:gap-10"
            >
              <img 
                src="/1.png" 
                alt="Catálogo Switch 1" 
                className="-mt-4 h-auto max-h-60 w-full max-w-full object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-transform duration-300 hover:-translate-y-2 md:-mt-8 md:max-h-80"
              />
              <img 
                src="/2.avif" 
                alt="Catálogo Switch 2" 
                className="h-auto max-h-60 w-full max-w-full object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-transform duration-300 hover:-translate-y-2 md:max-h-72"
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
          ) : gameListErrors.upcoming ? (
            <p role="alert" className="py-10 text-center font-medium text-amber-700">{gameListErrors.upcoming}</p>
          ) : upcomingGames.length === 0 ? (
            <p className="py-10 text-center font-medium text-zinc-600">No hay próximos estrenos disponibles ahora.</p>
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
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8 w-full"
            >
              {upcomingGames.map((game) => {
                const saved = isGameSaved(game.id);
                return (
                  <motion.div 
                    key={game.id}
                    variants={{ hidden: { opacity: 0, y: 100, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                    className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg hover:-translate-y-1 hover:border-[#ffd90f] hover:shadow-[0_16px_36px_rgba(255,217,15,0.12)] transition-all flex flex-col overflow-hidden group relative"
                  >
                    {/* Image & Badges */}
                    <div className="relative w-full aspect-4/3 overflow-hidden bg-zinc-800">
                      {game.background_image ? (
                        <img src={game.background_image} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600"><Gamepad2 size={40} /></div>
                      )}
                      
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
                    <div className="p-3 sm:p-4 flex flex-col grow">
                      <h3 className="text-white font-bold text-lg mb-3 line-clamp-2 leading-tight group-hover:text-[#ffd90f] transition-colors">
                        {game.name}
                      </h3>
                      
                      <div className="mt-auto flex justify-center pt-2">
                        {/* Botón Ver Videojuego */}
                        <Button 
                          onClick={() => handleOpenDetailModal(game)}
                          variant="outline"
                          className="w-full min-w-0 sm:w-auto sm:min-w-36 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-bold text-[10px] sm:text-xs tracking-wide flex items-center justify-center gap-1 px-3"
                        >
                          <Eye className="w-4 h-4 text-[#ffd90f]" />
                          ver detalles
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
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="flex flex-col items-center mb-10 text-center"
          >

            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-zinc-900">
              Catálogo de Videojuegos
            </h2>
            <p className="text-zinc-600 font-medium text-sm md:text-base mt-2 max-w-xl">
              {catalogCategory === 'popular' && 'Los juegos más jugados y aclamados por la comunidad de Nintendo Switch.'}
              {catalogCategory === 'estreno' && 'Las novedades más recientes que acaban de llegar a la plataforma.'}
              {catalogCategory === 'mario' && 'Explora las aventuras más legendarias de Mario, Luigi y el Reino Champiñón.'}
              {catalogCategory === 'precio' && 'Las mejores opciones, promociones especiales y grandes títulos al mejor precio.'}
            </p>
          </motion.div>

          {/* Grid Content */}
          {((catalogCategory === 'popular' ? isLoadingGames :
             catalogCategory === 'estreno' ? isLoadingNewReleases :
             catalogCategory === 'mario' ? isLoadingMario : isLoadingPrice)) ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#ffd90f]" />
              <p className="font-bold text-lg text-zinc-800">Cargando videojuegos...</p>
            </div>
          ) : gameListErrors[catalogErrorKey] ? (
            <div role="alert" className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-amber-500/40 bg-zinc-900/5 p-8 text-center text-zinc-800">
              <p>{gameListErrors[catalogErrorKey]}</p>
              <Button onClick={retryCatalogList} className="bg-[#ffd90f] font-bold text-zinc-900 hover:bg-[#e5c30d]">Reintentar</Button>
            </div>
          ) : catalogGames.length === 0 ? (
            <p className="py-10 text-center font-medium text-zinc-600">No hay videojuegos para mostrar en esta lista.</p>
          ) : (
            <>
              <motion.div 
                key={catalogCategory}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 }
                  }
                }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8 w-full"
              >
                {catalogGames.map((game) => {
                  const saved = isGameSaved(game.id);
                  return (
                    <motion.div 
                      variants={{ hidden: { opacity: 0, y: 50, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                      key={game.id} 
                      className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg hover:-translate-y-1 hover:border-[#ffd90f] hover:shadow-[0_16px_36px_rgba(255,217,15,0.12)] transition-all flex flex-col overflow-hidden group relative"
                    >
                      <div className="relative w-full aspect-4/3 overflow-hidden bg-zinc-800">
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

                      <div className="p-3 sm:p-4 flex flex-col grow">
                        <h3 className="text-white font-bold text-lg mb-3 line-clamp-2 leading-tight group-hover:text-[#ffd90f] transition-colors">
                          {game.name}
                        </h3>
                        
                        <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {/* Botón Ver Videojuego */}
                          <Button 
                            onClick={() => handleOpenDetailModal(game)}
                            variant="outline"
                            className="min-w-0 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-bold text-[10px] sm:text-xs tracking-wide flex items-center justify-center gap-1 px-2"
                          >
                            <Eye className="w-4 h-4 text-[#ffd90f]" />
                            ver detalles
                          </Button>

                          {/* Botón Comprar */}
                          {!isDemoGameId(game.id) && <Button
                            onClick={() => router.push(`/comprar/${game.id}`)}
                            className="min-w-0 w-full bg-[#ffd90f] hover:bg-[#ffe45c] text-zinc-950 font-black text-[10px] sm:text-xs tracking-wide border-0 shadow-sm flex items-center justify-center gap-1 px-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            comprar
                          </Button>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Botón Ver más juegos */}
              <div className="mt-12 flex justify-center w-full">
                <Link href="/catalogo">
                  <Button
                    size="lg" 
                    className="bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 border-4 border-zinc-900 rounded-full font-black px-10 py-7 text-lg md:text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(230,0,18,1)] transition-all hover:scale-105 flex items-center gap-3"
                  >
                    <span>Ver más juegos</span>
                    <ChevronRight className="w-6 h-6 text-zinc-900 stroke-3" />
                  </Button>
                </Link>
              </div>
            </>
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
              {averageCommentRating && (
                <div className="flex items-center gap-2 text-[#ffd90f] mt-5 drop-shadow-sm">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-6 h-6 md:w-8 md:h-8 ${star <= Math.round(Number(averageCommentRating)) ? "fill-current" : "fill-transparent"}`} />
                  ))}
                  <span className="text-zinc-900 font-black text-2xl md:text-3xl ml-3">{averageCommentRating} / 5</span>
                </div>
              )}
            </div>
          </div>

          {/* Carousel */}
          <div className="relative mt-10 w-full">
            {commentCards.length === 0 ? (
              <p className="py-8 text-center text-zinc-600">Aún no hay comentarios publicados.</p>
            ) : (
              <>
            <div 
              ref={carouselRef}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pb-4 pt-4 hide-scrollbar sm:gap-6 md:gap-8"
            >
              {commentCards.map((comment, i) => (
                <div key={i} className={`w-[calc(100vw-3rem)] max-w-120 min-h-48 shrink-0 snap-center relative hover:-translate-y-2 transition-transform duration-300 group flex items-center justify-center px-8 py-10 sm:px-10 md:min-h-65 md:px-12 ${comment.alignment}`}>
                  <img src={comment.bgSvg} alt="Comentario" className="absolute inset-0 w-full h-full object-fill -z-10 drop-shadow-[8px_8px_0px_rgba(24,24,27,1)] group-hover:scale-[1.02] transition-transform duration-300" />
                  
                  <div className="flex flex-col items-center text-center max-w-[90%] relative z-10">
                    <div className={`font-black text-xl md:text-2xl mb-1 ${comment.color}`}>{comment.name}</div>
                    <div className={`flex gap-1 mb-2 md:mb-3 ${comment.color === 'text-white' ? 'text-white' : 'text-zinc-900'}`}>
                      {[...Array(5)].map((_, idx) => (
                         <Star key={idx} className={`w-4 h-4 md:w-5 md:h-5 ${idx < comment.rating ? 'fill-current' : 'fill-transparent'} stroke-current`} strokeWidth={2.5} />
                      ))}
                    </div>
                    <p className={`${comment.color} font-bold leading-tight text-[13px] md:text-base line-clamp-5`}>
                      &quot;{comment.text}&quot;
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-center gap-2" aria-label="Seleccionar comentario">
              {Array.from({ length: commentCards.length }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Ver comentario ${index + 1}`}
                  aria-current={activeComment === index ? "true" : undefined}
                  onClick={() => {
                    const carousel = carouselRef.current;
                    if (!carousel) return;
                    carousel.scrollTo({ left: index * (carousel.scrollWidth / commentCards.length), behavior: "smooth" });
                    setActiveComment(index);
                  }}
                  className={`h-2.5 rounded-full transition-all ${activeComment === index ? "w-7 bg-[#ffd90f]" : "w-2.5 bg-zinc-300 hover:bg-zinc-500"}`}
                />
              ))}
            </div>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* Main Footer */}
      </main>
      <footer className="relative text-zinc-100 pt-24 pb-12 px-6 md:px-12 overflow-hidden border-t-8 border-white bg-zinc-900">
        
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
              className="text-sm sm:text-lg md:text-xl font-extrabold px-6 py-3 sm:px-8 sm:py-3.5 md:py-4 h-auto rounded-full bg-zinc-800 text-white border-2 border-zinc-600 hover:bg-zinc-700 hover:border-[#ffd90f] hover:text-[#ffd90f] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:-translate-y-1 tracking-tight flex items-center gap-2 sm:gap-3"
            >
              <span>Servicio al cliente</span>
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 stroke-3 shrink-0" />
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
                <a href="https://www.instagram.com/pika.switch" className="w-12 h-12 p-2.5 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg border-[3px] border-transparent hover:border-white bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center overflow-hidden text-white">
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
                  <a href="https://wa.me/528136975457" target="_blank" rel="noreferrer" className="font-medium text-lg">81 3697 5457</a>
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
             <p className="flex items-center gap-2 z-20">
               <span className="w-2 h-2 rounded-full bg-[#ff7a93] inline-block"></span>
               *Se podrían requerir juegos, consolas o accesorios adicionales para el modo multijugador.
             </p>
             <p className="font-bold flex items-center gap-2 z-20">
                © 2026 Pikagames
             </p>
          </div>
        </div>
      </footer>

      {/* Modal de Servicio al Cliente */}
      <AccessibleDialog open={isCustomerServiceOpen} title="Servicio al Cliente" description="Formulario de comentarios y contacto de soporte" onClose={() => {
        setIsCustomerServiceOpen(false);
        setTimeout(() => setCustomerServiceView('selection'), 300);
      }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[590px] bg-[#18181b] border border-[#ffd90f]/30 rounded-[24px] shadow-[0_0_35px_rgba(255,217,15,0.08),0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden z-10 flex flex-col mx-auto my-auto max-h-[85vh] sm:max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-start px-7 py-6 sm:px-8 sm:py-7 border-b border-zinc-800 bg-[#18181b]/95">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                    ¿Necesitas ayuda?
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 font-medium">Estamos aquí para ayudarte.</p>
                </div>
                <button 
                  onClick={() => {
                    setIsCustomerServiceOpen(false);
                    setTimeout(() => setCustomerServiceView('selection'), 300);
                  }}
                  aria-label="Cerrar servicio al cliente"
                  className="size-10 sm:size-11 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0 mt-0.5"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-7 sm:p-8 flex flex-col justify-center relative overflow-y-auto">
                <AnimatePresence mode="wait">
                  {customerServiceView === 'selection' && (
                    <motion.div 
                      key="selection"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex flex-col gap-6 w-full py-1"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Card 1: Comentario */}
                        <button 
                          onClick={() => { setCommentError(""); setCustomerServiceView('comment'); }}
                          className="group bg-zinc-900/90 hover:bg-zinc-800/90 border-2 border-zinc-700/60 hover:border-[#ffd90f] rounded-2xl p-5 sm:p-6 flex flex-col items-start text-left transition-all duration-200 hover:-translate-y-1 active:translate-y-0 shadow-lg hover:shadow-[0_8px_25px_rgba(255,217,15,0.1)] cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/60 group-hover:border-[#ffd90f]/40 group-hover:bg-[#ffd90f]/15 flex items-center justify-center mb-4 transition-colors">
                            <MessageCircle className="w-6 h-6 text-zinc-400 group-hover:text-[#ffd90f] transition-colors" />
                          </div>
                          <h4 className="text-lg font-bold text-white mb-1.5 group-hover:text-[#ffd90f] transition-colors">Dejar comentario</h4>
                          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">Comparte tu experiencia</p>
                          <span className="text-xs sm:text-sm font-bold text-[#ffd90f] flex items-center gap-1.5 mt-auto pt-2 group-hover:translate-x-1 transition-transform">
                            Comentar <ArrowRight className="w-4 h-4" />
                          </span>
                        </button>

                        {/* Card 2: Enviar correo */}
                        <button 
                          onClick={() => { setEmailError(""); setEmailSent(false); setCustomerServiceView('email'); }}
                          className="group bg-zinc-900/90 hover:bg-zinc-800/90 border-2 border-zinc-700/60 hover:border-[#ffd90f] rounded-2xl p-5 sm:p-6 flex flex-col items-start text-left transition-all duration-200 hover:-translate-y-1 active:translate-y-0 shadow-lg hover:shadow-[0_8px_25px_rgba(255,217,15,0.1)] cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/60 group-hover:border-[#ffd90f]/40 group-hover:bg-[#ffd90f]/15 flex items-center justify-center mb-4 transition-colors">
                            <Mail className="w-6 h-6 text-zinc-400 group-hover:text-[#ffd90f] transition-colors" />
                          </div>
                          <h4 className="text-lg font-bold text-white mb-1.5 group-hover:text-[#ffd90f] transition-colors">Enviar correo</h4>
                          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">Habla con soporte</p>
                          <span className="text-xs sm:text-sm font-bold text-[#ffd90f] flex items-center gap-1.5 mt-auto pt-2 group-hover:translate-x-1 transition-transform">
                            Contactar <ArrowRight className="w-4 h-4" />
                          </span>
                        </button>
                      </div>

          
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
                        {commentError && (
                          <p id="comment-error" role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                            {commentError}
                          </p>
                        )}
                        <div>
                          <label htmlFor="comment-name" className="block text-sm font-bold text-zinc-300 mb-2">Tu Nombre (Automático)</label>
                          <input id="comment-name" type="text" readOnly value={commentUserName || "Inicia sesión para comentar"} className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-3 text-zinc-300 font-medium cursor-not-allowed outline-none" />
                        </div>
                        <div>
                          <span id="comment-rating-label" className="block text-sm font-bold text-zinc-300 mb-2">Calificación</span>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} type="button" aria-label={`${star} de 5 estrellas`} aria-pressed={rating === star} onClick={() => { setRating(star); setCommentError(""); }} className="size-11 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#ffd90f] hover:scale-110 transition-transform">
                                <Star className={`w-8 h-8 ${rating >= star ? 'fill-[#ffd90f] text-[#ffd90f]' : 'text-zinc-600'} transition-colors`} strokeWidth={2} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label htmlFor="comment-message" className="block text-sm font-bold text-zinc-300 mb-2">Comentario</label>
                          <textarea 
                            id="comment-message" rows={4} aria-invalid={Boolean(commentError)} aria-describedby={commentError ? "comment-error" : undefined}
                            placeholder="¡Me encantó mi nuevo juego para Switch!" 
                            className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-[#ffd90f] rounded-xl px-4 py-3 text-white font-medium outline-none transition-colors resize-none"
                            value={mensaje}
                            onChange={(e) => { setMensaje(e.target.value); setCommentError(""); }}
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
                      <form onSubmit={handleSupportEmailSubmit} className="space-y-5 w-full">
                        {emailError && <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{emailError}</p>}
                        {emailSent && <p role="status" className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">Tu correo se envió correctamente. Te responderemos pronto.</p>}
                        <div>
                          <label htmlFor="support-email" className="block text-sm font-bold text-zinc-300 mb-2">Tu correo</label>
                          <input id="support-email" name="email" type="email" required maxLength={254} defaultValue={user?.email || ""} autoComplete="email" placeholder="tu@correo.com" className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-[#ffd90f] rounded-xl px-4 py-3 text-white font-medium outline-none transition-colors" />
                        </div>
                        <div>
                          <label htmlFor="support-subject" className="block text-sm font-bold text-zinc-300 mb-2">Asunto</label>
                          <input id="support-subject" name="subject" type="text" required maxLength={120} placeholder="Problema con mi pedido / Duda general" className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-[#ffd90f] rounded-xl px-4 py-3 text-white font-medium outline-none transition-colors" />
                        </div>
                        <div>
                          <label htmlFor="support-message" className="block text-sm font-bold text-zinc-300 mb-2">Mensaje</label>
                          <textarea id="support-message" name="message" rows={5} required maxLength={5000} placeholder="Escribe aquí los detalles..." className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-[#ffd90f] rounded-xl px-4 py-3 text-white font-medium outline-none transition-colors resize-none"></textarea>
                        </div>
                        <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                        <Button type="submit" disabled={emailSending || emailSent} className="w-full bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 font-black text-lg py-6 rounded-xl">
                          {emailSent ? "¡Correo enviado!" : emailSending ? "Enviando..." : "Enviar Correo"}
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
      </AccessibleDialog>

      {/* Modal de Detalle del Videojuego ("Ver Videojuego") */}
      {detailModal.isOpen && detailModal.game && (
          <AccessibleDialog open={detailModal.isOpen} title={detailModal.game.name} description={`Detalles del juego ${detailModal.game.name}`} onClose={() => setDetailModal({ isOpen: false, game: null, isLoading: false })}>
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
                <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                
                {/* Close Button */}
                <button 
                  onClick={() => setDetailModal({ isOpen: false, game: null, isLoading: false })}
                  aria-label="Cerrar detalles del juego"
                  className="absolute top-4 right-4 size-11 rounded-full bg-zinc-900/80 hover:bg-[#ffd90f] hover:text-zinc-900 text-white border-2 border-zinc-700 flex items-center justify-center transition-colors z-20"
                >
                  <X className="w-5 h-5 font-bold" />
                </button>

                {/* Rating Badge */}
                <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                  <span className="bg-[#ffd90f] text-zinc-900 font-black text-xs px-3 py-1 rounded-full border border-zinc-900 flex items-center gap-1 shadow-md">
                    <Star className="w-3.5 h-3.5 fill-current" /> {detailModal.game.rating ? detailModal.game.rating.toFixed(1) : "4.8"} / 5
                  </span>
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

                  {!isDemoGameId(detailModal.game.id) && <Button
                    onClick={() => {
                      if (detailModal.game) router.push(`/comprar/${detailModal.game.id}`);
                    }}
                    className="flex-1 bg-[#ff7a93] hover:bg-[#e66a82] text-white font-black text-sm py-5 rounded-xl shadow-md border-2 border-transparent hover:border-white flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Comprar Ahora
                  </Button>}
                </div>
              </div>
            </motion.div>
          </AccessibleDialog>
      )}


    </div>
  );
}

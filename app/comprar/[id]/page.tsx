"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Check, 
  Gamepad2, 
  Loader2, 
  Send, 
  ShieldCheck, 
  Star, 
  Copy, 
  X, 
  CreditCard,
  Landmark, 
  Clock, 
  AlertTriangle,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { getGameDetails, type Game } from "@/lib/rawg";
import { motion, AnimatePresence } from "framer-motion";
import PayPalCheckoutButton from "@/components/PayPalCheckoutButton";

type AccountType = "principal" | "secundaria";
type PaymentMethod = "paypal" | "oxxo" | "transferencia";

const accountOptions: Record<AccountType, { label: string; price: number }> = {
  principal: {
    label: "Cuenta Principal",
    price: 650,
  },
  secundaria: {
    label: "Cuenta Secundaria",
    price: 260,
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paypal");
  const [isReservedModalOpen, setIsReservedModalOpen] = useState(false);
  const [isPaypalPaid, setIsPaypalPaid] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [paypalError, setPaypalError] = useState(false);

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
          description_raw: "Título digital para Nintendo Switch.",
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
  const formattedPrice = selectedOption.price.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    paypal: "PayPal / Tarjeta",
    oxxo: "OXXO o 7Eleven",
    transferencia: "Transferencia SPEI",
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleReserveClick = () => {
    setIsReservedModalOpen(true);
  };

  const handlePayPalPaymentSuccess = () => {
    setIsPaypalPaid(true);
  };

  const sendWhatsAppComprobante = () => {
    if (!game) return;
    const message = paymentMethod === "paypal"
      ? `Hola Pikagames, he completado mi pago por PayPal para "${game.name}" (${selectedOption.label} - $${formattedPrice} MXN). Adjunto mi comprobante para la entrega.`
      : `Hola Pikagames, he apartado 1 boleto para "${game.name}" (${selectedOption.label} - $${formattedPrice} MXN) mediante ${paymentMethodLabels[paymentMethod]}. Adjunto mi comprobante de pago.`;
    
    window.open(`https://wa.me/528136975487?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#111311] pt-28 text-zinc-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-32 text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#ffd90f]" />
          <p className="font-bold">Cargando detalles del juego...</p>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-[#111311] pt-28 text-zinc-100">
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <Gamepad2 className="mx-auto mb-5 h-14 w-14 text-[#ffd90f]" />
          <h1 className="text-2xl font-black">Juego no encontrado</h1>
          <p className="mt-3 text-zinc-400">Vuelve al catálogo para explorar más títulos disponibles.</p>
          <Link href="/catalogo" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#ffd90f] px-5 py-3 text-sm font-black text-zinc-950">
            <ArrowLeft className="h-4 w-4" /> Volver al catálogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111311] pb-24 pt-24 text-zinc-100 md:pt-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link href="/catalogo" className="mb-6 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-[#ffd90f] hover:text-[#ffd90f]">
          <ArrowLeft className="h-4 w-4" /> Volver al catálogo
        </Link>

        {/* Layout Principal */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] items-start">

          {/* COLUMNA IZQUIERDA: Tarjeta del juego */}
          <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-md">
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
              {game.background_image ? (
                <img src={game.background_image} alt={game.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-600">
                  <Gamepad2 className="h-16 w-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
              {game.rating > 0 && (
                <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-1.5 text-xs font-black text-[#ffd90f] backdrop-blur-md">
                  <Star className="h-3.5 w-3.5 fill-current" /> {game.rating.toFixed(1)}
                </span>
              )}
            </div>

            <div className="p-6 md:p-8">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd90f]">
                <Sparkles className="h-3 w-3" /> Selección Actual
              </span>
              <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl">{game.name}</h1>
              
              {game.genres && game.genres.length > 0 && (
                <p className="mt-2 text-xs font-bold text-zinc-400">{game.genres.map((g) => g.name).join(" · ")}</p>
              )}

              <p className="mt-4 text-xs leading-relaxed text-zinc-300 sm:text-sm">{game.description_raw || "Título digital listo para Nintendo Switch con entrega rápida."}</p>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-xs text-zinc-400">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#ffd90f]" />
                <span>Garantía de activación digital y soporte directo por WhatsApp.</span>
              </div>
            </div>
          </section>

          {/* COLUMNA DERECHA: Panel de Compra y Reserva en la parte superior */}
          <aside className="rounded-3xl border border-[#ffd90f]/30 bg-zinc-900 p-6 shadow-[0_10px_35px_rgba(255,217,15,0.08)] backdrop-blur-md lg:sticky lg:top-28">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd90f]">Proceso de Pago</span>
                <h2 className="text-xl font-black text-white">Completa tu Pedido</h2>
              </div>
            </div>

            {/* 1. SELECCIÓN DE TIPO DE CUENTA (Sin descripciones largas) */}
            <div className="mt-5 space-y-2.5">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                1. Elige el tipo de cuenta:
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(accountOptions) as AccountType[]).map((type) => {
                  const option = accountOptions[type];
                  const isSelected = accountType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAccountType(type)}
                      className={`relative flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? "border-[#ffd90f] bg-[#ffd90f]/10 text-white shadow-[0_0_15px_rgba(255,217,15,0.15)]"
                          : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">{option.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#ffd90f] stroke-[3]" />}
                      </div>
                      <span className="text-sm font-black text-[#ffd90f]">${option.price} MXN</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SELECCIÓN DE MÉTODO DE PAGO */}
            <div className="mt-6 space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                2. Selecciona método de pago:
              </label>

              <div className="grid gap-2 sm:grid-cols-3">
                {/* Opción PayPal */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                    paymentMethod === "paypal"
                      ? "border-[#ffd90f] bg-[#ffd90f] text-zinc-950 font-black shadow-[0_0_15px_rgba(255,217,15,0.2)]"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 font-bold"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs">PayPal / Tarjeta</span>
                </button>

                {/* Opción OXXO */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("oxxo")}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                    paymentMethod === "oxxo"
                      ? "border-[#ffd90f] bg-[#ffd90f] text-zinc-950 font-black shadow-[0_0_15px_rgba(255,217,15,0.2)]"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 font-bold"
                  }`}
                >
                  <Landmark className="h-4 w-4" />
                  <span className="text-xs">OXXO / 7Eleven</span>
                </button>

                {/* Opción Transferencia */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("transferencia")}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                    paymentMethod === "transferencia"
                      ? "border-[#ffd90f] bg-[#ffd90f] text-zinc-950 font-black shadow-[0_0_15px_rgba(255,217,15,0.2)]"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 font-bold"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span className="text-xs">Transferencia</span>
                </button>
              </div>
            </div>

            {/* DETALLES DEL MÉTODO DE PAGO */}
            <div className="mt-5">
              {/* VISTA PAYPAL (Conectado a Checkout Directo) */}
              {paymentMethod === "paypal" && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400">Pago Directo</span>
                    <span className="text-[10px] font-black uppercase text-[#ffd90f]">Sin Caducidad</span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Al completar tu pago con PayPal, tu juego queda asegurado y guardado automáticamente. Al finalizar, enviarás tu comprobante a WhatsApp.
                  </p>

                  {/* Botones oficiales de PayPal SDK */}
                  <div className="pt-1">
                    <PayPalCheckoutButton
                      amount={selectedOption.price}
                      description={`${game.name} – ${selectedOption.label}`}
                      onSuccess={(details) => {
                        console.log("PayPal payment captured:", details);
                        setPaypalError(false);
                        handlePayPalPaymentSuccess();
                      }}
                      onCancel={() => {
                        console.log("PayPal payment cancelled by user");
                      }}
                      onError={(err) => {
                        console.error("PayPal error:", err);
                        setPaypalError(true);
                      }}
                    />
                    {paypalError && (
                      <p className="mt-2 text-xs text-red-400 text-center">
                        Ocurrió un error al procesar el pago. Inténtalo de nuevo.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* VISTA OXXO / 7ELEVEN */}
              {paymentMethod === "oxxo" && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Tienes un máximo de 4 horas para realizar el depósito y verificar tu boleto por WhatsApp.</span>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-zinc-400">Banco:</span>
                      <strong className="font-black text-white text-sm">BANCOPEL</strong>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-400 block">Número de Cuenta:</span>
                      <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                        <strong className="font-mono text-sm font-black text-[#ffd90f] tracking-wider">4169 1614 5560 1061</strong>
                        <button
                          type="button"
                          onClick={() => handleCopy("4169161455601061")}
                          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedText === "4169161455601061" ? "¡Copiado!" : "Copiar"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-zinc-400">Monto a depositar:</span>
                      <strong className="text-base font-black text-white">${formattedPrice} MXN</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA TRANSFERENCIA BANCARIA */}
              {paymentMethod === "transferencia" && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Tienes 4 horas para realizar la transferencia y verificar tu boleto enviando tu recibo.</span>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-zinc-400">Banco / Destino:</span>
                      <strong className="font-black text-white text-sm">BANCOPEL</strong>
                    </div>

                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-zinc-400">Titular:</span>
                      <strong className="font-black text-white text-sm">Pika Games</strong>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-400 block">CLABE Interbancaria:</span>
                      <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                        <strong className="font-mono text-xs sm:text-sm font-black text-[#ffd90f] tracking-wider">137888105075633395</strong>
                        <button
                          type="button"
                          onClick={() => handleCopy("137888105075633395")}
                          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold shrink-0 ml-2"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedText === "137888105075633395" ? "¡Copiado!" : "Copiar"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-zinc-400">Monto a transferir:</span>
                      <strong className="text-base font-black text-white">${formattedPrice} MXN</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RESUMEN DE TOTAL Y BOTÓN DE RESERVA (SOLO PARA OXXO Y TRANSFERENCIA) */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400">Total a Pagar</span>
                <span className="text-2xl font-black text-white">${formattedPrice} <small className="text-xs text-[#ffd90f]">MXN</small></span>
              </div>

              {paymentMethod !== "paypal" && (
                <button
                  type="button"
                  onClick={handleReserveClick}
                  className="w-full rounded-2xl bg-[#ffd90f] hover:bg-[#ffe45c] py-4 px-6 text-center font-black text-zinc-950 text-base shadow-[0_0_25px_rgba(255,217,15,0.2)] transition-all hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>Reservar Boleto</span>
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* MODAL DE RESERVA DE BOLETO (PARA OXXO / TRANSFERENCIA BANCARIA) */}
      <AnimatePresence>
        {isReservedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-zinc-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden my-auto p-6 sm:p-8"
            >
              <button
                type="button"
                onClick={() => setIsReservedModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
                </div>

                <div>
                  <span className="inline-block rounded-full bg-[#ffd90f]/10 border border-[#ffd90f]/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#ffd90f] mb-2">
                    ¡Reserva Registrada!
                  </span>
                  <h3 className="text-2xl font-black text-white">Boleto Reservado</h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Has apartado 1 boleto para <strong className="text-white">{game.name}</strong>
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left text-xs space-y-2.5">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Tipo de Cuenta:</span>
                    <strong className="font-bold text-white">{selectedOption.label}</strong>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Método de Pago:</span>
                    <strong className="font-bold text-[#ffd90f]">{paymentMethodLabels[paymentMethod]}</strong>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300 pt-2 border-t border-zinc-800">
                    <span>Monto Total:</span>
                    <strong className="text-sm font-black text-white">${formattedPrice} MXN</strong>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-left text-xs space-y-2">
                  <h4 className="font-black text-[#ffd90f] uppercase tracking-wider text-[11px]">Pasos para confirmar:</h4>
                  <ul className="space-y-1.5 text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="text-[#ffd90f] font-bold">1.</span>
                      <span>Realiza tu pago mediante {paymentMethodLabels[paymentMethod]}.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ffd90f] font-bold">2.</span>
                      <span>Toma captura o foto al comprobante de pago.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ffd90f] font-bold">3.</span>
                      <span>Envíanos el comprobante por WhatsApp dentro del tiempo límite (4 horas).</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={sendWhatsAppComprobante}
                  className="w-full rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] py-4 px-6 text-center font-black text-white text-sm shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  <Send className="h-4 w-4 fill-current" />
                  Enviar Comprobante por WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN POST-PAGO PAYPAL */}
      <AnimatePresence>
        {isPaypalPaid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-zinc-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden my-auto p-6 sm:p-8"
            >
              <button
                type="button"
                onClick={() => setIsPaypalPaid(false)}
                className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
                </div>

                <div>
                  <span className="inline-block rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400 mb-2">
                    ¡Pago Procesado!
                  </span>
                  <h3 className="text-2xl font-black text-white">Pago Exitoso con PayPal</h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Tu compra para <strong className="text-white">{game.name}</strong> ({selectedOption.label}) ha quedado guardada sin caducidad.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left text-xs space-y-2.5">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Método de Pago:</span>
                    <strong className="font-bold text-blue-400">PayPal / Tarjeta</strong>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Estado:</span>
                    <strong className="font-bold text-emerald-400">Pagado & Guardado</strong>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300 pt-2 border-t border-zinc-800">
                    <span>Monto Pagado:</span>
                    <strong className="text-sm font-black text-white">${formattedPrice} MXN</strong>
                  </div>
                </div>

                <p className="text-xs text-zinc-400">
                  Envía la confirmación por WhatsApp para coordinar la entrega o activación con un asesor:
                </p>

                <button
                  type="button"
                  onClick={sendWhatsAppComprobante}
                  className="w-full rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] py-4 px-6 text-center font-black text-white text-sm shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  <Send className="h-4 w-4 fill-current" />
                  Enviar Comprobante por WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}




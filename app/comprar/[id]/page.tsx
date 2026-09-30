"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Check, 
  Gamepad2, 
  Loader2, 
  Send, 
  Star, 
  X, 
  CreditCard,
  Landmark, 
  Clock,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { getGameDetails, type Game } from "@/lib/rawg";
import { motion } from "framer-motion";
import PayPalCheckoutButton, { type PayPalConfirmation } from "@/components/PayPalCheckoutButton";
import { useAuth } from "@/lib/AuthContext";
import { isDemoGameId } from "@/lib/demoGames";
import { apiFetch } from "@/lib/api";
import { AccessibleDialog } from "@/components/AccessibleDialog";

type AccountType = "principal" | "secundaria";
type PaymentMethod = "paypal" | "oxxo" | "transferencia";

const accountLabels: Record<AccountType, string> = {
  principal: "Cuenta Principal",
  secundaria: "Cuenta Secundaria",
};

type BackendProduct = {
  id: string;
  tipo_cuenta: AccountType;
  precio: string;
  disponible: boolean;
};

type BackendGame = {
  rawg_id: string;
  titulo: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  productos: BackendProduct[];
};


export default function ComprarJuegoPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const [paypalBusy, setPaypalBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<PayPalConfirmation | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountType, setAccountType] = useState<AccountType>("principal");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paypal");
  const [isPaypalPaid, setIsPaypalPaid] = useState(false);
  const [paypalError, setPaypalError] = useState(false);
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadGame() {
      const { id } = await params;
      if (isDemoGameId(id)) {
        if (active) setIsLoading(false);
        return;
      }
      const inventoryPromise = apiFetch(`/productos/rawg/${encodeURIComponent(id)}`)
        .then((data: BackendGame) => ({ data, error: "" }))
        .catch((error: unknown) => ({
          data: null,
          error: typeof error === "object" && error !== null && "status" in error && error.status === 404
            ? ""
            : "No se pudo comprobar la disponibilidad. Intenta de nuevo.",
        }));
      const [gameDetails, inventory] = await Promise.all([getGameDetails(id), inventoryPromise]);
      if (active) {
        const backendGame = inventory.data;
        setGame(gameDetails || (backendGame ? {
          id: Number(id), slug: "", name: backendGame.titulo,
          background_image: backendGame.imagen_url || "", rating: 0, released: "", platforms: [],
          description_raw: backendGame.descripcion || undefined,
        } : null));
        const availableProducts = backendGame?.productos.filter((product) =>
          ["principal", "secundaria"].includes(product.tipo_cuenta)) || [];
        setProducts(availableProducts);
        setCatalogError(inventory.error);
        if (availableProducts.length) setAccountType(availableProducts[0].tipo_cuenta);
        setIsLoading(false);
      }
    }

    loadGame();
    return () => {
      active = false;
    };
  }, [params, loadAttempt]);

  const selectedProduct = products.find((product) => product.tipo_cuenta === accountType);
  const selectedLabel = accountLabels[accountType];
  const displayedPrice = Number(selectedProduct?.precio);
  const formattedPrice = Number.isFinite(displayedPrice) ? displayedPrice.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) : accountType === "secundaria" ? "260.00" : "—";
  const availableProducts = products.filter((product) => product.disponible && Number.isFinite(Number(product.precio)));
  const startingPrice = availableProducts.length
    ? Math.min(...availableProducts.map((product) => Number(product.precio))).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    paypal: "PayPal / Tarjeta",
    oxxo: "OXXO o 7Eleven",
    transferencia: "Transferencia SPEI",
  };

  const sendWhatsAppComprobante = () => {
    if (!game) return;
    const message = paymentMethod === "paypal"
      ? `Hola Pikagames, he completado mi pago por PayPal para "${game.name}" (${selectedLabel} - $${confirmation?.total} MXN). Pedido #${confirmation?.pedidoId}, captura ${confirmation?.captureId}. Solicito coordinar la entrega.`
      : `Hola PikaGames, quiero comprar "${game.name}" (${selectedLabel}) por ${paymentMethodLabels[paymentMethod]}. Precio: $${formattedPrice} MXN. Enlace: ${window.location.href}. Haré el ${paymentMethod === "oxxo" ? "depósito" : "la transferencia"} y enviaré el comprobante por aquí.`;
    
    window.open(`https://wa.me/528136975487?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <main id="main-content" className="min-h-screen bg-[#111311] pt-28 text-zinc-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-32 text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#ffd90f]" />
          <p className="font-bold">Cargando detalles del juego...</p>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main id="main-content" className="min-h-screen bg-[#111311] pt-28 text-zinc-100">
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
    <main id="main-content" className="min-h-screen bg-[#111311] pb-[calc(6rem+env(safe-area-inset-bottom))] pt-24 text-zinc-100 lg:pb-24 md:pt-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link href="/catalogo" className="mb-6 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-[#ffd90f] hover:text-[#ffd90f]">
          <ArrowLeft className="h-4 w-4" /> Volver al catálogo
        </Link>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section aria-labelledby="product-title" className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-2xl">
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
              {game.background_image ? (
                <img src={game.background_image} alt={game.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-600">
                  <Gamepad2 className="h-16 w-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd90f]/10 px-3 py-1 text-xs font-bold text-[#ffd90f]">
                  <Gamepad2 className="size-4" /> Nintendo Switch
                </span>
                {game.rating > 0 && <span className="text-xs font-bold text-zinc-400"><Star className="mr-1 inline size-3.5 fill-[#ffd90f] text-[#ffd90f]" />{game.rating.toFixed(1)}</span>}
              </div>
              <h1 id="product-title" className="mt-3 text-balance text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl">{game.name}</h1>
              {game.genres && game.genres.length > 0 && <p className="mt-2 text-sm text-zinc-400">{game.genres.map((g) => g.name).join(" · ")}</p>}
            </div>
          </section>

          <aside aria-labelledby="purchase-title" className="rounded-3xl border border-[#ffd90f]/30 bg-zinc-900 p-5 shadow-[0_10px_35px_rgba(255,217,15,0.08)] sm:p-7">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd90f]">Proceso de Pago</span>
                <h2 id="purchase-title" className="text-xl font-black text-white">Completa tu Pedido</h2>
              </div>
            </div>

            <section aria-labelledby="availability-title" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
              <div>
                <h3 id="availability-title" className="text-sm font-bold text-white">Precio y disponibilidad</h3>
                <p className="mt-1 text-xs text-zinc-400">Videojuego digital con disponibilidad ilimitada</p>
              </div>
              {startingPrice && <p className="text-lg font-black tabular-nums text-[#ffd90f]">Desde ${startingPrice} MXN</p>}
            </section>

            <section aria-labelledby="account-types-title" className="mt-5 space-y-2.5">
              <h3 id="account-types-title" className="text-xs font-black uppercase tracking-wider text-zinc-300">1. Elige el tipo de cuenta:</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(accountLabels) as AccountType[]).map((type) => {
                  const product = products.find((item) => item.tipo_cuenta === type);
                  const isSelected = accountType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={paypalBusy || isPaypalPaid}
                      onClick={() => setAccountType(type)}
                      className={`relative flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? "border-[#ffd90f] bg-[#ffd90f]/10 text-white shadow-[0_0_15px_rgba(255,217,15,0.15)]"
                          : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">{accountLabels[type]}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#ffd90f] stroke-[3]" />}
                      </div>
                      {(product?.disponible || type === "secundaria") && <span className="text-sm font-black text-[#ffd90f]">${Number(product?.precio ?? 260).toLocaleString("es-MX")} MXN</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            <details className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <summary className="cursor-pointer text-sm font-bold text-zinc-200 focus-visible:outline-2 focus-visible:outline-[#ffd90f]">Diferencias entre modalidades</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <p className="text-xs leading-relaxed text-zinc-300"><strong className="text-[#ffd90f]">Principal:</strong> el producto se entrega bajo esta modalidad. Consulta con soporte los perfiles compatibles y requisitos para tu consola.</p>
                <p className="text-xs leading-relaxed text-zinc-300"><strong className="text-[#ffd90f]">Secundaria:</strong> el producto se entrega bajo esta modalidad. Consulta con soporte los requisitos de acceso y conexión para tu consola.</p>
              </div>
            </details>

            {/* 2. SELECCIÓN DE MÉTODO DE PAGO */}
            <div className="mt-6 space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                2. Selecciona método de pago:
              </label>

              <div className="grid gap-2 sm:grid-cols-3">
                {/* Opción PayPal */}
                <button
                  type="button"
                  disabled={paypalBusy || isPaypalPaid}
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
                  disabled={paypalBusy || isPaypalPaid}
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
                  disabled={paypalBusy || isPaypalPaid}
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
                    <span className="text-xs font-bold text-zinc-400">PayPal / Tarjeta</span>
                    <span className="text-[10px] font-black uppercase text-[#ffd90f]">Pago único</span>
                  </div>

                  {/* Botones oficiales de PayPal SDK */}
                  <div className="pt-1">
                    {!selectedProduct?.disponible ? (
                      <p role="status" className="text-xs text-amber-400">Este tipo de cuenta no está disponible.</p>
                    ) : !user ? (
                      <p role="status" className="text-xs text-amber-400">Inicia sesión para pagar tu pedido.</p>
                    ) : (
                      <PayPalCheckoutButton
                        key={`${user.id}:${selectedProduct?.id || accountType}`}
                        productId={selectedProduct?.id || ""}
                        userId={user.id}
                        onBusy={setPaypalBusy}
                        onSuccess={(details) => {
                          setConfirmation(details);
                          setPaypalError(false);
                          setIsPaypalPaid(true);
                        }}
                        onError={() => setPaypalError(true)}
                      />
                    )}
                    {paypalError && (
                      <p className="mt-2 text-xs text-red-400 text-center">
                        No se confirmó el pago. Verifica el mismo pedido antes de intentar otra compra.
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
                    <span>Realiza el depósito y envíanos el comprobante por WhatsApp para coordinar la entrega.</span>
                  </div>

                  <p className="text-xs text-zinc-300">WhatsApp abrirá el mensaje con el título, modalidad y enlace del juego.</p>
                </div>
              )}

              {/* VISTA TRANSFERENCIA BANCARIA */}
              {paymentMethod === "transferencia" && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Realiza la transferencia y envíanos el comprobante por WhatsApp para coordinar la entrega.</span>
                  </div>

                  <p className="text-xs text-zinc-300">WhatsApp abrirá el mensaje con el título, modalidad y enlace del juego.</p>
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
                  onClick={sendWhatsAppComprobante}
                  className="w-full rounded-2xl bg-[#ffd90f] hover:bg-[#ffe45c] py-4 px-6 text-center font-black text-zinc-950 text-base shadow-[0_0_25px_rgba(255,217,15,0.2)] transition-all hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>Continuar por WhatsApp</span>
                  <Send className="h-4 w-4" />
                </button>
              )}
              {catalogError && (
                <div role="alert" className="mt-3 text-center text-xs text-red-400">
                  <p>{catalogError}</p>
                  <button type="button" className="mt-1 underline" onClick={() => { setIsLoading(true); setLoadAttempt((value) => value + 1); }}>Reintentar</button>
                </div>
              )}
            </div>
          </aside>

          <section aria-labelledby="purchase-details-title" className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-7 lg:col-span-2">
            <h2 id="purchase-details-title" className="text-lg font-black text-white">Antes de comprar</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><h3 className="text-sm font-bold text-[#ffd90f]">Entrega</h3><p className="mt-1 text-sm leading-relaxed text-zinc-300">Producto digital. La entrega se coordina después de confirmar el pago.</p></div>
              <div><h3 className="text-sm font-bold text-[#ffd90f]">Región</h3><p className="mt-1 text-sm leading-relaxed text-zinc-300">Confirma con soporte que la región sea compatible con tu consola antes de comprar.</p></div>
              <div><h3 className="text-sm font-bold text-[#ffd90f]">Idioma</h3><p className="mt-1 text-sm leading-relaxed text-zinc-300">El idioma depende de la versión del título. Confírmalo con soporte antes de comprar.</p></div>
              <div><h3 className="text-sm font-bold text-[#ffd90f]">Soporte</h3><a href="https://wa.me/528136975487" target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 items-center text-sm font-bold text-zinc-200 underline underline-offset-4 hover:text-[#ffd90f] focus-visible:outline-2 focus-visible:outline-[#ffd90f]">Resolver dudas por WhatsApp</a></div>
            </div>
          </section>

          <details className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-7 lg:col-span-2">
            <summary className="cursor-pointer text-lg font-black text-white focus-visible:outline-2 focus-visible:outline-[#ffd90f]">Descripción completa del juego</summary>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{game.description_raw || `Conoce ${game.name}, disponible para Nintendo Switch.`}</p>
          </details>
        </div>
      </div>

      {/* MODAL DE RESERVA DE BOLETO (PARA OXXO / TRANSFERENCIA BANCARIA) */}
      {/* MODAL DE CONFIRMACIÓN POST-PAGO PAYPAL */}
      {isPaypalPaid && (
          <AccessibleDialog open={isPaypalPaid} title="Pago exitoso con PayPal" description={`Pago confirmado para ${game.name}`} onClose={() => setIsPaypalPaid(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden my-auto p-6 sm:p-8"
            >
              <button
                type="button"
                onClick={() => setIsPaypalPaid(false)}
                aria-label="Cerrar confirmación de PayPal"
                className="absolute top-5 right-5 size-11 flex items-center justify-center text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
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
                    Tu compra para <strong className="text-white">{game.name}</strong> ({selectedLabel}) ha quedado registrada. La entrega está pendiente.
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
                    <strong className="text-sm font-black text-white">${confirmation?.total} MXN</strong>
                  </div>
                </div>

                <p className="text-xs text-zinc-400">
                  Pedido #{confirmation?.pedidoId} · Captura {confirmation?.captureId}. Envía la confirmación por WhatsApp para coordinar la entrega:
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
          </AccessibleDialog>
      )}
    </main>
  );
}

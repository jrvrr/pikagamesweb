"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Gift,
  AtSign,
  Loader2,
  Send,
  ShieldCheck,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import PayPalCheckoutButton, { type PayPalConfirmation } from "@/components/PayPalCheckoutButton";
import { AuthModal } from "@/components/AuthModal";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import {
  estadoLabel,
  estadoTone,
  formatFecha,
  money,
  publicacionMetrica,
  sorteoCerrado,
  type Sorteo,
} from "@/lib/sorteos";

type Metodo = "paypal" | "oxxo" | "transferencia";
type OrdenCreada = {
  pedido_id: string;
  total: string;
  metodo_pago: Metodo;
  estado: string;
  boletos: { id: string; numero: number; estado: string }[];
};

const metodoLabel: Record<Metodo, string> = {
  paypal: "PayPal / Tarjeta",
  oxxo: "OXXO o 7Eleven",
  transferencia: "Transferencia SPEI",
};

export function RifaDetalleClient({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [sorteo, setSorteo] = useState<Sorteo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [metodo, setMetodo] = useState<Metodo>("paypal");
  const [buying, setBuying] = useState(false);
  const [paypalBusy, setPaypalBusy] = useState(false);
  const [orden, setOrden] = useState<OrdenCreada | null>(null);
  const requestIds = useRef<Record<string, string>>({});

  useEffect(() => {
    setOrden(null);
    setNotice("");
    setError("");
  }, [cantidad, metodo]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/sorteos/${encodeURIComponent(slug)}`);
      setSorteo(data?.sorteo || null);
    } catch {
      setError("No se pudo cargar la rifa. Puede que ya no esté disponible.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  const crearOrden = useCallback(async (metodoPago: Metodo) => {
    if (!user) {
      setAuthOpen(true);
      throw new Error("Inicia sesión para comprar boletos.");
    }
    if (!sorteo) throw new Error("Rifa no disponible.");
    const requestKey = `${sorteo.id}:${cantidad}:${metodoPago}`;
    const requestId = requestIds.current[requestKey] ||= crypto.randomUUID();
    const result = await apiFetch(`/sorteos/${sorteo.id}/comprar`, {
      method: "POST",
      body: JSON.stringify({
        request_id: requestId,
        cantidad,
        metodo_pago: metodoPago,
      }),
    });
    const creada: OrdenCreada = {
      pedido_id: String(result.pedido_id),
      total: String(result.total),
      metodo_pago: result.metodo_pago,
      estado: result.estado,
      boletos: Array.isArray(result.boletos) ? result.boletos : [],
    };
    setOrden(creada);
    return creada.pedido_id;
  }, [cantidad, sorteo, user]);

  const comprarManual = async () => {
    setBuying(true);
    setError("");
    setNotice("");
    try {
      await crearOrden(metodo);
      setNotice(`Reserva creada. Envía tu comprobante por WhatsApp para confirmar los boletos.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la reserva.");
    } finally {
      setBuying(false);
    }
  };

  const onPayPalSuccess = (confirmation: PayPalConfirmation) => {
    setNotice(`Pago confirmado. Pedido #${confirmation.pedidoId}. Tus boletos quedaron pagados.`);
    setOrden((current) => current ? { ...current, estado: "pagado" } : current);
    void load();
  };

  const publicaciones = useMemo(() => sorteo?.publicaciones || [], [sorteo]);
  const esBoletos = sorteo?.tipo === "boletos";
  const restantes = sorteo?.boletos_max ? Math.max(sorteo.boletos_max - sorteo.boletos_pagados, 0) : null;
  const cerrado = sorteo ? sorteoCerrado(sorteo) : false;
  const puedeComprar = Boolean(sorteo && esBoletos && ["activo", "programado"].includes(sorteo.estado) && !cerrado && (restantes === null || restantes > 0));
  const maxMetrica = useMemo(() => Math.max(0, ...publicaciones.map((publicacion) => publicacionMetrica(publicacion, sorteo?.criterio_comparacion || "comentarios"))), [publicaciones, sorteo?.criterio_comparacion]);

  if (loading) {
    return <main id="main-content" className="flex min-h-dvh items-center justify-center bg-[#111311] pt-24"><Loader2 className="size-10 animate-spin text-[#ffd90f]" /></main>;
  }

  if (!sorteo) {
    return <main id="main-content" className="min-h-dvh bg-[#111311] px-4 pb-24 pt-24 text-zinc-200 md:px-6 md:pt-28"><div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center"><Gift className="mx-auto size-12 text-zinc-600" /><h1 className="mt-4 text-2xl font-black text-white">Rifa no encontrada</h1><p className="mt-2 text-sm text-zinc-400">{error || "Esta rifa no está publicada."}</p><Link href="/rifas" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ffd90f] px-4 text-sm font-bold text-zinc-950"><ArrowLeft className="size-4" /> Volver a rifas</Link></div></main>;
  }

  return <main id="main-content" className="min-h-dvh bg-[#111311] px-4 pb-24 pt-24 text-zinc-200 md:px-6 md:pt-28">
    <div className="mx-auto max-w-6xl">
      <Link href="/rifas" className="mb-5 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-[#ffd90f] hover:text-[#ffd90f]"><ArrowLeft className="size-4" /> Volver a rifas</Link>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
            <div className="relative aspect-[16/9] bg-zinc-800">
              {sorteo.imagen_url ? <img src={sorteo.imagen_url} alt={sorteo.titulo} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-950"><Gift className="size-20 text-zinc-700" /></div>}
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold backdrop-blur", estadoTone[sorteo.estado])}>{estadoLabel[sorteo.estado]}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-semibold text-zinc-200 backdrop-blur">{esBoletos ? <Ticket className="size-3.5" /> : <AtSign className="size-3.5" />} {esBoletos ? "Rifa con boletos" : "Sorteo gratis"}</span>
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <h1 className="text-balance text-3xl font-black text-white sm:text-4xl">{sorteo.titulo}</h1>
              {sorteo.premio && <p className="mt-2 text-lg font-semibold text-[#ffd90f]">{sorteo.premio}</p>}
              {sorteo.descripcion && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{sorteo.descripcion}</p>}
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-zinc-400">
                <span className="inline-flex items-center gap-1.5"><Users className="size-4" /> {esBoletos ? `${sorteo.boletos_pagados} boletos pagados` : `${sorteo.total_participantes} participantes`}</span>
                <span className="inline-flex items-center gap-1.5"><Trophy className="size-4" /> {sorteo.num_ganadores} ganador{sorteo.num_ganadores === 1 ? "" : "es"}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-4" /> {sorteo.fecha_sorteo ? formatFecha(sorteo.fecha_sorteo) : "Fecha por definir"}</span>
              </div>
            </div>
          </section>

          {sorteo.ganadores.length > 0 && <section aria-labelledby="ganadores-title" className="rounded-3xl border border-[#ffd90f]/30 bg-zinc-900 p-5 sm:p-7">
            <h2 id="ganadores-title" className="flex items-center gap-2 text-xl font-black text-white"><Trophy className="size-5 text-[#ffd90f]" /> Ganadores</h2>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {sorteo.ganadores.map((ganador) => <li key={ganador.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ffd90f] text-sm font-black text-zinc-950">{ganador.posicion}</span>
                <div className="min-w-0"><p className="truncate font-bold text-white">{ganador.nombre}</p><p className="truncate text-xs text-zinc-500">{ganador.username ? `@${ganador.username.replace(/^@/, "")}` : ganador.premio || "Participante"}</p></div>
              </li>)}
            </ol>
          </section>}

          {publicaciones.length > 0 && <section aria-labelledby="publicaciones-title" className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
            <h2 id="publicaciones-title" className="text-xl font-black text-white">Publicaciones del sorteo</h2>
            <p className="mt-1 text-sm text-zinc-400">Los participantes se unen de todas las publicaciones y los usuarios repetidos cuentan una sola vez.</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full min-w-[520px] text-left text-sm">
                <caption className="sr-only">Comparativa de publicaciones del sorteo</caption>
                <thead className="bg-zinc-950 text-xs uppercase text-zinc-500"><tr><th scope="col" className="px-3 py-2 font-semibold">Publicación</th><th scope="col" className="px-3 py-2 text-right font-semibold">Likes</th><th scope="col" className="px-3 py-2 text-right font-semibold">Comentarios</th><th scope="col" className="px-3 py-2 text-right font-semibold">Ver</th></tr></thead>
                <tbody className="divide-y divide-zinc-800">{publicaciones.map((publicacion) => <tr key={publicacion.id} className={cn(publicacionMetrica(publicacion, sorteo.criterio_comparacion) === maxMetrica && maxMetrica > 0 && "bg-[#ffd90f]/5")}>
                  <th scope="row" className="max-w-[220px] truncate px-3 py-2 font-medium text-zinc-200">@{publicacion.autor || publicacion.shortcode}</th>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{publicacion.likes.toLocaleString("es-MX")}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{publicacion.comentarios.toLocaleString("es-MX")}</td>
                  <td className="px-3 py-2 text-right"><a href={publicacion.url} target="_blank" rel="noreferrer" className="inline-flex text-[#ffd90f] underline underline-offset-2">Abrir <ExternalLink className="ml-1 size-3.5" /></a></td>
                </tr>)}</tbody>
              </table>
            </div>
          </section>}

          {(sorteo.reglas || sorteo.tipo === "instagram") && <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
            <h2 className="text-xl font-black text-white">Bases y participación</h2>
            {sorteo.reglas && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{sorteo.reglas}</p>}
            {sorteo.tipo === "instagram" && <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <p className="flex items-center gap-2 font-bold text-white"><AtSign className="size-4" /> Participa comentando en Instagram</p>
              <p className="mt-2 text-zinc-400">Comenta en cualquiera de las publicaciones del sorteo. Los comentarios se sincronizan o importan antes de realizar el sorteo.</p>
              <div className="mt-3 flex flex-wrap gap-2">{publicaciones.map((publicacion) => <a key={publicacion.id} href={publicacion.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-800">Abrir publicación <ExternalLink className="size-3.5" /></a>)}</div>
            </div>}
          </section>}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <h2 className="text-lg font-black text-white">{esBoletos ? "Compra tus boletos" : "Participa gratis"}</h2>
            {esBoletos ? <>
              <p className="mt-1 text-sm text-zinc-400">Cada boleto tiene un número único. El sorteo se realiza entre los boletos pagados.</p>
              <div className="mt-4 flex items-end justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div><p className="text-xs uppercase text-zinc-500">Precio por boleto</p><p className="text-2xl font-black text-[#ffd90f]">{money(sorteo.precio_boleto)}</p></div>
                {restantes !== null && <p className="text-xs text-zinc-400">{restantes} disponibles</p>}
              </div>
              {!puedeComprar ? <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100/80">{sorteo.estado === "sorteado" ? "Esta rifa ya terminó. Revisa los ganadores." : cerrado ? "La venta de boletos cerró." : restantes === 0 ? "Ya no quedan boletos disponibles." : "La venta de boletos no está disponible."}</div> : <>
                <label className="mt-4 block text-sm text-zinc-300">Cantidad de boletos
                  <select value={cantidad} onChange={(event) => setCantidad(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-[#ffd90f] focus:outline-none">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((value) => restantes === null || value <= restantes).map((value) => <option key={value} value={value}>{value} boleto{value === 1 ? "" : "s"} · {money(Number(sorteo.precio_boleto) * value)}</option>)}</select>
                </label>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(Object.keys(metodoLabel) as Metodo[]).map((value) => <button key={value} type="button" onClick={() => setMetodo(value)} className={cn("rounded-xl border px-2 py-2 text-xs font-bold", metodo === value ? "border-[#ffd90f] bg-[#ffd90f]/10 text-[#ffd90f]" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800")}>{metodoLabel[value]}</button>)}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-950 p-3 text-sm"><span className="text-zinc-400">Total</span><strong className="text-xl text-white">{money(Number(sorteo.precio_boleto) * cantidad)}</strong></div>

                {!user ? <button type="button" onClick={() => setAuthOpen(true)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffd90f] px-4 text-sm font-black text-zinc-950 hover:bg-[#e5c30d]"><ShieldCheck className="size-4" /> Inicia sesión para comprar</button>
                  : metodo === "paypal" ? <div className="mt-4">
                    <PayPalCheckoutButton key={`${sorteo.id}-${cantidad}`} productId={`sorteo-${sorteo.id}-${cantidad}`} userId={user.id} createPedido={() => crearOrden("paypal")} onBusy={setPaypalBusy} onSuccess={onPayPalSuccess} onError={() => setError("No se pudo completar el pago con PayPal.")} />
                    {paypalBusy && <p className="mt-2 text-xs text-zinc-400">Procesando pago…</p>}
                  </div> : <button type="button" onClick={() => void comprarManual()} disabled={buying} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffd90f] px-4 text-sm font-black text-zinc-950 hover:bg-[#e5c30d] disabled:opacity-60">{buying ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Reservar y pagar por {metodoLabel[metodo]}</button>}

                {orden && <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3 text-sm text-emerald-100">
                  <p className="flex items-center gap-2 font-bold"><CheckCircle2 className="size-4" /> Pedido #{orden.pedido_id}</p>
                  <p className="mt-1 text-xs text-emerald-100/80">Boletos: {orden.boletos.map((boleto) => `#${boleto.numero}`).join(", ") || "—"}</p>
                  <p className="mt-1 text-xs text-emerald-100/80">Estado: {orden.estado === "pendiente_pago" ? "Pendiente de pago" : orden.estado} · Total {money(orden.total)}</p>
                  {orden.metodo_pago !== "paypal" && <a href={`https://wa.me/528136975457?text=${encodeURIComponent(`Hola PikaGames, reservé ${orden.boletos.length} boleto(s) para "${sorteo.titulo}". Pedido #${orden.pedido_id}, total $${orden.total} MXN. Adjunto mi comprobante.`)}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#177245] px-3 text-xs font-bold text-white hover:bg-[#135f3a]"><Send className="size-3.5" /> Enviar comprobante por WhatsApp</a>}
                </div>}
              </>}
            </> : <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <p className="flex items-center gap-2 font-bold text-white"><AtSign className="size-4" /> Comenta y participa</p>
              <p className="mt-2 text-zinc-400">No necesitas pagar. Comenta en las publicaciones del sorteo y espera la fecha del resultado.</p>
              {publicaciones.length > 0 && <a href={publicaciones[0].url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ffd90f] px-4 text-sm font-bold text-zinc-950 hover:bg-[#e5c30d]"><AtSign className="size-4" /> Ir a la publicación</a>}
            </div>}
            {notice && <p role="status" className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-100">{notice}</p>}
            {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-100">{error}</p>}
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
            <h2 className="text-base font-black text-white">Información del sorteo</h2>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-3"><dt>Modalidad</dt><dd className="text-right text-zinc-200">{esBoletos ? "Boletos de pago" : "Gratis por comentarios"}</dd></div>
              <div className="flex justify-between gap-3"><dt>Ganadores</dt><dd className="text-right text-zinc-200">{sorteo.num_ganadores}</dd></div>
              <div className="flex justify-between gap-3"><dt>Fecha</dt><dd className="text-right text-zinc-200">{sorteo.fecha_sorteo ? formatFecha(sorteo.fecha_sorteo) : "Por definir"}</dd></div>
              {sorteo.resultado_hash && <div className="flex justify-between gap-3"><dt>Hash</dt><dd className="max-w-[180px] break-all text-right text-[10px] text-zinc-500">{sorteo.resultado_hash}</dd></div>}
            </dl>
          </section>
        </aside>
      </div>
    </div>

    <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
  </main>;
}

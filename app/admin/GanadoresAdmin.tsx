"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Ticket,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  estadoLabel,
  estadoSorteoListo,
  estadoTone,
  formatFecha,
  type Sorteo,
} from "@/lib/sorteos";

export function GanadoresAdmin({ onOpenSorteos }: { onOpenSorteos: () => void }) {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/sorteos/admin");
      setSorteos(Array.isArray(data?.sorteos) ? data.sorteos : []);
    } catch {
      setError("No se pudieron cargar los sorteos. Verifica tu sesión e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const listos = useMemo(() => sorteos.filter((sorteo) => sorteo.estado !== "borrador" && sorteo.estado !== "cancelado"), [sorteos]);

  const sortear = async (sorteo: Sorteo) => {
    const yaSorteado = sorteo.estado === "sorteado" && sorteo.ganadores.length > 0;
    if (yaSorteado && !window.confirm("Este sorteo ya tiene ganadores. ¿Quieres volver a sortear? Se reemplazarán los ganadores actuales.")) return;
    setBusyId(sorteo.id);
    setError("");
    setNotice("");
    try {
      const result = await apiFetch(`/sorteos/admin/${sorteo.id}/sortear`, {
        method: "POST",
        body: JSON.stringify({ force: yaSorteado }),
      });
      const ganadores = Array.isArray(result?.ganadores) ? result.ganadores.length : 0;
      setNotice(result?.sorteado === false ? "El sorteo ya estaba realizado." : `Sorteo realizado: ${ganadores} ganador${ganadores === 1 ? "" : "es"}. Revisa y publica el resultado.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo realizar el sorteo.");
    } finally {
      setBusyId(null);
    }
  };

  const publicar = async (sorteo: Sorteo, publicado: boolean) => {
    setBusyId(sorteo.id);
    setError("");
    setNotice("");
    try {
      await apiFetch(`/sorteos/admin/${sorteo.id}/publicar-ganadores`, {
        method: "POST",
        body: JSON.stringify({ publicado }),
      });
      setNotice(publicado ? "Ganadores publicados en /rifas." : "Ganadores ocultos en /rifas.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron publicar los ganadores.");
    } finally {
      setBusyId(null);
    }
  };

  return <div className="space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#ffd90f]">Obtén ganadores</p>
        <h2 className="mt-1 text-2xl font-black text-white">Resultados y programación</h2>
        <p className="mt-1 text-sm text-zinc-400">Ejecuta el sorteo, revisa los ganadores y decide cuándo mostrarlos en /rifas.</p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"><RefreshCw className={cn("size-4", loading && "animate-spin")} /> Actualizar</button>
        <button type="button" onClick={onOpenSorteos} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ffd90f] px-4 text-sm font-bold text-zinc-950 hover:bg-[#e5c30d]"><Trophy className="size-4" /> Ir a sorteos</button>
      </div>
    </header>

    {error && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Cerrar error" className="rounded p-1 hover:bg-rose-400/10"><X className="size-4" /></button></div>}
    {notice && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Cerrar aviso" className="rounded p-1 hover:bg-emerald-400/10"><X className="size-4" /></button></div>}

    {loading ? <div className="space-y-3"><div className="h-40 animate-pulse rounded-2xl bg-zinc-900" /><div className="h-40 animate-pulse rounded-2xl bg-zinc-900" /></div>
      : listos.length === 0 ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center"><Trophy className="mx-auto size-9 text-zinc-600" /><p className="mt-3 text-sm text-zinc-400">No hay sorteos publicados o programados. Crea uno en la pestaña “Sorteos”.</p></div>
      : <div className="grid gap-4 xl:grid-cols-2">{listos.map((sorteo) => {
        const listo = estadoSorteoListo(sorteo);
        const pool = sorteo.tipo === "boletos" ? sorteo.boletos_pagados : sorteo.total_participantes;
        return <section key={sorteo.id} className="rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-bold text-white">{sorteo.titulo}</h3>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", estadoTone[sorteo.estado])}>{estadoLabel[sorteo.estado]}</span>
                  {listo && sorteo.estado !== "sorteado" && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">Listo para sortear</span>}
                </div>
                <p className="mt-2 text-sm text-zinc-400">{sorteo.tipo === "boletos" ? <span className="inline-flex items-center gap-1"><Ticket className="size-3.5" /> {pool} boletos pagados de {sorteo.total_boletos}</span> : <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {pool} participantes</span>} · {sorteo.num_ganadores} ganador{sorteo.num_ganadores === 1 ? "" : "es"}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500"><CalendarClock className="size-3.5" /> {sorteo.fecha_sorteo ? formatFecha(sorteo.fecha_sorteo) : "Sin fecha programada"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void sortear(sorteo)} disabled={busyId === sorteo.id || pool === 0} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#ffd90f] px-3 text-sm font-bold text-zinc-950 hover:bg-[#e5c30d] disabled:opacity-50">{busyId === sorteo.id ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />} {sorteo.estado === "sorteado" ? "Volver a sortear" : "Obtener ganadores"}</button>
                {sorteo.ganadores.length > 0 && <button type="button" onClick={() => void publicar(sorteo, !sorteo.ganadores_publicados)} disabled={busyId === sorteo.id} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60">{sorteo.ganadores_publicados ? <EyeOff className="size-4" /> : <Eye className="size-4" />} {sorteo.ganadores_publicados ? "Ocultar" : "Publicar"}</button>}
              </div>
            </div>
            {pool === 0 && <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-2 text-xs text-amber-100/80">{sorteo.tipo === "boletos" ? "Aún no hay boletos pagados. El sorteo no puede ejecutarse." : "Aún no hay participantes. Sincroniza o importa los comentarios."}</p>}
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white">Ganadores</h4>
              {sorteo.ganadores.length > 0 && <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", sorteo.ganadores_publicados ? "bg-emerald-400/10 text-emerald-200" : "bg-zinc-800 text-zinc-400")}>{sorteo.ganadores_publicados ? "Publicados" : "Ocultos"}</span>}
            </div>
            {sorteo.ganadores.length === 0 ? <p className="mt-2 text-sm text-zinc-500">Todavía no se ha ejecutado el sorteo.</p> : <ol className="mt-3 space-y-2">
              {sorteo.ganadores.map((ganador) => <li key={ganador.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ffd90f] text-sm font-black text-zinc-950">{ganador.posicion}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{ganador.nombre}</p>
                  <p className="truncate text-xs text-zinc-500">{ganador.username ? `@${ganador.username.replace(/^@/, "")}` : ganador.boleto_id ? `Boleto #${ganador.boleto_id}` : "Participante"}{ganador.premio ? ` · ${ganador.premio}` : ""}</p>
                </div>
                <Check className="size-4 shrink-0 text-emerald-300" />
              </li>)}
            </ol>}
            {sorteo.resultado_hash && <p className="mt-3 break-all text-[10px] text-zinc-600">Hash: {sorteo.resultado_hash}</p>}
          </div>
        </section>;
      })}</div>}
  </div>;
}

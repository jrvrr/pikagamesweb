"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Gift,
  AtSign,
  RefreshCw,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { estadoLabel, estadoTone, formatFecha, money, type Sorteo } from "@/lib/sorteos";

type Filtro = "activas" | "finalizadas" | "todas";

export function RifasClient() {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("activas");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/sorteos");
      setSorteos(Array.isArray(data?.sorteos) ? data.sorteos : []);
    } catch {
      setError("No se pudieron cargar las rifas. Intenta de nuevo en unos momentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtrados = useMemo(() => sorteos.filter((sorteo) => {
    if (filtro === "activas") return ["activo", "programado"].includes(sorteo.estado);
    if (filtro === "finalizadas") return sorteo.estado === "sorteado";
    return true;
  }), [sorteos, filtro]);

  return <main id="main-content" className="min-h-dvh bg-[#111311] px-4 pb-24 pt-24 text-zinc-200 md:px-6 md:pt-28">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#ffd90f]/30 bg-[#ffd90f]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#ffd90f]"><Gift className="size-3.5" /> Rifas PikaGames</p>
          <h1 className="mt-3 text-balance text-4xl font-black text-white sm:text-5xl">Sorteos y rifas</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Participa gratis comentando en Instagram o compra boletos numerados para las rifas con premio. Aquí publicamos bases, fechas y ganadores.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 disabled:opacity-60"><RefreshCw className={cn("size-4", loading && "animate-spin")} /> Actualizar</button>
      </header>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar rifas">
        {([{ id: "activas", label: "Activas" }, { id: "finalizadas", label: "Finalizadas" }, { id: "todas", label: "Todas" }] as const).map((item) => <button key={item.id} type="button" role="tab" aria-selected={filtro === item.id} onClick={() => setFiltro(item.id)} className={cn("min-h-10 rounded-full px-4 text-sm font-bold transition-colors", filtro === item.id ? "bg-[#ffd90f] text-zinc-950" : "border border-zinc-700 text-zinc-300 hover:bg-zinc-900")}>{item.label}</button>)}
      </div>

      {error && <div role="alert" className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>}

      {loading ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="h-72 animate-pulse rounded-2xl bg-zinc-900" /><div className="h-72 animate-pulse rounded-2xl bg-zinc-900" /><div className="h-72 animate-pulse rounded-2xl bg-zinc-900" /></div>
        : filtrados.length === 0 ? <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center"><Trophy className="mx-auto size-10 text-zinc-600" /><h2 className="mt-3 text-lg font-bold text-white">No hay rifas en esta categoría</h2><p className="mt-2 text-sm text-zinc-400">Vuelve pronto o revisa las rifas finalizadas.</p></div>
        : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtrados.map((sorteo) => <RifaCard key={sorteo.id} sorteo={sorteo} />)}</div>}
    </div>
  </main>;
}

function RifaCard({ sorteo }: { sorteo: Sorteo }) {
  const esBoletos = sorteo.tipo === "boletos";
  const pool = esBoletos ? sorteo.boletos_pagados : sorteo.total_participantes;
  return <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-600">
    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-800">
      {sorteo.imagen_url ? <img src={sorteo.imagen_url} alt={sorteo.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-950"><Gift className="size-16 text-zinc-700" /></div>}
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur", estadoTone[sorteo.estado])}>{estadoLabel[sorteo.estado]}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950/80 px-2.5 py-1 text-xs font-semibold text-zinc-200 backdrop-blur">{esBoletos ? <Ticket className="size-3.5" /> : <AtSign className="size-3.5" />} {esBoletos ? "Boletos" : "Gratis"}</span>
      </div>
    </div>
    <div className="flex flex-1 flex-col p-4">
      <h2 className="text-lg font-black leading-tight text-white">{sorteo.titulo}</h2>
      {sorteo.premio && <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{sorteo.premio}</p>}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {pool} {esBoletos ? "boletos pagados" : "participantes"}</span>
        <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" /> {sorteo.fecha_sorteo ? formatFecha(sorteo.fecha_sorteo) : "Por definir"}</span>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">{esBoletos ? "Precio por boleto" : "Participación"}</p>
          <p className="text-lg font-black text-[#ffd90f]">{esBoletos ? money(sorteo.precio_boleto) : "Gratis"}</p>
        </div>
        <Link href={`/rifas/${sorteo.slug}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#ffd90f] px-3 text-sm font-bold text-zinc-950 hover:bg-[#e5c30d]">{sorteo.estado === "sorteado" ? "Ver ganadores" : esBoletos ? "Comprar boletos" : "Participar"} <ArrowRight className="size-4" /></Link>
      </div>
    </div>
  </article>;
}

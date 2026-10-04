"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, CalendarDays, Gamepad2, ShoppingBag } from "lucide-react";

type PurchaseItem = { titulo_snapshot?: string; tipo_cuenta_snapshot?: string; cantidad?: number };
type Purchase = {
  id: string | number;
  total?: string | number;
  estado?: string;
  created_at?: string;
  PedidoDetalles?: PurchaseItem[];
  pedido_detalles?: PurchaseItem[];
};

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default function ComprasPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesLoadedAt, setPurchasesLoadedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending">("all");

  useEffect(() => {
    if (!isLoading && !user) router.push("/");
  }, [isLoading, user, router]);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch("/pedidos/mis-pedidos");
      const list = Array.isArray(result) ? result : result?.pedidos;
      if (!Array.isArray(list)) throw new Error("Respuesta no válida");
      setPurchases(list);
      setPurchasesLoadedAt(Date.now());
    } catch {
      setError("No se pudieron cargar tus compras. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && token) void loadPurchases();
  }, [user, token, loadPurchases]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-[#111311]" role="status" aria-label="Cargando compras"><div className="size-8 animate-spin rounded-full border-4 border-[#ffd90f] border-t-transparent" /></div>;
  }

  const activePurchases = purchases.filter((purchase) => {
    const isPending = ["pendiente", "pendiente_pago"].includes(purchase.estado?.toLowerCase() ?? "");
    const createdAt = purchase.created_at ? new Date(purchase.created_at).getTime() : Number.NaN;
    return !isPending || Number.isNaN(createdAt) || purchasesLoadedAt - createdAt < 24 * 60 * 60 * 1000;
  });
  const activePendingPurchases = activePurchases.filter((purchase) => ["pendiente", "pendiente_pago"].includes(purchase.estado?.toLowerCase() ?? ""));
  const completedPurchases = activePurchases.filter((purchase) => !["pendiente", "pendiente_pago"].includes(purchase.estado?.toLowerCase() ?? ""));
  const visiblePurchases = filter === "pending" ? activePendingPurchases : completedPurchases;

  return (
    <main id="main-content" className="min-h-screen bg-[#111311] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-20 text-zinc-200 md:px-6 md:pt-24 lg:pb-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/perfil" className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd90f]"><ArrowLeft aria-hidden="true" className="size-4" /> Volver al perfil</Link>
        <section aria-labelledby="purchases-title" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <header className="mb-4 flex items-center gap-3 border-b border-zinc-800 pb-4">
            <ShoppingBag aria-hidden="true" className="size-5 text-[#ffd90f]" />
            <div><h1 id="purchases-title" className="text-balance text-xl font-bold text-white">Mis compras</h1><p className="text-sm text-zinc-500">Pedidos asociados a tu cuenta</p></div>
          </header>
          {!loading && !error && <div className="mb-4 grid grid-cols-2 gap-2" role="group" aria-label="Filtrar compras">
            <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition-colors ${filter === "all" ? "bg-zinc-800 text-white" : "bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>Compras</button>
            <button type="button" aria-pressed={filter === "pending"} onClick={() => setFilter("pending")} className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition-colors ${filter === "pending" ? "bg-zinc-800 text-white" : "bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>Pendientes</button>
          </div>}
          {loading ? <p role="status" className="py-8 text-center text-sm text-zinc-400">Cargando pedidos…</p> : error ? (
            <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200"><p>{error}</p><button onClick={() => void loadPurchases()} className="mt-2 min-h-10 rounded-lg px-3 font-semibold text-[#ffd90f] hover:bg-zinc-800">Reintentar</button></div>
          ) : visiblePurchases.length > 0 ? (
            <ul className="divide-y divide-zinc-800">{visiblePurchases.map((purchase) => {
              const items = purchase.PedidoDetalles ?? purchase.pedido_detalles ?? [];
              const purchaseDate = purchase.created_at ? new Date(purchase.created_at) : null;
              const hasValidDate = purchaseDate && !Number.isNaN(purchaseDate.getTime());
              const total = purchase.total === undefined || purchase.total === null ? null : Number(purchase.total);
              const itemsWithTitle = items.filter((item) => item.titulo_snapshot);
              return <li key={purchase.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">Pedido #{purchase.id}</p>
                  {purchase.estado && <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs capitalize text-zinc-300">{purchase.estado.replaceAll("_", " ")}</span>}
                </div>
                {hasValidDate && <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500"><CalendarDays aria-hidden="true" className="size-3.5" />{purchaseDate.toLocaleDateString("es-MX", { dateStyle: "medium" })}</p>}
                {itemsWithTitle.length > 0 && <ul className="mt-3 space-y-1.5">{itemsWithTitle.map((item, index) => <li key={`${purchase.id}-${index}`} className="flex items-center gap-2 text-sm text-zinc-300"><Gamepad2 aria-hidden="true" className="size-4 shrink-0 text-zinc-500" /><span>{item.titulo_snapshot}{item.cantidad && item.cantidad > 1 ? ` × ${item.cantidad}` : ""}</span>{item.tipo_cuenta_snapshot && <span className="ml-auto text-xs capitalize text-zinc-500">{item.tipo_cuenta_snapshot}</span>}</li>)}</ul>}
                {total !== null && Number.isFinite(total) && <p className="mt-3 text-right text-sm text-zinc-500">Total: <strong className="tabular-nums text-white">{currency.format(total)}</strong></p>}
              </li>;
            })}</ul>
          ) : null}
        </section>
      </div>
    </main>
  );
}

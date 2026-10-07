"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

type Tab = "resumen" | "comentarios" | "pagos";
type ReviewStatus = "pendiente" | "aprobado" | "rechazado";

type AdminComment = {
  id: string;
  nombre: string;
  mensaje: string;
  calificacion: number;
  estado: ReviewStatus;
  fecha_creacion: string;
};

type AdminPayment = {
  id: string;
  pedido_id: string;
  metodo: "transferencia" | "oxxo";
  estado: ReviewStatus;
  monto: string;
  created_at: string;
  usuario: { nombre: string; email: string } | null;
  pedido: { estado: string; created_at: string } | null;
  comprobante: { archivo_url: string; nombre_archivo?: string | null; estado: string } | null;
};

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const date = (value?: string) => {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Sin fecha" : parsed.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
};

const safeUrl = (value?: string | null) => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
};

function StatusBadge({ status }: { status: ReviewStatus }) {
  const labels = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado" };
  return <span className={cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
    status === "pendiente" && "bg-amber-400/10 text-amber-200",
    status === "aprobado" && "bg-emerald-400/10 text-emerald-200",
    status === "rechazado" && "bg-rose-400/10 text-rose-200",
  )}>{labels[status]}</span>;
}

export default function AdminPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("resumen");
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [commentResult, paymentResult] = await Promise.all([
        apiFetch("/comentarios/admin"),
        apiFetch("/pagos/admin"),
      ]);
      if (!Array.isArray(commentResult) || !Array.isArray(paymentResult)) throw new Error("Respuesta no válida");
      setComments(commentResult);
      setPayments(paymentResult);
    } catch {
      setError("No se pudo cargar la información administrativa. Verifica tu sesión e inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.rol.toLowerCase() !== "admin") {
      router.replace("/perfil");
      return;
    }
    void loadData();
  }, [authLoading, user, router, loadData]);

  const pendingComments = useMemo(() => comments.filter((comment) => comment.estado === "pendiente").length, [comments]);
  const pendingPayments = useMemo(() => payments.filter((payment) => payment.estado === "pendiente").length, [payments]);

  const changeCommentStatus = async (id: string, estado: ReviewStatus) => {
    setBusyId(`comment-${id}`);
    setError("");
    try {
      const result = await apiFetch(`/comentarios/admin/${id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado }),
      });
      const updated = result?.comentario;
      setComments((current) => current.map((comment) => comment.id === id ? { ...comment, estado: updated?.estado ?? estado } : comment));
    } catch {
      setError("No se pudo actualizar el comentario.");
    } finally {
      setBusyId(null);
    }
  };

  const changePaymentStatus = async (id: string, estado: ReviewStatus) => {
    setBusyId(`payment-${id}`);
    setError("");
    try {
      const result = await apiFetch(`/pagos/admin/${id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado }),
      });
      const updated = result?.pago;
      setPayments((current) => current.map((payment) => payment.id === id ? { ...payment, estado: updated?.estado ?? estado, pedido: updated?.pedido ?? payment.pedido } : payment));
    } catch {
      setError("No se pudo actualizar el pago. El pedido no fue modificado.");
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || !user || user.rol.toLowerCase() !== "admin") {
    return <main className="flex min-h-dvh items-center justify-center bg-[#111311]" role="status" aria-label="Verificando acceso"><div className="size-9 animate-spin rounded-full border-4 border-[#ffd90f] border-t-transparent" /></main>;
  }

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { id: "resumen", label: "Resumen", icon: LayoutDashboard },
    { id: "comentarios", label: "Comentarios", icon: MessageSquare, count: pendingComments },
    { id: "pagos", label: "Pagos manuales", icon: CreditCard, count: pendingPayments },
  ];

  return (
    <main id="main-content" className="min-h-dvh bg-[#111311] px-4 pb-10 pt-20 text-zinc-200 md:px-6 md:pt-24">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="self-start rounded-2xl border border-zinc-800 bg-zinc-900 p-3 lg:sticky lg:top-24">
          <div className="mb-3 flex items-center gap-3 px-3 py-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#ffd90f] text-zinc-950"><ShieldCheck aria-hidden="true" className="size-5" /></div>
            <div className="min-w-0"><p className="text-xs font-semibold uppercase text-zinc-500">PikaGames</p><p className="truncate font-bold text-white">Administración</p></div>
          </div>
          <nav aria-label="Secciones administrativas" className="grid gap-1">
            {navItems.map(({ id, label, icon: Icon, count }) => <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors", tab === id ? "bg-[#ffd90f] text-zinc-950" : "text-zinc-400 hover:bg-zinc-800 hover:text-white")}>
              <Icon aria-hidden="true" className="size-4" /><span className="flex-1">{label}</span>{count ? <span className={cn("rounded-full px-2 py-0.5 text-xs", tab === id ? "bg-zinc-950/10" : "bg-zinc-800 text-zinc-300")}>{count}</span> : null}
            </button>)}
          </nav>
          <button type="button" onClick={logout} className="mt-4 flex min-h-11 w-full items-center gap-3 rounded-xl border-t border-zinc-800 px-3 pt-4 text-left text-sm font-semibold text-zinc-400 hover:text-white"><LogOut aria-hidden="true" className="size-4" />Cerrar sesión</button>
        </aside>

        <section className="min-w-0">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div><p className="mb-2 text-sm font-semibold text-[#ffd90f]">Panel administrativo</p><h1 className="text-balance text-3xl font-black text-white sm:text-4xl">Hola, {user.nombre.split(" ")[0]}</h1><p className="mt-2 text-pretty text-zinc-400">Revisa comentarios y confirma pagos por transferencia o depósito.</p></div>
            <button type="button" onClick={() => void loadData()} disabled={isLoading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 disabled:opacity-60"><RefreshCw aria-hidden="true" className={cn("size-4", isLoading && "animate-spin")} />Actualizar</button>
          </header>

          {error && <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Cerrar mensaje de error" className="rounded-md p-1 hover:bg-rose-400/10"><X aria-hidden="true" className="size-4" /></button></div>}

          {tab === "resumen" && <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon={MessageSquare} label="Comentarios pendientes" value={pendingComments} onClick={() => setTab("comentarios")} />
              <StatCard icon={CreditCard} label="Pagos por revisar" value={pendingPayments} onClick={() => setTab("pagos")} />
              <StatCard icon={Check} label="Comentarios aprobados" value={comments.filter((comment) => comment.estado === "aprobado").length} />
            </div>
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><ShieldCheck aria-hidden="true" className="size-5" /></div><div><h2 className="text-lg font-bold text-white">Acceso protegido</h2><p className="text-sm text-zinc-400">Tu rol de administrador se verifica contra la API antes de cargar este panel.</p></div></div></section>
          </div>}

          {tab === "comentarios" && <ReviewComments comments={comments} loading={isLoading} busyId={busyId} onStatusChange={changeCommentStatus} />}
          {tab === "pagos" && <ReviewPayments payments={payments} loading={isLoading} busyId={busyId} onStatusChange={changePaymentStatus} />}
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, onClick }: { icon: typeof Check; label: string; value: number; onClick?: () => void }) {
  const content = <><div className="flex size-10 items-center justify-center rounded-xl bg-[#ffd90f]/10 text-[#ffd90f]"><Icon aria-hidden="true" className="size-5" /></div><p className="mt-4 text-sm text-zinc-400">{label}</p><p className="mt-1 text-3xl font-black tabular-nums text-white">{value}</p></>;
  return onClick ? <button type="button" onClick={onClick} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left hover:border-zinc-600">{content}</button> : <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">{content}</div>;
}

function ReviewComments({ comments, loading, busyId, onStatusChange }: { comments: AdminComment[]; loading: boolean; busyId: string | null; onStatusChange: (id: string, status: ReviewStatus) => void }) {
  return <section aria-labelledby="comments-title" className="rounded-2xl border border-zinc-800 bg-zinc-900"><div className="border-b border-zinc-800 p-5 sm:p-6"><h2 id="comments-title" className="text-xl font-bold text-white">Moderación de comentarios</h2><p className="mt-1 text-sm text-zinc-400">Aprueba las opiniones que quieres mostrar en la tienda.</p></div>{loading ? <LoadingRows /> : comments.length === 0 ? <EmptyState text="No hay comentarios para revisar." /> : <ul className="divide-y divide-zinc-800">{comments.map((comment) => <li key={comment.id} className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">{comment.nombre}</h3><StatusBadge status={comment.estado} /></div><div className="mt-2 flex items-center gap-1 text-[#ffd90f]" aria-label={`${comment.calificacion} de 5 estrellas`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} aria-hidden="true" className={cn("size-4", star <= comment.calificacion ? "fill-[#ffd90f]" : "text-zinc-700")} />)}</div></div><time className="text-xs text-zinc-500">{date(comment.fecha_creacion)}</time></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{comment.mensaje}</p><div className="mt-5 flex flex-wrap gap-2">{comment.estado !== "aprobado" && <ActionButton label="Aprobar" icon={Check} disabled={busyId === `comment-${comment.id}`} onClick={() => onStatusChange(comment.id, "aprobado")} />}{comment.estado !== "rechazado" && <ActionButton label="Rechazar" icon={X} tone="danger" disabled={busyId === `comment-${comment.id}`} onClick={() => onStatusChange(comment.id, "rechazado")} />}</div></li>)}</ul>}</section>;
}

function ReviewPayments({ payments, loading, busyId, onStatusChange }: { payments: AdminPayment[]; loading: boolean; busyId: string | null; onStatusChange: (id: string, status: ReviewStatus) => void }) {
  return <section aria-labelledby="payments-title" className="rounded-2xl border border-zinc-800 bg-zinc-900"><div className="border-b border-zinc-800 p-5 sm:p-6"><h2 id="payments-title" className="text-xl font-bold text-white">Pagos por transferencia y depósito</h2><p className="mt-1 text-sm text-zinc-400">Confirma el comprobante antes de marcar el pedido como pagado.</p></div>{loading ? <LoadingRows /> : payments.length === 0 ? <EmptyState text="No hay pagos manuales para revisar." /> : <ul className="divide-y divide-zinc-800">{payments.map((payment) => { const receiptUrl = safeUrl(payment.comprobante?.archivo_url); return <li key={payment.id} className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">Pedido #{payment.pedido_id}</h3><StatusBadge status={payment.estado} /></div><p className="mt-2 text-sm capitalize text-zinc-400">{payment.metodo} · {date(payment.created_at)}</p></div><strong className="tabular-nums text-lg text-white">{currency.format(Number(payment.monto))}</strong></div><div className="mt-4 grid gap-3 rounded-xl bg-zinc-950 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs uppercase text-zinc-500">Cliente</p><p className="mt-1 text-zinc-200">{payment.usuario?.nombre ?? "Sin nombre"}</p><p className="text-zinc-500">{payment.usuario?.email ?? "Sin correo"}</p></div><div><p className="text-xs uppercase text-zinc-500">Comprobante</p>{receiptUrl ? <a href={receiptUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[#ffd90f] underline underline-offset-2">{payment.comprobante?.nombre_archivo || "Abrir comprobante"}</a> : <p className="mt-1 text-zinc-500">No adjunto</p>}</div></div>{payment.estado === "pendiente" && <div className="mt-5 flex flex-wrap gap-2"><ActionButton label="Aprobar pago" icon={Check} disabled={busyId === `payment-${payment.id}`} onClick={() => onStatusChange(payment.id, "aprobado")} /><ActionButton label="Rechazar" icon={X} tone="danger" disabled={busyId === `payment-${payment.id}`} onClick={() => onStatusChange(payment.id, "rechazado")} /></div>}</li>; })}</ul>}</section>;
}

function ActionButton({ label, icon: Icon, onClick, disabled, tone = "default" }: { label: string; icon: typeof Check; onClick: () => void; disabled: boolean; tone?: "default" | "danger" }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={cn("inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold disabled:opacity-60", tone === "danger" ? "border border-rose-400/30 text-rose-200 hover:bg-rose-400/10" : "bg-[#ffd90f] text-zinc-950 hover:bg-[#e5c30d]")}><Icon aria-hidden="true" className="size-4" />{disabled ? "Guardando…" : label}</button>;
}

function LoadingRows() {
  return <div className="space-y-3 p-5" role="status" aria-label="Cargando datos"><div className="h-20 animate-pulse rounded-xl bg-zinc-800" /><div className="h-20 animate-pulse rounded-xl bg-zinc-800" /></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="p-10 text-center"><Clock3 aria-hidden="true" className="mx-auto size-8 text-zinc-600" /><p className="mt-3 text-sm text-zinc-400">{text}</p></div>;
}

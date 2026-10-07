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
  metodo: "paypal" | "transferencia" | "oxxo";
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

const dayKey = (value: Date) => `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;

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
    if (user.rol.trim().toLowerCase() !== "admin") {
      router.replace("/perfil");
      return;
    }
    void loadData();
  }, [authLoading, user, router, loadData]);

  const pendingComments = useMemo(() => comments.filter((comment) => comment.estado === "pendiente").length, [comments]);
  const pendingPayments = useMemo(() => payments.filter((payment) => payment.estado === "pendiente").length, [payments]);
  const approvedComments = useMemo(() => comments.filter((comment) => comment.estado === "aprobado").length, [comments]);
  const approvedPayments = useMemo(() => payments.filter((payment) => payment.estado === "aprobado"), [payments]);
  const approvedRevenue = useMemo(() => approvedPayments.reduce((total, payment) => total + (Number(payment.monto) || 0), 0), [approvedPayments]);
  const reviewedPayments = useMemo(() => payments.filter((payment) => payment.estado !== "pendiente").length, [payments]);
  const approvalRate = reviewedPayments ? Math.round((approvedPayments.length / reviewedPayments) * 100) : 0;

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

  if (authLoading || !user || user.rol.trim().toLowerCase() !== "admin") {
    return <main className="flex min-h-dvh items-center justify-center bg-[#111311]" role="status" aria-label="Verificando acceso"><div className="size-9 animate-spin rounded-full border-4 border-[#ffd90f] border-t-transparent" /></main>;
  }

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { id: "resumen", label: "Resumen", icon: LayoutDashboard },
    { id: "comentarios", label: "Comentarios", icon: MessageSquare, count: pendingComments },
    { id: "pagos", label: "Pagos", icon: CreditCard, count: pendingPayments },
  ];

  return (
    <main id="main-content" className="min-h-dvh bg-[#111311] px-4 pb-6 pt-16 text-zinc-200 md:px-6 md:pt-20">
      <div className="mx-auto grid max-w-screen-2xl gap-4 lg:grid-cols-[210px_1fr]">
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
          <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="text-balance text-3xl font-black text-white sm:text-4xl">Hola, {user.nombre.split(" ")[0]}</h1></div>
            <button type="button" onClick={() => void loadData()} disabled={isLoading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 disabled:opacity-60"><RefreshCw aria-hidden="true" className={cn("size-4", isLoading && "animate-spin")} />Actualizar</button>
          </header>

          {error && <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Cerrar mensaje de error" className="rounded-md p-1 hover:bg-rose-400/10"><X aria-hidden="true" className="size-4" /></button></div>}

          {tab === "resumen" && <DashboardOverview
            comments={comments}
            payments={payments}
            approvedComments={approvedComments}
            approvedPayments={approvedPayments.length}
            approvedRevenue={approvedRevenue}
            approvalRate={approvalRate}
            pendingComments={pendingComments}
            pendingPayments={pendingPayments}
            loading={isLoading}
            onTabChange={setTab}
          />}

          {tab === "comentarios" && <ReviewComments comments={comments} loading={isLoading} busyId={busyId} onStatusChange={changeCommentStatus} />}
          {tab === "pagos" && <ReviewPayments payments={payments} loading={isLoading} busyId={busyId} onStatusChange={changePaymentStatus} />}
        </section>
      </div>
    </main>
  );
}

type ChartPoint = { label: string; total: number };

function DashboardOverview({
  comments,
  payments,
  approvedComments,
  approvedPayments,
  approvedRevenue,
  approvalRate,
  pendingComments,
  pendingPayments,
  loading,
  onTabChange,
}: {
  comments: AdminComment[];
  payments: AdminPayment[];
  approvedComments: number;
  approvedPayments: number;
  approvedRevenue: number;
  approvalRate: number;
  pendingComments: number;
  pendingPayments: number;
  loading: boolean;
  onTabChange: (tab: Tab) => void;
}) {
  const chartData = useMemo<ChartPoint[]>(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const total = payments
      .filter((payment) => payment.estado === "aprobado")
      .filter((payment) => dayKey(new Date(payment.created_at)) === dayKey(day))
      .reduce((sum, payment) => sum + (Number(payment.monto) || 0), 0);
    return { label: day.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", ""), total };
  }), [payments]);

  const transferCount = payments.filter((payment) => payment.metodo === "transferencia").length;
  const oxxoCount = payments.filter((payment) => payment.metodo === "oxxo").length;

  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Ingresos aprobados" value={loading ? "—" : currency.format(approvedRevenue)} note={`${approvedPayments} pagos confirmados`} />
      <MetricCard label="Pagos pendientes" value={loading ? "—" : pendingPayments} note="Requieren revisión" onClick={() => onTabChange("pagos")} />
      <MetricCard label="Comentarios aprobados" value={loading ? "—" : approvedComments} note={`${pendingComments} pendientes`} onClick={() => onTabChange("comentarios")} />
      <MetricCard label="Tasa de aprobación" value={loading ? "—" : `${approvalRate}%`} note="De pagos revisados" />
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
      <RevenueChart data={chartData} loading={loading} />
      <PaymentMix paypalCount={payments.filter((payment) => payment.metodo === "paypal").length} transferCount={transferCount} oxxoCount={oxxoCount} pendingCount={pendingPayments} loading={loading} />
    </div>

    <StatisticsTable comments={comments} payments={payments} />

  </div>;
}

function MetricCard({ label, value, note, onClick }: { label: string; value: string | number; note: string; onClick?: () => void }) {
  const content = <><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 truncate text-2xl font-black tabular-nums text-white">{value}</p><p className="mt-2 text-xs text-zinc-500">{note}</p></>;
  return onClick ? <button type="button" onClick={onClick} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left transition-colors hover:border-zinc-600">{content}</button> : <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">{content}</div>;
}

function RevenueChart({ data, loading }: { data: ChartPoint[]; loading: boolean }) {
  const width = 640;
  const height = 220;
  const padding = 24;
  const max = Math.max(...data.map((point) => point.total), 1);
  const points = data.map((point, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - (point.total / max) * (height - padding * 2);
    return { ...point, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;

  return <section aria-labelledby="revenue-title" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-[#ffd90f]">Rendimiento</p><h2 id="revenue-title" className="mt-2 text-lg font-bold text-white">Ingresos de los últimos 7 días</h2></div><p className="text-sm text-zinc-500">Pagos aprobados</p></div>
    <div className="mt-4 rounded-xl bg-zinc-950 p-2"><svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Gráfica de ingresos aprobados de los últimos siete días"><title>Ingresos aprobados de los últimos siete días</title><line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#3f3f46" /><line x1={padding} x2={width - padding} y1={padding} y2={padding} stroke="#27272a" /><polygon points={area} fill="#ffd90f" opacity="0.08" /><polyline points={line} fill="none" stroke="#ffd90f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />{points.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="4" fill="#111311" stroke="#ffd90f" strokeWidth="2" />)}</svg><div className="grid grid-cols-7 text-center text-[11px] text-zinc-500">{data.map((point) => <span key={point.label} className="capitalize">{point.label}</span>)}</div></div>
    {loading ? <p className="mt-4 text-xs text-zinc-500">Cargando métricas…</p> : <div className="mt-4 flex items-center justify-between text-sm"><span className="text-zinc-500">Total del periodo</span><strong className="tabular-nums text-white">{currency.format(data.reduce((sum, point) => sum + point.total, 0))}</strong></div>}
  </section>;
}

function PaymentMix({ paypalCount, transferCount, oxxoCount, pendingCount, loading }: { paypalCount: number; transferCount: number; oxxoCount: number; pendingCount: number; loading: boolean }) {
  const total = paypalCount + transferCount + oxxoCount;
  const paypalPercent = total ? Math.round((paypalCount / total) * 100) : 0;
  const transferPercent = total ? Math.round((transferCount / total) * 100) : 0;
  const oxxoPercent = total ? 100 - paypalPercent - transferPercent : 0;
  return <section aria-labelledby="mix-title" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-[#ffd90f]">Métodos</p><h2 id="mix-title" className="mt-2 text-lg font-bold text-white">Distribución de pagos</h2></div><span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">{total} total</span></div><div className="mt-5 space-y-4"><PaymentBar label="PayPal" count={paypalCount} percent={paypalPercent} color="bg-[#ffd90f]" /><PaymentBar label="Transferencia" count={transferCount} percent={transferPercent} color="bg-zinc-500" /><PaymentBar label="OXXO / depósito" count={oxxoCount} percent={oxxoPercent} color="bg-zinc-700" /></div><div className="mt-5 border-t border-zinc-800 pt-4"><p className="text-sm text-zinc-400"><strong className="text-white">{loading ? "—" : pendingCount}</strong> pagos esperan validación</p></div></section>;
}

function PaymentBar({ label, count, percent, color }: { label: string; count: number; percent: number; color: string }) {
  return <div><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="text-zinc-300">{label}</span><span className="tabular-nums text-zinc-500">{count} · {percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-zinc-800"><div className={cn("h-full rounded-full", color)} style={{ width: `${percent}%` }} /></div></div>;
}

function StatisticsTable({ comments, payments }: { comments: AdminComment[]; payments: AdminPayment[] }) {
  const paymentRows = (["paypal", "transferencia", "oxxo"] as const).map((method) => {
    const methodPayments = payments.filter((payment) => payment.metodo === method);
    return {
      label: method === "paypal" ? "PayPal" : method === "transferencia" ? "Transferencia" : "OXXO / depósito",
      total: methodPayments.length,
      approved: methodPayments.filter((payment) => payment.estado === "aprobado").length,
      pending: methodPayments.filter((payment) => payment.estado === "pendiente").length,
      amount: methodPayments.filter((payment) => payment.estado === "aprobado").reduce((sum, payment) => sum + (Number(payment.monto) || 0), 0),
    };
  });
  const rows = [
    ...paymentRows,
    {
      label: "Comentarios",
      total: comments.length,
      approved: comments.filter((comment) => comment.estado === "aprobado").length,
      pending: comments.filter((comment) => comment.estado === "pendiente").length,
      amount: null,
    },
  ];

  return <section aria-labelledby="stats-title" className="rounded-2xl border border-zinc-800 bg-zinc-900"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800 p-4 sm:p-5"><div><p className="text-xs font-semibold uppercase text-[#ffd90f]">Estadísticas</p><h2 id="stats-title" className="mt-2 text-lg font-bold text-white">Resumen de operaciones</h2></div><p className="text-xs text-zinc-500">Actualizado con la última consulta</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><caption className="sr-only">Estadísticas de pagos por método y comentarios</caption><thead className="bg-zinc-950/60 text-xs uppercase text-zinc-500"><tr><th scope="col" className="px-4 py-3 font-semibold sm:px-5">Categoría</th><th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">Operaciones</th><th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">Aprobadas</th><th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">Pendientes</th><th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">Monto aprobado</th></tr></thead><tbody className="divide-y divide-zinc-800">{rows.map((row) => <tr key={row.label} className="text-zinc-300 transition-colors hover:bg-zinc-950/50"><th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold text-white sm:px-5">{row.label}</th><td className="px-4 py-3 text-right tabular-nums sm:px-5">{row.total}</td><td className="px-4 py-3 text-right tabular-nums text-emerald-200 sm:px-5">{row.approved}</td><td className="px-4 py-3 text-right tabular-nums text-amber-200 sm:px-5">{row.pending}</td><td className="px-4 py-3 text-right tabular-nums sm:px-5">{row.amount === null ? "—" : currency.format(row.amount)}</td></tr>)}</tbody></table></div></section>;
}

function ReviewComments({ comments, loading, busyId, onStatusChange }: { comments: AdminComment[]; loading: boolean; busyId: string | null; onStatusChange: (id: string, status: ReviewStatus) => void }) {
  return <section aria-labelledby="comments-title" className="rounded-2xl border border-zinc-800 bg-zinc-900"><div className="border-b border-zinc-800 p-5 sm:p-6"><h2 id="comments-title" className="text-xl font-bold text-white">Moderación de comentarios</h2><p className="mt-1 text-sm text-zinc-400">Aprueba las opiniones que quieres mostrar en la tienda.</p></div>{loading ? <LoadingRows /> : comments.length === 0 ? <EmptyState text="No hay comentarios para revisar." /> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><caption className="sr-only">Comentarios recibidos para moderación</caption><thead className="bg-zinc-950/60 text-xs uppercase text-zinc-500"><tr><th scope="col" className="px-5 py-3 font-semibold">Usuario</th><th scope="col" className="px-5 py-3 font-semibold">Comentario</th><th scope="col" className="px-5 py-3 font-semibold">Estado</th><th scope="col" className="px-5 py-3 font-semibold">Fecha</th><th scope="col" className="px-5 py-3 text-right font-semibold">Acción</th></tr></thead><tbody className="divide-y divide-zinc-800">{comments.map((comment) => <tr key={comment.id} className="align-top text-zinc-300 transition-colors hover:bg-zinc-950/50"><th scope="row" className="px-5 py-4"><p className="font-bold text-white">{comment.nombre}</p><div className="mt-2 flex items-center gap-1 text-[#ffd90f]" aria-label={`${comment.calificacion} de 5 estrellas`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} aria-hidden="true" className={cn("size-3.5", star <= comment.calificacion ? "fill-[#ffd90f]" : "text-zinc-700")} />)}</div></th><td className="max-w-md px-5 py-4"><p className="line-clamp-2 whitespace-pre-wrap leading-6">{comment.mensaje}</p></td><td className="whitespace-nowrap px-5 py-4"><StatusBadge status={comment.estado} /></td><td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-500">{date(comment.fecha_creacion)}</td><td className="px-5 py-4"><div className="flex justify-end gap-2">{comment.estado !== "aprobado" && <ActionButton label="Aprobar" icon={Check} disabled={busyId === `comment-${comment.id}`} onClick={() => onStatusChange(comment.id, "aprobado")} />}{comment.estado !== "rechazado" && <ActionButton label="Rechazar" icon={X} tone="danger" disabled={busyId === `comment-${comment.id}`} onClick={() => onStatusChange(comment.id, "rechazado")} />}</div></td></tr>)}</tbody></table></div>}</section>;
}

function ReviewPayments({ payments, loading, busyId, onStatusChange }: { payments: AdminPayment[]; loading: boolean; busyId: string | null; onStatusChange: (id: string, status: ReviewStatus) => void }) {
  return <section aria-labelledby="payments-title" className="rounded-2xl border border-zinc-800 bg-zinc-900"><div className="border-b border-zinc-800 p-5 sm:p-6"><h2 id="payments-title" className="text-xl font-bold text-white">Pagos y comprobantes</h2><p className="mt-1 text-sm text-zinc-400">Los pagos PayPal se muestran automáticamente; valida los comprobantes manuales.</p></div>{loading ? <LoadingRows /> : payments.length === 0 ? <EmptyState text="No hay pagos registrados." /> : <ul className="divide-y divide-zinc-800">{payments.map((payment) => { const receiptUrl = safeUrl(payment.comprobante?.archivo_url); const methodLabel = payment.metodo === "paypal" ? "PayPal" : payment.metodo === "oxxo" ? "OXXO / depósito" : "Transferencia"; return <li key={payment.id} className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">Pedido #{payment.pedido_id}</h3><StatusBadge status={payment.estado} /></div><p className="mt-2 text-sm text-zinc-400">{methodLabel} · {date(payment.created_at)}</p></div><strong className="tabular-nums text-lg text-white">{currency.format(Number(payment.monto))}</strong></div><div className="mt-4 grid gap-3 rounded-xl bg-zinc-950 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs uppercase text-zinc-500">Cliente</p><p className="mt-1 text-zinc-200">{payment.usuario?.nombre ?? "Sin nombre"}</p><p className="text-zinc-500">{payment.usuario?.email ?? "Sin correo"}</p></div><div><p className="text-xs uppercase text-zinc-500">Comprobante</p>{receiptUrl ? <a href={receiptUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[#ffd90f] underline underline-offset-2">{payment.comprobante?.nombre_archivo || "Abrir comprobante"}</a> : <p className="mt-1 text-zinc-500">No adjunto</p>}</div></div>{payment.metodo !== "paypal" && payment.estado === "pendiente" && <div className="mt-5 flex flex-wrap gap-2"><ActionButton label="Aprobar pago" icon={Check} disabled={busyId === `payment-${payment.id}`} onClick={() => onStatusChange(payment.id, "aprobado")} /><ActionButton label="Rechazar" icon={X} tone="danger" disabled={busyId === `payment-${payment.id}`} onClick={() => onStatusChange(payment.id, "rechazado")} /></div>}</li>; })}</ul>}</section>;
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

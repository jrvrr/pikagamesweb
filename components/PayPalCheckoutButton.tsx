"use client";

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

export interface PayPalConfirmation {
  confirmed: true;
  status: "COMPLETED";
  pagoEstado: "completado";
  pedidoId: string;
  paypalOrderId: string;
  captureId: string;
  total: string;
  currency: "MXN";
}

interface PayPalCheckoutButtonProps {
  productId: string;
  userId: string;
  /** Called when payment is successfully captured */
  onSuccess: (details: PayPalConfirmation) => void;
  onBusy?: (busy: boolean) => void;
  /** Called when user cancels the payment flow */
  onCancel?: () => void;
  /** Called on payment error */
  onError?: (err: unknown) => void;
}

export default function PayPalCheckoutButton(props: PayPalCheckoutButtonProps) {
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_ENV !== "sandbox") {
    return (
      <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center text-xs text-amber-400">
        PayPal no está disponible por el momento. Puedes pagar por OXXO o transferencia.
      </div>
    );
  }

  return <PayPalCheckout {...props} />;
}

function PayPalCheckout({
  productId,
  userId,
  onSuccess,
  onBusy,
  onCancel,
  onError,
}: PayPalCheckoutButtonProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [message, setMessage] = useState("");
  const [recoverable, setRecoverable] = useState(false);
  const session = useRef<{ pedidoId?: string; orderId?: string }>({});
  const creating = useRef<Promise<string> | null>(null);
  const storageKey = `paypal-sandbox:${userId}:${productId}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      if (typeof saved.pedidoId === "string") session.current.pedidoId = saved.pedidoId;
      if (typeof saved.orderId === "string") session.current.orderId = saved.orderId;
      setRecoverable(Boolean(session.current.orderId));
    } catch { /* La recuperación también está disponible mediante el pedido en backend. */ }
  }, [storageKey]);

  const save = () => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(session.current)); } catch { /* Storage opcional. */ }
    setRecoverable(Boolean(session.current.orderId));
  };
  const working = (value: boolean) => { setBusy(value); onBusy?.(value); };
  const failed = (error: unknown) => {
    working(false);
    setMessage(error instanceof Error ? error.message : "No se pudo confirmar el pago. Verifica el mismo pedido antes de volver a pagar.");
    onError?.(error);
  };
  const confirm = (result: PayPalConfirmation) => {
    if (result?.confirmed !== true || result.status !== "COMPLETED" || result.pagoEstado !== "completado" ||
        result.pedidoId !== session.current.pedidoId || result.paypalOrderId !== session.current.orderId ||
        typeof result.captureId !== "string" || !result.captureId || result.currency !== "MXN" ||
        typeof result.total !== "string" || !/^\d+\.\d{2}$/.test(result.total)) {
      throw new Error("Pago todavía sin confirmar. Verifica el estado del mismo pedido.");
    }
    setPaid(true);
    setMessage(`Pago confirmado. Pedido #${result.pedidoId}`);
    onSuccess(result);
  };
  const createOrder = () => {
    if (creating.current) return creating.current;
    working(true);
    setMessage("Preparando pedido seguro...");
    creating.current = (async () => {
      if (!session.current.pedidoId) {
        const pedido = await apiFetch("/pedidos", { method: "POST", body: JSON.stringify({
          productos: [{ producto_id: productId, cantidad: 1 }],
        }) });
        if (!pedido?.id || pedido.estado !== "pendiente_pago") throw new Error("Pedido inválido");
        session.current.pedidoId = String(pedido.id);
        save();
      }
      const order = await apiFetch("/paypal/crear-orden", { method: "POST", body: JSON.stringify({ pedidoId: session.current.pedidoId }) });
      if (!order?.id || order.pedidoId !== session.current.pedidoId) throw new Error("Orden inválida");
      session.current.orderId = order.id;
      save();
      setMessage("Esperando aprobación en PayPal Sandbox...");
      return order.id as string;
    })().catch((error) => { failed(error); throw error; }).finally(() => { creating.current = null; });
    return creating.current;
  };
  const approve = async ({ orderID }: { orderID: string }) => {
    working(true);
    setMessage("Confirmando y registrando el pago...");
    try {
      if (orderID !== session.current.orderId) throw new Error("La orden no coincide con este pedido");
      confirm(await apiFetch("/paypal/capturar-orden", { method: "POST", body: JSON.stringify({ paypalOrderId: orderID }) }));
    } catch (error) { failed(error); }
    finally { working(false); }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
        <Loader2 className="h-5 w-5 animate-spin text-[#ffd90f]" />
        <span className="text-xs font-bold text-zinc-400">Cargando PayPal...</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center text-xs text-red-400">
        No se pudo cargar PayPal. Verifica tu conexión e intenta de nuevo.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* PayPal & Debit/Credit Card buttons rendered by the SDK */}
      <PayPalButtons
        disabled={busy || paid}
        style={{
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
          tagline: false,
          height: 45,
        }}
        createOrder={createOrder}
        onApprove={approve}
        onCancel={() => {
          working(false);
          setMessage("Aprobación cancelada. Puedes retomar el mismo pedido.");
          onCancel?.();
        }}
        onError={failed}
      />
      {message && <p role="status" className="text-xs text-zinc-300">{message}</p>}
      {recoverable && !paid && (
        <button type="button" disabled={busy} className="text-xs underline disabled:opacity-50"
          onClick={async () => {
            working(true);
            try { confirm(await apiFetch(`/paypal/orden/${encodeURIComponent(session.current.orderId!)}`)); }
            catch (error) { failed(error); }
            finally { working(false); }
          }}>
          Verificar pago de este pedido
        </button>
      )}
    </div>
  );
}

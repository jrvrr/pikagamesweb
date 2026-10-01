"use client";

import { PayPalButtons, PayPalCardFieldsForm, PayPalCardFieldsProvider, usePayPalCardFields, FUNDING, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { usePayPalConfig } from "@/components/PayPalProviderWrapper";

export interface PayPalConfirmation {
  confirmed: true;
  status: "COMPLETED";
  pagoEstado: "aprobado";
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
  const config = usePayPalConfig();
  if (!config.ready) return <p role="status" className="text-center text-xs text-zinc-400">Cargando PayPal...</p>;
  if (!config.clientId) {
    return (
      <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center text-xs text-amber-400">
        PayPal no está disponible por el momento. Puedes pagar por OXXO o transferencia.
      </div>
    );
  }

  return <PayPalCheckout {...props} paypalEnv={config.env} />;
}

function PayPalCheckout({
  productId,
  userId,
  paypalEnv,
  onSuccess,
  onBusy,
  onCancel,
  onError,
}: PayPalCheckoutButtonProps & { paypalEnv: "live" | "sandbox" }) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [message, setMessage] = useState("");
  const [recoverable, setRecoverable] = useState(false);
  const [buttonVersion, setButtonVersion] = useState(0);
  const session = useRef<{ requestId?: string; pedidoId?: string; orderId?: string }>({});
  const creating = useRef<Promise<string> | null>(null);
  const storageKey = `paypal-${paypalEnv}:${userId}:product:${productId}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      if (typeof saved.requestId === "string") session.current.requestId = saved.requestId;
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
    if (result?.confirmed !== true || result.status !== "COMPLETED" || result.pagoEstado !== "aprobado" ||
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
        session.current.requestId ||= crypto.randomUUID();
        save();
        const pedido = await apiFetch("/pedidos", { method: "POST", body: JSON.stringify({
          request_id: session.current.requestId,
          metodo_pago: "paypal",
          productos: [{ producto_id: productId, cantidad: 1 }],
        }) });
        if (!pedido?.id || pedido.estado !== "pendiente_pago" || pedido.metodo_pago !== "paypal") {
          throw new Error("Pedido inválido");
        }
        session.current.pedidoId = String(pedido.id);
        save();
      }
      const order = await apiFetch("/paypal/crear-orden", { method: "POST", body: JSON.stringify({ pedidoId: session.current.pedidoId }) });
      if (!order?.id || order.pedidoId !== session.current.pedidoId) throw new Error("Orden inválida");
      session.current.orderId = order.id;
      save();
      setMessage(`Esperando aprobación en PayPal ${paypalEnv === "live" ? "Live" : "Sandbox"}...`);
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
        key={buttonVersion}
        fundingSource={FUNDING.PAYPAL}
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
      {!paid && <PayPalCardFieldsProvider
        createOrder={createOrder}
        onApprove={approve}
        onError={failed}
        style={{
          input: { color: "#09090b", "font-size": "17px", "font-family": "Arial, sans-serif", "font-weight": "600", opacity: "1" },
          ":focus": { color: "#000000", opacity: "1" },
          ".invalid": { color: "#b91c1c" },
        }}
      >
        <CardFieldsPaymentForm busy={busy} paid={paid} working={working} onError={failed} />
      </PayPalCardFieldsProvider>}
      {message && <p role="status" className="text-xs text-zinc-300">{message}</p>}
      {recoverable && !paid && (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <button type="button" disabled={busy} className="text-xs underline disabled:opacity-50"
            onClick={async () => {
              working(true);
              try { confirm(await apiFetch(`/paypal/orden/${encodeURIComponent(session.current.orderId!)}`)); }
              catch (error) { failed(error); }
              finally { working(false); }
            }}>
            Verificar pago de este pedido
          </button>
          <button type="button" disabled={busy} className="text-xs underline disabled:opacity-50"
            onClick={() => {
              setButtonVersion((version) => version + 1);
              setMessage("Formulario restablecido. Puedes volver a intentar con este mismo pedido.");
            }}>
            Restablecer formulario de PayPal
          </button>
        </div>
      )}
    </div>
  );
}

function CardFieldsPaymentForm({
  busy,
  paid,
  working,
  onError,
}: {
  busy: boolean;
  paid: boolean;
  working: (value: boolean) => void;
  onError: (error: unknown) => void;
}) {
  const { cardFieldsForm } = usePayPalCardFields();
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    setEligible(Boolean(cardFieldsForm?.isEligible()));
  }, [cardFieldsForm]);

  if (!eligible) return null;

  return (
    <div className="space-y-3 rounded-xl border border-zinc-300 bg-white p-4 text-zinc-900">
      <h3 className="text-sm font-semibold">Pagar con tarjeta</h3>
      <div className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5">
        <PayPalCardFieldsForm />
      </div>
      <button
        type="button"
        disabled={busy || paid || !cardFieldsForm}
        onClick={async () => {
          working(true);
          try { await cardFieldsForm?.submit(); }
          catch (error) { onError(error); }
          finally { working(false); }
        }}
        className="w-full rounded-full bg-[#0070ba] px-4 py-3 text-sm font-semibold text-white hover:bg-[#005ea6] disabled:opacity-50"
      >
        {busy ? "Procesando…" : "Pagar con tarjeta"}
      </button>
    </div>
  );
}

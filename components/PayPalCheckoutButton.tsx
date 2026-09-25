"use client";

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Loader2 } from "lucide-react";

interface PayPalCheckoutButtonProps {
  /** Amount in MXN to charge */
  amount: number;
  /** Description shown in PayPal checkout */
  description: string;
  /** Called when payment is successfully captured */
  onSuccess: (details: Record<string, unknown>) => void;
  /** Called when user cancels the payment flow */
  onCancel?: () => void;
  /** Called on payment error */
  onError?: (err: unknown) => void;
}

export default function PayPalCheckoutButton({
  amount,
  description,
  onSuccess,
  onCancel,
  onError,
}: PayPalCheckoutButtonProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

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
        style={{
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
          tagline: false,
          height: 45,
        }}
        createOrder={(_data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                description,
                amount: {
                  currency_code: "MXN",
                  value: amount.toFixed(2),
                },
              },
            ],
          });
        }}
        onApprove={async (_data, actions) => {
          if (!actions.order) return;
          const details = await actions.order.capture();
          onSuccess(details as unknown as Record<string, unknown>);
        }}
        onCancel={() => {
          onCancel?.();
        }}
        onError={(err) => {
          console.error("PayPal Checkout Error:", err);
          onError?.(err);
        }}
      />
    </div>
  );
}

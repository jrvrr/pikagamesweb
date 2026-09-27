"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import type { ReactNode } from "react";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

export default function PayPalProviderWrapper({ children }: { children: ReactNode }) {
  if (!PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_ENV !== "sandbox") {
    // Render children without PayPal context when no client ID is set.
    // PayPalCheckoutButton handles the missing client ID before using the context.
    return <>{children}</>;
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: "MXN",
        intent: "capture",
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}

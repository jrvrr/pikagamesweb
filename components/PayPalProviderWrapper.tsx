"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import type { ReactNode } from "react";
import { API_URL } from "@/lib/api";

type PayPalConfig = { ready: boolean; clientId: string | null; env: "live" | "sandbox" };
const PayPalConfigContext = createContext<PayPalConfig | null>(null);

export function usePayPalConfig(): PayPalConfig {
  return useContext(PayPalConfigContext) ?? {
    ready: true,
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || null,
    env: process.env.NEXT_PUBLIC_PAYPAL_ENV === "sandbox" ? "sandbox" : "live",
  };
}

export default function PayPalProviderWrapper({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PayPalConfig>({ ready: false, clientId: null, env: "live" });

  useEffect(() => {
    fetch(`${API_URL}/paypal/config`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((value) => setConfig({
        ready: true,
        clientId: typeof value.clientId === "string" && value.clientId ? value.clientId : null,
        env: value.env === "sandbox" ? "sandbox" : "live",
      }))
      .catch(() => setConfig({ ready: true, clientId: null, env: "live" }));
  }, []);

  const content = config.clientId ? (
    <PayPalScriptProvider options={{ clientId: config.clientId, currency: "MXN", intent: "capture", components: "buttons", enableFunding: "card" }}>
      {children}
    </PayPalScriptProvider>
  ) : children;

  return <PayPalConfigContext.Provider value={config}>{content}</PayPalConfigContext.Provider>;
}

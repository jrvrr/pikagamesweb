"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window { google?: { accounts: { id: { initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void; renderButton: (element: HTMLElement, options: Record<string, string>) => void } } }; }
}

export function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  useEffect(() => {
    if (!clientId || !container.current) return;
    const render = () => {
      if (!window.google || !container.current) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => onCredential(credential) });
      window.google.accounts.id.renderButton(container.current, { theme: "outline", size: "large", width: "360", text: "continue_with", shape: "rectangular", logo_alignment: "left", locale: "es" });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google) render();
      else existing.addEventListener("load", render, { once: true });
    }
    else { const script = document.createElement("script"); script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.onload = render; document.head.appendChild(script); }
  }, [clientId, onCredential]);
  if (!clientId) return <p className="rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm text-zinc-400">Google no está configurado todavía.</p>;
  return <div ref={container} className="flex min-h-12 justify-center" aria-label="Continuar con Google" />;
}

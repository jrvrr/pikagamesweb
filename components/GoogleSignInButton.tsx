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
      window.google.accounts.id.renderButton(container.current, { theme: "filled_black", size: "large", width: "360", text: "continue_with" });
    };
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) render();
    else { const script = document.createElement("script"); script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.onload = render; document.head.appendChild(script); }
  }, [clientId, onCredential]);
  if (!clientId) return null;
  return <div ref={container} className="flex justify-center" aria-label="Continuar con Google" />;
}

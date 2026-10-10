"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string | number | boolean>
          ) => void;
        };
      };
    };
  }
}

const DEFAULT_GOOGLE_CLIENT_ID =
  "70434837868-m4ol4uslboruiag5kin28m7h4k2fcg88.apps.googleusercontent.com";

export function GoogleSignInButton({
  onCredential,
  disabled = false,
}: {
  onCredential: (credential: string) => void;
  disabled?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    const render = () => {
      if (!window.google?.accounts?.id || !container.current) return;
      try {
        container.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            if (credential) {
              onCredentialRef.current(credential);
            }
          },
        });
        window.google.accounts.id.renderButton(container.current, {
          theme: "outline",
          size: "large",
          width: "360",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          locale: "es",
        });
      } catch (err) {
        console.error("Error al inicializar Google Sign-In:", err);
      }
    };

    const scriptSrc = "https://accounts.google.com/gsi/client";
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptSrc}"]`
    );

    if (existing) {
      if (window.google?.accounts?.id) {
        render();
      } else {
        existing.addEventListener("load", render, { once: true });
      }
    } else {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    }
  }, [clientId]);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm text-zinc-400">
        Google no está configurado todavía.
      </p>
    );
  }

  return (
    <div
      className={`flex min-h-12 w-full justify-center ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
    >
      <div
        ref={container}
        className="flex w-full justify-center"
        aria-label="Continuar con Google"
      />
    </div>
  );
}


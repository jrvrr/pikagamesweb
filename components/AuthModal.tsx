"use client";

import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/lib/AuthContext";
import { X, Lock, Mail, User, ArrowRight, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://pikagamesapiweb.vercel.app/api";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/registro";
      const payload = isLogin
        ? { email, password }
        : { nombre, apellidos, email, password };

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const token = data.token || data.data?.token;
        const userObj = data.usuario || data.user || data.data?.usuario || data.data?.user;

        if (token && userObj) {
          login(token, userObj);
          onClose();
        } else if (token) {
          const meResponse = await fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            const fetchedUser = meData.usuario || meData.user || meData.data?.usuario || meData.data?.user || meData;
            login(token, fetchedUser);
            onClose();
          } else {
            setError(meResponse.status >= 500
              ? "El servicio no está disponible temporalmente. Intenta de nuevo más tarde."
              : "No se pudieron obtener los datos de la cuenta. Inicia sesión de nuevo.");
          }
        } else {
          setError("El servidor devolvió una respuesta no válida. Intenta de nuevo.");
        }
      } else {
        setError(
          data.message || data.mensaje || data.error ||
            (response.status >= 500
              ? "El servicio no está disponible temporalmente. Intenta de nuevo más tarde."
              : isLogin ? "Correo o contraseña incorrectos." : "No se pudo crear la cuenta.")
        );
      }
    } catch {
      setError(!navigator.onLine
        ? "Sin conexión a Internet. Verifica tu red e intenta de nuevo."
        : "No se pudo conectar al servidor. Intenta de nuevo más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setPassword("");
    setNombre("");
    setApellidos("");
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 z-[101] flex items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-0">
          <Dialog.Popup
            initialFocus={emailRef}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181b] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 p-6">
              <Dialog.Title className="text-2xl font-black tracking-tight text-white">
                {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </Dialog.Title>
              <Dialog.Close
                aria-label="Cerrar ventana de acceso"
                className="rounded-md p-1 text-zinc-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd90f]"
              >
                <X aria-hidden="true" className="size-6" />
              </Dialog.Close>
            </div>

            <div className="overflow-y-auto p-6">
              <Dialog.Description className="sr-only">
                {isLogin ? "Introduce tu correo y contraseña para entrar a tu cuenta." : "Completa los datos para crear tu cuenta de PikaGames."}
              </Dialog.Description>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && <p id="auth-error" role="alert" aria-live="assertive" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-center text-sm text-red-300">{error}</p>}

                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="auth-first-name" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">Nombre</label>
                      <div className="relative">
                        <User aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                        <input id="auth-first-name" type="text" required autoComplete="given-name" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white focus:border-[#ffd90f] focus:outline-none focus:ring-1 focus:ring-[#ffd90f]" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="auth-last-name" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">Apellidos</label>
                      <div className="relative">
                        <User aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                        <input id="auth-last-name" type="text" required autoComplete="family-name" value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white focus:border-[#ffd90f] focus:outline-none focus:ring-1 focus:ring-[#ffd90f]" />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">Correo electrónico</label>
                  <div className="relative">
                    <Mail aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <input ref={emailRef} id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={error ? "auth-error" : undefined} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white focus:border-[#ffd90f] focus:outline-none focus:ring-1 focus:ring-[#ffd90f]" />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-password" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">Contraseña</label>
                  <div className="relative">
                    <Lock aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <input id="auth-password" type={showPassword ? "text" : "password"} required autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={error ? "auth-error" : undefined} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-10 text-sm text-white focus:border-[#ffd90f] focus:outline-none focus:ring-1 focus:ring-[#ffd90f] [&:-webkit-autofill]:bg-zinc-900 [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:shadow-[0_0_0px_1000px_#18181b_inset]" />
                    <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white transition-colors hover:text-[#ffd90f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd90f]">
                      {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffd90f] px-4 py-3 font-bold text-zinc-900 shadow-md transition-colors hover:bg-[#e5c30d] disabled:cursor-not-allowed disabled:opacity-70">
                  {isSubmitting ? <span role="status" className="size-5 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent"><span className="sr-only">Procesando solicitud</span></span> : <>{isLogin ? "Entrar" : "Registrarme"}<ArrowRight aria-hidden="true" className="size-5" /></>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-zinc-400">
                {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}
                <button type="button" onClick={toggleMode} className="rounded font-bold text-[#ffd90f] transition-colors hover:text-[#e5c30d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd90f]">
                  {isLogin ? "Regístrate aquí" : "Inicia sesión aquí"}
                </button>
              </p>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

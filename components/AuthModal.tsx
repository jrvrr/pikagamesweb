"use client";

import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/lib/AuthContext";
import { X, Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";
import { GoogleSignInButton } from "./GoogleSignInButton";

interface AuthModalProps { isOpen: boolean; onClose: () => void; }

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [nombre, setNombre] = useState(""); const [apellidos, setApellidos] = useState("");
  const [message, setMessage] = useState(""); const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null); const { login } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://pikagamesapiweb.vercel.app/api";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage(""); setIsSubmitting(true);
    try {
      const endpoint = mode === "forgot" ? "/auth/forgot-password" : mode === "login" ? "/auth/login" : "/auth/registro";
      const body = mode === "forgot" ? { email } : mode === "login" ? { email, password } : { nombre, apellidos, email, password };
      const response = await fetch(`${apiUrl}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.mensaje || "No se pudo completar la solicitud.");
      if (mode === "forgot") { setMessage(data.message); return; }
      const token = data.token || data.data?.token;
      const meResponse = await fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meData = await meResponse.json(); await login(token, meData.usuario || meData.user || meData); onClose();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo conectar al servidor."); }
    finally { setIsSubmitting(false); }
  };
  const changeMode = (next: "login" | "register" | "forgot") => { setMode(next); setMessage(""); setPassword(""); };
  const handleGoogleCredential = async (credential: string) => {
    setMessage(""); setIsSubmitting(true);
    try { const response = await fetch(`${apiUrl}/auth/google`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || "No se pudo iniciar sesión con Google."); const meResponse = await fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${data.token}` } }); const meData = await meResponse.json(); await login(data.token, meData.usuario || meData.user || meData); onClose(); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión con Google."); } finally { setIsSubmitting(false); }
  };
  const title = mode === "forgot" ? "Recuperar contraseña" : mode === "login" ? "Iniciar Sesión" : "Crear Cuenta";

  return <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" /><Dialog.Viewport className="fixed inset-0 z-[101] flex items-center justify-center overflow-y-auto p-4"><Dialog.Popup initialFocus={emailRef} className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181b] shadow-2xl">
    <div className="flex items-center justify-between border-b border-zinc-800 p-4"><Dialog.Title className="text-2xl font-black tracking-tight text-white">{title}</Dialog.Title><Dialog.Close aria-label="Cerrar ventana de acceso" className="flex size-11 items-center justify-center rounded-md text-zinc-400 hover:text-white"><X aria-hidden="true" className="size-6" /></Dialog.Close></div>
    <div className="scrollbar-compact overflow-y-auto p-6"><Dialog.Description className="sr-only">{mode === "forgot" ? "Te enviaremos un enlace para crear una nueva contraseña." : mode === "login" ? "Introduce tu correo y contraseña para entrar a tu cuenta." : "Completa los datos para crear tu cuenta de PikaGames."}</Dialog.Description><form className="space-y-5" onSubmit={submit}>
      {message && <p id="auth-error" role={mode === "forgot" && !isSubmitting ? "status" : "alert"} className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-center text-sm text-zinc-300">{message}</p>}
      {mode === "register" && <div className="grid grid-cols-2 gap-4"><div><label htmlFor="auth-first-name" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">Nombre</label><input id="auth-first-name" type="text" required autoComplete="given-name" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 px-4 text-sm text-white" /></div><div><label htmlFor="auth-last-name" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">Apellidos</label><input id="auth-last-name" type="text" required autoComplete="family-name" value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 px-4 text-sm text-white" /></div></div>}
      <div><label htmlFor="auth-email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">Correo electrónico</label><div className="relative"><Mail aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" /><input ref={emailRef} id="auth-email" type="email" required autoComplete="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white" /></div></div>
      {mode !== "forgot" && <div><label htmlFor="auth-password" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">Contraseña</label><div className="relative"><Lock aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" /><input id="auth-password" type={showPassword ? "text" : "password"} required autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-10 text-sm text-white" /><button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>}
      <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffd90f] px-4 py-3 font-bold text-zinc-900 disabled:opacity-70">{isSubmitting ? <span role="status" className="size-5 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" /> : <>{mode === "forgot" ? "Enviar enlace" : mode === "login" ? "Entrar" : "Registrarme"}<ArrowRight aria-hidden="true" className="size-5" /></>}</button>
    </form>{mode === "login" && <><div className="my-5 flex items-center gap-3 text-xs text-zinc-500"><span className="h-px flex-1 bg-zinc-800" />o<span className="h-px flex-1 bg-zinc-800" /></div><GoogleSignInButton onCredential={handleGoogleCredential} /></>}<div className="mt-6 text-center text-sm text-zinc-400">{mode === "forgot" ? <button type="button" onClick={() => changeMode("login")} className="font-bold text-[#ffd90f]">Volver a iniciar sesión</button> : <>{mode === "login" && <button type="button" onClick={() => changeMode("forgot")} className="mb-4 block w-full font-bold text-[#ffd90f]">¿Olvidaste tu contraseña?</button>}<span>{mode === "login" ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"} </span><button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")} className="font-bold text-[#ffd90f]">{mode === "login" ? "Regístrate aquí" : "Inicia sesión aquí"}</button></>}</div></div>
  </Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>;
}

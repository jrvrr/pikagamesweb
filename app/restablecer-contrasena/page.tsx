"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff, LockKeyhole, X } from "lucide-react";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const mismatch = confirm.length > 0 && password !== confirm;
  const validLength = password.length >= 8;
  const validMatch = password.length > 0 && password === confirm;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validLength) return setMessage("La contraseña debe tener al menos 8 caracteres.");
    if (!validMatch) return setMessage("Las contraseñas no coinciden.");
    setMessage(""); setBusy(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://pikagamesapiweb.vercel.app/api";
      const response = await fetch(`${apiUrl}/usuarios/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: params.get("token"), newPassword: password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "El enlace no es válido o ya expiró.");
      setMessage(data.message || "Contraseña actualizada correctamente.");
      setTimeout(() => router.push("/"), 1400);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo restablecer la contraseña."); }
    finally { setBusy(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-[#111311] px-4 py-10 text-zinc-200"><section className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:p-8"><div className="mb-8 flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#ffd90f] text-xl font-black text-zinc-900">P</div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffd90f]">PikaGames</p><p className="text-sm text-zinc-500">Seguridad de cuenta</p></div></div><h1 className="text-3xl font-black tracking-tight text-white">Crea una nueva contraseña</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Usa una contraseña segura y confírmala para proteger tu cuenta.</p><form onSubmit={submit} className="mt-7 space-y-5" noValidate><PasswordField id="reset-password" label="Nueva contraseña" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} /><PasswordField id="reset-confirm" label="Confirmar contraseña" value={confirm} onChange={setConfirm} visible={showConfirm} onToggle={() => setShowConfirm((value) => !value)} invalid={mismatch} />{mismatch && <p className="-mt-2 flex items-center gap-2 text-sm text-red-300"><X className="size-4" />Las contraseñas no coinciden.</p>}<div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm"><p className="mb-2 font-medium text-zinc-300">Tu contraseña debe tener:</p><p className={validLength ? "flex items-center gap-2 text-emerald-300" : "flex items-center gap-2 text-zinc-500"}>{validLength ? <Check className="size-4" /> : <span className="size-4 rounded-full border border-current" />}Al menos 8 caracteres</p></div>{message && <p role="status" className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-300">{message}</p>}<button type="submit" disabled={busy || mismatch || !validLength} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#ffd90f] px-4 font-bold text-zinc-900 transition hover:bg-[#e5c30d] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Guardando…" : "Guardar nueva contraseña"}</button></form><Link href="/" className="mt-6 block text-center text-sm font-bold text-[#ffd90f] hover:text-[#e5c30d]">Volver a PikaGames</Link></section></main>;
}

function PasswordField({ id, label, value, onChange, visible, onToggle, invalid = false }: { id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; invalid?: boolean }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-medium text-zinc-300">{label}</label><div className="relative"><LockKeyhole aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" /><input id={id} type={visible ? "text" : "password"} required autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={invalid} className={`min-h-12 w-full rounded-xl border bg-zinc-950 px-11 pr-12 text-white outline-none transition focus:border-[#ffd90f] ${invalid ? "border-red-500" : "border-zinc-700"}`} /><button type="button" onClick={onToggle} aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} aria-pressed={visible} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-400 hover:text-[#ffd90f]">{visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div></div>;
}

export default function ResetPasswordPage() { return <Suspense fallback={<main className="min-h-screen bg-[#111311]" />}><ResetForm /></Suspense>; }

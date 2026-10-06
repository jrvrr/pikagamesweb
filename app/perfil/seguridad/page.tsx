"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronLeft, Lock } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function SeguridadPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://pikagamesapiweb.vercel.app/api";

  useEffect(() => { if (!isLoading && !user) router.push("/"); }, [isLoading, router, user]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setMessage("Las nuevas contraseñas no coinciden.");
    setMessage(""); setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/auth/password`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo actualizar la contraseña.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setMessage("Contraseña actualizada correctamente.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Error de conexión con el servidor."); } finally { setSaving(false); }
  };

  if (isLoading || !user) return <main className="flex min-h-screen items-center justify-center bg-[#111311]"><span className="size-10 animate-spin rounded-full border-4 border-[#ffd90f] border-t-transparent" /></main>;
  return <main className="min-h-screen bg-[#111311] px-4 pb-24 pt-20 text-zinc-200 md:pt-24"><section className="mx-auto max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-7"><Link href="/perfil" className="mb-7 inline-flex items-center gap-1 text-sm font-bold text-zinc-400 hover:text-[#ffd90f]"><ChevronLeft className="size-4" />Volver al perfil</Link><div className="mb-7 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-[#ffd90f]/10 text-[#ffd90f]"><Lock className="size-5" /></div><div><h1 className="text-2xl font-black text-white">Seguridad</h1><p className="text-sm text-zinc-500">Actualiza la contraseña de tu cuenta.</p></div></div><form onSubmit={submit} className="space-y-5"><Field id="current-password" label="Contraseña actual" value={form.currentPassword} onChange={(currentPassword) => setForm({ ...form, currentPassword })} autoComplete="current-password" /><Field id="new-password" label="Nueva contraseña" value={form.newPassword} onChange={(newPassword) => setForm({ ...form, newPassword })} autoComplete="new-password" /><Field id="confirm-password" label="Confirmar nueva contraseña" value={form.confirmPassword} onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} autoComplete="new-password" invalid={Boolean(form.confirmPassword) && form.confirmPassword !== form.newPassword} />{message && <p role="status" className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-300">{message}</p>}<button type="submit" disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ffd90f] px-5 font-bold text-zinc-900 transition hover:bg-[#e5c30d] disabled:opacity-60">{saving ? <span className="size-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" /> : <CheckCircle className="size-4" />}Actualizar contraseña</button></form></section></main>;
}

function Field({ id, label, value, onChange, autoComplete, invalid = false }: { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: string; invalid?: boolean }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-medium text-zinc-300">{label}</label><input id={id} type="password" required autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={invalid} className={`min-h-12 w-full rounded-xl border bg-zinc-950 px-4 text-white focus:outline-none ${invalid ? "border-red-500" : "border-zinc-700 focus:border-[#ffd90f]"}`} /></div>;
}

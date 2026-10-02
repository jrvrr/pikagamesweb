"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Lock, LogOut, Mail, Save, ShoppingBag, UserRound } from "lucide-react";

const avatarEmojis = ["🎮", "🕹️", "👾", "⭐", "🚀", "🐉", "⚡", "🦊"];

export default function PerfilPage() {
  const { user, token, isLoading, updateUser, logout } = useAuth();
  const router = useRouter();
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [userInfo, setUserInfo] = useState({ nombre: "", apellidos: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://pikagamesapiweb.vercel.app/api";

  useEffect(() => {
    if (!isLoading && !user) router.push("/");
    if (user) setUserInfo({ nombre: user.nombre || "", apellidos: user.apellidos || "", email: user.email || "" });
  }, [user, isLoading, router]);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage("");
    setIsSavingInfo(true);
    try {
      const response = await fetch(`${apiUrl}/auth/perfil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: userInfo.nombre, apellidos: userInfo.apellidos, email: userInfo.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo actualizar tu información.");
      updateUser(data.usuario);
      setInfoMessage("Tu información se actualizó correctamente.");
    } catch (error) {
      setInfoMessage(error instanceof Error ? error.message : "Error de conexión con el servidor.");
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("Las nuevas contraseñas no coinciden.");
      return;
    }
    setIsSavingPassword(true);
    try {
      const response = await fetch(`${apiUrl}/auth/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo actualizar la contraseña.");
      setPasswordMessage("Contraseña actualizada correctamente.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "Error de conexión con el servidor.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-[#111311]" role="status" aria-label="Cargando perfil"><div className="size-10 animate-spin rounded-full border-4 border-[#ffd90f] border-t-transparent" /></div>;
  }

  const avatarIndex = [...user.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarEmojis.length;
  const firstName = userInfo.nombre.trim().split(/\s+/)[0] || "jugador";

  return (
    <main id="main-content" className="min-h-screen bg-[#111311] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-20 text-zinc-200 md:px-6 md:pt-24 lg:pb-12">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-xl" aria-hidden="true">{avatarEmojis[avatarIndex]}</div>
            <div className="min-w-0 flex-1">
              <h1 className="text-balance truncate text-xl font-bold text-white">Hola, {firstName}</h1>
              <p className="mt-1 inline-flex max-w-full items-center gap-2 text-sm text-zinc-400"><Mail aria-hidden="true" className="hidden size-4 shrink-0 sm:block" /><span className="truncate">{userInfo.email}</span></p>
            </div>
            <button onClick={logout} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd90f]">
              <LogOut aria-hidden="true" className="hidden size-4 sm:block" /><span>Cerrar sesión</span>
            </button>
          </div>
          <nav aria-label="Secciones del perfil" className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800 pt-4">
            <Link href="/perfil/compras" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-2 text-center text-sm font-medium text-zinc-200 hover:bg-zinc-800"><ShoppingBag aria-hidden="true" className="hidden size-4 shrink-0 sm:block" /><span>Compras</span></Link>
            <a href="#datos" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-2 text-center text-sm font-medium text-zinc-200 hover:bg-zinc-800"><UserRound aria-hidden="true" className="hidden size-4 shrink-0 sm:block" /><span>Mis datos</span></a>
            <a href="#seguridad" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-2 text-center text-sm font-medium text-zinc-200 hover:bg-zinc-800"><Lock aria-hidden="true" className="hidden size-4 shrink-0 sm:block" /><span>Seguridad</span></a>
          </nav>
        </header>

        <section id="datos" aria-labelledby="details-title" className="scroll-mt-24 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-[#ffd90f]/10 text-[#ffd90f]"><UserRound aria-hidden="true" className="size-5" /></div><div><h2 id="details-title" className="text-xl font-bold text-white">Mis datos</h2><p className="text-sm text-zinc-500">Mantén actualizada tu información</p></div></div>
          <form onSubmit={handleInfoSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="profile-first-name" className="mb-2 block text-sm font-medium text-zinc-300">Nombre</label><input id="profile-first-name" type="text" autoComplete="given-name" value={userInfo.nombre} onChange={(e) => setUserInfo({ ...userInfo, nombre: e.target.value })} className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-white placeholder:text-zinc-500 focus-visible:border-[#ffd90f] focus-visible:outline-none" required /></div>
              <div><label htmlFor="profile-last-name" className="mb-2 block text-sm font-medium text-zinc-300">Apellidos</label><input id="profile-last-name" type="text" autoComplete="family-name" value={userInfo.apellidos} onChange={(e) => setUserInfo({ ...userInfo, apellidos: e.target.value })} className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-white placeholder:text-zinc-500 focus-visible:border-[#ffd90f] focus-visible:outline-none" required /></div>
            </div>
            <div><label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-zinc-300">Correo electrónico</label><input id="profile-email" type="email" autoComplete="email" value={userInfo.email} onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })} className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-white focus-visible:border-[#ffd90f] focus-visible:outline-none" required /></div>
            {infoMessage && <p role="status" aria-live="polite" className="text-sm text-zinc-300">{infoMessage}</p>}
            <div className="flex justify-end"><button type="submit" disabled={isSavingInfo} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ffd90f] px-5 font-bold text-zinc-900 transition hover:bg-[#e5c30d] disabled:cursor-not-allowed disabled:opacity-60">{isSavingInfo ? <span className="size-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" /> : <Save aria-hidden="true" className="size-4" />}Guardar cambios</button></div>
          </form>
        </section>

        <section id="seguridad" aria-labelledby="security-title" className="scroll-mt-24 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300"><Lock aria-hidden="true" className="size-5" /></div><div><h2 id="security-title" className="text-xl font-bold text-white">Seguridad</h2><p className="text-sm text-zinc-500">Cambia la contraseña de tu cuenta</p></div></div>
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div><label htmlFor="current-password" className="mb-2 block text-sm font-medium text-zinc-300">Contraseña actual</label><input id="current-password" type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="******" className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-white placeholder:text-zinc-600 focus-visible:border-[#ffd90f] focus-visible:outline-none" required /></div>
            <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="new-password" className="mb-2 block text-sm font-medium text-zinc-300">Nueva contraseña</label><input id="new-password" type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="******" className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-white placeholder:text-zinc-600 focus-visible:border-[#ffd90f] focus-visible:outline-none" required /></div><div><label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-zinc-300">Confirmar contraseña</label><input id="confirm-password" type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="******" aria-invalid={passwordMessage.includes("no coinciden")} aria-describedby={passwordMessage ? "password-feedback" : undefined} className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-white placeholder:text-zinc-600 focus-visible:border-[#ffd90f] focus-visible:outline-none" required /></div></div>
            {passwordMessage && <p id="password-feedback" role={passwordMessage.includes("no coinciden") ? "alert" : "status"} className="text-sm text-zinc-300">{passwordMessage}</p>}
            <div className="flex justify-end"><button type="submit" disabled={isSavingPassword} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 px-5 font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60">{isSavingPassword ? <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle aria-hidden="true" className="size-4" />}Actualizar contraseña</button></div>
          </form>
        </section>
      </div>
    </main>
  );
}

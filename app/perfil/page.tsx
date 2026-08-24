"use client";

import { useState } from "react";
import { User, Shield, Gamepad2, Settings, LogOut, Lock, Mail, Edit3, Save, CheckCircle, ChevronRight, Heart } from "lucide-react";

export default function PerfilPage() {
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Mocked state from database 'usuarios' table
  const [userInfo, setUserInfo] = useState({
    nombre: "Juan Pérez",
    email: "juan.perez@pikagames.com",
    rol: "cliente" // or "admin"
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    // Simulate API call
    setTimeout(() => {
      setIsSavingInfo(false);
      alert("Información personal actualizada con éxito.");
    }, 1000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Las nuevas contraseñas no coinciden.");
      return;
    }
    setIsSavingPassword(true);
    // Simulate API call
    setTimeout(() => {
      setIsSavingPassword(false);
      alert("Contraseña actualizada con éxito.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#111311] text-zinc-300 font-sans pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-[#ffd90f] bg-zinc-800 flex items-center justify-center overflow-hidden">
              <User className="w-16 h-16 text-zinc-500" />
            </div>
            <button className="absolute bottom-0 right-0 bg-[#ffd90f] text-black p-2 rounded-full shadow-lg hover:bg-[#e5c30d] transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Hola, {userInfo.nombre.split(" ")[0]}</h1>
            <p className="text-zinc-500 font-medium">{userInfo.email}</p>
            <div className="mt-4 flex gap-3 justify-center md:justify-start">
              <span className="px-4 py-1 bg-[#ffd90f]/10 border border-[#ffd90f]/30 rounded-full text-xs font-bold text-[#ffd90f] uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Rol: {userInfo.rol}
              </span>
              <span className="px-4 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-white">Miembro desde 2026</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Column - Settings */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Personal Info Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[#ffd90f]" /> Información Personal
              </h2>
              
              <form onSubmit={handleInfoSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input 
                      type="text" 
                      value={userInfo.nombre}
                      onChange={(e) => setUserInfo({...userInfo, nombre: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#ffd90f] focus:ring-1 focus:ring-[#ffd90f] transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input 
                      type="email" 
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#ffd90f] focus:ring-1 focus:ring-[#ffd90f] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSavingInfo}
                    className="flex items-center gap-2 bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 px-6 py-3 rounded-full font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSavingInfo ? (
                      <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>

            {/* Security / Password Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#ffd90f]" /> Seguridad y Contraseña
              </h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Contraseña Actual</label>
                  <input 
                    type="password" 
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#ffd90f] focus:ring-1 focus:ring-[#ffd90f] transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nueva Contraseña</label>
                    <input 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#ffd90f] focus:ring-1 focus:ring-[#ffd90f] transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Confirmar Nueva Contraseña</label>
                    <input 
                      type="password" 
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#ffd90f] focus:ring-1 focus:ring-[#ffd90f] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSavingPassword}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-6 py-3 rounded-full font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSavingPassword ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Links */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2">            
              
              <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors text-left text-zinc-500">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

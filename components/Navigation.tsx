"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageCircle,
  Search,
  ShoppingBag,
  User,
  Heart,
  Menu,
  Gamepad2,
  Compass,
  ChevronDown,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  const activeTab: string = pathname === "/perfil" ? "perfil" : pathname === "/guardados" ? "guardados" : pathname === "/buscar" ? "buscar" : "";

  const handleTabClick = (tab: string, path?: string) => {
    setIsMenuOpen(false);
    if (path) {
      router.push(path);
    }
  };

  return (
    <>
      {/* Top Navbar (Dark Theme) - Hidden on mobile */}
      <div className="fixed top-0 left-0 w-full z-50 bg-[#18181b] border-b border-zinc-800 hidden md:block transition-all">
        <header className="w-full flex items-stretch h-16">
          {/* Logo Area */}
          <Link href="/" className="bg-[#ffd90f] px-6 flex items-center justify-center">
            <div className="font-black text-xl tracking-tighter text-zinc-900">PIKAGAMES</div>
          </Link>
          
          {/* Main Nav Links */}
          <nav className="flex items-center h-full ml-4 space-x-2 font-bold text-sm tracking-wide text-zinc-300">
            {/* Explorar Dropdown */}
            <div className="relative h-full flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex items-center gap-2 px-4 h-full transition-colors border-b-4 ${isMenuOpen ? "text-[#ffd90f] border-[#ffd90f]" : "text-[#ffd90f] hover:bg-zinc-800 border-transparent hover:border-[#ffd90f]"}`}>
                <Compass className="w-5 h-5" />
                Explorar
                <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            
            <a href="#" className="flex items-center gap-2 px-4 h-full hover:text-[#ffd90f] hover:bg-zinc-800 transition-colors">
              <ShoppingBag className="w-5 h-5" /> Comprar
            </a>
          </nav>

          <div className="flex-grow"></div>

          {/* Right Actions */}
          <div className="flex items-center h-full mr-4 space-x-2 font-bold text-sm text-zinc-300">
            <div className="flex items-center px-4 h-full">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-zinc-500" />
                <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm font-medium focus:outline-none focus:border-[#ffd90f] focus:ring-1 focus:ring-[#ffd90f] w-32 md:focus:w-56 transition-all text-white placeholder-zinc-500" />
              </div>
            </div>
            <a href="#" className="flex items-center px-4 h-full hover:text-[#ffd90f] hover:bg-zinc-800 transition-colors">
              <Heart className="w-5 h-5" />
            </a>
            <div className="flex items-center h-full py-2">
              <Link href="/perfil" className="flex items-center gap-2 px-6 h-full text-[#18181b] bg-[#ffd90f] border-2 border-[#ffd90f] hover:bg-[#e5c30d] hover:border-[#e5c30d] rounded-full transition-colors shadow-sm">
                <User className="w-5 h-5" />
                <span>Mi Perfil</span>
              </Link>
            </div>
          </div>
        </header>
      </div>

      {/* Backdrop Overlay */}
      <div onClick={() => setIsMenuOpen(false)} className={`fixed inset-0 top-14 md:top-16 bg-black/70 backdrop-blur-sm z-50 transition-all duration-500 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}></div>

      {/* Mega Menu (Dropdown) */}
      <div className={`fixed top-14 md:top-16 left-0 w-full bg-[#111] border-t border-zinc-800 shadow-2xl transition-all duration-300 flex flex-col z-[60] cursor-default overflow-y-auto max-h-[calc(100vh-3.5rem)] md:max-h-[calc(100vh-4rem)] pb-6 md:pb-0 ${isMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-4"}`}>
        <div className="max-w-6xl mx-auto w-full py-8 md:py-12 px-6 grid grid-cols-1 md:grid-cols-4 gap-8 relative z-50">
          
          {/* Left Main Content */}
          <div className="col-span-3">
            <h3 className="text-zinc-500 font-bold mb-6 uppercase tracking-widest text-sm flex items-center gap-2">
               Descubre Pikagames
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/catalogo" onClick={() => setIsMenuOpen(false)} className="flex flex-col group/item bg-zinc-900/80 p-5 md:p-6 rounded-xl hover:bg-zinc-800 border border-zinc-800 transition-all">
                <div className="hidden md:flex w-full h-28 bg-[#18181b] rounded-xl mb-4 items-center justify-center group-hover/item:scale-105 transition-transform shadow-inner border border-zinc-800/50">
                  <Gamepad2 className="w-12 h-12 text-[#ffd90f]" />
                </div>
                <span className="font-bold text-white group-hover/item:text-[#ffd90f] transition-colors text-lg">Catálogo de Juegos</span>
                <p className="hidden md:block text-xs text-zinc-500 mt-2 font-normal leading-relaxed">Explora miles de títulos increíbles para tu consola.</p>
              </Link>
              <Link href="/soporte" onClick={() => setIsMenuOpen(false)} className="flex flex-col group/item bg-zinc-900/80 p-5 md:p-6 rounded-xl hover:bg-zinc-800 border border-zinc-800 transition-all">
                <div className="hidden md:flex w-full h-28 bg-[#18181b] rounded-xl mb-4 items-center justify-center group-hover/item:scale-105 transition-transform shadow-inner border border-zinc-800/50">
                  <HelpCircle className="w-12 h-12 text-[#ffd90f]" />
                </div>
                <span className="font-bold text-white group-hover/item:text-[#ffd90f] transition-colors text-lg">Servicio al Cliente</span>
                <p className="hidden md:block text-xs text-zinc-500 mt-2 font-normal leading-relaxed">¿Necesitas ayuda? Estamos aquí para resolver tus dudas.</p>
              </Link>
              <a href="https://wa.me/528136975487" onClick={() => setIsMenuOpen(false)} target="_blank" rel="noreferrer" className="flex flex-col group/item bg-zinc-900/80 p-5 md:p-6 rounded-xl hover:bg-zinc-800 border border-zinc-800 transition-all">
                <div className="hidden md:flex w-full h-28 bg-[#18181b] rounded-xl mb-4 items-center justify-center group-hover/item:scale-105 transition-transform shadow-inner border border-zinc-800/50">
                  <MessageCircle className="w-12 h-12 text-[#25D366]" />
                </div>
                <span className="font-bold text-white group-hover/item:text-[#25D366] transition-colors text-lg">Vía WhatsApp</span>
                <p className="hidden md:block text-xs text-zinc-500 mt-2 font-normal leading-relaxed">Escríbenos directamente y recibe atención personalizada.</p>
              </a>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-1 md:border-l md:border-t-0 border-t border-zinc-800 md:pl-8 pt-8 md:pt-0 flex flex-col justify-between">
            <div>
              <h3 className="text-zinc-500 font-bold mb-6 uppercase tracking-widest text-sm">Enlaces Rápidos</h3>
              <div className="flex flex-col gap-3">
                <a href="#" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 bg-zinc-900 rounded-xl text-white font-bold hover:bg-zinc-800 transition-colors border border-zinc-800">
                  <Heart className="w-5 h-5 text-[#ffd90f]" /> Guardados
                </a>
                <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 bg-zinc-900 rounded-xl text-white font-bold hover:bg-zinc-800 transition-colors border border-zinc-800">
                  <User className="w-5 h-5 text-[#ffd90f]" /> Mi Cuenta
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Top Bar (Simple Logo) */}
      <div className="fixed top-0 left-0 w-full z-[45] bg-[#18181b] border-b border-zinc-800 h-14 flex items-center justify-center px-4 md:hidden shadow-md">
        <Link href="/">
           <div className="font-black text-xl tracking-tighter text-[#ffd90f]">PIKAGAMES</div>
        </Link>
      </div>

      {/* Mobile Bottom Tab Bar (Floating Pill) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[70] bg-[#18181b] rounded-full h-16 md:hidden flex justify-around items-center text-zinc-400 shadow-2xl border border-zinc-800 px-2">
        <button onClick={() => { setIsMenuOpen(!isMenuOpen); }} className="flex items-center justify-center w-full h-full">
          <div className={`flex items-center justify-center transition-all duration-300 rounded-full ${isMenuOpen ? "bg-[#ffd90f] text-[#18181b] w-12 h-12 shadow-lg" : "text-zinc-400 hover:text-[#ffd90f] hover:bg-zinc-800 w-10 h-10"}`}>
            <Menu className="w-6 h-6" />
          </div>
        </button>
        <button onClick={() => handleTabClick("guardados", "/guardados")} className="flex items-center justify-center w-full h-full">
          <div className={`flex items-center justify-center transition-all duration-300 rounded-full ${activeTab === "guardados" && !isMenuOpen ? "bg-[#ffd90f] text-[#18181b] w-12 h-12 shadow-lg" : "text-zinc-400 hover:text-[#ffd90f] hover:bg-zinc-800 w-10 h-10"}`}>
            <Heart className="w-6 h-6" />
          </div>
        </button>
        <button onClick={() => handleTabClick("buscar", "/buscar")} className="flex items-center justify-center w-full h-full">
          <div className={`flex items-center justify-center transition-all duration-300 rounded-full ${activeTab === "buscar" && !isMenuOpen ? "bg-[#ffd90f] text-[#18181b] w-12 h-12 shadow-lg" : "text-zinc-400 hover:text-[#ffd90f] hover:bg-zinc-800 w-10 h-10"}`}>
            <Search className="w-6 h-6" />
          </div>
        </button>
        <button onClick={() => handleTabClick("inicio", "/")} className="flex items-center justify-center w-full h-full">
          <div className={`flex items-center justify-center transition-all duration-300 rounded-full ${activeTab === "inicio" && !isMenuOpen ? "bg-[#ffd90f] text-[#18181b] w-12 h-12 shadow-lg" : "text-zinc-400 hover:text-[#ffd90f] hover:bg-zinc-800 w-10 h-10"}`}>
            <Gamepad2 className="w-6 h-6" />
          </div>
        </button>
        <button onClick={() => handleTabClick("perfil", "/perfil")} className="flex items-center justify-center w-full h-full">
          <div className={`flex items-center justify-center transition-all duration-300 rounded-full ${activeTab === "perfil" && !isMenuOpen ? "bg-[#ffd90f] text-[#18181b] w-12 h-12 shadow-lg" : "text-zinc-400 hover:text-[#ffd90f] hover:bg-zinc-800 w-10 h-10"}`}>
            <User className="w-6 h-6" />
          </div>
        </button>
      </div>
    </>
  );
}

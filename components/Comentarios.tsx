"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { MessageCircle, Star, Send } from "lucide-react";
import Link from "next/link";

interface Comentario {
  id: string;
  user_id: string;
  nombre: string;
  calificacion: number;
  mensaje: string;
  fecha_creacion: string;
}

export function Comentarios() {
  const { user, token } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [calificacion, setCalificacion] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchComentarios = async () => {
    try {
      const response = await fetch(`${apiUrl}/comentarios`);
      if (response.ok) {
        const data = await response.json();
        setComentarios(data);
      }
    } catch (err) {
      console.error("Error fetching comentarios", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComentarios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/comentarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          nombre: `${user.nombre} ${user.apellidos || ""}`.trim(),
          calificacion,
          mensaje
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Comentario enviado con éxito y en espera de aprobación.");
        setMensaje("");
        setCalificacion(5);
      } else {
        setError(data.mensaje || "Error al enviar el comentario.");
      }
    } catch (err) {
      setError("Error de conexión al servidor.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12">
      <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-[#ffd90f]" /> Comentarios de la Comunidad
      </h2>

      {/* Formulario de nuevo comentario */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-10">
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Deja tu comentario</h3>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm p-3 rounded-xl">
                {success}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Calificación
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCalificacion(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`w-8 h-8 ${star <= calificacion ? "text-[#ffd90f] fill-[#ffd90f]" : "text-zinc-700"}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Mensaje
              </label>
              <textarea
                required
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="¿Qué te parece nuestra tienda o este juego?"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#ffd90f] focus:ring-1 focus:ring-[#ffd90f] transition-all min-h-[120px]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !mensaje.trim()}
                className="flex items-center gap-2 bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 px-6 py-3 rounded-full font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Enviar Comentario
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <p className="text-zinc-400 mb-4">Debes iniciar sesión para dejar un comentario.</p>
            <Link href="/login" className="inline-block bg-[#ffd90f] hover:bg-[#e5c30d] text-zinc-900 px-6 py-2 rounded-full font-bold transition-all">
              Iniciar Sesión
            </Link>
          </div>
        )}
      </div>

      {/* Lista de comentarios */}
      <div>
        <h3 className="text-lg font-bold text-white mb-6">Comentarios Recientes</h3>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#ffd90f] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : comentarios.length === 0 ? (
          <div className="text-center py-8 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
            <p className="text-zinc-500">Aún no hay comentarios. ¡Sé el primero en opinar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comentarios.map((comentario) => (
              <div key={comentario.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-white">{comentario.nombre}</h4>
                    <span className="text-xs text-zinc-500">
                      {new Date(comentario.fecha_creacion).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`w-4 h-4 ${star <= comentario.calificacion ? "text-[#ffd90f] fill-[#ffd90f]" : "text-zinc-800"}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {comentario.mensaje}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

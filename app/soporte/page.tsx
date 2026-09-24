import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";

export default function SoportePage() {
  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition-colors hover:text-[#ffd90f]">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#ffd90f]">Estamos para ayudarte</p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Servicio al cliente</h1>
        <p className="mt-5 max-w-2xl leading-7 text-zinc-400">
          Si tienes una duda sobre un juego, pedido o tu cuenta, escríbenos y te ayudaremos.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a href="https://wa.me/528136975487" target="_blank" rel="noreferrer" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-[#25D366]/60">
            <MessageCircle className="h-7 w-7 text-[#25D366]" />
            <h2 className="mt-5 text-lg font-bold">WhatsApp</h2>
            <p className="mt-2 text-sm text-zinc-400">81 3697 5487</p>
          </a>
          <a href="mailto:pikagamestore@gmail.com" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-[#ffd90f]/60">
            <Mail className="h-7 w-7 text-[#ffd90f]" />
            <h2 className="mt-5 text-lg font-bold">Correo electrónico</h2>
            <p className="mt-2 break-all text-sm text-zinc-400">pikagamestore@gmail.com</p>
          </a>
        </div>
      </div>
    </main>
  );
}

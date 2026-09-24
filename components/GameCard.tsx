import { Calendar, Eye, Gamepad2, Heart, ShoppingCart, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Game } from "@/lib/rawg";

interface GameCardProps {
  game: Game;
  saved: boolean;
  onToggleSave: (game: Game) => void;
  onView: (game: Game) => void;
  onBuy: (game: Game) => void;
  buyLabel?: string;
  isSwitch2?: boolean;
  showReleaseDate?: boolean;
  onRemove?: (game: Game) => void;
}

export function GameCard({
  game,
  saved,
  onToggleSave,
  onView,
  onBuy,
  buyLabel = "Comprar",
  isSwitch2 = false,
  showReleaseDate = true,
  onRemove,
}: GameCardProps) {
  const rating = game.rating ? Number(game.rating).toFixed(1) : "4.8";
  const platformLabel = isSwitch2 ? "Nintendo Switch 2" : "Nintendo Switch";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:border-[#ffd90f]/70 hover:shadow-[0_16px_36px_rgba(255,217,15,0.12)]">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-800">
        {game.background_image ? (
          <img
            src={game.background_image}
            alt={game.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600">
            <Gamepad2 size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide backdrop-blur-md ${isSwitch2 ? "border-cyan-400/40 bg-cyan-950/80 text-cyan-200" : "border-white/10 bg-zinc-950/75 text-zinc-100"}`}>
            {platformLabel}
          </span>
          <span className="flex items-center gap-1 rounded-md border border-white/10 bg-zinc-950/75 px-2 py-1 text-xs font-bold text-[#ffd90f] backdrop-blur-md">
            <Star className="h-3 w-3 fill-current" />
            {rating}
          </span>
        </div>

        {onRemove ? (
          <button
            onClick={() => onRemove(game)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/75 text-zinc-300 backdrop-blur-md transition-colors hover:border-red-400 hover:bg-red-500 hover:text-white"
            title="Eliminar de guardados"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => onToggleSave(game)}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition-colors ${saved ? "border-[#ffd90f] bg-[#ffd90f] text-zinc-950" : "border-white/10 bg-zinc-950/75 text-white hover:border-[#ffd90f] hover:bg-[#ffd90f] hover:text-zinc-950"}`}
            title={saved ? "Quitar de guardados" : "Guardar en favoritos"}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          </button>
        )}

        {showReleaseDate && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-zinc-200">
            <Calendar className="h-3.5 w-3.5 text-[#ffd90f]" />
            <span>{game.released || "Próximamente"}</span>
          </div>
        )}
      </div>

      <div className="flex grow flex-col p-4">
        <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ffd90f]">
          {game.genres?.[0]?.name || "Videojuego"}
        </span>
        <h3 className="mb-4 line-clamp-2 text-base font-black leading-tight text-white transition-colors group-hover:text-[#ffd90f]">
          {game.name}
        </h3>

        <div className="mt-auto flex gap-2">
          <Button
            onClick={() => onView(game)}
            variant="outline"
            className="min-w-0 flex-1 border-zinc-700 bg-zinc-800 text-xs font-bold text-zinc-100 hover:border-[#ffd90f] hover:bg-zinc-700"
          >
            <Eye className="h-4 w-4 text-[#ffd90f]" />
            <span className="truncate">Ver detalles</span>
          </Button>
          <Button
            onClick={() => onBuy(game)}
            className="min-w-0 flex-1 border-0 bg-[#ffd90f] text-xs font-black text-zinc-950 hover:bg-[#ffe45c]"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="truncate">{buyLabel}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}

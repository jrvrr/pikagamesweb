"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "./api";

export interface User {
  id: string;
  nombre: string;
  apellidos?: string;
  email: string;
  rol: string;
}

// Minimal game shape for favorites (matches RAWG Game type)
export interface SavedGame {
  id: number;
  name: string;
  background_image?: string | null;
  rating?: number | null;
  released?: string | null;
}

// Helper to normalize game data from RAWG or backend API
export const normalizeSavedGame = (item: any): SavedGame => {
  return {
    id: Number(item.rawg_game_id || item.id),
    name: item.name || item.game_name || item.title || "Videojuego",
    background_image: item.background_image || item.game_image || item.image || null,
    rating: item.rating !== undefined && item.rating !== null ? Number(item.rating) : (item.game_rating !== undefined && item.game_rating !== null ? Number(item.game_rating) : null),
    released: item.released || item.game_released || null,
  };
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  checkAuth: () => Promise<void>;
  // Favorites
  savedGames: SavedGame[];
  toggleSaveGame: (game: any) => void;
  isGameSaved: (gameId: number) => boolean;
  isFavoritesLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const router = useRouter();

  const loadFavoritesFromLocalStorage = (): SavedGame[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("savedGames");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeSavedGame);
        }
      }
    } catch {
      console.error("Failed to parse saved games from localStorage");
    }
    return [];
  };

  const saveFavoritesToLocalStorage = (games: SavedGame[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("savedGames", JSON.stringify(games));
      } catch (e) {
        console.error("Error writing savedGames to localStorage:", e);
      }
    }
  };

  // Load favorites from server (when logged in) or localStorage (when guest)
  const loadFavorites = useCallback(async (hasToken: boolean) => {
    if (hasToken) {
      setIsFavoritesLoading(true);
      try {
        const data = await apiFetch("/favoritos");
        const rawFavorites = data?.favoritos || (Array.isArray(data) ? data : []);
        if (Array.isArray(rawFavorites)) {
          const serverGames: SavedGame[] = rawFavorites.map(normalizeSavedGame);
          setSavedGames(serverGames);
        }
      } catch (error) {
        console.error("Error al cargar favoritos del servidor:", error);
      } finally {
        setIsFavoritesLoading(false);
      }
    } else {
      const localGames = loadFavoritesFromLocalStorage();
      setSavedGames(localGames);
    }
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem("token");
    
    if (storedToken) {
      try {
        const userData = await apiFetch("/auth/me");
        const userObj = userData?.usuario || userData?.user || userData;
        setUser(userObj);
        setToken(storedToken);
        await loadFavorites(true);
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
        setSavedGames(loadFavoritesFromLocalStorage());
        console.error("Error al verificar sesión:", error);
      }
    } else {
      setUser(null);
      setToken(null);
      setSavedGames(loadFavoritesFromLocalStorage());
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (newToken: string, userData: User) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);

    // Migrate local guest favorites to server upon login
    const localGames = loadFavoritesFromLocalStorage();
    if (localGames.length > 0) {
      for (const game of localGames) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://pikagamesapiweb.vercel.app/api"}/favoritos`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${newToken}`,
            },
            body: JSON.stringify({
              rawg_game_id: game.id,
              game_name: game.name,
              game_image: game.background_image || null,
              game_rating: game.rating || null,
              game_released: game.released || null,
            }),
          });
        } catch {
          // Individual migration failure is non-blocking
        }
      }
      // Clear guest local storage after migration
      if (typeof window !== "undefined") {
        localStorage.removeItem("savedGames");
      }
    }

    await loadFavorites(true);
    router.push("/perfil");
  };

  const logout = () => {
    localStorage.removeItem("token");
    if (typeof window !== "undefined") {
      localStorage.removeItem("savedGames");
    }
    setToken(null);
    setUser(null);
    setSavedGames([]);
    router.push("/");
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const toggleSaveGame = async (game: any) => {
    if (!game) return;
    const normalized = normalizeSavedGame(game);
    const exists = savedGames.some((g) => Number(g.id) === Number(normalized.id));

    let updated: SavedGame[];
    if (exists) {
      updated = savedGames.filter((g) => Number(g.id) !== Number(normalized.id));
      setSavedGames(updated);

      if (token) {
        try {
          await apiFetch(`/favoritos/${normalized.id}`, { method: "DELETE" });
        } catch (error) {
          console.error("Error al eliminar favorito del servidor:", error);
        }
      } else {
        saveFavoritesToLocalStorage(updated);
      }
    } else {
      updated = [...savedGames, normalized];
      setSavedGames(updated);

      if (token) {
        try {
          await apiFetch("/favoritos", {
            method: "POST",
            body: JSON.stringify({
              rawg_game_id: normalized.id,
              game_name: normalized.name,
              game_image: normalized.background_image || null,
              game_rating: normalized.rating || null,
              game_released: normalized.released || null,
            }),
          });
        } catch (error) {
          console.error("Error al agregar favorito al servidor:", error);
        }
      } else {
        saveFavoritesToLocalStorage(updated);
      }
    }
  };

  const isGameSaved = (gameId: number) => {
    if (gameId === undefined || gameId === null) return false;
    return savedGames.some((g) => Number(g.id) === Number(gameId));
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, isLoading, login, logout, updateUser, checkAuth,
      savedGames, toggleSaveGame, isGameSaved, isFavoritesLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}

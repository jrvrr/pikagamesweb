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
  toggleSaveGame: (game: SavedGame) => void;
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

  // Load favorites from server (when logged in) or localStorage (when not)
  const loadFavorites = useCallback(async (hasToken: boolean) => {
    if (hasToken) {
      // Load from server
      setIsFavoritesLoading(true);
      try {
        const data = await apiFetch("/favoritos");
        setSavedGames(data?.favoritos || []);
      } catch (error) {
        console.error("Error al cargar favoritos del servidor:", error);
        // Fallback to localStorage
        loadFavoritesFromLocalStorage();
      }
      setIsFavoritesLoading(false);
    } else {
      loadFavoritesFromLocalStorage();
    }
  }, []);

  const loadFavoritesFromLocalStorage = () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("savedGames");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedGames(parsed);
        }
      } catch {
        console.error("Failed to parse saved games from localStorage");
      }
    }
  };

  const saveFavoritesToLocalStorage = (games: SavedGame[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("savedGames", JSON.stringify(games));
    }
  };

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
        // Token is invalid or expired
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
        loadFavorites(false);
        console.error("Error al verificar sesión:", error);
      }
    } else {
      setUser(null);
      setToken(null);
      loadFavorites(false);
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

    // Migrate localStorage favorites to server
    const localStored = localStorage.getItem("savedGames");
    if (localStored) {
      try {
        const localGames: SavedGame[] = JSON.parse(localStored);
        if (Array.isArray(localGames) && localGames.length > 0) {
          // Upload local favorites to server
          for (const game of localGames) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/favoritos`, {
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
              // Individual game migration failure is non-critical
            }
          }
          // Clear localStorage after migration
          localStorage.removeItem("savedGames");
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Load server favorites
    await loadFavorites(true);
    router.push("/perfil");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setSavedGames([]);
    router.push("/");
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const toggleSaveGame = async (game: SavedGame) => {
    const exists = savedGames.some((g) => g.id === game.id);

    if (exists) {
      // Remove
      const updated = savedGames.filter((g) => g.id !== game.id);
      setSavedGames(updated);

      if (token) {
        // Remove from server
        try {
          await apiFetch(`/favoritos/${game.id}`, { method: "DELETE" });
        } catch (error) {
          console.error("Error al eliminar favorito:", error);
          // Revert on error
          setSavedGames(savedGames);
        }
      } else {
        saveFavoritesToLocalStorage(updated);
      }
    } else {
      // Add
      const updated = [...savedGames, game];
      setSavedGames(updated);

      if (token) {
        // Add to server
        try {
          await apiFetch("/favoritos", {
            method: "POST",
            body: JSON.stringify({
              rawg_game_id: game.id,
              game_name: game.name,
              game_image: game.background_image || null,
              game_rating: game.rating || null,
              game_released: game.released || null,
            }),
          });
        } catch (error) {
          console.error("Error al agregar favorito:", error);
          // Revert on error
          setSavedGames(savedGames);
        }
      } else {
        saveFavoritesToLocalStorage(updated);
      }
    }
  };

  const isGameSaved = (gameId: number) => {
    return savedGames.some((g) => g.id === gameId);
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

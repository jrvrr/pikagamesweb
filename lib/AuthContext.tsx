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
export const normalizeSavedGame = (value: unknown): SavedGame => {
  const item = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const rating = item.rating ?? item.game_rating;
  return {
    id: Number(item.rawg_game_id ?? item.id),
    name: String(item.name ?? item.game_name ?? item.title ?? "Videojuego"),
    background_image: typeof (item.background_image ?? item.game_image ?? item.image) === "string" ? String(item.background_image ?? item.game_image ?? item.image) : null,
    rating: rating === undefined || rating === null || !Number.isFinite(Number(rating)) ? null : Number(rating),
    released: typeof (item.released ?? item.game_released) === "string" ? String(item.released ?? item.game_released) : null,
  };
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sessionError: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  checkAuth: () => Promise<void>;
  // Favorites
  savedGames: SavedGame[];
  toggleSaveGame: (game: unknown) => void;
  isGameSaved: (gameId: number) => boolean;
  isFavoritesLoading: boolean;
  favoritesError: string | null;
  reloadFavorites: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (input: unknown): User => {
  const value = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  return ({
  id: String(value?.id ?? value?._id ?? value?.user_id ?? value?.usuario_id ?? value?.id_usuario ?? value?.userId ?? ""),
  nombre: String(value?.nombre ?? value?.name ?? value?.nombre_usuario ?? value?.first_name ?? value?.firstName ?? value?.username ?? value?.email ?? "Cuenta"),
  apellidos: String(value?.apellidos ?? value?.last_name ?? value?.lastName ?? ""),
  email: String(value?.email ?? ""),
  rol: String(value?.rol ?? value?.role ?? "cliente"),
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const router = useRouter();

  // The signed-in account is the only source of saved games.
  const loadFavorites = useCallback(async (hasToken: boolean) => {
    if (hasToken) {
      setIsFavoritesLoading(true);
      setFavoritesError(null);
      setSavedGames([]);
      try {
        const data = await apiFetch("/favoritos");
        const rawFavorites = data?.favoritos ?? data?.data?.favoritos ?? data;
        if (!Array.isArray(rawFavorites)) throw new Error("Respuesta de favoritos no válida.");
        const serverGames: SavedGame[] = rawFavorites.map(normalizeSavedGame);
        setSavedGames(serverGames);
        return serverGames;
      } catch (error) {
        const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : undefined;
        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setToken(null);
          setSavedGames([]);
          setFavoritesError("Tu sesión dejó de ser válida. Inicia sesión para cargar tus guardados.");
        } else {
          setFavoritesError(status && status >= 500
            ? "El servicio de guardados no está disponible temporalmente. Intenta de nuevo."
            : "No se pudieron cargar tus guardados. Revisa tu conexión e intenta de nuevo.");
        }
        console.warn("No se pudieron cargar los favoritos de la cuenta.", error);
        return [];
      } finally {
        setIsFavoritesLoading(false);
      }
    } else {
      setSavedGames([]);
      setFavoritesError(null);
      return [];
    }
  }, []);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    setSessionError(null);
    localStorage.removeItem("savedGames");
    const storedToken = localStorage.getItem("token");
    
    if (storedToken) {
      setToken(storedToken);
      const cachedUser = localStorage.getItem("user");
      if (cachedUser) {
        try {
          setUser(normalizeUser(JSON.parse(cachedUser)));
        } catch {
          localStorage.removeItem("user");
        }
      }
      try {
        const userData = await apiFetch("/auth/me");
        const userObj = userData?.usuario || userData?.user || userData?.data?.usuario || userData?.data?.user || userData;
        const normalizedUser = normalizeUser(userObj);
        setUser(normalizedUser);
        setToken(storedToken);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        await loadFavorites(true);
      } catch (error) {
        const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setToken(null);
          setSavedGames([]);
          setFavoritesError(null);
        } else {
          setSessionError(status && Number(status) >= 500
            ? "El servidor no pudo verificar tu sesión temporalmente. Conservamos tu sesión; vuelve a intentarlo más tarde."
            : "No se pudo verificar tu sesión por un problema de conexión. Conservamos tu sesión.");
        }
        console.error("Error al verificar sesión:", error);
      }
    } else {
      localStorage.removeItem("user");
      setUser(null);
      setToken(null);
      setSavedGames([]);
      setFavoritesError(null);
    }
    
    setIsLoading(false);
  }, [loadFavorites]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (newToken: string, userData: User) => {
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setToken(newToken);
    setUser(normalizedUser);
    setSessionError(null);

    await loadFavorites(true);
    router.push(normalizedUser.rol.toLowerCase() === "admin" ? "/admin" : "/perfil");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setSavedGames([]);
    setFavoritesError(null);
    setSessionError(null);
    router.push("/");
  };

  const updateUser = (userData: User) => {
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  const toggleSaveGame = async (game: unknown) => {
    if (!game || !token) return;
    const normalized = normalizeSavedGame(game);
    const exists = savedGames.some((saved) => saved.id === normalized.id);
    try {
      if (exists) {
        await apiFetch(`/favoritos/${normalized.id}`, { method: "DELETE" });
        setSavedGames((games) => games.filter((saved) => saved.id !== normalized.id));
      } else {
        await apiFetch("/favoritos", {
          method: "POST",
          body: JSON.stringify({
            rawg_game_id: normalized.id,
            game_name: normalized.name,
            game_image: normalized.background_image ?? null,
            game_rating: normalized.rating ?? null,
            game_released: normalized.released ?? null,
          }),
        });
        setSavedGames((games) => [...games, normalized]);
      }
    } catch (error) {
      console.warn("No se pudo actualizar favoritos de la cuenta.", error);
    }
  };
  const isGameSaved = (gameId: number) => {
    if (gameId === undefined || gameId === null) return false;
    return savedGames.some((g) => Number(g.id) === Number(gameId));
  };

  const reloadFavorites = useCallback(async () => {
    await loadFavorites(Boolean(token));
  }, [loadFavorites, token]);

  return (
    <AuthContext.Provider value={{ 
      user, token, isLoading, sessionError, login, logout, updateUser, checkAuth,
      savedGames, toggleSaveGame, isGameSaved, isFavoritesLoading, favoritesError, reloadFavorites
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

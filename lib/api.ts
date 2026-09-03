const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Función centralizada para realizar peticiones a la API.
 * Automáticamente añade el Content-Type y el token de autorización si existe.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Intentar obtener el token de localStorage si estamos en el cliente
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Intentar extraer el mensaje de error de la API si existe
    let errorMessage = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
    } catch (e) {
      // Si no es JSON, mantenemos el mensaje de estado por defecto
    }
    throw new Error(errorMessage);
  }

  // Si la respuesta es 204 (No Content), no intentamos parsear JSON
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

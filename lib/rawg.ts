export interface Game {
  id: number;
  slug: string;
  name: string;
  background_image: string;
  rating: number;
  released: string;
  platforms: { platform: { id: number; name: string } }[];
  genres?: { id: number; name: string }[];
  description_raw?: string;
  metacritic?: number;
}

const API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api';

export async function getPopularGames(page = 1, pageSize = 12): Promise<Game[]> {
  try {
    const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&page=${page}&page_size=${pageSize}&ordering=-rating&platforms=7`); // Platforms=7 is Nintendo Switch
    if (!res.ok) throw new Error('Failed to fetch popular games');
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching popular games:', error);
    return [];
  }
}

export async function getUpcomingGames(page = 1, pageSize = 8): Promise<Game[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&dates=${today},${nextYear}&ordering=released&page=${page}&page_size=${pageSize}&platforms=7`);
    if (!res.ok) throw new Error('Failed to fetch upcoming games');
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return [];
  }
}

export async function getNewReleases(page = 1, pageSize = 8): Promise<Game[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const pastSixMonths = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&dates=${pastSixMonths},${today}&ordering=-released&page=${page}&page_size=${pageSize}&platforms=7`);
    if (!res.ok) throw new Error('Failed to fetch new releases');
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching new releases:', error);
    return [];
  }
}

export async function getGameDetails(id: number | string): Promise<Game | null> {
  try {
    const res = await fetch(`${BASE_URL}/games/${id}?key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch game details');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching game details:', error);
    return null;
  }
}

export async function searchGames(query: string, page = 1, pageSize = 12): Promise<Game[]> {
  try {
    const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&search=${query}&page=${page}&page_size=${pageSize}&platforms=7`); // Platforms=7 is Nintendo Switch
    if (!res.ok) throw new Error('Failed to search games');
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching games:', error);
    return [];
  }
}


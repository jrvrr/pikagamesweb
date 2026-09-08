export interface Game {
  id: number;
  slug: string;
  name: string;
  background_image: string;
  rating: number;
  released: string;
  platforms: { platform: { id: number; name: string } }[];
}

const API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api';

export async function getPopularGames(page = 1, pageSize = 12): Promise<Game[]> {
  try {
    const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&page=${page}&page_size=${pageSize}&ordering=-rating&platforms=7`); // Platforms=7 is Nintendo Switch
    if (!res.ok) throw new Error('Failed to fetch popular games');
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching popular games:', error);
    return [];
  }
}

export async function searchGames(query: string, page = 1, pageSize = 12): Promise<Game[]> {
  try {
    const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&search=${query}&page=${page}&page_size=${pageSize}&platforms=7`); // Platforms=7 is Nintendo Switch
    if (!res.ok) throw new Error('Failed to search games');
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error('Error searching games:', error);
    return [];
  }
}

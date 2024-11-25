const GIPHY_API_KEY = 'Y1i1qdj1PAsmAnI9o1A1ovbManPommhb0'; 
const BASE_URL = 'https://api.giphy.com/v1/gifs';

const searchGifs = async (query, limit = 20) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}`
    );
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error searching Giphy:', error);
    throw error;
  }
};

const getTrendingGifs = async (limit = 20) => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}`
    );
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching trending gifs:', error);
    throw error;
  }
};

export default {
  searchGifs,
  getTrendingGifs
};
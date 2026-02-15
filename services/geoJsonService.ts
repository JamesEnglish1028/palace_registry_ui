import axios from "axios";

export async function fetchGeoJson(url: string) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch GeoJSON:", error);
    return null;
  }
}

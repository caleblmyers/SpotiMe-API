import axios, { AxiosError } from "axios";

/**
 * Central utility function for making authenticated requests to Spotify API
 * Handles errors and returns typed responses
 */
export async function getSpotifyData<T>(
  accessToken: string,
  url: string,
  params?: Record<string, string | number>
): Promise<T> {
  try {
    const response = await axios.get<T>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ error: { message: string; status: number } }>;
    
    if (axiosError.response?.status === 401) {
      throw new Error("Unauthorized: Invalid or expired access token");
    }
    
    if (axiosError.response?.status === 500) {
      throw new Error("Spotify API server error");
    }
    
    throw new Error(
      axiosError.response?.data?.error?.message || 
      axiosError.message || 
      "Failed to fetch data from Spotify API"
    );
  }
}


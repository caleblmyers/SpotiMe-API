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
    
    // Log detailed error information for debugging
    if (axiosError.response) {
      console.error(`[Spotify API] Error ${axiosError.response.status} for ${url}:`, {
        status: axiosError.response.status,
        statusText: axiosError.response.statusText,
        data: axiosError.response.data,
        params,
      });
    }
    
    if (axiosError.response?.status === 401) {
      throw new Error("Unauthorized: Invalid or expired access token");
    }
    
    if (axiosError.response?.status === 403) {
      const errorMessage = axiosError.response?.data?.error?.message || "Forbidden: Insufficient permissions";
      throw new Error(`403 Forbidden: ${errorMessage}. You may need to re-authenticate with the required scopes.`);
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


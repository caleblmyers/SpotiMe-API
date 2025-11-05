import { Response } from "express";
import { AxiosError } from "axios";

export interface ErrorResponse {
  error: string;
  message?: string;
}

/**
 * Handle Spotify API errors and return appropriate response
 */
export function handleSpotifyError(
  res: Response,
  err: unknown,
  defaultMessage: string,
  spotifyId: string | null = null
): void {
  const axiosError = err as AxiosError<{ error: { message: string } }>;

  // Handle 401 Unauthorized
  if (axiosError.response?.status === 401) {
    res.status(401).json({
      error: "Spotify access token expired or invalid",
      message: spotifyId
        ? "Token refresh failed. Please use /auth/refresh endpoint or reconnect your Spotify account."
        : "Please use /auth/refresh endpoint to refresh your token, or reconnect your Spotify account",
    });
    return;
  }

  // Handle 429 Rate Limit
  if (axiosError.response?.status === 429) {
    res.status(429).json({
      error: "Rate limit exceeded",
      message: "Too many requests to Spotify API. Please try again later.",
    });
    return;
  }

  // Handle other Spotify API errors
  if (axiosError.response?.status) {
    res.status(axiosError.response.status).json({
      error: "Spotify API error",
      message: axiosError.response.data?.error?.message || defaultMessage,
    });
    return;
  }

  // Generic error
  console.error(`Error: ${defaultMessage}`, err);
  res.status(500).json({ error: defaultMessage });
}


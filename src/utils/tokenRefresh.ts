import prisma from "./prisma";
import { refreshSpotifyToken } from "./refreshToken";

const SPOTIFY_TOKEN_EXPIRY_MS = 3600 * 1000; // 1 hour

/**
 * Refresh Spotify token for a user by spotifyId and update database
 */
export async function refreshUserSpotifyToken(spotifyId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { spotifyId },
    select: {
      spotifyRefreshToken: true,
    },
  });

  if (!user || !user.spotifyRefreshToken) {
    throw new Error("User not authenticated with Spotify or refresh token missing");
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify client credentials not configured");
  }

  // Refresh the token
  const newAccessToken = await refreshSpotifyToken(
    user.spotifyRefreshToken,
    clientId,
    clientSecret
  );

  // Update token in database
  const tokenExpiresAt = new Date(Date.now() + SPOTIFY_TOKEN_EXPIRY_MS);
  await prisma.user.update({
    where: { spotifyId },
    data: {
      spotifyAccessToken: newAccessToken,
      spotifyTokenExpiresAt: tokenExpiresAt,
    },
  });

  return newAccessToken;
}

/**
 * Attempt to refresh token if request fails with 401
 * Requires spotifyId to be passed for token refresh
 * If spotifyId is not provided, the frontend should handle refresh using /auth/refresh endpoint
 */
export async function handleTokenRefresh<T>(
  spotifyId: string | null,
  accessToken: string,
  requestFn: (token: string) => Promise<T>
): Promise<T> {
  try {
    return await requestFn(accessToken);
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number } };
    
    // If 401 and we have spotifyId, try to refresh token from database
    if (axiosError.response?.status === 401 && spotifyId) {
      console.log("Spotify token expired, attempting refresh from database...");
      try {
        const newAccessToken = await refreshUserSpotifyToken(spotifyId);
        // Retry the request with new token
        return await requestFn(newAccessToken);
      } catch (refreshErr) {
        console.error("Error refreshing Spotify token:", refreshErr);
        throw new Error("Spotify access token expired and refresh failed");
      }
    }
    // If 401 but no spotifyId, let the error propagate - frontend should use /auth/refresh
    throw err;
  }
}


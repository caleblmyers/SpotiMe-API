import prisma from "./prisma";
import { refreshSpotifyToken } from "./refreshToken";

const SPOTIFY_TOKEN_EXPIRY_MS = 3600 * 1000; // 1 hour

/**
 * Refresh Spotify token for a user and update database
 */
export async function refreshUserSpotifyToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      spotifyRefreshToken: true,
      spotifyId: true,
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
    where: { id: userId },
    data: {
      spotifyAccessToken: newAccessToken,
      spotifyTokenExpiresAt: tokenExpiresAt,
    },
  });

  return newAccessToken;
}

/**
 * Attempt to refresh token if request fails with 401
 */
export async function handleTokenRefresh<T>(
  userId: string | null,
  accessToken: string,
  requestFn: (token: string) => Promise<T>
): Promise<T> {
  try {
    return await requestFn(accessToken);
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number } };
    
    // If 401 and we have userId, try to refresh token
    if (axiosError.response?.status === 401 && userId) {
      console.log("Spotify token expired, refreshing...");
      try {
        const newAccessToken = await refreshUserSpotifyToken(userId);
        // Retry the request with new token
        return await requestFn(newAccessToken);
      } catch (refreshErr) {
        console.error("Error refreshing Spotify token:", refreshErr);
        throw new Error("Spotify access token expired and refresh failed");
      }
    }
    throw err;
  }
}


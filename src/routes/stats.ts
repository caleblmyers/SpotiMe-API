import { Router } from "express";
import prisma from "../utils/prisma";
import { getTopTracks, getTopArtists } from "../lib/spotifyClient";
import { refreshSpotifyToken } from "../utils/refreshToken";

const router = Router();

// Helper function to get valid access token (with auto-refresh)
async function getValidAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { spotifyId: userId },
    select: {
      spotifyAccessToken: true,
      spotifyRefreshToken: true,
      spotifyTokenExpiresAt: true,
    },
  });

  if (!user || !user.spotifyAccessToken || !user.spotifyRefreshToken) {
    throw new Error("User not authenticated with Spotify");
  }

  // Check if token is expired or missing expiration date
  const needsRefresh =
    !user.spotifyTokenExpiresAt || user.spotifyTokenExpiresAt < new Date();

  if (needsRefresh) {
    // Refresh the token
    const newAccessToken = await refreshSpotifyToken(
      user.spotifyRefreshToken,
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!
    );

    // Update token in database (expires in 1 hour)
    const tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
    await prisma.user.update({
      where: { spotifyId: userId },
      data: {
        spotifyAccessToken: newAccessToken,
        spotifyTokenExpiresAt: tokenExpiresAt,
      },
    });

    return newAccessToken;
  }

  return user.spotifyAccessToken;
}

// Get top tracks
router.get("/top-tracks", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const timeRange = (req.query.range as string) || "short_term";

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const accessToken = await getValidAccessToken(userId);
    const tracks = await getTopTracks(accessToken, timeRange);

    res.json(tracks);
  } catch (err: any) {
    console.error("Error fetching top tracks:", err);
    if (err.message === "User not authenticated with Spotify") {
      return res.status(401).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to fetch top tracks" });
  }
});

// Get top artists
router.get("/top-artists", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const timeRange = (req.query.range as string) || "short_term";

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const accessToken = await getValidAccessToken(userId);
    const artists = await getTopArtists(accessToken, timeRange);

    res.json(artists);
  } catch (err: any) {
    console.error("Error fetching top artists:", err);
    if (err.message === "User not authenticated with Spotify") {
      return res.status(401).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to fetch top artists" });
  }
});

export default router;


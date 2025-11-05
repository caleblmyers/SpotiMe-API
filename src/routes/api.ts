import { Router } from "express";
import { getTopTracks, getTopArtists } from "../lib/spotifyClient";
import { extractUserId, extractSpotifyToken } from "../middleware/auth";
import { validateSpotifyQueryParams } from "../utils/validation";
import { handleSpotifyError } from "../utils/errorHandler";
import { handleTokenRefresh } from "../utils/tokenRefresh";
import { SpotifyTrack, SpotifyArtist } from "../types/spotify";

const router = Router();

// Get top tracks
router.get("/top-tracks", async (req, res) => {
  try {
    const userId = extractUserId(req);
    const accessToken = extractSpotifyToken(req);

    if (!accessToken) {
      return res.status(401).json({ error: "No Spotify access token provided" });
    }

    // Validate query parameters
    const validation = validateSpotifyQueryParams(
      req.query.time_range || "short_term",
      req.query.limit || 20,
      req.query.offset || 0
    );

    if (!validation.valid || !validation.params) {
      return res.status(400).json({ error: validation.error });
    }

    const { timeRange, limit, offset } = validation.params;

    // Fetch top tracks with automatic token refresh
    const tracks = await handleTokenRefresh(
      userId,
      accessToken,
      (token) => getTopTracks(token, timeRange, limit, offset)
    );

    // Transform data to clean JSON response
    const transformedTracks = (tracks as SpotifyTrack[]).map((track) => ({
      id: track.id,
      name: track.name,
      album: {
        id: track.album?.id || null,
        name: track.album?.name || null,
        images: track.album?.images || [],
      },
      duration: track.duration_ms || null,
    }));

    res.json(transformedTracks);
  } catch (err) {
    if (err instanceof Error && err.message === "Spotify access token expired and refresh failed") {
      return res.status(401).json({
        error: err.message,
        message: "Please reconnect your Spotify account",
      });
    }
    handleSpotifyError(res, err, "Failed to fetch top tracks", extractUserId(req));
  }
});

// Get top artists
router.get("/top-artists", async (req, res) => {
  try {
    const userId = extractUserId(req);
    const accessToken = extractSpotifyToken(req);

    if (!accessToken) {
      return res.status(401).json({ error: "No Spotify access token provided" });
    }

    // Validate query parameters
    const validation = validateSpotifyQueryParams(
      req.query.time_range || "short_term",
      req.query.limit || 20,
      req.query.offset || 0
    );

    if (!validation.valid || !validation.params) {
      return res.status(400).json({ error: validation.error });
    }

    const { timeRange, limit, offset } = validation.params;

    // Fetch top artists with automatic token refresh
    const artists = await handleTokenRefresh(
      userId,
      accessToken,
      (token) => getTopArtists(token, timeRange, limit, offset)
    );

    // Transform data to clean JSON response
    const transformedArtists = (artists as SpotifyArtist[]).map((artist) => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images?.[0]?.url || null,
      genres: artist.genres || [],
      popularity: artist.popularity || null,
    }));

    res.json(transformedArtists);
  } catch (err) {
    if (err instanceof Error && err.message === "Spotify access token expired and refresh failed") {
      return res.status(401).json({
        error: err.message,
        message: "Please reconnect your Spotify account",
      });
    }
    handleSpotifyError(res, err, "Failed to fetch top artists", extractUserId(req));
  }
});

export default router;


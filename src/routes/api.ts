import { Router } from "express";
import { getTopTracks, getTopArtists, getUserProfile } from "../lib/spotifyClient";
import { extractSpotifyToken } from "../middleware/auth";
import { validateSpotifyQueryParams } from "../utils/validation";
import { handleSpotifyError } from "../utils/errorHandler";
import { handleTokenRefresh } from "../utils/tokenRefresh";
import { SpotifyTrack, SpotifyArtist } from "../types/spotify";
import prisma from "../utils/prisma";

const router = Router();

// Get current user profile from Spotify and update database if needed
router.get("/me", async (req, res) => {
  try {
    const accessToken = extractSpotifyToken(req);

    if (!accessToken) {
      return res.status(401).json({ error: "No Spotify access token provided" });
    }

    // Optional spotifyId from header (for token refresh)
    const spotifyId = req.headers["x-spotify-id"] as string | undefined;

    // Fetch user profile from Spotify with automatic token refresh
    const spotifyProfile = await handleTokenRefresh(
      spotifyId || null,
      accessToken,
      (token) => getUserProfile(token)
    );

    const spotifyIdFromProfile = spotifyProfile.id;
    const displayName = spotifyProfile.display_name || null;
    const email = spotifyProfile.email || null;
    const profileImageUrl = spotifyProfile.images?.[0]?.url || null;
    const country = spotifyProfile.country || null;

    // Find existing user or create new one
    const existingUser = await prisma.user.findUnique({
      where: { spotifyId: spotifyIdFromProfile },
    });

    // Check if any fields have changed
    const hasChanges =
      !existingUser ||
      existingUser.displayName !== displayName ||
      existingUser.email !== email ||
      existingUser.profileImageUrl !== profileImageUrl ||
      existingUser.country !== country;

    // Update user if changes detected
    const user = hasChanges
      ? await prisma.user.upsert({
          where: { spotifyId: spotifyIdFromProfile },
          update: {
            displayName: displayName || undefined,
            email: email || undefined,
            profileImageUrl: profileImageUrl || undefined,
            country: country || undefined,
          },
          create: {
            spotifyId: spotifyIdFromProfile,
            displayName: displayName || undefined,
            email: email || undefined,
            profileImageUrl: profileImageUrl || undefined,
            country: country || undefined,
          },
        })
      : existingUser;

    if (!user) {
      return res.status(500).json({ error: "Failed to create or update user" });
    }

    res.json({
      id: user.id,
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl,
      email: user.email,
      country: user.country,
      updated: hasChanges,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Spotify access token expired and refresh failed") {
      return res.status(401).json({
        error: err.message,
        message: "Please reconnect your Spotify account",
      });
    }
    const axiosError = err as { response?: { status?: number } };
    if (axiosError.response?.status === 401) {
      return res.status(401).json({ error: "Invalid or expired Spotify token" });
    }
    console.error("Error in /api/me endpoint:", err);
    handleSpotifyError(res, err, "Failed to fetch user profile", null);
  }
});

// Get top tracks
router.get("/top-tracks", async (req, res) => {
  try {
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

    // Optional spotifyId from header (for token refresh)
    const spotifyId = req.headers["x-spotify-id"] as string | undefined;

    // Fetch top tracks with automatic token refresh
    const tracks = await handleTokenRefresh(
      spotifyId || null,
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
    handleSpotifyError(res, err, "Failed to fetch top tracks", null);
  }
});

// Get top artists
router.get("/top-artists", async (req, res) => {
  try {
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

    // Optional spotifyId from header (for token refresh)
    const spotifyId = req.headers["x-spotify-id"] as string | undefined;

    // Fetch top artists with automatic token refresh
    const artists = await handleTokenRefresh(
      spotifyId || null,
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
    handleSpotifyError(res, err, "Failed to fetch top artists", null);
  }
});

export default router;

